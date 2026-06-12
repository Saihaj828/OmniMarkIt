"""Vetting schemas: credentials, ID verification, teaching approach, vetting state."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.schemas.common import ORM


class CredentialCreate(BaseModel):
    kind: str  # degree | certification | transcript
    title: str
    institution: Optional[str] = None
    file_url: Optional[str] = None


class CredentialRead(BaseModel):
    id: UUID
    kind: str
    title: str
    institution: Optional[str] = None
    file_url: Optional[str] = None
    status: str
    created_at: datetime
    model_config = ORM


class IdVerificationSubmit(BaseModel):
    document_type: str
    document_url: Optional[str] = None


class IdVerificationRead(BaseModel):
    id: UUID
    document_type: Optional[str] = None
    status: str
    verified_at: Optional[datetime] = None
    model_config = ORM


class TeachingApproachSubmit(BaseModel):
    philosophy: Optional[str] = None
    experience_years: Optional[str] = None
    specialties: Optional[str] = None
    sample_lesson_url: Optional[str] = None


class TeachingApproachRead(BaseModel):
    id: UUID
    philosophy: Optional[str] = None
    experience_years: Optional[str] = None
    specialties: Optional[str] = None
    sample_lesson_url: Optional[str] = None
    model_config = ORM


class VettingStateRead(BaseModel):
    id: UUID
    tutor_id: UUID
    status: str
    background_check_status: str
    reviewer_note: Optional[str] = None
    model_config = ORM


class VettingDecision(BaseModel):
    decision: str  # approve | reject
    note: Optional[str] = None

    @field_validator("decision")
    @classmethod
    def decision_valid(cls, v: str) -> str:
        if v not in ("approve", "reject"):
            raise ValueError("decision must be 'approve' or 'reject'")
        return v
