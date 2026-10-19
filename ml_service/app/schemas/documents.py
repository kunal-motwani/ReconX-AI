"""Document extraction schemas."""
from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class DocumentType(str, Enum):
    INVOICE = "invoice"
    RECEIPT = "receipt"
    PURCHASE_ORDER = "purchase_order"
    BANK_STATEMENT = "bank_statement"
    EXPENSE_REPORT = "expense_report"
    ACCOUNTING_POLICY = "accounting_policy"
    UNKNOWN = "unknown"


class LineItem(BaseModel):
    description: str = ""
    quantity: float | None = None
    unit_price: float | None = None
    amount: float | None = None
    tax: float | None = None


class ExtractedInvoice(BaseModel):
    document_type: str = DocumentType.INVOICE
    vendor: str | None = None
    invoice_number: str | None = None
    invoice_date: str | None = None
    due_date: str | None = None
    subtotal: float | None = None
    tax: float | None = None
    total: float | None = None
    currency: str | None = None
    po_number: str | None = None
    line_items: list[LineItem] = Field(default_factory=list)
    confidence: float = Field(0.0, ge=0.0, le=1.0)


class ExtractedBankTransaction(BaseModel):
    document_type: str = DocumentType.BANK_STATEMENT
    transaction_date: str | None = None
    description: str | None = None
    reference: str | None = None
    debit: float | None = None
    credit: float | None = None
    amount: float | None = None
    currency: str | None = None
    balance: float | None = None


class DocumentClassification(BaseModel):
    document_type: DocumentType = DocumentType.UNKNOWN
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    reason: str = ""


class ExtractionRequest(BaseModel):
    document_id: str
    file_path: str | None = None
    file_content: str | None = None
    file_type: str | None = None
    company_id: str = ""


class ExtractionResult(BaseModel):
    document_id: str
    document_type: DocumentType = DocumentType.UNKNOWN
    classification_confidence: float = 0.0
    extracted_data: dict[str, Any] = Field(default_factory=dict)
    raw_text: str = ""
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
