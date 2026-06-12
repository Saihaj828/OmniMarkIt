"""RECORDINGS: session recordings + admin-granted view access.

A recording is stored locally (uploads/recordings/). Access is gated two ways:
  1) an admin must grant a specific user (student or tutor) permission, AND
  2) it's free to view until `free_until`, after which the user must pay.
"""
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base, GUID
from app.models.base import created_at_col, uuid_pk


class Recording(Base):
    __tablename__ = "recordings"

    id = uuid_pk()
    session_id = Column(GUID(), ForeignKey("sessions.id"), nullable=False)
    uploader_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    file_url = Column(String, nullable=False)  # /api/recordings/{id}/view (permission-gated)
    storage_path = Column(String, nullable=False)  # local path on disk
    duration_seconds = Column(Integer, nullable=True)
    size_bytes = Column(Integer, nullable=True)
    # Free to view until this time, then payable.
    free_until = Column(DateTime(timezone=True), nullable=False)
    price_cents = Column(Integer, nullable=False, default=499)
    created_at = created_at_col()

    grants = relationship("RecordingAccess", back_populates="recording", cascade="all, delete-orphan")


class RecordingAccess(Base):
    """One row per (recording, user) the admin has permitted to view."""

    __tablename__ = "recording_access"
    __table_args__ = (
        UniqueConstraint("recording_id", "user_id", name="uq_recording_user"),
    )

    id = uuid_pk()
    recording_id = Column(GUID(), ForeignKey("recordings.id"), nullable=False)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    granted_by = Column(GUID(), ForeignKey("users.id"), nullable=False)  # admin
    # True once the user has paid to view after the free window.
    is_paid = Column(Boolean, nullable=False, default=False)
    created_at = created_at_col()

    recording = relationship("Recording", back_populates="grants")
