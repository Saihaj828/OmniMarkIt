"""Payment schemas: payments, payment methods, payouts, earnings."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import ORM


class PaymentCreate(BaseModel):
    session_id: UUID
    promo_code: Optional[str] = None
    # DEMO ONLY: force a declined payment so the "payment failed" flow (E3)
    # can be exercised without a real Stripe failure.
    simulate_failure: bool = False


class PaymentRead(BaseModel):
    id: UUID
    session_id: Optional[UUID] = None
    amount_cents: int
    platform_fee_cents: int
    discount_cents: int
    status: str
    created_at: datetime
    model_config = ORM


class PaymentMethodCreate(BaseModel):
    brand: Optional[str] = None
    last4: Optional[str] = None
    exp_month: Optional[int] = None
    exp_year: Optional[int] = None
    is_default: bool = False


class PaymentMethodRead(BaseModel):
    id: UUID
    brand: Optional[str] = None
    last4: Optional[str] = None
    exp_month: Optional[int] = None
    exp_year: Optional[int] = None
    is_default: bool
    model_config = ORM


class PayoutRead(BaseModel):
    id: UUID
    amount_cents: int
    status: str
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    created_at: datetime
    model_config = ORM


class EarningsRead(BaseModel):
    gross_cents: int
    platform_fees_cents: int
    net_payout_cents: int
    paid_out_cents: int
    available_cents: int
    payment_count: int
