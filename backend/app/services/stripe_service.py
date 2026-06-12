"""Stripe integration with a safe dev fallback.

When a real key is configured (settings.stripe_enabled), this calls the official
Stripe SDK. Otherwise it simulates the same shapes so the app is fully functional
in development without any account. Money is always integer cents.

To go live:
  pip install stripe
  set STRIPE_SECRET_KEY=sk_test_...   (or sk_live_...)
"""
import logging
import uuid

from app.config import settings

logger = logging.getLogger("omnimarkit.stripe")


def _client():
    import stripe  # imported lazily so the dep is optional in dev

    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def charge_session(amount_cents: int, *, description: str, metadata: dict) -> dict:
    """Charge a one-off session payment.

    Returns {"status": "succeeded"|"failed", "payment_intent": str}.
    In real (test) mode we confirm immediately with a Stripe test card so the
    server-side flow is end-to-end without Stripe Elements on the client.
    """
    if not settings.stripe_enabled:
        return {"status": "succeeded", "payment_intent": f"pi_stub_{uuid.uuid4().hex[:24]}"}
    try:
        stripe = _client()
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="usd",
            description=description,
            metadata=metadata,
            payment_method=settings.STRIPE_TEST_PAYMENT_METHOD,
            confirm=True,
            automatic_payment_methods={"enabled": True, "allow_redirects": "never"},
        )
        return {"status": intent.status if intent.status == "succeeded" else "failed",
                "payment_intent": intent.id}
    except Exception as exc:  # pragma: no cover - network/credentials dependent
        logger.warning("Stripe charge failed: %s", exc)
        return {"status": "failed", "payment_intent": None}


def create_transfer(amount_cents: int, destination_account: str | None) -> dict:
    """Pay out to a tutor's connected account (Stripe Connect Transfer)."""
    if not settings.stripe_enabled:
        return {"status": "paid", "transfer_id": f"tr_stub_{uuid.uuid4().hex[:24]}"}
    if not destination_account:
        return {"status": "failed", "transfer_id": None,
                "error": "Tutor has no Stripe account on file"}
    try:
        stripe = _client()
        transfer = stripe.Transfer.create(
            amount=amount_cents, currency="usd", destination=destination_account
        )
        return {"status": "paid", "transfer_id": transfer.id}
    except Exception as exc:  # pragma: no cover
        logger.warning("Stripe transfer failed: %s", exc)
        return {"status": "failed", "transfer_id": None, "error": str(exc)}
