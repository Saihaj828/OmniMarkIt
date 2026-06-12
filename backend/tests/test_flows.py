"""End-to-end flow tests across the major domains."""
from datetime import datetime, timedelta, timezone

from app import models
from tests.conftest import auth, register


def _approved_tutor(db, user_id, rate=6000, subject_name="Algebra"):
    """Approve a freshly-registered tutor and give them a subject."""
    subject = db.query(models.Subject).filter_by(name=subject_name).first()
    if not subject:
        subject = models.Subject(name=subject_name, category="Math")
        db.add(subject)
        db.commit()
        db.refresh(subject)
    tp = db.query(models.TutorProfile).filter_by(user_id=user_id).first()
    tp.vetting_status = "approved"
    tp.hourly_rate_cents = rate
    db.add(models.TutorSubject(tutor_id=tp.id, subject_id=subject.id))
    db.commit()
    return str(tp.id), str(subject.id)


def test_auth_and_roles(client):
    s_token, user = register(client, "s@x.com", "student")
    assert user["role"] == "student"
    assert client.get("/api/admin/users", headers=auth(s_token)).status_code == 403
    assert client.get("/api/sessions/").status_code == 401
    # duplicate email
    r = client.post(
        "/api/auth/register",
        json={"email": "s@x.com", "password": "password123", "full_name": "x", "role": "student"},
    )
    assert r.status_code == 409


def test_full_booking_payment_review(client, db):
    s_token, _ = register(client, "s@x.com", "student")
    t_token, tutor_user = register(client, "t@x.com", "tutor")
    tutor_id, subject_id = _approved_tutor(db, tutor_user["id"])

    assert len(client.get("/api/tutors/").json()) == 1

    start = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    r = client.post(
        "/api/sessions/", headers=auth(s_token),
        json={"tutor_id": tutor_id, "subject_id": subject_id,
              "start_time": start, "duration_minutes": 30},
    )
    assert r.status_code == 201, r.text
    session = r.json()
    assert session["price_cents"] == 3000  # half of 6000/hr

    # pay
    r = client.post("/api/payments/", headers=auth(s_token), json={"session_id": session["id"]})
    assert r.status_code == 201 and r.json()["status"] == "succeeded"
    # double pay blocked
    assert client.post("/api/payments/", headers=auth(s_token),
                       json={"session_id": session["id"]}).status_code == 409

    # tutor completes
    r = client.patch(f"/api/sessions/{session['id']}/status",
                     headers=auth(t_token), json={"status": "completed"})
    assert r.status_code == 200

    # review updates cached rating
    r = client.post("/api/reviews/", headers=auth(s_token),
                    json={"session_id": session["id"], "rating": 5})
    assert r.status_code == 201
    t = client.get(f"/api/tutors/{tutor_id}").json()
    assert t["total_reviews"] == 1 and t["avg_rating"] == 500


def test_promo_code_discount(client, db):
    s_token, _ = register(client, "s@x.com", "student")
    t_token, tu = register(client, "t@x.com", "tutor")
    tutor_id, subject_id = _approved_tutor(db, tu["id"], rate=10000)
    db.add(models.PromoCode(code="SAVE20", percent_off=20))
    db.commit()

    start = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    sess = client.post("/api/sessions/", headers=auth(s_token),
                       json={"tutor_id": tutor_id, "subject_id": subject_id,
                             "start_time": start, "duration_minutes": 60}).json()
    r = client.post("/api/payments/", headers=auth(s_token),
                    json={"session_id": sess["id"], "promo_code": "SAVE20"})
    assert r.status_code == 201
    body = r.json()
    assert body["discount_cents"] == 2000 and body["amount_cents"] == 8000


def test_idor_protection(client, db):
    s_token, _ = register(client, "s@x.com", "student")
    t_token, tu = register(client, "t@x.com", "tutor")
    _other_token, ou = register(client, "o@x.com", "tutor")
    tutor_id, subject_id = _approved_tutor(db, tu["id"])

    start = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    sess = client.post("/api/sessions/", headers=auth(s_token),
                       json={"tutor_id": tutor_id, "subject_id": subject_id,
                             "start_time": start, "duration_minutes": 30}).json()
    # a different tutor cannot read this session
    assert client.get(f"/api/sessions/{sess['id']}",
                      headers=auth(_other_token)).status_code == 403


def test_invalid_duration_422(client):
    s_token, _ = register(client, "s@x.com", "student")
    r = client.post(
        "/api/sessions/", headers=auth(s_token),
        json={"tutor_id": "00000000-0000-0000-0000-000000000000",
              "subject_id": "00000000-0000-0000-0000-000000000000",
              "start_time": datetime.now(timezone.utc).isoformat(),
              "duration_minutes": 45},
    )
    assert r.status_code == 422
