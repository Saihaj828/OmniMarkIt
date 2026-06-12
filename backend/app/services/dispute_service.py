"""Disputes: students/tutors raise them; admins resolve them."""
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import models
from app.schemas import dispute as dispute_schemas
from app.services import notification_service, session_service


def create(
    db: Session, data: dispute_schemas.DisputeCreate, user: models.User
) -> models.Dispute:
    against_id = None
    if data.session_id:
        session = session_service.get_or_404(db, data.session_id)
        session_service.assert_participant(session, user)
        # The other party is the counterparty on the session.
        against_id = (
            session.tutor.user_id if user.id == session.student_id else session.student_id
        )

    dispute = models.Dispute(
        session_id=data.session_id,
        payment_id=data.payment_id,
        raised_by_id=user.id,
        against_id=against_id,
        category=data.category,
        description=data.description,
        status="open",
    )
    db.add(dispute)
    db.commit()
    db.refresh(dispute)

    for admin in db.query(models.User).filter(models.User.role == "admin").all():
        notification_service.create(
            db,
            user_id=admin.id,
            kind="dispute",
            title="New dispute filed",
            body=f"Category: {data.category}",
        )
    return dispute


def list_for_user(db: Session, user: models.User) -> list[models.Dispute]:
    query = db.query(models.Dispute)
    if user.role != "admin":
        query = query.filter(
            (models.Dispute.raised_by_id == user.id)
            | (models.Dispute.against_id == user.id)
        )
    return query.order_by(models.Dispute.created_at.desc()).all()


def list_all(db: Session, status_filter: str | None = None) -> list[models.Dispute]:
    query = db.query(models.Dispute)
    if status_filter:
        query = query.filter(models.Dispute.status == status_filter)
    return query.order_by(models.Dispute.created_at.desc()).all()


def resolve(
    db: Session, admin: models.User, dispute_id: UUID, data: dispute_schemas.DisputeResolve
) -> models.Dispute:
    dispute = db.query(models.Dispute).filter(models.Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    if dispute.status in ("resolved", "rejected"):
        raise HTTPException(status_code=409, detail="Dispute already closed")

    dispute.status = data.decision
    dispute.resolution = data.resolution
    dispute.resolved_at = datetime.now(timezone.utc)

    # Process refund if granted (Stripe refund stubbed → mark payment refunded).
    if data.decision == "resolved" and data.refund_amount_cents:
        dispute.refund_amount_cents = data.refund_amount_cents
        if dispute.payment_id:
            payment = (
                db.query(models.Payment)
                .filter(models.Payment.id == dispute.payment_id)
                .first()
            )
            if payment:
                payment.status = "refunded"

    db.add(
        models.AdminAction(
            admin_id=admin.id,
            action="resolve_dispute",
            target_type="dispute",
            target_id=dispute.id,
            note=data.resolution,
        )
    )
    db.commit()
    db.refresh(dispute)

    notification_service.create(
        db,
        user_id=dispute.raised_by_id,
        kind="dispute",
        title=f"Dispute {dispute.status}",
        body=data.resolution,
    )
    return dispute
