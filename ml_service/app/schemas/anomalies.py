"""Anomaly detection schemas."""
from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class AnomalyType(str, Enum):
    DUPLICATE_PAYMENT = "duplicate_payment"
    AMOUNT_MISMATCH = "amount_mismatch"
    MISSING_INVOICE = "missing_invoice"
    MISSING_PO = "missing_po"
    MISSING_BANK_TRANSACTION = "missing_bank_transaction"
    INVALID_CURRENCY = "invalid_currency"
    SUSPICIOUS_DATE = "suspicious_date"
    DUPLICATE_INVOICE_NUMBER = "duplicate_invoice_number"
    UNUSUALLY_HIGH_AMOUNT = "unusually_high_amount"
    STATISTICAL_OUTLIER = "statistical_outlier"


class AnomalySeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Anomaly(BaseModel):
    anomaly_id: str = ""
    anomaly_type: AnomalyType
    severity: AnomalySeverity = AnomalySeverity.MEDIUM
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    amount: float | None = None
    reason: str = ""
    evidence: list[dict[str, Any]] = Field(default_factory=list)
    related_transaction_ids: list[str] = Field(default_factory=list)
    requires_human_review: bool = True


class AnomalyDetectionRequest(BaseModel):
    company_id: str = ""
    transactions: list[dict] = Field(default_factory=list)
    reconciliation_results: list[dict] = Field(default_factory=list)


class AnomalyDetectionResult(BaseModel):
    total_transactions: int = 0
    anomalies_found: int = 0
    anomalies: list[Anomaly] = Field(default_factory=list)
    high_severity_count: int = 0
    requires_human_review: int = 0
