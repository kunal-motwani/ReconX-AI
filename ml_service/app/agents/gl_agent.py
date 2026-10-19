"""GL Mapping Agent — intelligent General Ledger code classification.

Decision hierarchy (deterministic first, LLM last):
1. Historical company mapping (exact match)
2. Company accounting policy / RAG context
3. Vendor history
4. Transaction description keyword matching
5. LLM classification
6. Human review if confidence is low
"""
from __future__ import annotations

import logging
import re
from typing import Any

from app.config import get_settings
from app.schemas.investigation import GLMappingResult, GLBatchResult
from app.schemas.transactions import NormalizedTransaction

logger = logging.getLogger(__name__)

# Default GL code registry — keyword-based classification
DEFAULT_GL_CODES: list[dict[str, Any]] = [
    {"code": "4101", "name": "Sales Revenue", "keywords": ["sale", "revenue", "income"]},
    {"code": "5101", "name": "Cost of Goods Sold", "keywords": ["cogs", "cost of goods", "raw material"]},
    {"code": "6101", "name": "Office Supplies", "keywords": ["office", "stationery", "supplies", "printer"]},
    {"code": "6102", "name": "Utilities", "keywords": ["electricity", "water", "gas", "utility", "power"]},
    {"code": "6201", "name": "Cloud / Software Expenses", "keywords": ["cloud", "aws", "azure", "gcp", "saas", "software", "subscription", "hosting", "server"]},
    {"code": "6202", "name": "Hardware / Equipment", "keywords": ["hardware", "laptop", "computer", "equipment", "monitor", "keyboard"]},
    {"code": "6301", "name": "Professional Services", "keywords": ["consulting", "legal", "audit", "advisory", "professional"]},
    {"code": "6302", "name": "Marketing & Advertising", "keywords": ["marketing", "advertising", "ads", "campaign", "social media", "seo"]},
    {"code": "6401", "name": "Travel & Transportation", "keywords": ["travel", "flight", "hotel", "cab", "taxi", "uber", "train", "transport"]},
    {"code": "6402", "name": "Meals & Entertainment", "keywords": ["meal", "food", "lunch", "dinner", "catering", "entertainment"]},
    {"code": "6501", "name": "Rent & Lease", "keywords": ["rent", "lease", "office space", "coworking"]},
    {"code": "6502", "name": "Insurance", "keywords": ["insurance", "policy", "premium"]},
    {"code": "6601", "name": "Salaries & Wages", "keywords": ["salary", "wages", "payroll", "compensation"]},
    {"code": "6602", "name": "Employee Benefits", "keywords": ["benefit", "medical", "health", "pf", "provident"]},
    {"code": "6701", "name": "Telecommunication", "keywords": ["phone", "mobile", "internet", "broadband", "telecom"]},
    {"code": "6801", "name": "Depreciation", "keywords": ["depreciation", "amortization"]},
    {"code": "6901", "name": "Miscellaneous Expenses", "keywords": ["misc", "sundry", "general"]},
    {"code": "7101", "name": "Bank Charges", "keywords": ["bank charge", "bank fee", "transaction fee", "wire fee"]},
    {"code": "7201", "name": "Interest Expense", "keywords": ["interest", "loan", "emi"]},
]

# Known vendor-to-GL mappings (example historical data)
VENDOR_GL_MAP: dict[str, dict[str, str]] = {
    "AWS": {"code": "6201", "name": "Cloud / Software Expenses"},
    "AMAZON WEB SERVICES": {"code": "6201", "name": "Cloud / Software Expenses"},
    "MICROSOFT": {"code": "6201", "name": "Cloud / Software Expenses"},
    "GOOGLE CLOUD": {"code": "6201", "name": "Cloud / Software Expenses"},
    "UBER": {"code": "6401", "name": "Travel & Transportation"},
    "ZOMATO": {"code": "6402", "name": "Meals & Entertainment"},
    "SWIGGY": {"code": "6402", "name": "Meals & Entertainment"},
}


class GLMappingAgent:
    """Maps transactions to GL codes using a deterministic-first hierarchy."""

    def __init__(
        self,
        gl_codes: list[dict[str, Any]] | None = None,
        vendor_map: dict[str, dict[str, str]] | None = None,
        llm_provider=None,
        rag_retriever=None,
    ):
        self.gl_codes = gl_codes or DEFAULT_GL_CODES
        self.vendor_map = vendor_map or VENDOR_GL_MAP
        self.llm = llm_provider
        self.rag = rag_retriever
        self.settings = get_settings()

    def map_transaction(
        self,
        txn: NormalizedTransaction,
        company_id: str = "",
        historical_mappings: dict[str, dict] | None = None,
    ) -> GLMappingResult:
        """Map a single transaction to a GL code."""
        evidence: list[dict[str, Any]] = []

        # 1. Historical company mapping
        if historical_mappings:
            result = self._check_historical(txn, historical_mappings, evidence)
            if result:
                return result

        # 2. RAG — company accounting policy
        if self.rag and company_id:
            result = self._check_rag(txn, company_id, evidence)
            if result:
                return result

        # 3. Vendor history
        result = self._check_vendor(txn, evidence)
        if result:
            return result

        # 4. Description keyword matching
        result = self._check_keywords(txn, evidence)
        if result:
            return result

        # 5. LLM classification (last resort)
        if self.llm:
            result = self._check_llm(txn, company_id, evidence)
            if result:
                return result

        # 6. Unknown — needs human review
        return GLMappingResult(
            gl_code=None,
            gl_name=None,
            confidence=0.0,
            reason="Unable to determine GL code through any method. Human review required.",
            evidence=evidence,
            requires_human_review=True,
            transaction_id=txn.transaction_id,
        )

    def map_batch(
        self,
        transactions: list[NormalizedTransaction],
        company_id: str = "",
        historical_mappings: dict[str, dict] | None = None,
    ) -> GLBatchResult:
        """Map a batch of transactions."""
        results = []
        auto_approved = 0
        requires_review = 0

        for txn in transactions:
            result = self.map_transaction(txn, company_id, historical_mappings)
            results.append(result)
            if result.requires_human_review:
                requires_review += 1
            else:
                auto_approved += 1

        return GLBatchResult(
            total=len(transactions),
            results=results,
            auto_approved=auto_approved,
            requires_review=requires_review,
        )

    def _check_historical(
        self, txn: NormalizedTransaction, mappings: dict[str, dict], evidence: list
    ) -> GLMappingResult | None:
        """Check if there's an exact historical mapping for this vendor + description combo."""
        key = f"{(txn.vendor or '').upper()}:{(txn.description or '').upper()}"
        if key in mappings:
            mapping = mappings[key]
            evidence.append({
                "source": "historical_mapping",
                "field": "vendor:description",
                "value": key,
                "matched_gl": mapping.get("code"),
            })
            conf = 0.95
            return GLMappingResult(
                gl_code=mapping.get("code"),
                gl_name=mapping.get("name"),
                confidence=conf,
                reason=f"Historical mapping found for vendor+description: {key}",
                evidence=evidence,
                requires_human_review=conf < self.settings.GL_AUTO_APPROVAL_THRESHOLD,
                transaction_id=txn.transaction_id,
            )
        return None

    def _check_vendor(
        self, txn: NormalizedTransaction, evidence: list
    ) -> GLMappingResult | None:
        """Check known vendor-to-GL mappings."""
        vendor = (txn.vendor or "").upper().strip()
        if not vendor:
            return None

        # Exact match
        if vendor in self.vendor_map:
            gl = self.vendor_map[vendor]
            evidence.append({
                "source": "vendor_mapping",
                "field": "vendor",
                "value": vendor,
                "matched_gl": gl["code"],
            })
            conf = 0.90
            return GLMappingResult(
                gl_code=gl["code"],
                gl_name=gl["name"],
                confidence=conf,
                reason=f"Known vendor mapping: {vendor} → {gl['code']} {gl['name']}",
                evidence=evidence,
                requires_human_review=conf < self.settings.GL_AUTO_APPROVAL_THRESHOLD,
                transaction_id=txn.transaction_id,
            )

        # Partial match
        for known_vendor, gl in self.vendor_map.items():
            if known_vendor in vendor or vendor in known_vendor:
                evidence.append({
                    "source": "vendor_mapping_partial",
                    "field": "vendor",
                    "value": vendor,
                    "matched_vendor": known_vendor,
                    "matched_gl": gl["code"],
                })
                conf = 0.80
                return GLMappingResult(
                    gl_code=gl["code"],
                    gl_name=gl["name"],
                    confidence=conf,
                    reason=f"Partial vendor match: {vendor} ≈ {known_vendor} → {gl['code']}",
                    evidence=evidence,
                    requires_human_review=conf < self.settings.GL_AUTO_APPROVAL_THRESHOLD,
                    transaction_id=txn.transaction_id,
                )
        return None

    def _check_keywords(
        self, txn: NormalizedTransaction, evidence: list
    ) -> GLMappingResult | None:
        """Match transaction description against GL keyword rules."""
        text = " ".join(
            filter(None, [txn.description, txn.vendor, txn.reference])
        ).lower()
        if not text.strip():
            return None

        best_match: dict | None = None
        best_score = 0

        for gl in self.gl_codes:
            hits = sum(1 for kw in gl["keywords"] if kw in text)
            if hits > best_score:
                best_score = hits
                best_match = gl

        if best_match and best_score > 0:
            # Confidence scales with number of keyword hits (max 0.85)
            conf = min(0.60 + best_score * 0.10, 0.85)
            evidence.append({
                "source": "keyword_matching",
                "field": "description",
                "value": text[:200],
                "matched_keywords": best_score,
                "matched_gl": best_match["code"],
            })
            return GLMappingResult(
                gl_code=best_match["code"],
                gl_name=best_match["name"],
                confidence=conf,
                reason=f"Keyword match ({best_score} keywords) → {best_match['code']} {best_match['name']}",
                evidence=evidence,
                requires_human_review=conf < self.settings.GL_AUTO_APPROVAL_THRESHOLD,
                transaction_id=txn.transaction_id,
            )
        return None

    def _check_rag(
        self, txn: NormalizedTransaction, company_id: str, evidence: list
    ) -> GLMappingResult | None:
        """Search company knowledge for GL guidance."""
        try:
            query = f"GL code classification for: {txn.vendor} {txn.description} {txn.amount}"
            result = self.rag.retrieve(company_id, query, top_k=3)
            if not result.chunks:
                return None

            # Look for GL code mentions in retrieved chunks
            for chunk in result.chunks:
                chunk_text = chunk.get("text", "")
                # Try to find GL code patterns in the retrieved policy
                gl_matches = re.findall(r'\b(\d{4})\b', chunk_text)
                for code in gl_matches:
                    # Verify it's a known GL code
                    for gl in self.gl_codes:
                        if gl["code"] == code:
                            evidence.append({
                                "source": "rag_policy",
                                "document_id": chunk.get("metadata", {}).get("document_id", ""),
                                "field": "policy_text",
                                "value": chunk_text[:200],
                                "matched_gl": code,
                            })
                            conf = 0.85
                            return GLMappingResult(
                                gl_code=code,
                                gl_name=gl["name"],
                                confidence=conf,
                                reason=f"Company policy indicates GL {code} ({gl['name']})",
                                evidence=evidence,
                                requires_human_review=conf < self.settings.GL_AUTO_APPROVAL_THRESHOLD,
                                transaction_id=txn.transaction_id,
                            )
        except Exception as e:
            logger.warning("RAG lookup failed for GL mapping: %s", e)
        return None

    def _check_llm(
        self, txn: NormalizedTransaction, company_id: str, evidence: list
    ) -> GLMappingResult | None:
        """Use LLM as last resort for GL classification."""
        try:
            from app.llm.prompts import GL_CLASSIFICATION_PROMPT, FINANCIAL_SAFETY_PREAMBLE

            gl_list = "\n".join(f"- {gl['code']}: {gl['name']}" for gl in self.gl_codes)

            # Try RAG context for the prompt
            rag_context = ""
            if self.rag and company_id:
                try:
                    search = self.rag.retrieve(company_id, f"{txn.vendor} {txn.description}", top_k=2)
                    if search.chunks:
                        rag_context = "Company policy context:\n" + "\n".join(
                            c.get("text", "")[:300] for c in search.chunks
                        )
                except Exception:
                    pass

            prompt = GL_CLASSIFICATION_PROMPT.format(
                vendor=txn.vendor or "Unknown",
                description=txn.description or "N/A",
                amount=txn.amount or 0,
                currency=txn.currency,
                date=txn.date or "N/A",
                gl_codes=gl_list,
                rag_context=rag_context,
            )

            result = self.llm.structured_generate(prompt, GLMappingResult, FINANCIAL_SAFETY_PREAMBLE)
            if result and result.gl_code:
                # Verify the GL code is in our list
                valid = any(gl["code"] == result.gl_code for gl in self.gl_codes)
                if not valid:
                    logger.warning("LLM suggested unknown GL code %s — rejecting", result.gl_code)
                    return None
                result.transaction_id = txn.transaction_id
                evidence.append({
                    "source": "llm_classification",
                    "field": "llm_output",
                    "value": result.reason,
                })
                result.evidence = evidence
                # LLM results get slightly lower confidence ceiling
                result.confidence = min(result.confidence, 0.80)
                result.requires_human_review = result.confidence < self.settings.GL_AUTO_APPROVAL_THRESHOLD
                return result
        except Exception as e:
            logger.warning("LLM GL classification failed: %s", e)
        return None
