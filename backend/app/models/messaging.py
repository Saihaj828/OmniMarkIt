"""MESSAGING: conversations, messages."""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base, GUID
from app.models.base import created_at_col, uuid_pk


class Conversation(Base):
    __tablename__ = "conversations"
    __table_args__ = (UniqueConstraint("student_id", "tutor_id", name="uq_conversation_pair"),)

    id = uuid_pk()
    student_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    tutor_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    # Cached unread counters — increment on send, reset on read (never COUNT(*)).
    student_unread_count = Column(Integer, nullable=False, default=0)
    tutor_unread_count = Column(Integer, nullable=False, default=0)
    last_message_at = Column(DateTime(timezone=True), nullable=True)
    created_at = created_at_col()

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = uuid_pk()
    conversation_id = Column(GUID(), ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    created_at = created_at_col()

    conversation = relationship("Conversation", back_populates="messages")
