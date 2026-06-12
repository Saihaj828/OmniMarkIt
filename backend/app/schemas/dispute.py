"""Dispute schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import ORM


class DisputeCreate(BaseModel):
    session_id: Optional[UUID] = None
    payment_id: Optional[UUID] = None
    category: str  # quality | no_show | billing | conduct
    description: str = Field(min_length=1)

    @field_validator("category")
    @classmethod
    def category_valid(cls, v: str) -> str:
        allowed = {"quality", "no_show", "billing", "conduct"}
        if v not in allowed:
            raise ValueError(f"category must be one of {sorted(allowed)}")
        return v


class DisputeRead(BaseModel):
    id: UUID
    session_id: Optional[UUID] = None
    payment_id: Optional[UUID] = None
    raised_by_id: UUID
    against_id: Optional[UUID] = None
    category: str
    description: str
    status: str
    resolution: Optional[str] = None
    refund_amount_cents: Optional[int] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    model_config = ORM


class DisputeResolve(BaseModel):
    decision: str  # resolved | rejected
    resolution: str
    refund_amount_cents: Optional[int] = Field(default=None, ge=0)

    @field_validator("decision")
    @classmethod
    def decision_valid(cls, v: str) -> str:
        if v not in ("resolved", "rejected"):
            raise ValueError("decision must be 'resolved' or 'rejected'")
        return v
