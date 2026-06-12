"""Security primitives: password hashing, JWT, and AES-256-GCM encryption.

AES-256-GCM is used to encrypt OAuth tokens before they are stored in
CALENDAR_CONNECTIONS (hard rule: never store OAuth tokens in plain text).
"""
import base64
import hashlib
import os
from datetime import datetime, timedelta, timezone
from uuid import UUID

import bcrypt
import jwt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import settings


# --- Passwords (bcrypt) ---
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# --- JWT (HS256) ---
def create_access_token(user_id: UUID, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": now + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])


# --- AES-256-GCM (OAuth token at-rest encryption) ---
def _aes_key() -> bytes:
    # Derive a stable 256-bit key from the configured secret.
    return hashlib.sha256(settings.ENCRYPTION_SECRET.encode("utf-8")).digest()


def encrypt_secret(plaintext: str) -> str:
    """Return base64(nonce || ciphertext) — safe to store in a text column."""
    aesgcm = AESGCM(_aes_key())
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return base64.b64encode(nonce + ct).decode("utf-8")


def decrypt_secret(token: str) -> str:
    raw = base64.b64decode(token.encode("utf-8"))
    nonce, ct = raw[:12], raw[12:]
    return AESGCM(_aes_key()).decrypt(nonce, ct, None).decode("utf-8")
