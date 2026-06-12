"""Reviews + cached avg_rating / total_reviews update.

Hard rule: never recompute avg_rating on read. The write path here owns the
cache update; in production this is a Postgres trigger on INSERT to REVIEWS.
"""
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import models
from app.schemas import review as review_schemas
from app.services import notification_service, session_service


def create(
    db: Session, data: review_schemas.ReviewCreate, student: models.User
) -> models.Review:
    session = session_service.get_or_404(db, data.session_id)
    if session.student_id != student.id:
        raise HTTPException(status_code=403, detail="You can only review your own sessions")
    if session.status != "completed":
        raise HTTPException(status_code=409, detail="Can only review completed sessions")
    if session.review is not None:
        raise HTTPException(status_code=409, detail="Session already reviewed")

    review = models.Review(
        session_id=session.id,
        tutor_id=session.tutor_id,
        student_id=student.id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)

    # --- Update cached aggregates (the "trigger" job) ---
    tutor = session.tutor
    new_total = tutor.total_reviews + 1
    tutor.avg_rating = round(
        (tutor.avg_rating * tutor.total_reviews + data.rating * 100) / new_total
    )
    tutor.total_reviews = new_total

    db.commit()
    db.refresh(review)

    notification_service.create(
        db,
        user_id=tutor.user_id,
        kind="review",
        title="You received a new review",
        body=f"{data.rating}-star review on your session.",
    )
    return review


def respond(
    db: Session, tutor: models.TutorProfile, review_id: UUID, response: str
) -> models.Review:
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review or review.tutor_id != tutor.id:
        raise HTTPException(status_code=404, detail="Review not found")
    review.tutor_response = response
    db.commit()
    db.refresh(review)
    return review


def list_for_tutor(db: Session, tutor_id: UUID) -> list[dict]:
    rows = (
        db.query(models.Review, models.User.full_name)
        .join(models.User, models.User.id == models.Review.student_id)
        .filter(models.Review.tutor_id == tutor_id)
        .order_by(models.Review.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "session_id": r.session_id,
            "tutor_id": r.tutor_id,
            "student_id": r.student_id,
            "rating": r.rating,
            "comment": r.comment,
            "tutor_response": r.tutor_response,
            "created_at": r.created_at,
            "student_name": name,
        }
        for r, name in rows
    ]
