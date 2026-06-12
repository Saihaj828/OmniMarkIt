"""Application configuration loaded from environment variables.

Every setting has a safe local-dev default so the app runs with zero setup.
Override via a `.env` file (see .env.example) or real environment variables.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Core ---
    APP_NAME: str = "OmniMarkIt API"
    ENV: str = "development"

    # SQLite by default → zero setup. For Postgres, e.g.:
    #   DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/omnimarkit
    DATABASE_URL: str = "sqlite:///./omnimarkit.db"

    # --- Auth (JWT, HS256) ---
    JWT_SECRET: str = "dev-only-secret-change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24

    # --- Encryption (AES-256-GCM for OAuth tokens in CALENDAR_CONNECTIONS) ---
    # Any string; a 256-bit key is derived from it via SHA-256.
    ENCRYPTION_SECRET: str = "dev-only-encryption-secret-change-me"

    # --- CORS ---
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    # --- Payments (Stripe) ---
    # Leave as the stub to simulate; set a real sk_test_/sk_live_ key to go live.
    STRIPE_SECRET_KEY: str = "sk_test_stub"
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_stub"
    # Stripe test payment method used for server-side demo charges in test mode.
    STRIPE_TEST_PAYMENT_METHOD: str = "pm_card_visa"
    PLATFORM_FEE_BPS: int = 1500  # 15% platform fee, in basis points

    # --- Background checks (Checkr) ---
    # Leave blank to simulate; set a real key to run real Checkr reports.
    CHECKR_API_KEY: str = ""
    CHECKR_PACKAGE: str = "tasker_standard"

    # --- File uploads (PDF) ---
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_BYTES: int = 10 * 1024 * 1024  # 10 MB

    # --- Video + recordings ---
    # Public Jitsi server — free, no account. Override with your own domain.
    JITSI_DOMAIN: str = "meet.jit.si"
    MAX_RECORDING_BYTES: int = 200 * 1024 * 1024  # 200 MB
    # Recordings are free to view for this many days, then payable.
    RECORDING_FREE_DAYS: int = 7
    RECORDING_PRICE_CENTS: int = 499  # cost to view after the free window

    # --- Celery / Redis (broker optional; tasks run eager if unset) ---
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_TASK_ALWAYS_EAGER: bool = True  # run tasks inline in dev

    @property
    def stripe_enabled(self) -> bool:
        key = self.STRIPE_SECRET_KEY or ""
        return key.startswith("sk_") and key != "sk_test_stub"

    @property
    def checkr_enabled(self) -> bool:
        return bool(self.CHECKR_API_KEY)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
