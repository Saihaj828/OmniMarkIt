"""Recording schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import ORM


class RecordingRead(BaseModel):
    id: UUID
    session_id: UUID
    uploader_id: UUID
    file_url: str
    duration_seconds: Optional[int] = None
    size_bytes: Optional[int] = None
    free_until: datetime
    price_cents: int
    created_at: datetime
    # Per-viewer flags (computed in the service for the requesting user):
    granted: bool = False          # admin granted this user access
    in_free_window: bool = True    # now < free_until
    is_paid: bool = False          # user already paid (post-window)
    can_view: bool = False         # final decision
    requires_payment: bool = False  # granted, window expired, not yet paid
    # Session participants (helps admins decide who to grant):
    student_id: Optional[UUID] = None
    student_name: Optional[str] = None
    tutor_user_id: Optional[UUID] = None
    tutor_name: Optional[str] = None
    subject_name: Optional[str] = None
    granted_user_ids: list[UUID] = []
    model_config = ORM


class RecordingGrant(BaseModel):
    user_id: UUID


class WhiteboardData(BaseModel):
    # Opaque JSON string of strokes; the frontend owns the shape.
    data: str = ""
