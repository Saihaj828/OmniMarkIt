"""Payments, payouts, payment methods. Stripe is stubbed.

Money is always integer cents. Platform fee derives from PLATFORM_FEE_BPS.
A promo code (if valid) reduces the charged amount; the platform fee is computed
on the discounted amount.
"""
import uuid
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import models
from app.config import settings
from app.schemas import payment as payment_schemas
from app.services import notification_service, session_service, stripe_service


def _platform_fee(amount_cents: int) -> int:
    return amount_cents * settings.PLATFORM_FEE_BPS // 10_000


def _apply_promo(db: Session, code: str | None, base_cents: int):
    """Return (discount_cents, promo_or_None). Raises on invalid code."""
    if not code:
        return 0, None
    promo = db.query(models.PromoCode).filter(models.PromoCode.code == code).first()
    if not promo or not promo.is_active:
        raise HTTPException(status_code=400, detail="Invalid promo code")
    if promo.expires_at and promo.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Promo code expired")
    if promo.max_redemptions is not None and promo.times_redeemed >= promo.max_redemptions:
        raise HTTPException(status_code=400, detail="Promo code fully redeemed")

    discount = 0
    if promo.percent_off:
        discount = base_cents * promo.percent_off // 100
    elif promo.amount_off_cents:
        discount = min(promo.amount_off_cents, base_cents)
    return discount, promo


def create_for_session(
    db: Session, data: payment_schemas.PaymentCreate, student: models.User
) -> models.Payment:
    session = session_service.get_or_404(db, data.session_id)
    if session.student_id != student.id:
        raise HTTPException(status_code=403, detail="Not your session")
    if (
        db.query(models.Payment)
        .filter(models.Payment.session_id == session.id, models.Payment.status == "succeeded")
        .first()
    ):
        raise HTTPException(status_code=409, detail="Session already paid")

    discount, promo = _apply_promo(db, data.promo_code, session.price_cents)
    amount = session.price_cents - discount

    # DEMO: simulate a declined card (E3 payment-failed flow).
    if data.simulate_failure:
        failed = models.Payment(
            session_id=session.id,
            student_id=session.student_id,
            tutor_id=session.tutor_id,
            amount_cents=amount,
            discount_cents=discount,
            platform_fee_cents=_platform_fee(amount),
            promo_code_id=promo.id if promo else None,
            stripe_payment_intent=f"pi_stub_{uuid.uuid4().hex[:24]}",
            status="failed",
        )
        db.add(failed)
        db.commit()
        raise HTTPException(
            status_code=402, detail="Your card was declined. Please try another card."
        )

    # Charge via Stripe (real when a key is configured, simulated otherwise).
    result = stripe_service.charge_session(
        amount,
        description=f"OmniMarkIt session {session.id}",
        metadata={"session_id": str(session.id), "student_id": str(session.student_id)},
    )

    payment = models.Payment(
        session_id=session.id,
        student_id=session.student_id,   # denormalized from session
        tutor_id=session.tutor_id,       # denormalized from session
        amount_cents=amount,
        discount_cents=discount,
        platform_fee_cents=_platform_fee(amount),
        promo_code_id=promo.id if promo else None,
        stripe_payment_intent=result["payment_intent"],
        status=result["status"],
    )
    db.add(payment)
    if result["status"] == "succeeded" and promo:
        promo.times_redeemed += 1
    db.commit()
    db.refresh(payment)

    if result["status"] != "succeeded":
        raise HTTPException(status_code=402, detail="Payment failed. Please try another card.")

    notification_service.create(
        db,
        user_id=session.tutor.user_id,
        kind="payment",
        title="Payment received",
        body=f"You earned {amount - payment.platform_fee_cents} cents (after fee).",
    )
    return payment


def history_for_student(db: Session, student_id: UUID) -> list[models.Payment]:
    return (
        db.query(models.Payment)
        .filter(models.Payment.student_id == student_id)
        .order_by(models.Payment.created_at.desc())
        .all()
    )


def earnings_for_tutor(db: Session, tutor_id: UUID) -> dict:
    payments = (
        db.query(models.Payment)
        .filter(models.Payment.tutor_id == tutor_id, models.Payment.status == "succeeded")
        .all()
    )
    gross = sum(p.amount_cents for p in payments)
    fees = sum(p.platform_fee_cents for p in payments)
    net = gross - fees
    paid_out = sum(
        p.amount_cents
        for p in db.query(models.Payout)
        .filter(models.Payout.tutor_id == tutor_id, models.Payout.status == "paid")
        .all()
    )
    return {
        "gross_cents": gross,
        "platform_fees_cents": fees,
        "net_payout_cents": net,
        "paid_out_cents": paid_out,
        "available_cents": net - paid_out,
        "payment_count": len(payments),
    }


def request_payout(db: Session, tutor: models.TutorProfile) -> models.Payout:
    """Pay out the tutor's available balance via a Stripe Connect transfer."""
    earnings = earnings_for_tutor(db, tutor.id)
    available = earnings["available_cents"]
    if available <= 0:
        raise HTTPException(status_code=400, detail="No funds available for payout")
    if settings.stripe_enabled and not tutor.stripe_account_id:
        raise HTTPException(
            status_code=400,
            detail="Add your Stripe account before requesting a payout",
        )

    result = stripe_service.create_transfer(available, tutor.stripe_account_id)
    payout = models.Payout(
        tutor_id=tutor.id,
        amount_cents=available,
        status=result["status"],
        stripe_transfer_id=result["transfer_id"],
    )
    db.add(payout)
    db.commit()
    db.refresh(payout)
    if result["status"] != "paid":
        raise HTTPException(
            status_code=402, detail=result.get("error", "Payout failed")
        )
    return payout


def list_payouts(db: Session, tutor_id: UUID) -> list[models.Payout]:
    return (
        db.query(models.Payout)
        .filter(models.Payout.tutor_id == tutor_id)
        .order_by(models.Payout.created_at.desc())
        .all()
    )


# --- Payment methods ---
def add_payment_method(
    db: Session, user: models.User, data: payment_schemas.PaymentMethodCreate
) -> models.PaymentMethod:
    if data.is_default:
        db.query(models.PaymentMethod).filter(
            models.PaymentMethod.user_id == user.id
        ).update({"is_default": False})
    pm = models.PaymentMethod(
        user_id=user.id,
        stripe_payment_method_id=f"pm_stub_{uuid.uuid4().hex[:24]}",
        **data.model_dump(),
    )
    db.add(pm)
    db.commit()
    db.refresh(pm)
    return pm


def list_payment_methods(db: Session, user_id: UUID) -> list[models.PaymentMethod]:
    return (
        db.query(models.PaymentMethod)
        .filter(models.PaymentMethod.user_id == user_id)
        .order_by(models.PaymentMethod.is_default.desc())
        .all()
    )
