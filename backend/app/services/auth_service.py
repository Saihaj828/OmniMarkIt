"""Authentication & registration."""
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.schemas import auth as auth_schemas
from app.security import create_access_token, hash_password, verify_password


def register(db: Session, data: auth_schemas.RegisterRequest) -> models.User:
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = models.User(
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
        full_name=data.full_name,
    )
    db.add(user)
    db.flush()

    if data.role == "student":
        db.add(models.StudentProfile(user_id=user.id))
    elif data.role == "tutor":
        tutor = models.TutorProfile(
            user_id=user.id,
            display_name=data.full_name,
            vetting_status="pending",
            stripe_account_id=data.stripe_account_id,  # collected at registration
        )
        db.add(tutor)
        db.flush()
        # Bootstrap the vetting pipeline row.
        db.add(models.TutorVetting(tutor_id=tutor.id, status="pending"))

    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, data: auth_schemas.LoginRequest) -> models.User:
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is suspended")
    return user


def issue_token(user: models.User) -> str:
    return create_access_token(user.id, user.role)


def update_user(db: Session, user: models.User, data: auth_schemas.UserUpdate) -> models.User:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, user: models.User, data: auth_schemas.ChangePassword) -> None:
    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.hashed_password = hash_password(data.new_password)
    db.commit()


def forgot_password(db: Session, email: str) -> str | None:
    """Create a reset token. Returns it (dev only — would be emailed in prod)."""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        # Don't reveal whether the email exists.
        return None
    token = secrets.token_urlsafe(24)
    user.reset_token = token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()
    return token


def reset_password(db: Session, token: str, new_password: str) -> None:
    user = db.query(models.User).filter(models.User.reset_token == token).first()
    expires = user.reset_token_expires if user else None
    if expires is not None and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if not user or expires is None or expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user.hashed_password = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()


def update_student_profile(
    db: Session, user: models.User, data: auth_schemas.StudentProfileUpdate
) -> models.StudentProfile:
    profile = (
        db.query(models.StudentProfile)
        .filter(models.StudentProfile.user_id == user.id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


def get_student_profile(db: Session, user: models.User) -> models.StudentProfile:
    profile = (
        db.query(models.StudentProfile)
        .filter(models.StudentProfile.user_id == user.id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return profile
