"""Admin console: vetting, users, flagged sessions, disputes, audit log."""
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import User
from app.schemas import admin as admin_s
from app.schemas import auth as auth_s
from app.schemas import dispute as dispute_s
from app.schemas import recording as recording_s
from app.schemas import session as session_s
from app.schemas import tutor as tutor_s
from app.schemas import vetting as vetting_s
from app.services import admin_service, dispute_service, recording_service, vetting_service

router = APIRouter(prefix="/api/admin", tags=["admin"])


# --- Tutor vetting ---
@router.get("/vetting-queue", response_model=list[tutor_s.TutorRead])
def vetting_queue(_: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return vetting_service.queue(db)


@router.post("/tutors/{tutor_id}/vetting", response_model=tutor_s.TutorRead)
def decide_vetting(
    tutor_id: UUID,
    data: vetting_s.VettingDecision,
    current: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return vetting_service.decide(db, current, tutor_id, data.decision, data.note)


@router.get("/tutors/{tutor_id}/credentials", response_model=list[vetting_s.CredentialRead])
def tutor_credentials(
    tutor_id: UUID, _: User = Depends(get_current_admin), db: Session = Depends(get_db)
):
    return admin_service.tutor_credentials(db, tutor_id)


@router.get("/tutors/{tutor_id}/vetting-detail")
def tutor_vetting_detail(
    tutor_id: UUID, _: User = Depends(get_current_admin), db: Session = Depends(get_db)
):
    return admin_service.tutor_vetting_detail(db, tutor_id)


# --- Users ---
@router.get("/users", response_model=list[auth_s.UserRead])
def list_users(
    role: str | None = None,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return admin_service.list_users(db, role)


@router.post("/users/{user_id}/active", response_model=auth_s.UserRead)
def set_user_active(
    user_id: UUID,
    data: admin_s.SetActiveRequest,
    current: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return admin_service.set_user_active(db, current, user_id, data.is_active)


# --- Flagged sessions (trust & safety) ---
@router.get("/flagged-sessions", response_model=list[session_s.FlagRead])
def flagged_sessions(_: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return admin_service.flagged_sessions(db)


@router.post("/flags/{flag_id}/resolve", response_model=session_s.FlagRead)
def resolve_flag(
    flag_id: UUID,
    legal_hold: bool = False,
    current: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return admin_service.resolve_flag(db, current, flag_id, legal_hold)


# --- Disputes ---
@router.get("/disputes", response_model=list[dispute_s.DisputeRead])
def list_disputes(
    status: str | None = None,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return dispute_service.list_all(db, status)


@router.post("/disputes/{dispute_id}/resolve", response_model=dispute_s.DisputeRead)
def resolve_dispute(
    dispute_id: UUID,
    data: dispute_s.DisputeResolve,
    current: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return dispute_service.resolve(db, current, dispute_id, data)


# --- Recordings: list + grant/revoke view access ---
@router.get("/recordings", response_model=list[recording_s.RecordingRead])
def list_recordings(current: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return recording_service.list_for_user(db, current)


@router.post("/recordings/{recording_id}/grant", response_model=recording_s.RecordingRead)
def grant_recording(
    recording_id: UUID,
    data: recording_s.RecordingGrant,
    current: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return recording_service.grant_access(db, current, recording_id, data.user_id)


@router.post("/recordings/{recording_id}/revoke", status_code=204)
def revoke_recording(
    recording_id: UUID,
    data: recording_s.RecordingGrant,
    current: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    recording_service.revoke_access(db, current, recording_id, data.user_id)


# --- Database overview (row counts per table) ---
@router.get("/db-overview")
def db_overview(_: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return admin_service.database_overview(db)


# --- Audit log ---
@router.get("/actions", response_model=list[admin_s.AdminActionRead])
def action_log(_: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return admin_service.action_log(db)
