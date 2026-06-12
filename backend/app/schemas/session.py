"""Session schemas: booking, status, materials, flags."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import ORM


class SessionCreate(BaseModel):
    tutor_id: UUID
    subject_id: UUID
    start_time: datetime
    duration_minutes: int

    @field_validator("duration_minutes")
    @classmethod
    def duration_valid(cls, v: int) -> int:
        if v not in (30, 60, 90):
            raise ValueError("duration_minutes must be 30, 60, or 90")
        return v


class SessionRead(BaseModel):
    id: UUID
    student_id: UUID
    tutor_id: UUID
    subject_id: UUID
    start_time: datetime
    duration_minutes: int
    price_cents: int
    status: str
    video_room_url: Optional[str] = None
    created_at: datetime
    tutor_name: Optional[str] = None
    student_name: Optional[str] = None
    subject_name: Optional[str] = None
    model_config = ORM


class SessionStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def status_valid(cls, v: str) -> str:
        allowed = {"scheduled", "in_progress", "completed", "cancelled"}
        if v not in allowed:
            raise ValueError(f"status must be one of {sorted(allowed)}")
        return v


class SessionCancel(BaseModel):
    reason: Optional[str] = None


class SessionReschedule(BaseModel):
    start_time: datetime


class MaterialCreate(BaseModel):
    title: str
    file_url: Optional[str] = None
    kind: str = "document"


class MaterialRead(BaseModel):
    id: UUID
    session_id: UUID
    uploader_id: UUID
    title: str
    file_url: Optional[str] = None
    kind: str
    created_at: datetime
    model_config = ORM


class FlagCreate(BaseModel):
    reason: str
    detail: Optional[str] = None


class FlagRead(BaseModel):
    id: UUID
    session_id: UUID
    reporter_id: UUID
    reason: str
    detail: Optional[str] = None
    status: str
    legal_hold: bool
    created_at: datetime
    model_config = ORM
