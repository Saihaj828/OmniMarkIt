"""ORM models — 28 tables across the OmniMarkIt domain.

Importing this package registers every model on `Base.metadata`, which Alembic
autogenerate and `Base.metadata.create_all` both rely on.
"""
from app.models.admin import AdminAction
from app.models.dispute import Dispute
from app.models.messaging import Conversation, Message
from app.models.notification import Notification
from app.models.recording import Recording, RecordingAccess
from app.models.payment import (
    BillingPlan,
    CancellationPolicy,
    Payment,
    PaymentMethod,
    Payout,
    PromoCode,
    Subscription,
)
from app.models.review import Review
from app.models.scheduling import (
    AvailabilityException,
    CalendarConnection,
    TutorAvailability,
)
from app.models.session import Session, SessionFlag, SessionMaterial
from app.models.subject import Subject, TutorSubject
from app.models.user import StudentProfile, TutorProfile, User
from app.models.vetting import (
    TutorCredential,
    TutorIdVerification,
    TutorTeachingApproach,
    TutorVetting,
)

__all__ = [
    # auth & identity
    "User",
    "StudentProfile",
    "TutorProfile",
    # subjects
    "Subject",
    "TutorSubject",
    # vetting
    "TutorVetting",
    "TutorCredential",
    "TutorIdVerification",
    "TutorTeachingApproach",
    # scheduling
    "TutorAvailability",
    "AvailabilityException",
    "CalendarConnection",
    # sessions
    "Session",
    "SessionMaterial",
    "SessionFlag",
    # payments
    "BillingPlan",
    "Subscription",
    "Payment",
    "Payout",
    "PaymentMethod",
    "PromoCode",
    "CancellationPolicy",
    # reviews
    "Review",
    # messaging
    "Conversation",
    "Message",
    # notifications
    "Notification",
    # recordings
    "Recording",
    "RecordingAccess",
    # disputes
    "Dispute",
    # admin
    "AdminAction",
]
