"""Transaction schemas."""
from __future__ import annotations

from pydantic import BaseModel, Field


class NormalizedTransaction(BaseModel):
    """Universal transaction model after normalization."""
    transaction_id: str = ""
    source: str = ""  # invoice, bank_statement, expense_report, etc.
    vendor: str | None = None
    vendor_original: str | None = None
    amount: float | None = None
    amount_original: float | None = None
    currency: str = "INR"
    date: str | None = None  # ISO 8601
    date_original: str | None = None
    reference: str | None = None
    reference_original: str | None = None
    description: str | None = None
    description_original: str | None = None
    document_id: str = ""
    po_number: str | None = None
    po_number_original: str | None = None
    invoice_number: str | None = None
    invoice_number_original: str | None = None
    debit: float | None = None
    credit: float | None = None


class NormalizationRequest(BaseModel):
    transactions: list[dict] = Field(default_factory=list)
    company_id: str = ""


class NormalizationResult(BaseModel):
    normalized: list[NormalizedTransaction] = Field(default_factory=list)
    total: int = 0
    errors: list[str] = Field(default_factory=list)
