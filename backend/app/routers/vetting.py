"""Tutor vetting pipeline (tutor-facing submissions + state)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_tutor
from app.models import User
from app.schemas import vetting as s
from app.services import tutor_service, vetting_service

router = APIRouter(prefix="/api/vetting", tags=["vetting"])


@router.get("/me", response_model=s.VettingStateRead)
def my_vetting_state(current: User = Depends(get_current_tutor), db: Session = Depends(get_db)):
    tutor = tutor_service.get_by_user_or_404(db, current.id)
    return vetting_service.get_state(db, tutor.id)


@router.post("/me/credentials", response_model=s.CredentialRead, status_code=201)
def submit_credential(
    data: s.CredentialCreate,
    current: User = Depends(get_current_tutor),
    db: Session = Depends(get_db),
):
    tutor = tutor_service.get_by_user_or_404(db, current.id)
    return vetting_service.add_credential(db, tutor, data)


@router.get("/me/credentials", response_model=list[s.CredentialRead])
def my_credentials(current: User = Depends(get_current_tutor), db: Session = Depends(get_db)):
    tutor = tutor_service.get_by_user_or_404(db, current.id)
    return vetting_service.list_credentials(db, tutor.id)


@router.post("/me/id-verification", response_model=s.IdVerificationRead, status_code=201)
def submit_id(
    data: s.IdVerificationSubmit,
    current: User = Depends(get_current_tutor),
    db: Session = Depends(get_db),
):
    tutor = tutor_service.get_by_user_or_404(db, current.id)
    return vetting_service.submit_id_verification(db, tutor, data)


@router.post("/me/teaching-approach", response_model=s.TeachingApproachRead, status_code=201)
def submit_teaching_approach(
    data: s.TeachingApproachSubmit,
    current: User = Depends(get_current_tutor),
    db: Session = Depends(get_db),
):
    tutor = tutor_service.get_by_user_or_404(db, current.id)
    return vetting_service.submit_teaching_approach(db, tutor, data)


@router.post("/me/background-check", response_model=s.VettingStateRead, status_code=201)
def start_background_check(
    current: User = Depends(get_current_tutor), db: Session = Depends(get_db)
):
    tutor = tutor_service.get_by_user_or_404(db, current.id)
    return vetting_service.initiate_background_check(db, tutor)
