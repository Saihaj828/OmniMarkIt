"""Scheduling schemas: availability, exceptions, calendar connections."""
from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORM


class AvailabilityCreate(BaseModel):
    weekday: int = Field(ge=0, le=6)
    start_minute: int = Field(ge=0, le=1440)
    end_minute: int = Field(ge=0, le=1440)


class AvailabilityRead(BaseModel):
    id: UUID
    weekday: int
    start_minute: int
    end_minute: int
    timezone: str
    model_config = ORM


class AvailabilityExceptionCreate(BaseModel):
    date: date
    is_available: bool = False
    start_minute: Optional[int] = Field(default=None, ge=0, le=1440)
    end_minute: Optional[int] = Field(default=None, ge=0, le=1440)
    reason: Optional[str] = None


class AvailabilityExceptionRead(BaseModel):
    id: UUID
    date: date
    is_available: bool
    start_minute: Optional[int] = None
    end_minute: Optional[int] = None
    reason: Optional[str] = None
    model_config = ORM


class CalendarConnectionCreate(BaseModel):
    provider: str  # google | outlook
    access_token: str  # plaintext in; stored AES-encrypted
    refresh_token: Optional[str] = None
    expires_at: Optional[datetime] = None


class CalendarConnectionRead(BaseModel):
    id: UUID
    provider: str
    expires_at: Optional[datetime] = None
    created_at: datetime
    model_config = ORM
