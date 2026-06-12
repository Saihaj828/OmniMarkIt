"""Availability, exceptions, and (encrypted) calendar connections."""
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import models
from app.schemas import scheduling as sched_schemas
from app.security import encrypt_secret


# --- Weekly availability ---
def list_availability(db: Session, tutor_id: UUID) -> list[models.TutorAvailability]:
    return (
        db.query(models.TutorAvailability)
        .filter(models.TutorAvailability.tutor_id == tutor_id)
        .order_by(models.TutorAvailability.weekday, models.TutorAvailability.start_minute)
        .all()
    )


def add_availability(
    db: Session, tutor: models.TutorProfile, data: sched_schemas.AvailabilityCreate
) -> models.TutorAvailability:
    if data.end_minute <= data.start_minute:
        raise HTTPException(status_code=400, detail="end_minute must be after start_minute")
    slot = models.TutorAvailability(
        tutor_id=tutor.id,
        weekday=data.weekday,
        start_minute=data.start_minute,
        end_minute=data.end_minute,
        timezone=tutor.timezone,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


def delete_availability(db: Session, tutor: models.TutorProfile, slot_id: UUID) -> None:
    slot = (
        db.query(models.TutorAvailability)
        .filter(
            models.TutorAvailability.id == slot_id,
            models.TutorAvailability.tutor_id == tutor.id,
        )
        .first()
    )
    if not slot:
        raise HTTPException(status_code=404, detail="Availability slot not found")
    db.delete(slot)
    db.commit()


# --- One-off exceptions ---
def list_exceptions(db: Session, tutor_id: UUID) -> list[models.AvailabilityException]:
    return (
        db.query(models.AvailabilityException)
        .filter(models.AvailabilityException.tutor_id == tutor_id)
        .order_by(models.AvailabilityException.date)
        .all()
    )


def add_exception(
    db: Session, tutor: models.TutorProfile, data: sched_schemas.AvailabilityExceptionCreate
) -> models.AvailabilityException:
    exc = models.AvailabilityException(tutor_id=tutor.id, **data.model_dump())
    db.add(exc)
    db.commit()
    db.refresh(exc)
    return exc


# --- Calendar connections (OAuth tokens AES-256 encrypted at rest) ---
def connect_calendar(
    db: Session, user: models.User, data: sched_schemas.CalendarConnectionCreate
) -> models.CalendarConnection:
    conn = models.CalendarConnection(
        user_id=user.id,
        provider=data.provider,
        access_token_enc=encrypt_secret(data.access_token),
        refresh_token_enc=encrypt_secret(data.refresh_token) if data.refresh_token else None,
        expires_at=data.expires_at,
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn


def list_calendar_connections(db: Session, user_id: UUID) -> list[models.CalendarConnection]:
    return (
        db.query(models.CalendarConnection)
        .filter(models.CalendarConnection.user_id == user_id)
        .all()
    )
