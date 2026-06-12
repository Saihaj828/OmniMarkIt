"""Review schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORM


class ReviewCreate(BaseModel):
    session_id: UUID
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class ReviewRead(BaseModel):
    id: UUID
    session_id: UUID
    tutor_id: UUID
    student_id: UUID
    rating: int
    comment: Optional[str] = None
    tutor_response: Optional[str] = None
    created_at: datetime
    student_name: Optional[str] = None
    model_config = ORM


class TutorResponse(BaseModel):
    response: str = Field(min_length=1)
