"""Tutor profile + search."""
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app import models
from app.schemas import tutor as tutor_schemas


def _with_subjects(query):
    return query.options(
        joinedload(models.TutorProfile.subjects).joinedload(models.TutorSubject.subject)
    )


def get_or_404(db: Session, tutor_id: UUID) -> models.TutorProfile:
    tutor = _with_subjects(
        db.query(models.TutorProfile).filter(models.TutorProfile.id == tutor_id)
    ).first()
    if not tutor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor not found")
    return tutor


def get_by_user_or_404(db: Session, user_id: UUID) -> models.TutorProfile:
    tutor = _with_subjects(
        db.query(models.TutorProfile).filter(models.TutorProfile.user_id == user_id)
    ).first()
    if not tutor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor profile not found")
    return tutor


def search(
    db: Session,
    *,
    q: str | None = None,
    subject_id: UUID | None = None,
    max_rate_cents: int | None = None,
    only_approved: bool = True,
) -> list[models.TutorProfile]:
    query = _with_subjects(db.query(models.TutorProfile))
    if only_approved:
        query = query.filter(models.TutorProfile.vetting_status == "approved")
    if q:
        like = f"%{q}%"
        query = query.filter(
            models.TutorProfile.display_name.ilike(like)
            | models.TutorProfile.headline.ilike(like)
        )
    if subject_id:
        query = query.join(models.TutorSubject).filter(
            models.TutorSubject.subject_id == subject_id
        )
    if max_rate_cents is not None:
        query = query.filter(models.TutorProfile.hourly_rate_cents <= max_rate_cents)
    return query.order_by(models.TutorProfile.avg_rating.desc()).all()


def update_profile(
    db: Session, tutor: models.TutorProfile, data: tutor_schemas.TutorProfileUpdate
) -> models.TutorProfile:
    payload = data.model_dump(exclude_unset=True)
    subject_ids = payload.pop("subject_ids", None)
    for field, value in payload.items():
        setattr(tutor, field, value)

    if subject_ids is not None:
        db.query(models.TutorSubject).filter(
            models.TutorSubject.tutor_id == tutor.id
        ).delete()
        for sid in subject_ids:
            if not db.query(models.Subject).filter(models.Subject.id == sid).first():
                raise HTTPException(status_code=400, detail=f"Unknown subject {sid}")
            db.add(models.TutorSubject(tutor_id=tutor.id, subject_id=sid))

    # Keep availability timezone in sync with the tutor (denormalization rule).
    if "timezone" in payload:
        db.query(models.TutorAvailability).filter(
            models.TutorAvailability.tutor_id == tutor.id
        ).update({"timezone": tutor.timezone})

    db.commit()
    db.refresh(tutor)
    return tutor
