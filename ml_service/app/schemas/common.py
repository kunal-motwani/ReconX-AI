"""Common base schemas shared across all agents."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


def generate_id() -> str:
    return uuid4().hex[:16]


class AIDecision(BaseModel):
    """Universal AI decision wrapper — every agent output embeds this."""
    decision: str = ""
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    reason: str = ""
    evidence: list[dict[str, Any]] = Field(default_factory=list)
    source_data: list[dict[str, Any]] = Field(default_factory=list)
    requires_human_review: bool = False


class EvidenceItem(BaseModel):
    """A single piece of evidence supporting an AI decision."""
    source: str = ""
    document_id: str = ""
    field: str = ""
    value: Any = None
    transaction_id: str = ""
    description: str = ""


class ProcessingStatus(str, Enum):
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"
    SKIPPED = "skipped"


class AgentResult(BaseModel):
    """Wrapper returned by every agent invocation."""
    agent_name: str
    status: ProcessingStatus = ProcessingStatus.SUCCESS
    execution_time_ms: float = 0.0
    result: Any = None
    error: str | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
