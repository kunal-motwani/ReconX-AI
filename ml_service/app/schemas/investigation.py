"""Investigation agent schemas."""
from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class Recommendation(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"
    REQUEST_DOCUMENTATION = "request_documentation"
    INVESTIGATE_FURTHER = "investigate_further"
    MARK_AS_EXPECTED = "mark_as_expected"


class InvestigationResult(BaseModel):
    investigation_id: str = ""
    anomaly_id: str = ""
    issue: str = ""
    likely_cause: str = ""
    evidence: list[dict[str, Any]] = Field(default_factory=list)
    reasoning: str = ""
    recommendation: Recommendation = Recommendation.INVESTIGATE_FURTHER
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    requires_human_review: bool = True
    related_documents: list[str] = Field(default_factory=list)
    related_transactions: list[str] = Field(default_factory=list)
    policy_references: list[str] = Field(default_factory=list)


class InvestigationRequest(BaseModel):
    company_id: str = ""
    anomalies: list[dict] = Field(default_factory=list)
    transactions: list[dict] = Field(default_factory=list)
    reconciliation_results: list[dict] = Field(default_factory=list)


class InvestigationBatchResult(BaseModel):
    total_investigated: int = 0
    results: list[InvestigationResult] = Field(default_factory=list)
    requires_human_review: int = 0


class WorkflowRequest(BaseModel):
    company_id: str = ""
    document_ids: list[str] = Field(default_factory=list)
    documents: list[dict] = Field(default_factory=list)
    transactions: list[dict] = Field(default_factory=list)
    options: dict[str, Any] = Field(default_factory=dict)


class WorkflowResult(BaseModel):
    workflow_id: str = ""
    status: str = ""
    transactions_processed: int = 0
    reconciled: int = 0
    anomalies: int = 0
    human_review_required: int = 0
    results: list[dict[str, Any]] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    execution_time_ms: float = 0.0


class GLMappingRequest(BaseModel):
    company_id: str = ""
    transactions: list[dict] = Field(default_factory=list)


class GLMappingResult(BaseModel):
    gl_code: str | None = None
    gl_name: str | None = None
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    reason: str = ""
    evidence: list[dict[str, Any]] = Field(default_factory=list)
    requires_human_review: bool = False
    transaction_id: str = ""


class GLBatchResult(BaseModel):
    total: int = 0
    results: list[GLMappingResult] = Field(default_factory=list)
    auto_approved: int = 0
    requires_review: int = 0


class RAGIngestRequest(BaseModel):
    company_id: str
    document_id: str = ""
    document_type: str = ""
    content: str = ""
    metadata: dict[str, Any] = Field(default_factory=dict)


class RAGSearchRequest(BaseModel):
    company_id: str
    query: str
    top_k: int = 5


class RAGSearchResult(BaseModel):
    chunks: list[dict[str, Any]] = Field(default_factory=list)
    query: str = ""
    company_id: str = ""
