"""Shared model helpers: UUID PKs and UTC timestamp columns."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime

from app.database import GUID


def uuid_pk() -> Column:
    return Column(GUID(), primary_key=True, default=uuid.uuid4)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def created_at_col() -> Column:
    return Column(DateTime(timezone=True), default=now_utc, nullable=False)


def updated_at_col() -> Column:
    return Column(
        DateTime(timezone=True), default=now_utc, onupdate=now_utc, nullable=False
    )
