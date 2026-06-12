"""Tutor + subject schemas."""
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORM


class SubjectRead(BaseModel):
    id: UUID
    name: str
    category: str
    model_config = ORM


class SubjectCreate(BaseModel):
    name: str
    category: str


class CustomSubjectCreate(BaseModel):
    name: str = Field(min_length=1)
    category: Optional[str] = "Other"


class TutorSubjectRead(BaseModel):
    subject: SubjectRead
    model_config = ORM


class TutorRead(BaseModel):
    id: UUID
    user_id: UUID
    display_name: str
    headline: Optional[str] = None
    bio: Optional[str] = None
    hourly_rate_cents: int
    timezone: str
    vetting_status: str
    avg_rating: int  # x100
    total_reviews: int
    total_sessions: int
    subjects: list[TutorSubjectRead] = []
    model_config = ORM


class TutorProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    hourly_rate_cents: Optional[int] = Field(default=None, ge=0)
    timezone: Optional[str] = None
    subject_ids: Optional[list[UUID]] = None
