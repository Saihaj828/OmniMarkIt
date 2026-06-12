"""Auth & identity schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.common import ORM


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1)
    role: str  # student | tutor
    # For tutors: Stripe Connect account id for payouts (e.g. acct_123...).
    stripe_account_id: Optional[str] = None

    @field_validator("role")
    @classmethod
    def role_valid(cls, v: str) -> str:
        if v not in ("student", "tutor"):
            raise ValueError("role must be 'student' or 'tutor'")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    model_config = ORM


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class StudentProfileRead(BaseModel):
    id: UUID
    user_id: UUID
    grade_level: Optional[str] = None
    bio: Optional[str] = None
    timezone: str
    model_config = ORM


class StudentProfileUpdate(BaseModel):
    grade_level: Optional[str] = None
    bio: Optional[str] = None
    timezone: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1)
    phone: Optional[str] = None


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str
    # DEV ONLY: with no email provider wired, the token is returned so you can
    # complete the reset. In production this is emailed, never returned.
    reset_token: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)
