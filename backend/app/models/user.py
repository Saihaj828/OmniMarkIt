"""AUTH & IDENTITY: users, student_profiles, tutor_profiles."""
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base, GUID
from app.models.base import created_at_col, updated_at_col, uuid_pk


class User(Base):
    __tablename__ = "users"

    id = uuid_pk()
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # student | tutor | admin
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    # Password reset (no email provider wired in dev — token is returned directly)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)
    created_at = created_at_col()

    student_profile = relationship(
        "StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    tutor_profile = relationship(
        "TutorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = uuid_pk()
    user_id = Column(GUID(), ForeignKey("users.id"), unique=True, nullable=False)
    grade_level = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    timezone = Column(String, nullable=False, default="UTC")
    created_at = created_at_col()

    user = relationship("User", back_populates="student_profile")


class TutorProfile(Base):
    __tablename__ = "tutor_profiles"

    id = uuid_pk()
    user_id = Column(GUID(), ForeignKey("users.id"), unique=True, nullable=False)
    display_name = Column(String, nullable=False)
    headline = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    hourly_rate_cents = Column(Integer, nullable=False, default=5000)  # cents!
    timezone = Column(String, nullable=False, default="UTC")
    stripe_account_id = Column(String, nullable=True)  # Stripe Connect (stubbed)

    vetting_status = Column(String, nullable=False, default="pending")
    # pending | in_review | approved | rejected

    # Cached / denormalized — written by services, never recomputed on read.
    avg_rating = Column(Integer, nullable=False, default=0)  # stored x100 (487 = 4.87)
    total_reviews = Column(Integer, nullable=False, default=0)
    total_sessions = Column(Integer, nullable=False, default=0)

    created_at = created_at_col()
    updated_at = updated_at_col()

    user = relationship("User", back_populates="tutor_profile")
    subjects = relationship("TutorSubject", back_populates="tutor", cascade="all, delete-orphan")
    credentials = relationship("TutorCredential", back_populates="tutor", cascade="all, delete-orphan")
    availability = relationship("TutorAvailability", back_populates="tutor", cascade="all, delete-orphan")
