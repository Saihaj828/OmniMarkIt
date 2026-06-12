"""Session recordings: upload (stored locally), list, permission-gated viewing,
and pay-to-view after the free window."""
from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import recording as s
from app.services import recording_service, session_service

router = APIRouter(prefix="/api/recordings", tags=["recordings"])


@router.post("/session/{session_id}", response_model=s.RecordingRead, status_code=201)
def upload_recording(
    session_id: UUID,
    file: UploadFile,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = session_service.get_or_404(db, session_id)
    session_service.assert_participant(session, current)  # only participants/admin
    rec = recording_service.save_recording(db, session, current, file)
    return recording_service._serialize(db, rec, current)


@router.get("/session/{session_id}", response_model=list[s.RecordingRead])
def list_session_recordings(
    session_id: UUID,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = session_service.get_or_404(db, session_id)
    session_service.assert_participant(session, current)
    return recording_service.list_for_session(db, session, current)


@router.get("/mine", response_model=list[s.RecordingRead])
def my_recordings(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return recording_service.list_for_user(db, current)


@router.get("/{recording_id}/view")
def view_recording(
    recording_id: UUID,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    path = recording_service.view_path(db, recording_id, current)
    media = "video/webm" if path.endswith(".webm") else "video/mp4"
    return FileResponse(path, media_type=media)


@router.post("/{recording_id}/purchase", response_model=s.RecordingRead)
def purchase_recording(
    recording_id: UUID,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return recording_service.purchase(db, recording_id, current)
