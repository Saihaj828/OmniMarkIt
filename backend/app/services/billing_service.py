"""Billing plans, subscriptions, promo codes."""
import uuid
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app import models
from app.schemas import billing as billing_schemas


def list_plans(db: Session) -> list[models.BillingPlan]:
    return (
        db.query(models.BillingPlan)
        .filter(models.BillingPlan.is_active.is_(True))
        .order_by(models.BillingPlan.price_cents.asc())
        .all()
    )


def subscribe(db: Session, student: models.User, plan_id: UUID) -> models.Subscription:
    plan = db.query(models.BillingPlan).filter(models.BillingPlan.id == plan_id).first()
    if not plan or not plan.is_active:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Cancel any existing active subscription (one active plan per student).
    db.query(models.Subscription).filter(
        models.Subscription.student_id == student.id,
        models.Subscription.status == "active",
    ).update({"status": "cancelled"})

    sub = models.Subscription(
        student_id=student.id,
        plan_id=plan.id,
        status="active",
        stripe_subscription_id=f"sub_stub_{uuid.uuid4().hex[:24]}",
        current_period_end=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def current_subscription(db: Session, student_id: UUID) -> models.Subscription | None:
    return (
        db.query(models.Subscription)
        .options(joinedload(models.Subscription.plan))
        .filter(
            models.Subscription.student_id == student_id,
            models.Subscription.status == "active",
        )
        .first()
    )


def cancel_subscription(db: Session, student_id: UUID) -> None:
    sub = current_subscription(db, student_id)
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription")
    sub.status = "cancelled"
    db.commit()


# --- Promo codes (admin) ---
def create_promo(db: Session, data: billing_schemas.PromoCodeCreate) -> models.PromoCode:
    if db.query(models.PromoCode).filter(models.PromoCode.code == data.code).first():
        raise HTTPException(status_code=409, detail="Promo code already exists")
    if not data.percent_off and not data.amount_off_cents:
        raise HTTPException(status_code=400, detail="Provide percent_off or amount_off_cents")
    promo = models.PromoCode(**data.model_dump())
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo


def list_promos(db: Session) -> list[models.PromoCode]:
    return db.query(models.PromoCode).order_by(models.PromoCode.created_at.desc()).all()
