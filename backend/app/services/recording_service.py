"""Session recordings: upload (stored locally), admin-granted access, and the
free-then-paid viewing rule."""
import os
import uuid
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app import models
from app.config import settings
from app.services import notification_service, session_service, stripe_service

WEBM_MAGIC = b"\x1a\x45\xdf\xa3"  # EBML header used by .webm
MP4_MAGIC = b"ftyp"  # appears at bytes 4-8 of mp4


def _recordings_dir() -> str:
    path = os.path.join(settings.UPLOAD_DIR, "recordings")
    os.makedirs(path, exist_ok=True)
    return path


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def save_recording(
    db: Session, session: models.Session, uploader: models.User, file: UploadFile
) -> models.Recording:
    data = file.file.read()
    if len(data) > settings.MAX_RECORDING_BYTES:
        raise HTTPException(status_code=413, detail="Recording too large")
    is_webm = data.startswith(WEBM_MAGIC)
    is_mp4 = data[4:8] == MP4_MAGIC
    if not (is_webm or is_mp4):
        raise HTTPException(status_code=400, detail="Recording must be a .webm or .mp4 video")

    ext = "webm" if is_webm else "mp4"
    stored = f"{uuid.uuid4().hex}.{ext}"
    full = os.path.join(_recordings_dir(), stored)
    with open(full, "wb") as out:
        out.write(data)

    rec = models.Recording(
        session_id=session.id,
        uploader_id=uploader.id,
        storage_path=full,
        file_url="",  # set after we have the id
        size_bytes=len(data),
        free_until=datetime.now(timezone.utc) + timedelta(days=settings.RECORDING_FREE_DAYS),
        price_cents=settings.RECORDING_PRICE_CENTS,
    )
    db.add(rec)
    db.flush()
    rec.file_url = f"/api/recordings/{rec.id}/view"
    db.commit()
    db.refresh(rec)

    # Notify admins so they can grant access.
    for admin in db.query(models.User).filter(models.User.role == "admin").all():
        notification_service.create(
            db, user_id=admin.id, kind="dispute", title="New session recording",
            body="A recording is awaiting access decisions.",
        )
    return rec


def get_or_404(db: Session, recording_id: UUID) -> models.Recording:
    rec = db.query(models.Recording).filter(models.Recording.id == recording_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recording not found")
    return rec


def _grant_for(db: Session, recording_id: UUID, user_id: UUID) -> models.RecordingAccess | None:
    return (
        db.query(models.RecordingAccess)
        .filter(
            models.RecordingAccess.recording_id == recording_id,
            models.RecordingAccess.user_id == user_id,
        )
        .first()
    )


def access_flags(db: Session, rec: models.Recording, user: models.User) -> dict:
    """Compute the per-user view decision."""
    in_free = datetime.now(timezone.utc) < _aware(rec.free_until)
    if user.role == "admin":
        return {"granted": True, "in_free_window": in_free, "is_paid": True,
                "can_view": True, "requires_payment": False}
    grant = _grant_for(db, rec.id, user.id)
    granted = grant is not None
    is_paid = bool(grant and grant.is_paid)
    can_view = granted and (in_free or is_paid)
    requires_payment = granted and not in_free and not is_paid
    return {"granted": granted, "in_free_window": in_free, "is_paid": is_paid,
            "can_view": can_view, "requires_payment": requires_payment}


def _serialize(db: Session, rec: models.Recording, user: models.User) -> dict:
    flags = access_flags(db, rec, user)
    session = session_service.get_or_404(db, rec.session_id)
    granted_ids = [g.user_id for g in rec.grants]
    return {
        "id": rec.id, "session_id": rec.session_id, "uploader_id": rec.uploader_id,
        "file_url": rec.file_url, "duration_seconds": rec.duration_seconds,
        "size_bytes": rec.size_bytes, "free_until": rec.free_until,
        "price_cents": rec.price_cents, "created_at": rec.created_at,
        "student_id": session.student_id,
        "student_name": session.student.full_name if session.student else None,
        "tutor_user_id": session.tutor.user_id if session.tutor else None,
        "tutor_name": session.tutor.display_name if session.tutor else None,
        "subject_name": session.subject.name if session.subject else None,
        "granted_user_ids": granted_ids,
        **flags,
    }


def list_for_session(db: Session, session: models.Session, user: models.User) -> list[dict]:
    recs = (
        db.query(models.Recording)
        .filter(models.Recording.session_id == session.id)
        .order_by(models.Recording.created_at.desc())
        .all()
    )
    return [_serialize(db, r, user) for r in recs]


def list_for_user(db: Session, user: models.User) -> list[dict]:
    """Recordings the user can see: admins see all; others see ones granted to them."""
    if user.role == "admin":
        recs = db.query(models.Recording).order_by(models.Recording.created_at.desc()).all()
    else:
        recs = (
            db.query(models.Recording)
            .join(models.RecordingAccess, models.RecordingAccess.recording_id == models.Recording.id)
            .filter(models.RecordingAccess.user_id == user.id)
            .order_by(models.Recording.created_at.desc())
            .all()
        )
    return [_serialize(db, r, user) for r in recs]


def view_path(db: Session, recording_id: UUID, user: models.User) -> str:
    """Return the on-disk path if the user may view, else raise 402/403."""
    rec = get_or_404(db, recording_id)
    flags = access_flags(db, rec, user)
    if not flags["granted"]:
        raise HTTPException(status_code=403, detail="An admin has not granted you access")
    if flags["requires_payment"]:
        raise HTTPException(status_code=402, detail="Free viewing period ended — payment required")
    if not flags["can_view"]:
        raise HTTPException(status_code=403, detail="You cannot view this recording")
    return rec.storage_path


def purchase(db: Session, recording_id: UUID, user: models.User) -> dict:
    rec = get_or_404(db, recording_id)
    grant = _grant_for(db, rec.id, user.id)
    if not grant:
        raise HTTPException(status_code=403, detail="An admin has not granted you access")
    if grant.is_paid:
        return _serialize(db, rec, user)
    if datetime.now(timezone.utc) < _aware(rec.free_until):
        raise HTTPException(status_code=409, detail="Recording is still free to view")

    result = stripe_service.charge_session(
        rec.price_cents, description=f"Recording {rec.id}", metadata={"recording_id": str(rec.id)}
    )
    if result["status"] != "succeeded":
        raise HTTPException(status_code=402, detail="Payment failed")
    grant.is_paid = True
    db.commit()
    return _serialize(db, rec, user)


# --- Admin permissioning ---
def grant_access(db: Session, admin: models.User, recording_id: UUID, user_id: UUID) -> dict:
    rec = get_or_404(db, recording_id)
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if not _grant_for(db, rec.id, user_id):
        db.add(models.RecordingAccess(recording_id=rec.id, user_id=user_id, granted_by=admin.id))
        db.add(models.AdminAction(admin_id=admin.id, action="grant_recording_access",
                                  target_type="recording", target_id=rec.id))
        db.commit()
        notification_service.create(
            db, user_id=user_id, kind="dispute", title="Recording access granted",
            body="You can now view a session recording.",
        )
    return _serialize(db, rec, target)


def revoke_access(db: Session, admin: models.User, recording_id: UUID, user_id: UUID) -> None:
    grant = _grant_for(db, recording_id, user_id)
    if grant:
        db.delete(grant)
        db.add(models.AdminAction(admin_id=admin.id, action="revoke_recording_access",
                                  target_type="recording", target_id=recording_id))
        db.commit()
