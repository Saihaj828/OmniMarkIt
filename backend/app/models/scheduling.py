"""SCHEDULING: tutor_availability, availability_exceptions, calendar_connections."""
from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base, GUID
from app.models.base import created_at_col, uuid_pk


class TutorAvailability(Base):
    __tablename__ = "tutor_availability"

    id = uuid_pk()
    tutor_id = Column(GUID(), ForeignKey("tutor_profiles.id"), nullable=False)
    weekday = Column(Integer, nullable=False)  # 0=Mon … 6=Sun
    start_minute = Column(Integer, nullable=False)  # minutes from midnight, tutor-local
    end_minute = Column(Integer, nullable=False)
    timezone = Column(String, nullable=False, default="UTC")  # synced from tutor

    tutor = relationship("TutorProfile", back_populates="availability")


class AvailabilityException(Base):
    """A one-off block/override on a specific date (e.g. vacation, extra slot)."""

    __tablename__ = "availability_exceptions"

    id = uuid_pk()
    tutor_id = Column(GUID(), ForeignKey("tutor_profiles.id"), nullable=False)
    date = Column(Date, nullable=False)
    is_available = Column(Boolean, nullable=False, default=False)  # False = blocked off
    start_minute = Column(Integer, nullable=True)
    end_minute = Column(Integer, nullable=True)
    reason = Column(String, nullable=True)
    created_at = created_at_col()


class CalendarConnection(Base):
    """External calendar link. OAuth tokens stored AES-256 encrypted."""

    __tablename__ = "calendar_connections"

    id = uuid_pk()
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    provider = Column(String, nullable=False)  # google | outlook
    # Encrypted at rest (see app.security.encrypt_secret) — NEVER plain text.
    access_token_enc = Column(String, nullable=False)
    refresh_token_enc = Column(String, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = created_at_col()
