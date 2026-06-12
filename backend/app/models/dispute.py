"""DISPUTES & SAFETY: disputes."""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.database import Base, GUID
from app.models.base import created_at_col, uuid_pk


class Dispute(Base):
    __tablename__ = "disputes"

    id = uuid_pk()
    session_id = Column(GUID(), ForeignKey("sessions.id"), nullable=True)
    payment_id = Column(GUID(), ForeignKey("payments.id"), nullable=True)
    raised_by_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    against_id = Column(GUID(), ForeignKey("users.id"), nullable=True)

    category = Column(String, nullable=False)  # quality | no_show | billing | conduct
    description = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="open")  # open|under_review|resolved|rejected
    resolution = Column(Text, nullable=True)
    refund_amount_cents = Column(Integer, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = created_at_col()
