"""Admin schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import ORM


class AdminActionRead(BaseModel):
    id: UUID
    admin_id: UUID
    action: str
    target_type: str
    target_id: UUID
    note: str | None = None
    created_at: datetime
    model_config = ORM


class SetActiveRequest(BaseModel):
    is_active: bool
