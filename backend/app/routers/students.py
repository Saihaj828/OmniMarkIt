"""Student profile self-service."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_student
from app.models import User
from app.schemas import auth as s
from app.services import auth_service

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("/me", response_model=s.StudentProfileRead)
def my_student_profile(
    current: User = Depends(get_current_student), db: Session = Depends(get_db)
):
    return auth_service.get_student_profile(db, current)


@router.patch("/me", response_model=s.StudentProfileRead)
def update_my_student_profile(
    data: s.StudentProfileUpdate,
    current: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return auth_service.update_student_profile(db, current, data)
