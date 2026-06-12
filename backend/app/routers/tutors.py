"""Tutor search, public profiles, and the authenticated tutor's own profile."""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_tutor
from app.models import User
from app.schemas import review as review_s
from app.schemas import scheduling as sched_s
from app.schemas import tutor as s
from app.services import review_service, scheduling_service, tutor_service

router = APIRouter(prefix="/api/tutors", tags=["tutors"])


# --- Authenticated tutor: own profile (declared before /{tutor_id}) ---
@router.get("/me", response_model=s.TutorRead)
def my_profile(current: User = Depends(get_current_tutor), db: Session = Depends(get_db)):
    return tutor_service.get_by_user_or_404(db, current.id)


@router.patch("/me", response_model=s.TutorRead)
def update_my_profile(
    data: s.TutorProfileUpdate,
    current: User = Depends(get_current_tutor),
    db: Session = Depends(get_db),
):
    tutor = tutor_service.get_by_user_or_404(db, current.id)
    return tutor_service.update_profile(db, tutor, data)


@router.get("/me/availability", response_model=list[sched_s.AvailabilityRead])
def my_availability(current: User = Depends(get_current_tutor), db: Session = Depends(get_db)):
    tutor = tutor_service.get_by_user_or_404(db, current.id)
    return scheduling_service.list_availability(db, tutor.id)


@router.post("/me/availability", response_model=sched_s.AvailabilityRead, status_code=201)
def add_availability(
    data: sched_s.AvailabilityCreate,
    current: User = Depends(get_current_tutor),
    db: Session = Depends(get_db),
):
    tutor = tutor_service.get_by_user_or_404(db, current.id)
    return scheduling_service.add_availability(db, tutor, data)


@router.delete("/me/availability/{slot_id}", status_code=204)
def delete_availability(
    slot_id: UUID,
    current: User = Depends(get_current_tutor),
    db: Session = Depends(get_db),
):
    tutor = tutor_service.get_by_user_or_404(db, current.id)
    scheduling_service.delete_availability(db, tutor, slot_id)


# --- Public search & profiles ---
@router.get("/", response_model=list[s.TutorRead])
def search_tutors(
    q: str | None = None,
    subject_id: UUID | None = None,
    max_rate_cents: int | None = Query(default=None, ge=0),
    db: Session = Depends(get_db),
):
    return tutor_service.search(db, q=q, subject_id=subject_id, max_rate_cents=max_rate_cents)


@router.get("/{tutor_id}", response_model=s.TutorRead)
def get_tutor(tutor_id: UUID, db: Session = Depends(get_db)):
    return tutor_service.get_or_404(db, tutor_id)


@router.get("/{tutor_id}/availability", response_model=list[sched_s.AvailabilityRead])
def tutor_availability(tutor_id: UUID, db: Session = Depends(get_db)):
    tutor_service.get_or_404(db, tutor_id)
    return scheduling_service.list_availability(db, tutor_id)


@router.get("/{tutor_id}/reviews", response_model=list[review_s.ReviewRead])
def tutor_reviews(tutor_id: UUID, db: Session = Depends(get_db)):
    tutor_service.get_or_404(db, tutor_id)
    return review_service.list_for_tutor(db, tutor_id)
