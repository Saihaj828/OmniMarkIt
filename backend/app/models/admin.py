"""ADMIN: admin_actions (audit log of every admin operation)."""
from sqlalchemy import Column, ForeignKey, String, Text

from app.database import Base, GUID
from app.models.base import created_at_col, uuid_pk


class AdminAction(Base):
    __tablename__ = "admin_actions"

    id = uuid_pk()
    admin_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # approve_tutor | suspend_user | resolve_dispute …
    target_type = Column(String, nullable=False)  # tutor | user | session | dispute
    target_id = Column(GUID(), nullable=False)
    note = Column(Text, nullable=True)
    created_at = created_at_col()
