"""Subject catalog (public list; admin create; tutor custom 'Other')."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.deps import get_current_admin, get_current_tutor
from app.schemas import tutor as s

router = APIRouter(prefix="/api/subjects", tags=["subjects"])


@router.get("/", response_model=list[s.SubjectRead])
def list_subjects(db: Session = Depends(get_db)):
    return (
        db.query(models.Subject)
        .order_by(models.Subject.category, models.Subject.name)
        .all()
    )


@router.post("/", response_model=s.SubjectRead, status_code=201)
def create_subject(
    data: s.SubjectCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)
):
    subject = models.Subject(**data.model_dump())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.post("/custom", response_model=s.SubjectRead, status_code=201)
def create_custom_subject(
    data: s.CustomSubjectCreate, db: Session = Depends(get_db), _=Depends(get_current_tutor)
):
    """Tutor 'Other' option: create-or-return a custom subject by name."""
    name = data.name.strip()
    existing = (
        db.query(models.Subject)
        .filter(models.Subject.name.ilike(name))
        .first()
    )
    if existing:
        return existing
    subject = models.Subject(name=name, category=data.category or "Other")
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject
