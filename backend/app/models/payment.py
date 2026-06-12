"""PAYMENTS: billing_plans, subscriptions, payments, payouts, payment_methods,
promo_codes, cancellation_policies."""
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base, GUID
from app.models.base import created_at_col, uuid_pk


class BillingPlan(Base):
    __tablename__ = "billing_plans"

    id = uuid_pk()
    name = Column(String, unique=True, nullable=False)  # Starter | Plus | Pro
    description = Column(String, nullable=True)
    price_cents = Column(Integer, nullable=False)  # monthly, in cents
    sessions_included = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = uuid_pk()
    student_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    plan_id = Column(GUID(), ForeignKey("billing_plans.id"), nullable=False)
    status = Column(String, nullable=False, default="active")  # active|past_due|cancelled
    stripe_subscription_id = Column(String, nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    created_at = created_at_col()

    plan = relationship("BillingPlan")


class Payment(Base):
    __tablename__ = "payments"

    id = uuid_pk()
    session_id = Column(GUID(), ForeignKey("sessions.id"), nullable=True)
    # student_id / tutor_id duplicated from session per denormalization rule.
    student_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    tutor_id = Column(GUID(), ForeignKey("tutor_profiles.id"), nullable=False)

    amount_cents = Column(Integer, nullable=False)
    platform_fee_cents = Column(Integer, nullable=False)
    discount_cents = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default="pending")  # pending|succeeded|failed|refunded
    stripe_payment_intent = Column(String, nullable=True)
    promo_code_id = Column(GUID(), ForeignKey("promo_codes.id"), nullable=True)
    created_at = created_at_col()


class Payout(Base):
    """Money sent to a tutor (Stripe Connect transfer; stubbed)."""

    __tablename__ = "payouts"

    id = uuid_pk()
    tutor_id = Column(GUID(), ForeignKey("tutor_profiles.id"), nullable=False)
    amount_cents = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending|paid|failed
    stripe_transfer_id = Column(String, nullable=True)
    period_start = Column(DateTime(timezone=True), nullable=True)
    period_end = Column(DateTime(timezone=True), nullable=True)
    created_at = created_at_col()


class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id = uuid_pk()
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    brand = Column(String, nullable=True)  # visa | mastercard | …
    last4 = Column(String, nullable=True)
    exp_month = Column(Integer, nullable=True)
    exp_year = Column(Integer, nullable=True)
    stripe_payment_method_id = Column(String, nullable=True)
    is_default = Column(Boolean, nullable=False, default=False)
    created_at = created_at_col()


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = uuid_pk()
    code = Column(String, unique=True, nullable=False)
    percent_off = Column(Integer, nullable=True)  # 0..100
    amount_off_cents = Column(Integer, nullable=True)
    max_redemptions = Column(Integer, nullable=True)
    times_redeemed = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = created_at_col()


class CancellationPolicy(Base):
    __tablename__ = "cancellation_policies"

    id = uuid_pk()
    name = Column(String, unique=True, nullable=False)  # flexible | moderate | strict
    description = Column(String, nullable=True)
    # Full refund if cancelled at least this many hours before start.
    free_cancellation_hours = Column(Integer, nullable=False, default=24)
    # Otherwise this percentage is charged.
    late_charge_percent = Column(Integer, nullable=False, default=50)
