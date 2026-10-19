"""Centralized configuration loaded from environment variables."""
from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    """Application settings — all values overridable via env vars or .env file."""

    # --- LLM ---
    LLM_PROVIDER: str = "gemini"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gemini-2.0-flash"

    # --- Vector DB ---
    VECTOR_DB_PATH: str = "./data/vectorstore"

    # --- Thresholds ---
    GL_AUTO_APPROVAL_THRESHOLD: float = 0.90
    RECONCILIATION_AUTO_MATCH_THRESHOLD: float = 0.95
    ANOMALY_REVIEW_THRESHOLD: float = 0.70

    # --- Matching ---
    MATCHING_WEIGHTS: dict[str, float] = {
        "amount": 0.35,
        "vendor": 0.20,
        "date": 0.15,
        "reference": 0.20,
        "description": 0.10,
    }
    DATE_TOLERANCE_DAYS: int = 3
    AMOUNT_TOLERANCE_PERCENT: float = 1.0

    # --- OCR ---
    OCR_ENABLED: bool = True

    # --- Logging ---
    LOG_LEVEL: str = "INFO"

    # --- Server ---
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # --- CORS ---
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    @field_validator("MATCHING_WEIGHTS", mode="before")
    @classmethod
    def parse_matching_weights(cls, v: Any) -> dict[str, float]:
        if isinstance(v, str):
            return json.loads(v)
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            return json.loads(v)
        return v

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
