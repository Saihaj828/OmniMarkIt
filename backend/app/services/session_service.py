"""Session booking lifecycle, materials, and flags."""
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app import models
from app.schemas import session as session_schemas
from app.services import notification_service, tutor_service


def _price_cents(rate_cents_per_hour: int, duration_minutes: int) -> int:
    """Integer-cents pricing — no floats."""
    return round(rate_cents_per_hour * duration_minutes / 60)


def _assert_future(start_time: datetime) -> None:
    """Reject bookings/reschedules in the past (or without a timezone)."""
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    # Small grace window so 'now' isn't rejected due to request latency/clock skew.
    if start_time < datetime.now(timezone.utc) - timedelta(minutes=1):
        raise HTTPException(status_code=400, detail="Start time must be in the future")


def create(
    db: Session, data: session_schemas.SessionCreate, student_id: UUID
) -> models.Session:
    _assert_future(data.start_time)  # no past-dated bookings
    tutor = tutor_service.get_or_404(db, data.tutor_id)
    if tutor.vetting_status != "approved":
        raise HTTPException(status_code=409, detail="Tutor is not available for booking")

    subject = db.query(models.Subject).filter(models.Subject.id == data.subject_id).first()
    if not subject:
        raise HTTPException(status_code=400, detail="Unknown subject")

    clash = (
        db.query(models.Session)
        .filter(
            models.Session.tutor_id == tutor.id,
            models.Session.start_time == data.start_time,
            models.Session.status.in_(["scheduled", "in_progress"]),
        )
        .first()
    )
    if clash:
        raise HTTPException(status_code=409, detail="Tutor already booked for that slot")

    session = models.Session(
        student_id=student_id,
        tutor_id=tutor.id,
        subject_id=subject.id,
        start_time=data.start_time,
        duration_minutes=data.duration_minutes,
        price_cents=_price_cents(tutor.hourly_rate_cents, data.duration_minutes),
        status="scheduled",
        video_room_url=f"https://meet.omnimarkit.dev/room/{uuid_hex()}",  # Daily.co stub
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    notification_service.create(
        db,
        user_id=tutor.user_id,
        kind="booking",
        title="New session booked",
        body=f"A student booked a {data.duration_minutes}-min {subject.name} session.",
    )
    return session


def uuid_hex() -> str:
    import uuid

    return uuid.uuid4().hex


def get_or_404(db: Session, session_id: UUID) -> models.Session:
    session = (
        db.query(models.Session)
        .options(
            joinedload(models.Session.subject),
            joinedload(models.Session.tutor).joinedload(models.TutorProfile.user),
            joinedload(models.Session.student),
        )
        .filter(models.Session.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


def assert_participant(session: models.Session, user: models.User) -> None:
    """IDOR guard — only the booking student or assigned tutor (or admin)."""
    if user.role == "admin":
        return
    if user.role == "student" and session.student_id == user.id:
        return
    if user.role == "tutor" and session.tutor and session.tutor.user_id == user.id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your session")


def list_for_user(db: Session, user: models.User) -> list[models.Session]:
    query = db.query(models.Session).options(
        joinedload(models.Session.subject),
        joinedload(models.Session.tutor).joinedload(models.TutorProfile.user),
        joinedload(models.Session.student),
    )
    if user.role == "student":
        query = query.filter(models.Session.student_id == user.id)
    elif user.role == "tutor":
        tutor = tutor_service.get_by_user_or_404(db, user.id)
        query = query.filter(models.Session.tutor_id == tutor.id)
    return query.order_by(models.Session.start_time.desc()).all()


def update_status(db: Session, session: models.Session, new_status: str) -> models.Session:
    if session.status == "cancelled":
        raise HTTPException(status_code=409, detail="Session already cancelled")
    completing = new_status == "completed" and session.status != "completed"
    session.status = new_status
    if completing:
        session.tutor.total_sessions += 1  # cached counter
    db.commit()
    db.refresh(session)
    return session


def reschedule(db: Session, session: models.Session, new_start) -> models.Session:
    _assert_future(new_start)  # no rescheduling into the past
    if session.status not in ("scheduled",):
        raise HTTPException(
            status_code=409, detail="Only scheduled sessions can be rescheduled"
        )
    if any(f.legal_hold for f in session.flags):
        raise HTTPException(status_code=423, detail="Session is under legal hold")
    # Ensure the new slot is free for this tutor.
    clash = (
        db.query(models.Session)
        .filter(
            models.Session.tutor_id == session.tutor_id,
            models.Session.start_time == new_start,
            models.Session.status.in_(["scheduled", "in_progress"]),
            models.Session.id != session.id,
        )
        .first()
    )
    if clash:
        raise HTTPException(status_code=409, detail="Tutor already booked for that slot")
    session.start_time = new_start
    db.commit()
    db.refresh(session)
    notification_service.create(
        db,
        user_id=session.tutor.user_id,
        kind="booking",
        title="Session rescheduled",
        body="A session was moved to a new time.",
    )
    return session


def cancel(db: Session, session: models.Session, reason: str | None) -> models.Session:
    # Legal hold is absolute — it takes precedence over every other check.
    if any(f.legal_hold for f in session.flags):
        raise HTTPException(status_code=423, detail="Session is under legal hold")
    if session.status in ("completed", "cancelled"):
        raise HTTPException(status_code=409, detail=f"Cannot cancel a {session.status} session")
    session.status = "cancelled"
    session.cancellation_reason = reason
    db.commit()
    db.refresh(session)
    return session


# --- Materials ---
def add_material(
    db: Session, session: models.Session, uploader: models.User, data: session_schemas.MaterialCreate
) -> models.SessionMaterial:
    mat = models.SessionMaterial(
        session_id=session.id,
        uploader_id=uploader.id,
        title=data.title,
        file_url=data.file_url,
        kind=data.kind,
    )
    db.add(mat)
    db.commit()
    db.refresh(mat)
    return mat


def list_materials(db: Session, session_id: UUID) -> list[models.SessionMaterial]:
    return (
        db.query(models.SessionMaterial)
        .filter(models.SessionMaterial.session_id == session_id)
        .order_by(models.SessionMaterial.created_at.asc())
        .all()
    )


# --- Flags (trust & safety) ---
def add_flag(
    db: Session, session: models.Session, reporter: models.User, data: session_schemas.FlagCreate
) -> models.SessionFlag:
    flag = models.SessionFlag(
        session_id=session.id,
        reporter_id=reporter.id,
        reason=data.reason,
        detail=data.detail,
    )
    db.add(flag)
    db.commit()
    db.refresh(flag)

    # Notify all admins.
    for admin in db.query(models.User).filter(models.User.role == "admin").all():
        notification_service.create(
            db,
            user_id=admin.id,
            kind="dispute",
            title="Session flagged",
            body=f"Reason: {data.reason}",
        )
    return flag


def get_whiteboard(session: models.Session) -> str:
    return session.whiteboard_data or ""


def set_whiteboard(db: Session, session: models.Session, data: str) -> None:
    session.whiteboard_data = data
    db.commit()


def enrich(session: models.Session) -> dict:
    return {
        "id": session.id,
        "student_id": session.student_id,
        "tutor_id": session.tutor_id,
        "subject_id": session.subject_id,
        "start_time": session.start_time,
        "duration_minutes": session.duration_minutes,
        "price_cents": session.price_cents,
        "status": session.status,
        "video_room_url": session.video_room_url,
        "created_at": session.created_at,
        "tutor_name": session.tutor.display_name if session.tutor else None,
        "student_name": session.student.full_name if session.student else None,
        "subject_name": session.subject.name if session.subject else None,
    }
