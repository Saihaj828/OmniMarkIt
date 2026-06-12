"""Billing plans, subscriptions, and promo codes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin, get_current_student
from app.models import User
from app.schemas import billing as s
from app.services import billing_service

router = APIRouter(prefix="/api/billing", tags=["billing"])


@router.get("/plans", response_model=list[s.BillingPlanRead])
def list_plans(db: Session = Depends(get_db)):
    return billing_service.list_plans(db)


@router.post("/subscribe", response_model=s.SubscriptionRead, status_code=201)
def subscribe(
    data: s.SubscribeRequest,
    current: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return billing_service.subscribe(db, current, data.plan_id)


@router.get("/subscription", response_model=s.SubscriptionRead | None)
def my_subscription(
    current: User = Depends(get_current_student), db: Session = Depends(get_db)
):
    return billing_service.current_subscription(db, current.id)


@router.delete("/subscription", status_code=204)
def cancel_subscription(
    current: User = Depends(get_current_student), db: Session = Depends(get_db)
):
    billing_service.cancel_subscription(db, current.id)


# --- Promo codes (admin) ---
@router.get("/promos", response_model=list[s.PromoCodeRead])
def list_promos(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return billing_service.list_promos(db)


@router.post("/promos", response_model=s.PromoCodeRead, status_code=201)
def create_promo(
    data: s.PromoCodeCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)
):
    return billing_service.create_promo(db, data)
