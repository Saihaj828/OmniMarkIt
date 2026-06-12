"""Celery application.

In dev, `CELERY_TASK_ALWAYS_EAGER=True` makes `.delay()` run the task inline so
no Redis/worker is required. In production, set it False and run a worker:

    celery -A app.celery_app:celery worker --loglevel=info
"""
from celery import Celery

from app.config import settings

celery = Celery(
    "omnimarkit",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)
celery.conf.update(
    task_always_eager=settings.CELERY_TASK_ALWAYS_EAGER,
    task_eager_propagates=True,
    timezone="UTC",
    enable_utc=True,
)

# Ensure task modules are imported so they register with the app.
celery.autodiscover_tasks(["app.tasks"])
