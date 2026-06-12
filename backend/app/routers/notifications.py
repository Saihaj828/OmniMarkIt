"""In-app notification feed."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import notification as s
from app.services import notification_service

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/", response_model=list[s.NotificationRead])
def list_notifications(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return notification_service.list_for_user(db, current.id)


@router.post("/{notification_id}/read", response_model=s.NotificationRead)
def mark_read(
    notification_id: UUID,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notif = notification_service.mark_read(db, current.id, notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif
