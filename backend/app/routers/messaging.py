"""Conversations & messages."""
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_student, get_current_user
from app.models import User
from app.schemas import messaging as s
from app.services import messaging_service

router = APIRouter(prefix="/api/conversations", tags=["messaging"])


@router.get("/", response_model=list[s.ConversationRead])
def list_conversations(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return messaging_service.list_for_user(db, current)


@router.post("/", response_model=s.ConversationRead, status_code=201)
def start_conversation(
    data: s.ConversationStart,
    current: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    convo = messaging_service.start_or_get(db, current, data.tutor_user_id)
    return {
        "id": convo.id,
        "student_id": convo.student_id,
        "tutor_id": convo.tutor_id,
        "student_unread_count": convo.student_unread_count,
        "tutor_unread_count": convo.tutor_unread_count,
        "last_message_at": convo.last_message_at,
        "other_party_name": None,
    }


@router.get("/{conversation_id}/messages", response_model=list[s.MessageRead])
def get_messages(
    conversation_id: UUID,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return messaging_service.get_messages(db, conversation_id, current)


@router.post("/{conversation_id}/messages", response_model=s.MessageRead, status_code=201)
def send_message(
    conversation_id: UUID,
    data: s.MessageCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return messaging_service.send_message(db, conversation_id, current, data.body)
