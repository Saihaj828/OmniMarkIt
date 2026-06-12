"""Review creation + tutor responses."""
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_student, get_current_tutor
from app.models import User
from app.schemas import review as s
from app.services import review_service, tutor_service

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.post("/", response_model=s.ReviewRead, status_code=201)
def create_review(
    data: s.ReviewCreate,
    current: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    review = review_service.create(db, data, current)
    return s.ReviewRead(
        id=review.id,
        session_id=review.session_id,
        tutor_id=review.tutor_id,
        student_id=review.student_id,
        rating=review.rating,
        comment=review.comment,
        tutor_response=review.tutor_response,
        created_at=review.created_at,
        student_name=current.full_name,
    )


@router.post("/{review_id}/respond", response_model=s.ReviewRead)
def respond_to_review(
    review_id: UUID,
    data: s.TutorResponse,
    current: User = Depends(get_current_tutor),
    db: Session = Depends(get_db),
):
    tutor = tutor_service.get_by_user_or_404(db, current.id)
    review = review_service.respond(db, tutor, review_id, data.response)
    return s.ReviewRead(
        id=review.id,
        session_id=review.session_id,
        tutor_id=review.tutor_id,
        student_id=review.student_id,
        rating=review.rating,
        comment=review.comment,
        tutor_response=review.tutor_response,
        created_at=review.created_at,
    )
