"""Auth: register, login, current user, profile."""
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import auth as s
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=s.TokenResponse, status_code=201)
def register(data: s.RegisterRequest, db: Session = Depends(get_db)):
    user = auth_service.register(db, data)
    return s.TokenResponse(access_token=auth_service.issue_token(user), user=user)


@router.post("/login", response_model=s.TokenResponse)
def login(data: s.LoginRequest, db: Session = Depends(get_db)):
    user = auth_service.authenticate(db, data)
    return s.TokenResponse(access_token=auth_service.issue_token(user), user=user)


@router.post("/token", response_model=s.TokenResponse, include_in_schema=False)
def login_form(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 password flow so the Swagger Authorize button works."""
    user = auth_service.authenticate(
        db, s.LoginRequest(email=form.username, password=form.password)
    )
    return s.TokenResponse(access_token=auth_service.issue_token(user), user=user)


@router.get("/me", response_model=s.UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=s.UserRead)
def update_me(
    data: s.UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return auth_service.update_user(db, current_user, data)


@router.post("/change-password", status_code=204)
def change_password(
    data: s.ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    auth_service.change_password(db, current_user, data)


@router.post("/forgot-password", response_model=s.ForgotPasswordResponse)
def forgot_password(data: s.ForgotPasswordRequest, db: Session = Depends(get_db)):
    token = auth_service.forgot_password(db, data.email)
    # Always return the same message; include token only in dev (no email provider).
    return s.ForgotPasswordResponse(
        message="If that email exists, a reset link has been generated.",
        reset_token=token,
    )


@router.post("/reset-password", status_code=204)
def reset_password(data: s.ResetPasswordRequest, db: Session = Depends(get_db)):
    auth_service.reset_password(db, data.token, data.new_password)
