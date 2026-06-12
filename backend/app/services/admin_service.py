"""Admin: user management, flagged sessions, action audit log.

(Tutor vetting decisions live in vetting_service; disputes in dispute_service.)
"""
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app import models


def list_users(db: Session, role: str | None = None) -> list[models.User]:
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    return query.order_by(models.User.created_at.desc()).all()


def set_user_active(
    db: Session, admin: models.User, user_id: UUID, is_active: bool
) -> models.User:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot modify an admin account")
    user.is_active = is_active
    db.add(
        models.AdminAction(
            admin_id=admin.id,
            action="activate_user" if is_active else "suspend_user",
            target_type="user",
            target_id=user.id,
        )
    )
    db.commit()
    db.refresh(user)
    return user


def flagged_sessions(db: Session) -> list[models.SessionFlag]:
    return (
        db.query(models.SessionFlag)
        .options(joinedload(models.SessionFlag.session))
        .filter(models.SessionFlag.status != "resolved")
        .order_by(models.SessionFlag.created_at.desc())
        .all()
    )


def resolve_flag(
    db: Session, admin: models.User, flag_id: UUID, legal_hold: bool
) -> models.SessionFlag:
    flag = db.query(models.SessionFlag).filter(models.SessionFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    flag.status = "resolved"
    flag.legal_hold = legal_hold
    db.add(
        models.AdminAction(
            admin_id=admin.id,
            action="resolve_flag",
            target_type="session",
            target_id=flag.session_id,
            note="legal_hold set" if legal_hold else None,
        )
    )
    db.commit()
    db.refresh(flag)
    return flag


def tutor_credentials(db: Session, tutor_id: UUID) -> list[models.TutorCredential]:
    if not db.query(models.TutorProfile).filter(models.TutorProfile.id == tutor_id).first():
        raise HTTPException(status_code=404, detail="Tutor not found")
    return (
        db.query(models.TutorCredential)
        .filter(models.TutorCredential.tutor_id == tutor_id)
        .order_by(models.TutorCredential.created_at.asc())
        .all()
    )


def tutor_vetting_detail(db: Session, tutor_id: UUID) -> dict:
    """Everything an admin needs to review a tutor: vetting state, ID, approach."""
    vetting = (
        db.query(models.TutorVetting)
        .filter(models.TutorVetting.tutor_id == tutor_id)
        .first()
    )
    idv = (
        db.query(models.TutorIdVerification)
        .filter(models.TutorIdVerification.tutor_id == tutor_id)
        .first()
    )
    approach = (
        db.query(models.TutorTeachingApproach)
        .filter(models.TutorTeachingApproach.tutor_id == tutor_id)
        .first()
    )
    return {
        "vetting_status": vetting.status if vetting else "pending",
        "background_check_status": vetting.background_check_status if vetting else "not_started",
        "id_status": idv.status if idv else "not_submitted",
        "id_document_type": idv.document_type if idv else None,
        "teaching_philosophy": approach.philosophy if approach else None,
        "credentials": tutor_credentials(db, tutor_id),
    }


def action_log(db: Session, limit: int = 100) -> list[models.AdminAction]:
    return (
        db.query(models.AdminAction)
        .order_by(models.AdminAction.created_at.desc())
        .limit(limit)
        .all()
    )


def database_overview(db: Session) -> dict:
    """Row counts per table — a quick 'see the database in action' summary."""
    from sqlalchemy import func, select

    from app.database import Base

    counts = {}
    for table in Base.metadata.sorted_tables:
        try:
            counts[table.name] = db.execute(
                select(func.count()).select_from(table)
            ).scalar()
        except Exception:
            counts[table.name] = None
    return {"tables": counts, "total_tables": len(counts)}
