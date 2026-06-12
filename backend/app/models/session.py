"""SESSIONS: sessions, session_materials, session_flags."""
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base, GUID
from app.models.base import created_at_col, uuid_pk


class Session(Base):
    __tablename__ = "sessions"

    id = uuid_pk()
    student_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    tutor_id = Column(GUID(), ForeignKey("tutor_profiles.id"), nullable=False)
    subject_id = Column(GUID(), ForeignKey("subjects.id"), nullable=False)

    start_time = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    price_cents = Column(Integer, nullable=False)  # cents!
    status = Column(String, nullable=False, default="scheduled")
    # scheduled | in_progress | completed | cancelled

    video_room_url = Column(String, nullable=True)  # Jitsi room url
    cancellation_reason = Column(String, nullable=True)
    whiteboard_data = Column(Text, nullable=True)  # shared whiteboard strokes (JSON)
    created_at = created_at_col()

    student = relationship("User", foreign_keys=[student_id])
    tutor = relationship("TutorProfile", foreign_keys=[tutor_id])
    subject = relationship("Subject")
    review = relationship("Review", back_populates="session", uselist=False)
    materials = relationship("SessionMaterial", back_populates="session", cascade="all, delete-orphan")
    flags = relationship("SessionFlag", back_populates="session", cascade="all, delete-orphan")


class SessionMaterial(Base):
    __tablename__ = "session_materials"

    id = uuid_pk()
    session_id = Column(GUID(), ForeignKey("sessions.id"), nullable=False)
    uploader_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    file_url = Column(String, nullable=True)  # S3 in prod
    kind = Column(String, nullable=False, default="document")  # document | whiteboard | recording
    created_at = created_at_col()

    session = relationship("Session", back_populates="materials")


class SessionFlag(Base):
    """A trust & safety flag raised on a session."""

    __tablename__ = "session_flags"

    id = uuid_pk()
    session_id = Column(GUID(), ForeignKey("sessions.id"), nullable=False)
    reporter_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    reason = Column(String, nullable=False)
    detail = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="open")  # open | reviewing | resolved
    # Hard rule: a session under legal hold can never be deleted.
    legal_hold = Column(Boolean, nullable=False, default=False)
    created_at = created_at_col()

    session = relationship("Session", back_populates="flags")
