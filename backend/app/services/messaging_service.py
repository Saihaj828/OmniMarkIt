"""Student ↔ tutor messaging with cached unread counters."""
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.services import notification_service


def _now():
    return datetime.now(timezone.utc)


def _conversation_or_404(db: Session, conversation_id: UUID) -> models.Conversation:
    convo = (
        db.query(models.Conversation)
        .filter(models.Conversation.id == conversation_id)
        .first()
    )
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return convo


def _assert_member(convo: models.Conversation, user: models.User) -> None:
    if user.id not in (convo.student_id, convo.tutor_id) and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your conversation")


def start_or_get(db: Session, student: models.User, tutor_user_id: UUID) -> models.Conversation:
    tutor_user = (
        db.query(models.User)
        .filter(models.User.id == tutor_user_id, models.User.role == "tutor")
        .first()
    )
    if not tutor_user:
        raise HTTPException(status_code=404, detail="Tutor user not found")

    convo = (
        db.query(models.Conversation)
        .filter(
            models.Conversation.student_id == student.id,
            models.Conversation.tutor_id == tutor_user.id,
        )
        .first()
    )
    if not convo:
        convo = models.Conversation(student_id=student.id, tutor_id=tutor_user.id)
        db.add(convo)
        db.commit()
        db.refresh(convo)
    return convo


def list_for_user(db: Session, user: models.User) -> list[dict]:
    if user.role == "student":
        convos = db.query(models.Conversation).filter(
            models.Conversation.student_id == user.id
        ).all()
    else:
        convos = db.query(models.Conversation).filter(
            models.Conversation.tutor_id == user.id
        ).all()

    out = []
    for c in convos:
        other_id = c.tutor_id if user.id == c.student_id else c.student_id
        other = db.query(models.User).filter(models.User.id == other_id).first()
        out.append(
            {
                "id": c.id,
                "student_id": c.student_id,
                "tutor_id": c.tutor_id,
                "student_unread_count": c.student_unread_count,
                "tutor_unread_count": c.tutor_unread_count,
                "last_message_at": c.last_message_at,
                "other_party_name": other.full_name if other else None,
            }
        )
    out.sort(key=lambda x: (x["last_message_at"] is None, x["last_message_at"]), reverse=True)
    return out


def send_message(
    db: Session, conversation_id: UUID, sender: models.User, body: str
) -> models.Message:
    convo = _conversation_or_404(db, conversation_id)
    _assert_member(convo, sender)

    msg = models.Message(conversation_id=convo.id, sender_id=sender.id, body=body)
    db.add(msg)
    convo.last_message_at = _now()
    if sender.id == convo.student_id:
        convo.tutor_unread_count += 1
        recipient_id = convo.tutor_id
    else:
        convo.student_unread_count += 1
        recipient_id = convo.student_id
    db.commit()
    db.refresh(msg)

    notification_service.create(
        db, user_id=recipient_id, kind="message", title="New message", body=body[:80]
    )
    return msg


def get_messages(
    db: Session, conversation_id: UUID, user: models.User
) -> list[models.Message]:
    convo = _conversation_or_404(db, conversation_id)
    _assert_member(convo, user)
    if user.id == convo.student_id:
        convo.student_unread_count = 0
    elif user.id == convo.tutor_id:
        convo.tutor_unread_count = 0
    db.commit()
    return (
        db.query(models.Message)
        .filter(models.Message.conversation_id == convo.id)
        .order_by(models.Message.created_at.asc())
        .all()
    )
