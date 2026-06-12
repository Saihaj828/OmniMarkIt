"""VETTING: tutor_vetting, tutor_credentials, tutor_id_verification,
tutor_teaching_approach."""
from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.database import Base, GUID
from app.models.base import created_at_col, updated_at_col, uuid_pk


class TutorVetting(Base):
    """One row per tutor tracking overall vetting pipeline state."""

    __tablename__ = "tutor_vetting"

    id = uuid_pk()
    tutor_id = Column(GUID(), ForeignKey("tutor_profiles.id"), unique=True, nullable=False)
    status = Column(String, nullable=False, default="pending")
    # pending | credentials_submitted | id_submitted | background_check | approved | rejected
    background_check_status = Column(String, nullable=False, default="not_started")
    # not_started | pending | passed | failed
    reviewer_note = Column(Text, nullable=True)
    created_at = created_at_col()
    updated_at = updated_at_col()


class TutorCredential(Base):
    __tablename__ = "tutor_credentials"

    id = uuid_pk()
    tutor_id = Column(GUID(), ForeignKey("tutor_profiles.id"), nullable=False)
    kind = Column(String, nullable=False)  # degree | certification | transcript
    title = Column(String, nullable=False)
    institution = Column(String, nullable=True)
    file_url = Column(String, nullable=True)  # S3 url in prod; placeholder here
    status = Column(String, nullable=False, default="pending")  # pending|approved|rejected
    created_at = created_at_col()

    tutor = relationship("TutorProfile", back_populates="credentials")


class TutorIdVerification(Base):
    __tablename__ = "tutor_id_verification"

    id = uuid_pk()
    tutor_id = Column(GUID(), ForeignKey("tutor_profiles.id"), unique=True, nullable=False)
    document_type = Column(String, nullable=True)  # passport | drivers_license | national_id
    document_url = Column(String, nullable=True)
    status = Column(String, nullable=False, default="pending")  # pending|verified|rejected
    verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = created_at_col()


class TutorTeachingApproach(Base):
    __tablename__ = "tutor_teaching_approach"

    id = uuid_pk()
    tutor_id = Column(GUID(), ForeignKey("tutor_profiles.id"), unique=True, nullable=False)
    philosophy = Column(Text, nullable=True)
    experience_years = Column(String, nullable=True)
    specialties = Column(Text, nullable=True)  # comma-separated tags
    sample_lesson_url = Column(String, nullable=True)
    created_at = created_at_col()
