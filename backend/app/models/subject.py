"""SUBJECTS: subjects, tutor_subjects."""
from sqlalchemy import Column, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base, GUID
from app.models.base import uuid_pk


class Subject(Base):
    __tablename__ = "subjects"

    id = uuid_pk()
    name = Column(String, unique=True, nullable=False)
    category = Column(String, nullable=False)  # Math, Physics, Chemistry, …


class TutorSubject(Base):
    __tablename__ = "tutor_subjects"
    __table_args__ = (UniqueConstraint("tutor_id", "subject_id", name="uq_tutor_subject"),)

    id = uuid_pk()
    tutor_id = Column(GUID(), ForeignKey("tutor_profiles.id"), nullable=False)
    subject_id = Column(GUID(), ForeignKey("subjects.id"), nullable=False)

    tutor = relationship("TutorProfile", back_populates="subjects")
    subject = relationship("Subject")
