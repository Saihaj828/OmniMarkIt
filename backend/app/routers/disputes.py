"""Disputes: raise (student/tutor) and list own."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import dispute as s
from app.services import dispute_service

router = APIRouter(prefix="/api/disputes", tags=["disputes"])


@router.post("/", response_model=s.DisputeRead, status_code=201)
def create_dispute(
    data: s.DisputeCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return dispute_service.create(db, data, current)


@router.get("/", response_model=list[s.DisputeRead])
def my_disputes(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return dispute_service.list_for_user(db, current)
