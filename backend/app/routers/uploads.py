"""PDF upload endpoint (authenticated). Accepts PDF only."""
from fastapi import APIRouter, Depends, UploadFile

from app.deps import get_current_user
from app.models import User
from app.services import upload_service

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


@router.post("/pdf")
def upload_pdf(file: UploadFile, _: User = Depends(get_current_user)):
    """Validate + store a PDF, returning {url, filename}."""
    return upload_service.save_pdf(file)
