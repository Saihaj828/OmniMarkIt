"""Billing schemas: plans, subscriptions, promo codes."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import ORM


class BillingPlanRead(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    price_cents: int
    sessions_included: int
    is_active: bool
    model_config = ORM


class SubscribeRequest(BaseModel):
    plan_id: UUID


class SubscriptionRead(BaseModel):
    id: UUID
    plan_id: UUID
    status: str
    current_period_end: Optional[datetime] = None
    created_at: datetime
    plan: Optional[BillingPlanRead] = None
    model_config = ORM


class PromoCodeCreate(BaseModel):
    code: str
    percent_off: Optional[int] = None
    amount_off_cents: Optional[int] = None
    max_redemptions: Optional[int] = None
    expires_at: Optional[datetime] = None


class PromoCodeRead(BaseModel):
    id: UUID
    code: str
    percent_off: Optional[int] = None
    amount_off_cents: Optional[int] = None
    max_redemptions: Optional[int] = None
    times_redeemed: int
    is_active: bool
    expires_at: Optional[datetime] = None
    model_config = ORM
