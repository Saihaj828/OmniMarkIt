"""Seed the database with demo data so the app is usable immediately.

Run from the backend/ directory:   python -m app.seed

Wipes and recreates all 28 tables, then inserts an admin, a student, approved
tutors (subjects, ratings, availability), a pending tutor for the vetting queue,
billing plans, a promo code, cancellation policies, and a completed session with
a review + payment so dashboards have content.
"""
from datetime import datetime, timedelta, timezone

from app import models
from app.database import Base, SessionLocal, engine
from app.security import hash_password

DEMO_PASSWORD = "password123"


def reset_schema() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def ensure_seed() -> None:
    """Seed demo data only if the database is empty — safe for production boot.

    Unlike run(), this never drops tables, so it won't wipe real data on restart.
    """
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.User).first() is not None:
            return  # already populated
    finally:
        db.close()
    _populate()


def run() -> None:
    reset_schema()
    _populate()


def _populate() -> None:
    db = SessionLocal()
    try:
        # --- Users ---
        admin = models.User(
            email="admin@omnimarkit.com",
            hashed_password=hash_password(DEMO_PASSWORD),
            role="admin",
            full_name="Ada Admin",
        )
        student = models.User(
            email="student@omnimarkit.com",
            hashed_password=hash_password(DEMO_PASSWORD),
            role="student",
            full_name="Sam Student",
        )
        db.add_all([admin, student])
        db.flush()
        db.add(models.StudentProfile(user_id=student.id, grade_level="Grade 11"))

        # --- Subjects ---
        subject_defs = [
            ("Algebra", "Math"),
            ("Calculus", "Math"),
            ("Geometry", "Math"),
            ("Physics", "Physics"),
            ("Chemistry", "Chemistry"),
            ("Biology", "Biology"),
            ("Computer Science", "CS"),
        ]
        subjects = {}
        for name, cat in subject_defs:
            sub = models.Subject(name=name, category=cat)
            db.add(sub)
            subjects[name] = sub
        db.flush()

        # --- Approved tutors ---
        tutor_specs = [
            dict(email="tutor@omnimarkit.com", name="Dr. Tara Tutor",
                 headline="PhD Mathematician — Calculus & beyond",
                 bio="10 years tutoring AP Calculus and university analysis.",
                 rate=6500, subjects=["Calculus", "Algebra"], avg=487, rev=23, sess=140),
            dict(email="marcus@omnimarkit.com", name="Marcus Reed",
                 headline="Physics & Chemistry specialist",
                 bio="Makes hard sciences click. MIT alum.",
                 rate=7200, subjects=["Physics", "Chemistry"], avg=492, rev=41, sess=210),
            dict(email="lena@omnimarkit.com", name="Lena Park",
                 headline="CS & Algebra — patient and clear",
                 bio="Software engineer turned tutor. Loves first-timers.",
                 rate=5800, subjects=["Computer Science", "Algebra"], avg=470, rev=12, sess=64),
        ]
        approved = []
        for spec in tutor_specs:
            u = models.User(
                email=spec["email"], hashed_password=hash_password(DEMO_PASSWORD),
                role="tutor", full_name=spec["name"],
            )
            db.add(u)
            db.flush()
            tp = models.TutorProfile(
                user_id=u.id, display_name=spec["name"], headline=spec["headline"],
                bio=spec["bio"], hourly_rate_cents=spec["rate"], timezone="America/New_York",
                vetting_status="approved", avg_rating=spec["avg"],
                total_reviews=spec["rev"], total_sessions=spec["sess"],
            )
            db.add(tp)
            db.flush()
            db.add(models.TutorVetting(tutor_id=tp.id, status="approved",
                                       background_check_status="passed"))
            for sname in spec["subjects"]:
                db.add(models.TutorSubject(tutor_id=tp.id, subject_id=subjects[sname].id))
            for weekday in (0, 2, 4):  # Mon/Wed/Fri 4–8pm
                db.add(models.TutorAvailability(
                    tutor_id=tp.id, weekday=weekday, start_minute=16 * 60,
                    end_minute=20 * 60, timezone=tp.timezone))
            approved.append(tp)

        # --- Pending tutor for the vetting queue ---
        pu = models.User(email="pending@omnimarkit.com",
                         hashed_password=hash_password(DEMO_PASSWORD),
                         role="tutor", full_name="Pat Pending")
        db.add(pu)
        db.flush()
        pt = models.TutorProfile(user_id=pu.id, display_name="Pat Pending",
                                 headline="Aspiring Biology tutor", hourly_rate_cents=5000,
                                 vetting_status="in_review")
        db.add(pt)
        db.flush()
        db.add(models.TutorVetting(tutor_id=pt.id, status="credentials_submitted"))
        db.add(models.TutorSubject(tutor_id=pt.id, subject_id=subjects["Biology"].id))
        db.add(models.TutorCredential(tutor_id=pt.id, kind="degree",
                                      title="BSc Biology, State University",
                                      institution="State University", status="pending"))

        # --- Billing plans, promo, cancellation policies ---
        db.add_all([
            models.BillingPlan(name="Starter", description="Pay as you go",
                               price_cents=0, sessions_included=0),
            models.BillingPlan(name="Plus", description="4 sessions / month",
                               price_cents=19900, sessions_included=4),
            models.BillingPlan(name="Pro", description="10 sessions / month",
                               price_cents=44900, sessions_included=10),
        ])
        db.add(models.PromoCode(code="WELCOME10", percent_off=10, max_redemptions=1000))
        db.add_all([
            models.CancellationPolicy(name="flexible", description="Free up to 4h before",
                                      free_cancellation_hours=4, late_charge_percent=0),
            models.CancellationPolicy(name="moderate", description="Free up to 24h before",
                                      free_cancellation_hours=24, late_charge_percent=50),
            models.CancellationPolicy(name="strict", description="Free up to 48h before",
                                      free_cancellation_hours=48, late_charge_percent=100),
        ])

        # --- A completed session + review + payment ---
        first = approved[0]
        past = datetime.now(timezone.utc) - timedelta(days=3)
        done = models.Session(student_id=student.id, tutor_id=first.id,
                              subject_id=subjects["Calculus"].id, start_time=past,
                              duration_minutes=60, price_cents=first.hourly_rate_cents,
                              status="completed")
        db.add(done)
        db.flush()
        db.add(models.Review(session_id=done.id, tutor_id=first.id, student_id=student.id,
                             rating=5,
                             comment="Tara explained limits in a way that finally made sense!"))
        db.add(models.Payment(session_id=done.id, student_id=student.id, tutor_id=first.id,
                              amount_cents=done.price_cents,
                              platform_fee_cents=done.price_cents * 15 // 100,
                              status="succeeded", stripe_payment_intent="pi_stub_seed"))

        # --- An upcoming scheduled session ---
        future = datetime.now(timezone.utc) + timedelta(days=2)
        db.add(models.Session(student_id=student.id, tutor_id=first.id,
                              subject_id=subjects["Algebra"].id, start_time=future,
                              duration_minutes=60, price_cents=first.hourly_rate_cents,
                              status="scheduled"))

        db.commit()
        print("✅ Seed complete (28 tables).")
        print("\nDemo accounts (password: password123):")
        for line in (
            "  admin@omnimarkit.com    (admin)",
            "  student@omnimarkit.com  (student)",
            "  tutor@omnimarkit.com    (tutor, approved)",
            "  marcus@omnimarkit.com   (tutor, approved)",
            "  lena@omnimarkit.com     (tutor, approved)",
            "  pending@omnimarkit.com  (tutor, awaiting vetting)",
        ):
            print(line)
    finally:
        db.close()


if __name__ == "__main__":
    run()
