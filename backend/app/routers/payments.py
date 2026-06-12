"""Payments, payment methods, payouts, earnings."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_student, get_current_tutor, get_current_user
from app.models import User
from app.schemas import payment as s
from app.services import payment_service, tutor_service

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("/", response_model=s.PaymentRead, status_code=201)
def pay_for_session(
    data: s.PaymentCreate,
    current: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return payment_service.create_for_session(db, data, current)


@router.get("/", response_model=list[s.PaymentRead])
def my_payments(current: User = Depends(get_current_student), db: Session = Depends(get_db)):
    return payment_service.history_for_student(db, current.id)


@router.get("/earnings", response_model=s.EarningsRead)
def tutor_earnings(current: User = Depends(get_current_tutor), db: Session = Depends(get_db)):
    tutor = tutor_service.get_by_user_or_404(db, current.id)
    return payment_service.earnings_for_tutor(db, tutor.id)


@router.post("/payouts", response_model=s.PayoutRead, status_code=201)
def request_payout(current: User = Depends(get_current_tutor), db: Session = Depends(get_db)):
    tutor = tutor_service.get_by_user_or_404(db, current.id)
    return payment_service.request_payout(db, tutor)


@router.get("/payouts", response_model=list[s.PayoutRead])
def list_payouts(current: User = Depends(get_current_tutor), db: Session = Depends(get_db)):
    tutor = tutor_service.get_by_user_or_404(db, current.id)
    return payment_service.list_payouts(db, tutor.id)


# --- Payment methods (any authenticated user) ---
@router.get("/methods", response_model=list[s.PaymentMethodRead])
def list_methods(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return payment_service.list_payment_methods(db, current.id)


@router.post("/methods", response_model=s.PaymentMethodRead, status_code=201)
def add_method(
    data: s.PaymentMethodCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return payment_service.add_payment_method(db, current, data)
