"""Tutor vetting pipeline: credentials, ID verification, teaching approach."""
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import models
from app.schemas import vetting as vetting_schemas


def _vetting_row(db: Session, tutor_id: UUID) -> models.TutorVetting:
    row = (
        db.query(models.TutorVetting)
        .filter(models.TutorVetting.tutor_id == tutor_id)
        .first()
    )
    if not row:
        row = models.TutorVetting(tutor_id=tutor_id, status="pending")
        db.add(row)
        db.flush()
    return row


def add_credential(
    db: Session, tutor: models.TutorProfile, data: vetting_schemas.CredentialCreate
) -> models.TutorCredential:
    cred = models.TutorCredential(tutor_id=tutor.id, **data.model_dump())
    db.add(cred)
    row = _vetting_row(db, tutor.id)
    if row.status == "pending":
        row.status = "credentials_submitted"
    if tutor.vetting_status == "pending":
        tutor.vetting_status = "in_review"
    db.commit()
    db.refresh(cred)
    return cred


def list_credentials(db: Session, tutor_id: UUID) -> list[models.TutorCredential]:
    return (
        db.query(models.TutorCredential)
        .filter(models.TutorCredential.tutor_id == tutor_id)
        .all()
    )


def submit_id_verification(
    db: Session, tutor: models.TutorProfile, data: vetting_schemas.IdVerificationSubmit
) -> models.TutorIdVerification:
    existing = (
        db.query(models.TutorIdVerification)
        .filter(models.TutorIdVerification.tutor_id == tutor.id)
        .first()
    )
    if existing:
        existing.document_type = data.document_type
        existing.document_url = data.document_url
        existing.status = "pending"
        rec = existing
    else:
        rec = models.TutorIdVerification(tutor_id=tutor.id, **data.model_dump())
        db.add(rec)
    row = _vetting_row(db, tutor.id)
    if row.status in ("pending", "credentials_submitted"):
        row.status = "id_submitted"
    db.commit()
    db.refresh(rec)
    return rec


def submit_teaching_approach(
    db: Session, tutor: models.TutorProfile, data: vetting_schemas.TeachingApproachSubmit
) -> models.TutorTeachingApproach:
    existing = (
        db.query(models.TutorTeachingApproach)
        .filter(models.TutorTeachingApproach.tutor_id == tutor.id)
        .first()
    )
    if existing:
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(existing, k, v)
        rec = existing
    else:
        rec = models.TutorTeachingApproach(tutor_id=tutor.id, **data.model_dump())
        db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


def get_state(db: Session, tutor_id: UUID) -> models.TutorVetting:
    row = _vetting_row(db, tutor_id)
    db.commit()
    return row


def initiate_background_check(db: Session, tutor: models.TutorProfile) -> models.TutorVetting:
    """Kick off a Checkr background check (real if configured, else simulated)."""
    from app.services import checkr_service

    result = checkr_service.start_background_check(
        full_name=tutor.user.full_name, email=tutor.user.email
    )
    # Map Checkr report status → our internal status.
    mapping = {"clear": "passed", "consider": "failed", "failed": "failed"}
    internal = mapping.get(result.get("status", "pending"), "pending")

    row = _vetting_row(db, tutor.id)
    row.background_check_status = internal
    if row.status in ("pending", "credentials_submitted", "id_submitted"):
        row.status = "background_check"
    db.commit()
    db.refresh(row)
    return row


def decide(
    db: Session, admin: models.User, tutor_id: UUID, decision: str, note: str | None
) -> models.TutorProfile:
    tutor = db.query(models.TutorProfile).filter(models.TutorProfile.id == tutor_id).first()
    if not tutor:
        raise HTTPException(status_code=404, detail="Tutor not found")

    approved = decision == "approve"
    tutor.vetting_status = "approved" if approved else "rejected"

    row = _vetting_row(db, tutor.id)
    row.status = "approved" if approved else "rejected"
    row.reviewer_note = note
    if approved:
        row.background_check_status = "passed"
        idv = (
            db.query(models.TutorIdVerification)
            .filter(models.TutorIdVerification.tutor_id == tutor.id)
            .first()
        )
        if idv:
            idv.status = "verified"
            idv.verified_at = datetime.now(timezone.utc)

    db.add(
        models.AdminAction(
            admin_id=admin.id,
            action=f"{decision}_tutor",
            target_type="tutor",
            target_id=tutor.id,
            note=note,
        )
    )
    db.commit()
    db.refresh(tutor)

    # Lazy import to avoid a cycle.
    from app.services import notification_service

    notification_service.create(
        db,
        user_id=tutor.user_id,
        kind="vetting",
        title=f"Application {tutor.vetting_status}",
        body=note or f"Your tutor application was {tutor.vetting_status}.",
    )
    return tutor


def queue(db: Session) -> list[models.TutorProfile]:
    from sqlalchemy.orm import joinedload

    return (
        db.query(models.TutorProfile)
        .options(joinedload(models.TutorProfile.user))
        .filter(models.TutorProfile.vetting_status.in_(["pending", "in_review"]))
        .order_by(models.TutorProfile.created_at.asc())
        .all()
    )
