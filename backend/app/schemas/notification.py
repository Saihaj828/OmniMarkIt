"""Notification schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import ORM


class NotificationRead(BaseModel):
    id: UUID
    kind: str
    title: str
    body: Optional[str] = None
    is_read: bool
    created_at: datetime
    model_config = ORM
