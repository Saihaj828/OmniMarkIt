# OmniMarkIt backend — production container
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

# System deps for building wheels (cryptography, bcrypt) — slim runtime after.
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render/railway provide $PORT; default to 8000 locally.
ENV PORT=8000
EXPOSE 8000

# On boot: apply migrations, seed demo data only if the DB is empty (never wipes),
# then serve. Works for both SQLite and PostgreSQL (DATABASE_URL).
CMD ["sh", "-c", "alembic upgrade head && python -c 'from app.seed import ensure_seed; ensure_seed()' && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
