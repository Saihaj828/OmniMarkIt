"""Checkr background-check integration with a safe dev fallback.

When CHECKR_API_KEY is set (settings.checkr_enabled) this calls the Checkr REST
API; otherwise it simulates a 'pending' report so the flow works without an
account. Checkr uses HTTP Basic auth with the API key as the username.

To go live:
  set CHECKR_API_KEY=<your key>
"""
import base64
import json
import logging
import urllib.request
import uuid

from app.config import settings

logger = logging.getLogger("omnimarkit.checkr")
CHECKR_BASE = "https://api.checkr.com/v1"


def _post(path: str, payload: dict) -> dict:
    auth = base64.b64encode(f"{settings.CHECKR_API_KEY}:".encode()).decode()
    req = urllib.request.Request(
        CHECKR_BASE + path,
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Basic {auth}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as r:  # pragma: no cover
        return json.loads(r.read())


def start_background_check(*, full_name: str, email: str) -> dict:
    """Create a candidate + report. Returns {"status": ..., "report_id": ...}.

    status is Checkr-style: 'pending' | 'clear' | 'consider'. We map 'clear'→passed,
    'consider'/failed→failed, anything else→pending in the service layer.
    """
    if not settings.checkr_enabled:
        return {"status": "pending", "report_id": f"rep_stub_{uuid.uuid4().hex[:16]}"}
    try:  # pragma: no cover - credentials dependent
        first, _, last = full_name.partition(" ")
        candidate = _post("/candidates", {"first_name": first, "last_name": last or first,
                                          "email": email})
        report = _post("/reports", {"candidate_id": candidate["id"],
                                    "package": settings.CHECKR_PACKAGE})
        return {"status": report.get("status", "pending"), "report_id": report.get("id")}
    except Exception as exc:  # pragma: no cover
        logger.warning("Checkr request failed: %s", exc)
        return {"status": "pending", "report_id": None, "error": str(exc)}
