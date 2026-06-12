"""Availability exceptions + calendar connections (tutor/authenticated)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_tutor, get_current_user
from app.models import User
from app.schemas import scheduling as s
from app.services import scheduling_service, tutor_service

router = APIRouter(prefix="/api/scheduling", tags=["scheduling"])


@router.get("/me/exceptions", response_model=list[s.AvailabilityExceptionRead])
def my_exceptions(current: User = Depends(get_current_tutor), db: Session = Depends(get_db)):
    tutor = tutor_service.get_by_user_or_404(db, current.id)
    return scheduling_service.list_exceptions(db, tutor.id)


@router.post("/me/exceptions", response_model=s.AvailabilityExceptionRead, status_code=201)
def add_exception(
    data: s.AvailabilityExceptionCreate,
    current: User = Depends(get_current_tutor),
    db: Session = Depends(get_db),
):
    tutor = tutor_service.get_by_user_or_404(db, current.id)
    return scheduling_service.add_exception(db, tutor, data)


@router.get("/me/calendar", response_model=list[s.CalendarConnectionRead])
def my_calendar(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return scheduling_service.list_calendar_connections(db, current.id)


@router.post("/me/calendar", response_model=s.CalendarConnectionRead, status_code=201)
def connect_calendar(
    data: s.CalendarConnectionCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # OAuth tokens are AES-256 encrypted before persistence (see the service).
    return scheduling_service.connect_calendar(db, current, data)
