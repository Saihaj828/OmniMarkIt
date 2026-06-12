"""In-app notifications.

Persists a notification row and dispatches an async fan-out task (email/push).
In dev the Celery task runs eagerly, so no worker is required.
"""
from uuid import UUID

from sqlalchemy.orm import Session

from app import models


def create(
    db: Session, *, user_id: UUID, kind: str, title: str, body: str | None = None
) -> models.Notification:
    notif = models.Notification(user_id=user_id, kind=kind, title=title, body=body)
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # Fire-and-forget delivery (email/push). Imported lazily to avoid a cycle.
    try:
        from app.tasks.notifications import deliver_notification

        deliver_notification.delay(str(notif.id))
    except Exception:
        # Never let delivery wiring break the request path.
        pass
    return notif


def list_for_user(db: Session, user_id: UUID) -> list[models.Notification]:
    return (
        db.query(models.Notification)
        .filter(models.Notification.user_id == user_id)
        .order_by(models.Notification.created_at.desc())
        .all()
    )


def mark_read(db: Session, user_id: UUID, notif_id: UUID) -> models.Notification | None:
    notif = (
        db.query(models.Notification)
        .filter(
            models.Notification.id == notif_id,
            models.Notification.user_id == user_id,
        )
        .first()
    )
    if notif and not notif.is_read:
        notif.is_read = True
        db.commit()
        db.refresh(notif)
    return notif
