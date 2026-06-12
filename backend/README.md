# OmniMarkIt — Backend (FastAPI)

Complete FastAPI + SQLAlchemy backend for the OmniMarkIt tutoring marketplace.
Full **28-table** data model, JWT auth, service-layer architecture, Alembic
migrations, Celery tasks, and AES-256 encryption for OAuth tokens.

**Runs on SQLite with zero setup; PostgreSQL-ready via one env var.**

## Quick start

```bash
cd backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python -m app.seed                   # create + seed omnimarkit.db
uvicorn app.main:app --reload --port 8000
```

- Swagger docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/health

## Demo accounts (password `password123`)

| Email | Role |
|-------|------|
| `admin@omnimarkit.com` | admin |
| `student@omnimarkit.com` | student |
| `tutor@omnimarkit.com` · `marcus@…` · `lena@…` | tutor (approved) |
| `pending@omnimarkit.com` | tutor (in vetting queue) |

## Layout (matches the project spec)

```
backend/
├── alembic.ini, alembic/         # migrations (env wired to app settings)
├── app/
│   ├── main.py                   # app factory, CORS, logging middleware, routers
│   ├── config.py                 # env-driven settings
│   ├── database.py               # engine, SessionLocal, Base, portable GUID
│   ├── security.py               # bcrypt, JWT, AES-256-GCM (OAuth tokens)
│   ├── deps.py                   # current-user + role guards
│   ├── celery_app.py             # Celery (eager in dev)
│   ├── models/                   # 28 tables, one file per domain
│   ├── schemas/                  # Pydantic per domain
│   ├── services/                 # business logic per domain
│   ├── routers/                  # endpoints per domain
│   ├── middleware/logging.py     # request logging (no PII)
│   ├── tasks/notifications.py    # Celery tasks (delivery stubs)
│   └── seed.py
└── tests/                        # pytest e2e flows
```

## The 28 tables

```
AUTH:        users · student_profiles · tutor_profiles
SUBJECTS:    subjects · tutor_subjects
VETTING:     tutor_vetting · tutor_credentials · tutor_id_verification · tutor_teaching_approach
SCHEDULING:  tutor_availability · availability_exceptions · calendar_connections
SESSIONS:    sessions · session_materials · session_flags
PAYMENTS:    billing_plans · subscriptions · payments · payouts · payment_methods · promo_codes · cancellation_policies
REVIEWS:     reviews
MESSAGING:   conversations · messages
NOTIF:       notifications
DISPUTES:    disputes
ADMIN:       admin_actions
```

## Hard rules honored

- Money in **integer cents**; ratings cached as int ×100.
- **UTC** timestamps everywhere (`DateTime(timezone=True)`).
- **UUID** PKs via a portable type (native UUID on Postgres, CHAR(36) on SQLite).
- Cached `avg_rating` / `total_sessions` / unread counts written by services,
  never recomputed on read.
- Sessions under `legal_hold` cannot be cancelled/deleted (enforced in service).
- OAuth tokens **AES-256-GCM encrypted** before storage (`calendar_connections`).
- Pydantic schema + `response_model` on every endpoint; **IDOR** ownership checks.
- No PII in logs.

## Alembic (PostgreSQL path)

The initial migration is in `alembic/versions/`. To use Postgres:

```bash
pip install "psycopg[binary]"
export DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/omnimarkit
export ENV=production            # skip auto table-create on startup
alembic upgrade head
```

Regenerate after model changes: `alembic revision --autogenerate -m "msg"`.

## Celery

Dev runs tasks eagerly (no worker needed). For real async delivery:

```bash
# set CELERY_TASK_ALWAYS_EAGER=False and run a worker + Redis
celery -A app.celery_app:celery worker --loglevel=info
```

## Tests

```bash
pip install pytest httpx
pytest tests/ -v
```

## What's stubbed

| Concern | Where |
|---------|-------|
| Stripe charges / Connect payouts | `services/payment_service.py` |
| Email / push delivery | `tasks/notifications.py` |
| Daily.co video room URL | `services/session_service.py` |
| S3 uploads (file_url) | accepted as strings on credentials/materials |
