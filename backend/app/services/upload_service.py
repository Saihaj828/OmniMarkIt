"""PDF upload handling with strict validation.

Saves to a local uploads/ directory in dev (served via StaticFiles). In
production you'd swap the storage backend for S3 — the returned URL is the only
thing the rest of the app depends on.
"""
import os
import uuid

from fastapi import HTTPException, UploadFile

from app.config import settings

PDF_MAGIC = b"%PDF-"


def _ensure_dir() -> str:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    return settings.UPLOAD_DIR


def save_pdf(file: UploadFile) -> dict:
    """Validate that the upload is a real PDF, store it, return {url, filename}."""
    # 1) extension + declared content type
    name = (file.filename or "").lower()
    if not name.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only .pdf files are accepted")
    if file.content_type not in ("application/pdf", "application/x-pdf", "binary/octet-stream"):
        raise HTTPException(status_code=400, detail="File must be a PDF (application/pdf)")

    data = file.file.read()
    if len(data) > settings.MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")
    # 2) magic-byte check — the real content must start with %PDF-
    if not data.startswith(PDF_MAGIC):
        raise HTTPException(status_code=400, detail="File content is not a valid PDF")

    directory = _ensure_dir()
    stored = f"{uuid.uuid4().hex}.pdf"
    with open(os.path.join(directory, stored), "wb") as out:
        out.write(data)
    return {"url": f"/uploads/{stored}", "filename": file.filename}
