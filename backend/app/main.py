"""FastAPI application: CORS, logging middleware, router registration.

On startup we run `Base.metadata.create_all` so the app works with zero setup on
SQLite. For PostgreSQL in production, manage the schema with Alembic instead
(see alembic/ and the README) and set ENV=production to skip auto-create.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.config import settings
from app.database import Base, engine
from app.middleware.logging import RequestLoggingMiddleware

logger = logging.getLogger("omnimarkit.startup")


def _heal_sqlite_schema() -> None:
    """Auto-add missing *nullable* columns to an existing SQLite dev database.

    SQLite's create_all() only creates missing tables — it never alters an
    existing one. So after upgrading the code (which may add a nullable column),
    an old omnimarkit.db would be missing that column and every query on the
    table would fail. This safely heals that common case (SQLite + dev only),
    adding any missing nullable model columns via ALTER TABLE ADD COLUMN.
    It never drops or alters existing columns, and never runs on PostgreSQL.
    """
    if not settings.DATABASE_URL.startswith("sqlite"):
        return
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if table.name not in existing_tables:
                continue  # create_all will have made brand-new tables in full
            have = {c["name"] for c in inspector.get_columns(table.name)}
            for col in table.columns:
                if col.name in have:
                    continue
                # Only auto-add columns SQLite can append: nullable, no PK.
                if col.primary_key or (not col.nullable and col.default is None):
                    logger.warning(
                        "Stale DB: column %s.%s is missing and can't be auto-added; "
                        "delete omnimarkit.db and re-run `python -m app.seed`.",
                        table.name,
                        col.name,
                    )
                    continue
                col_type = col.type.compile(dialect=engine.dialect)
                conn.execute(
                    text(f'ALTER TABLE "{table.name}" ADD COLUMN "{col.name}" {col_type}')
                )
                logger.warning(
                    "Healed stale DB: added missing column %s.%s",
                    table.name,
                    col.name,
                )
from app.routers import (
    admin,
    auth,
    billing,
    disputes,
    messaging,
    notifications,
    payments,
    recordings,
    reviews,
    scheduling,
    sessions,
    students,
    subjects,
    tutors,
    uploads,
    vetting,
)

@asynccontextmanager
async def lifespan(_app: FastAPI):
    from app import models  # noqa: F401  (register models on Base)

    # In production, prefer Alembic migrations over auto-create.
    if settings.ENV != "production":
        Base.metadata.create_all(bind=engine)
        _heal_sqlite_schema()  # auto-add any columns a stale dev DB is missing
    yield


app = FastAPI(title=settings.APP_NAME, version="1.0.0")

# Serve uploaded PDFs (credentials, KYC, materials) in dev. Swap for S3 in prod.
import os  # noqa: E402

from fastapi.staticfiles import StaticFiles  # noqa: E402

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok", "service": settings.APP_NAME, "env": settings.ENV}


@app.get("/api/config", tags=["health"])
def public_config():
    """Non-secret client config (video domain, recording rules)."""
    return {
        "jitsi_domain": settings.JITSI_DOMAIN,
        "recording_free_days": settings.RECORDING_FREE_DAYS,
        "recording_price_cents": settings.RECORDING_PRICE_CENTS,
        "stripe_enabled": settings.stripe_enabled,
    }


for r in (
    auth.router,
    students.router,
    subjects.router,
    tutors.router,
    vetting.router,
    scheduling.router,
    sessions.router,
    payments.router,
    billing.router,
    reviews.router,
    messaging.router,
    notifications.router,
    disputes.router,
    recordings.router,
    uploads.router,
    admin.router,
):
    app.include_router(r)
