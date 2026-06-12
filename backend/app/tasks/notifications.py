"""Celery tasks for asynchronous notification delivery (email / push).

In dev these run eagerly (CELERY_TASK_ALWAYS_EAGER=True), so no Redis/worker is
needed. The delivery itself is stubbed — wire in SES/FCM/etc. where marked.
"""
import logging

from app.celery_app import celery
from app.database import SessionLocal
from app import models

logger = logging.getLogger("omnimarkit.tasks")


@celery.task(bind=True, max_retries=3, name="notifications.deliver")
def deliver_notification(self, notification_id: str):
    """Look up the notification and 'deliver' it (stubbed)."""
    db = SessionLocal()
    try:
        notif = (
            db.query(models.Notification)
            .filter(models.Notification.id == notification_id)
            .first()
        )
        if not notif:
            return
        # No PII in logs — only the kind and id.
        logger.info("Delivering notification %s (kind=%s)", notif.id, notif.kind)
        # TODO: integrate real email (SES) / push (FCM/APNs) here.
    except Exception as exc:  # pragma: no cover
        raise self.retry(exc=exc, countdown=30)
    finally:
        db.close()


@celery.task(bind=True, max_retries=3, name="notifications.session_reminder")
def send_session_reminder(self, session_id: str):
    """Reminder dispatched ahead of a session start (stubbed)."""
    logger.info("Session reminder for %s", session_id)
