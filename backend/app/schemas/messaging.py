"""Messaging schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORM


class ConversationStart(BaseModel):
    tutor_user_id: UUID


class ConversationRead(BaseModel):
    id: UUID
    student_id: UUID
    tutor_id: UUID
    student_unread_count: int
    tutor_unread_count: int
    last_message_at: Optional[datetime] = None
    other_party_name: Optional[str] = None
    model_config = ORM


class MessageCreate(BaseModel):
    body: str = Field(min_length=1)


class MessageRead(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    body: str
    created_at: datetime
    model_config = ORM
