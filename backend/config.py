"""
ARIA SOC Platform — Configuration
All settings loaded from environment variables via Pydantic Settings.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Copy .env.example to .env and fill in all required values.
    """

    # ── Wazuh ──────────────────────────────────────────────────────────────
    wazuh_base_url: str = Field(
        default="https://127.0.0.1:55000",
        description="Wazuh Manager API base URL",
    )
    wazuh_user: str = Field(
        default="wazuh",
        description="Wazuh API username",
    )
    wazuh_pass: str = Field(
        ...,
        description="Wazuh API password — REQUIRED",
    )

    # ── OpenSearch ──────────────────────────────────────────────────────────
    opensearch_base_url: str = Field(
        default="https://127.0.0.1:9200",
        description="OpenSearch base URL",
    )
    opensearch_auth: str = Field(
        ...,
        description='base64("user:password") — REQUIRED',
    )

    # ── Ollama ─────────────────────────────────────────────────────────────
    ollama_base_url: str = Field(
        default="http://127.0.0.1:11434",
        description="Ollama API base URL",
    )
    ollama_model: str = Field(
        default="llama3.2",
        description="Ollama model name",
    )
    ollama_timeout: int = Field(
        default=300,
        description="Ollama request timeout in seconds",
    )

    # ── Redis ──────────────────────────────────────────────────────────────
    redis_url: str = Field(
        default="redis://localhost:6379",
        description="Redis connection URL",
    )

    # ── App ────────────────────────────────────────────────────────────────
    jwt_secret: str = Field(
        ...,
        description="Secret for JWT validation — REQUIRED (32+ chars)",
    )
    min_alert_level: int = Field(
        default=7,
        ge=1,
        le=15,
        description="Minimum Wazuh alert level to process (1-15)",
    )
    poll_interval: int = Field(
        default=5,
        description="Alert poller interval in seconds",
    )
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        description="Allowed CORS origins for the frontend",
    )
    log_level: str = Field(
        default="INFO",
        description="Application log level",
    )
    app_version: str = Field(
        default="1.0.0",
        description="Application version",
    )

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton Settings instance."""
    return Settings()


# Convenience alias used throughout the app
settings = get_settings()
