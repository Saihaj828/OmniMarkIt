"""NOTIFICATIONS: notifications."""
from sqlalchemy import Boolean, Column, ForeignKey, String, Text

from app.database import Base, GUID
from app.models.base import created_at_col, uuid_pk


class Notification(Base):
    __tablename__ = "notifications"

    id = uuid_pk()
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    kind = Column(String, nullable=False)  # booking|message|payment|vetting|review|dispute
    title = Column(String, nullable=False)
    body = Column(Text, nullable=True)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = created_at_col()
