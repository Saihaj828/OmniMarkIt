"""REVIEWS: reviews."""
from sqlalchemy import Column, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.database import Base, GUID
from app.models.base import created_at_col, uuid_pk


class Review(Base):
    __tablename__ = "reviews"

    id = uuid_pk()
    session_id = Column(GUID(), ForeignKey("sessions.id"), unique=True, nullable=False)
    tutor_id = Column(GUID(), ForeignKey("tutor_profiles.id"), nullable=False)
    student_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1..5
    comment = Column(Text, nullable=True)
    tutor_response = Column(Text, nullable=True)
    created_at = created_at_col()

    session = relationship("Session", back_populates="review")
