"""Session booking, status, cancellation, materials, and flags."""
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_student, get_current_user
from app.models import User
from app.schemas import recording as rec_s
from app.schemas import session as s
from app.services import session_service

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("/", response_model=s.SessionRead, status_code=201)
def book_session(
    data: s.SessionCreate,
    current: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    created = session_service.create(db, data, student_id=current.id)
    return session_service.enrich(session_service.get_or_404(db, created.id))


@router.get("/", response_model=list[s.SessionRead])
def list_sessions(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [session_service.enrich(x) for x in session_service.list_for_user(db, current)]


@router.get("/{session_id}", response_model=s.SessionRead)
def get_session(
    session_id: UUID, current: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    session = session_service.get_or_404(db, session_id)
    session_service.assert_participant(session, current)
    return session_service.enrich(session)


@router.patch("/{session_id}/status", response_model=s.SessionRead)
def update_status(
    session_id: UUID,
    data: s.SessionStatusUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = session_service.get_or_404(db, session_id)
    session_service.assert_participant(session, current)
    return session_service.enrich(session_service.update_status(db, session, data.status))


@router.post("/{session_id}/cancel", response_model=s.SessionRead)
def cancel_session(
    session_id: UUID,
    data: s.SessionCancel,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = session_service.get_or_404(db, session_id)
    session_service.assert_participant(session, current)
    return session_service.enrich(session_service.cancel(db, session, data.reason))


@router.post("/{session_id}/reschedule", response_model=s.SessionRead)
def reschedule_session(
    session_id: UUID,
    data: s.SessionReschedule,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = session_service.get_or_404(db, session_id)
    session_service.assert_participant(session, current)
    return session_service.enrich(
        session_service.reschedule(db, session, data.start_time)
    )


# --- Materials ---
@router.get("/{session_id}/materials", response_model=list[s.MaterialRead])
def list_materials(
    session_id: UUID, current: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    session = session_service.get_or_404(db, session_id)
    session_service.assert_participant(session, current)
    return session_service.list_materials(db, session_id)


@router.post("/{session_id}/materials", response_model=s.MaterialRead, status_code=201)
def add_material(
    session_id: UUID,
    data: s.MaterialCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = session_service.get_or_404(db, session_id)
    session_service.assert_participant(session, current)
    return session_service.add_material(db, session, current, data)


# --- Flags (trust & safety) ---
@router.post("/{session_id}/flag", response_model=s.FlagRead, status_code=201)
def flag_session(
    session_id: UUID,
    data: s.FlagCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = session_service.get_or_404(db, session_id)
    session_service.assert_participant(session, current)
    return session_service.add_flag(db, session, current, data)


# --- Shared whiteboard (synced through the backend) ---
@router.get("/{session_id}/whiteboard", response_model=rec_s.WhiteboardData)
def get_whiteboard(
    session_id: UUID, current: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    session = session_service.get_or_404(db, session_id)
    session_service.assert_participant(session, current)
    return {"data": session_service.get_whiteboard(session)}


@router.put("/{session_id}/whiteboard", response_model=rec_s.WhiteboardData)
def put_whiteboard(
    session_id: UUID,
    body: rec_s.WhiteboardData,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = session_service.get_or_404(db, session_id)
    session_service.assert_participant(session, current)
    session_service.set_whiteboard(db, session, body.data)
    return {"data": body.data}
