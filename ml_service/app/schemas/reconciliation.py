"""Reconciliation schemas."""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class ReconciliationStatus(str, Enum):
    MATCHED = "matched"
    PARTIAL_MATCH = "partial_match"
    MISMATCH = "mismatch"
    UNMATCHED = "unmatched"


class MatchScoreBreakdown(BaseModel):
    amount: float = 0.0
    vendor: float = 0.0
    date: float = 0.0
    reference: float = 0.0
    description: float = 0.0


class ReconciliationResult(BaseModel):
    status: ReconciliationStatus = ReconciliationStatus.UNMATCHED
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    source_transaction_id: str = ""
    matched_transaction_id: str = ""
    score_breakdown: MatchScoreBreakdown = Field(default_factory=MatchScoreBreakdown)
    reason: str = ""
    requires_human_review: bool = False


class ReconciliationRequest(BaseModel):
    company_id: str = ""
    source_transactions: list[dict] = Field(default_factory=list)
    target_transactions: list[dict] = Field(default_factory=list)


class ReconciliationBatchResult(BaseModel):
    total_source: int = 0
    total_target: int = 0
    matched: int = 0
    partial_matches: int = 0
    mismatches: int = 0
    unmatched: int = 0
    results: list[ReconciliationResult] = Field(default_factory=list)
    human_review_required: int = 0


class MatchRequest(BaseModel):
    transaction_a: dict
    transaction_b: dict
