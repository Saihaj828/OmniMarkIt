# CLAUDE.md — Backend

FastAPI + SQLAlchemy + PostgreSQL + Alembic backend for OmniMarkIt.

## Quick Start

```bash
cd backend
source .venv/bin/activate        # or: python -m venv .venv && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

---

## Project Structure

```
backend/
├── alembic/                # DB migrations
│   └── versions/           # Auto-generated migration files
├── app/
│   ├── main.py             # App factory, router registration, CORS, middleware
│   ├── database.py         # SQLAlchemy engine + SessionLocal + get_db()
│   ├── middleware/         # Auth, logging, CORS
│   ├── models/             # SQLAlchemy ORM models (one file per domain)
│   ├── routers/            # Endpoint handlers grouped by domain
│   ├── schemas/            # Pydantic request/response models
│   ├── services/           # Business logic (no DB calls in routers)
│   └── tasks/              # Celery async tasks
└── tests/
```

---

## Service Layer Pattern

**Rule**: Routers handle HTTP. Services handle business logic. Models handle DB.

```python
# ❌ Bad — logic in router
@router.post("/sessions")
def create_session(data: SessionCreate, db: Session = Depends(get_db)):
    tutor = db.query(TutorProfile).filter(...).first()
    if not tutor.is_available(data.start_time):
        raise HTTPException(...)
    session = Session(**data.dict())
    db.add(session); db.commit()
    return session

# ✅ Good — logic in service
@router.post("/sessions", response_model=SessionRead)
def create_session(data: SessionCreate, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_student)):
    return session_service.create(db, data, student_id=current_user.id)

# app/services/sessions.py
def create(db: Session, data: SessionCreate, student_id: UUID) -> Session:
    tutor = tutor_service.get_or_404(db, data.tutor_id)
    if not availability_service.is_slot_free(db, data.tutor_id, data.start_time):
        raise HTTPException(status_code=409, detail="Slot not available")
    session = Session(**data.model_dump(), student_id=student_id)
    db.add(session); db.commit(); db.refresh(session)
    return session
```

---

## FastAPI Patterns

### Dependency Injection

```python
# app/database.py
from sqlalchemy.orm import Session

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# app/middleware/auth.py
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = verify_jwt(token)
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user

def get_current_student(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    return current_user

def get_current_tutor(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "tutor":
        raise HTTPException(status_code=403, detail="Tutor access required")
    return current_user

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
```

### Router Grouping

```python
# app/routers/sessions.py
router = APIRouter(prefix="/api/sessions", tags=["sessions"])

@router.get("/", response_model=list[SessionRead])
def list_sessions(db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    return session_service.list_for_user(db, current_user)

# app/main.py
from app.routers import auth, sessions, tutors, students, admin, payments
app.include_router(auth.router)
app.include_router(sessions.router)
```

---

## SQLAlchemy ORM Patterns

```python
# app/models/user.py
import uuid
from sqlalchemy import Column, String, Enum, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    role = Column(Enum("student", "tutor", "admin", name="user_role"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False)
    tutor_profile = relationship("TutorProfile", back_populates="user", uselist=False)
```

**Session management — always use `get_db` dependency, never create sessions manually.**

---

## Alembic Workflow

```bash
# Create a new migration (after changing models)
alembic revision --autogenerate -m "add sessions table"

# Apply all pending migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1

# Check current migration version
alembic current

# View migration history
alembic history
```

**Rule**: Always review autogenerated migrations before applying. Alembic misses some changes (e.g., server-side defaults, complex constraints).

---

## Pydantic Schema Patterns

```python
# app/schemas/session.py
from pydantic import BaseModel, UUID4, field_validator
from datetime import datetime

class SessionCreate(BaseModel):
    tutor_id: UUID4
    subject_id: UUID4
    start_time: datetime
    duration_minutes: int

    @field_validator("duration_minutes")
    @classmethod
    def validate_duration(cls, v):
        if v not in [30, 60, 90]:
            raise ValueError("Duration must be 30, 60, or 90 minutes")
        return v

class SessionRead(BaseModel):
    id: UUID4
    tutor_id: UUID4
    student_id: UUID4
    start_time: datetime
    status: str

    model_config = {"from_attributes": True}  # replaces orm_mode = True
```

**Pattern**: Separate `Create`, `Update`, `Read` schemas per resource. Never expose internal fields (hashed passwords, internal IDs) in `Read` schemas.

---

## Auth Patterns

```python
# JWT creation
def create_access_token(user_id: UUID, role: str) -> str:
    payload = {"sub": str(user_id), "role": role, "exp": datetime.utcnow() + timedelta(hours=24)}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

# Role-based IDOR check — always verify ownership
@router.get("/sessions/{session_id}")
def get_session(session_id: UUID, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    session = session_service.get_or_404(db, session_id)
    if current_user.role == "student" and session.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your session")
    if current_user.role == "tutor" and session.tutor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your session")
    return session
```

---

## Celery Tasks

```python
# app/tasks/notifications.py
from app.celery_app import celery

@celery.task(bind=True, max_retries=3)
def send_session_reminder(self, session_id: str):
    try:
        # send email/push
        pass
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)

# Dispatch from a service
from app.tasks.notifications import send_session_reminder
send_session_reminder.delay(str(session.id))
```

---

## Data Model — 28 Tables

```
AUTH & IDENTITY:    USERS · STUDENT_PROFILES · TUTOR_PROFILES
SUBJECTS:           SUBJECTS · TUTOR_SUBJECTS
VETTING:            TUTOR_VETTING · TUTOR_CREDENTIALS · TUTOR_ID_VERIFICATION · TUTOR_TEACHING_APPROACH
SCHEDULING:         TUTOR_AVAILABILITY · AVAILABILITY_EXCEPTIONS · CALENDAR_CONNECTIONS
SESSIONS:           SESSIONS · SESSION_MATERIALS · SESSION_FLAGS
PAYMENTS:           BILLING_PLANS · SUBSCRIPTIONS · PAYMENTS · PAYOUTS · PAYMENT_METHODS · PROMO_CODES · CANCELLATION_POLICIES
REVIEWS:            REVIEWS
MESSAGING:          CONVERSATIONS · MESSAGES
NOTIFICATIONS:      NOTIFICATIONS
DISPUTES & SAFETY:  DISPUTES
ADMIN:              ADMIN_ACTIONS
```

Full schema (fields, types, enums, relationships): `design/omnimarkit_data_model.xlsx`

### Denormalization Rules — Always Honor

| Field(s) | Table | Rule |
|---|---|---|
| `avg_rating`, `total_sessions`, `total_reviews` | `TUTOR_PROFILES` | Cached — update via DB trigger on INSERT to REVIEWS/SESSIONS |
| `student_unread_count`, `tutor_unread_count` | `CONVERSATIONS` | Increment on INSERT to MESSAGES, reset on read — never COUNT(*) |
| `timezone` | `TUTOR_AVAILABILITY` | Sync on tutor timezone update |
| `student_id`, `tutor_id` | `PAYMENTS` | Duplicated from SESSIONS — avoids join on payment history |

---

## Testing

```python
# backend/tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import get_db, Base

TEST_DB_URL = "postgresql://test_user:test@localhost/tutoring_test"
engine = create_engine(TEST_DB_URL)
TestingSessionLocal = sessionmaker(bind=engine)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client(db):
    def override_get_db():
        yield db
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture
def student_token(db):
    user = User(email="student@test.com", role="student", ...)
    db.add(user); db.commit()
    return create_access_token(user.id, "student")
```

```bash
# Run tests
cd backend
pytest tests/ -v --tb=short

# With coverage
pytest tests/ --cov=app --cov-report=term-missing
```

---

## Common Pitfalls

- **Never** recompute `avg_rating` in application code — always read the cached column
- **Never** allow SESSION deletion if `SESSION_FLAGS.legal_hold = TRUE`
- **Never** store OAuth tokens in plain text — AES-256 in `CALENDAR_CONNECTIONS`
- `db.refresh(obj)` after `db.commit()` to get DB-generated defaults back
- `response_model` on every endpoint — prevents accidental PII leakage
- Alembic `autogenerate` misses: `server_default`, `CHECK` constraints, partial indexes — add manually
- Celery tasks: always use `.delay()` or `.apply_async()`, never call directly in request path

---

## Quick Reference

| Task | Command |
|------|---------|
| Start server | `uvicorn app.main:app --reload --port 8000` |
| API docs | http://localhost:8000/docs |
| New migration | `alembic revision --autogenerate -m "description"` |
| Apply migrations | `alembic upgrade head` |
| Run tests | `pytest tests/ -v` |
| Add endpoint | Define schema → Service method → Router handler → Write test |
