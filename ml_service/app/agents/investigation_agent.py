"""Investigation Agent — deep analysis of anomalies with evidence and recommendations.

For every significant anomaly:
1. Find related invoices, POs, bank transactions
2. Retrieve accounting policy via RAG
3. Compare evidence
4. Determine likely cause
5. Produce actionable recommendation
"""
from __future__ import annotations

import logging
from typing import Any

from app.config import get_settings
from app.schemas.anomalies import Anomaly, AnomalyType, AnomalySeverity
from app.schemas.common import generate_id
from app.schemas.investigation import InvestigationResult, Recommendation
from app.schemas.transactions import NormalizedTransaction
from app.services.evidence import EvidenceCollector

logger = logging.getLogger(__name__)


class InvestigationAgent:
    """Investigates anomalies and produces evidence-backed recommendations."""

    def __init__(self, llm_provider=None, rag_retriever=None):
        self.llm = llm_provider
        self.rag = rag_retriever
        self.settings = get_settings()

    def investigate(
        self,
        anomaly: Anomaly,
        transactions: list[NormalizedTransaction],
        company_id: str = "",
    ) -> InvestigationResult:
        """Investigate a single anomaly and produce a recommendation."""
        evidence = EvidenceCollector()
        investigation_id = generate_id()

        # Build transaction lookup
        txn_map = {t.transaction_id: t for t in transactions}
        related_txns = [txn_map[tid] for tid in anomaly.related_transaction_ids if tid in txn_map]

        # Add anomaly evidence
        for e in anomaly.evidence:
            evidence.add(
                source="anomaly",
                field=e.get("field", ""),
                value=e.get("value"),
                document_id=e.get("document_id", ""),
                transaction_id=e.get("transaction_id", ""),
            )

        # Add transaction evidence
        for txn in related_txns:
            evidence.add_transaction_ref(txn.transaction_id, "amount", txn.amount)
            evidence.add_transaction_ref(txn.transaction_id, "vendor", txn.vendor)
            evidence.add_transaction_ref(txn.transaction_id, "date", txn.date)
            if txn.invoice_number:
                evidence.add_transaction_ref(txn.transaction_id, "invoice_number", txn.invoice_number)

        # Retrieve company policy context if available
        policy_refs: list[str] = []
        policy_context = ""
        if self.rag and company_id:
            try:
                query = f"{anomaly.anomaly_type.value} policy for {anomaly.reason}"
                rag_result = self.rag.retrieve(company_id, query, top_k=3)
                for chunk in rag_result.chunks:
                    text = chunk.get("text", "")
                    doc_id = chunk.get("metadata", {}).get("document_id", "")
                    policy_context += text + "\n"
                    policy_refs.append(doc_id)
                    evidence.add_policy_ref(doc_id, text[:200])
            except Exception as e:
                logger.warning("RAG retrieval failed during investigation: %s", e)

        # Deterministic cause analysis
        result = self._analyze_cause(anomaly, related_txns, policy_context, evidence)
        result.investigation_id = investigation_id
        result.anomaly_id = anomaly.anomaly_id
        result.related_documents = list({t.document_id for t in related_txns if t.document_id})
        result.related_transactions = [t.transaction_id for t in related_txns]
        result.policy_references = policy_refs
        result.evidence = evidence.to_list()

        # Use LLM for complex cases if available and deterministic analysis was inconclusive
        if result.confidence < 0.5 and self.llm:
            result = self._llm_investigate(anomaly, related_txns, policy_context, result)

        # Always require human review for investigation results
        result.requires_human_review = True
        return result

    def investigate_batch(
        self,
        anomalies: list[Anomaly],
        transactions: list[NormalizedTransaction],
        company_id: str = "",
    ) -> list[InvestigationResult]:
        """Investigate multiple anomalies."""
        results = []
        for anomaly in anomalies:
            try:
                result = self.investigate(anomaly, transactions, company_id)
                results.append(result)
            except Exception as e:
                logger.error("Investigation failed for anomaly %s: %s", anomaly.anomaly_id, e)
                results.append(InvestigationResult(
                    investigation_id=generate_id(),
                    anomaly_id=anomaly.anomaly_id,
                    issue=f"Investigation failed: {e}",
                    likely_cause="Unable to determine — investigation error",
                    reasoning=str(e),
                    recommendation=Recommendation.INVESTIGATE_FURTHER,
                    confidence=0.0,
                    requires_human_review=True,
                ))
        return results

    def _analyze_cause(
        self,
        anomaly: Anomaly,
        related_txns: list[NormalizedTransaction],
        policy_context: str,
        evidence: EvidenceCollector,
    ) -> InvestigationResult:
        """Deterministic cause analysis based on anomaly type."""
        handlers = {
            AnomalyType.DUPLICATE_PAYMENT: self._analyze_duplicate_payment,
            AnomalyType.AMOUNT_MISMATCH: self._analyze_amount_mismatch,
            AnomalyType.MISSING_INVOICE: self._analyze_missing_invoice,
            AnomalyType.MISSING_BANK_TRANSACTION: self._analyze_missing_bank_txn,
            AnomalyType.DUPLICATE_INVOICE_NUMBER: self._analyze_duplicate_invoice,
            AnomalyType.SUSPICIOUS_DATE: self._analyze_suspicious_date,
            AnomalyType.UNUSUALLY_HIGH_AMOUNT: self._analyze_high_amount,
            AnomalyType.MISSING_PO: self._analyze_missing_po,
        }

        handler = handlers.get(anomaly.anomaly_type, self._analyze_generic)
        return handler(anomaly, related_txns, policy_context)

    def _analyze_duplicate_payment(
        self, anomaly: Anomaly, txns: list[NormalizedTransaction], policy: str
    ) -> InvestigationResult:
        inv_nums = [t.invoice_number for t in txns if t.invoice_number]
        amounts = [t.amount for t in txns if t.amount is not None]
        dates = [t.date for t in txns if t.date]

        same_amount = len(set(amounts)) == 1 if amounts else False
        reasoning_parts = [
            f"Found {len(txns)} transactions referencing the same invoice.",
            f"Invoice numbers involved: {', '.join(inv_nums)}" if inv_nums else "",
            f"Amounts: {amounts}" if amounts else "",
            f"All amounts identical: {same_amount}" if amounts else "",
            f"Dates: {', '.join(dates)}" if dates else "",
        ]

        if same_amount and len(amounts) > 1:
            return InvestigationResult(
                issue="Duplicate payment detected — same invoice paid multiple times",
                likely_cause="The same invoice appears to have been settled more than once with identical amounts.",
                reasoning="\n".join(filter(None, reasoning_parts)),
                recommendation=Recommendation.REJECT,
                confidence=0.90,
            )

        return InvestigationResult(
            issue="Possible duplicate payment — same invoice referenced by multiple bank transactions",
            likely_cause="Multiple bank entries reference the same invoice, but amounts differ. Could be partial payments or a processing error.",
            reasoning="\n".join(filter(None, reasoning_parts)),
            recommendation=Recommendation.INVESTIGATE_FURTHER,
            confidence=0.65,
        )

    def _analyze_amount_mismatch(
        self, anomaly: Anomaly, txns: list[NormalizedTransaction], policy: str
    ) -> InvestigationResult:
        amounts = [(t.source, t.amount) for t in txns if t.amount is not None]
        if len(amounts) >= 2:
            diff = abs(amounts[0][1] - amounts[1][1])
            pct = (diff / max(abs(amounts[0][1]), 1)) * 100
            reasoning = (
                f"Amount from {amounts[0][0]}: {amounts[0][1]}\n"
                f"Amount from {amounts[1][0]}: {amounts[1][1]}\n"
                f"Difference: {diff:.2f} ({pct:.1f}%)"
            )

            if pct < 2:
                return InvestigationResult(
                    issue=f"Minor amount mismatch ({pct:.1f}%)",
                    likely_cause="Small discrepancy — possibly rounding, bank charges, or tax adjustment.",
                    reasoning=reasoning,
                    recommendation=Recommendation.APPROVE if pct < 0.5 else Recommendation.REQUEST_DOCUMENTATION,
                    confidence=0.80,
                )
            elif pct < 10:
                return InvestigationResult(
                    issue=f"Moderate amount mismatch ({pct:.1f}%)",
                    likely_cause="Significant discrepancy — could be partial payment, additional charges, or data entry error.",
                    reasoning=reasoning,
                    recommendation=Recommendation.REQUEST_DOCUMENTATION,
                    confidence=0.70,
                )
            else:
                return InvestigationResult(
                    issue=f"Large amount mismatch ({pct:.1f}%)",
                    likely_cause="Major discrepancy — likely a data error, wrong invoice matched, or fraud risk.",
                    reasoning=reasoning,
                    recommendation=Recommendation.REJECT,
                    confidence=0.75,
                )

        return InvestigationResult(
            issue="Amount mismatch detected",
            likely_cause="Insufficient transaction data to determine root cause.",
            reasoning=f"Related transactions: {len(txns)}",
            recommendation=Recommendation.INVESTIGATE_FURTHER,
            confidence=0.40,
        )

    def _analyze_missing_invoice(
        self, anomaly: Anomaly, txns: list[NormalizedTransaction], policy: str
    ) -> InvestigationResult:
        bank_txns = [t for t in txns if t.source == "bank_statement"]
        desc = bank_txns[0].description if bank_txns else "N/A"
        amount = bank_txns[0].amount if bank_txns else anomaly.amount

        return InvestigationResult(
            issue="Bank payment without matching invoice",
            likely_cause="A bank debit was found but no corresponding invoice exists in the system. "
                         "This could be a missing upload, direct payment, or unauthorized transaction.",
            reasoning=f"Bank transaction description: {desc}\nAmount: {amount}\n"
                       f"No invoice found matching this payment.",
            recommendation=Recommendation.REQUEST_DOCUMENTATION,
            confidence=0.70,
        )

    def _analyze_missing_bank_txn(
        self, anomaly: Anomaly, txns: list[NormalizedTransaction], policy: str
    ) -> InvestigationResult:
        inv_txns = [t for t in txns if t.source == "invoice"]
        inv_num = inv_txns[0].invoice_number if inv_txns else "N/A"
        vendor = inv_txns[0].vendor if inv_txns else "N/A"

        return InvestigationResult(
            issue="Invoice without corresponding bank payment",
            likely_cause=f"Invoice {inv_num} from {vendor} has no matching bank transaction. "
                         f"Payment may be pending, made through a different channel, or not yet recorded.",
            reasoning=f"Invoice: {inv_num}\nVendor: {vendor}\nAmount: {anomaly.amount}\n"
                       f"No bank transaction found.",
            recommendation=Recommendation.INVESTIGATE_FURTHER,
            confidence=0.65,
        )

    def _analyze_duplicate_invoice(
        self, anomaly: Anomaly, txns: list[NormalizedTransaction], policy: str
    ) -> InvestigationResult:
        inv_nums = [t.invoice_number for t in txns if t.invoice_number]
        vendors = [t.vendor for t in txns if t.vendor]

        return InvestigationResult(
            issue="Duplicate invoice number detected",
            likely_cause="Multiple invoices share the same number. This could be a vendor error, "
                         "data entry duplication, or intentional reuse of invoice numbers.",
            reasoning=f"Invoice numbers: {inv_nums}\nVendors: {vendors}",
            recommendation=Recommendation.REQUEST_DOCUMENTATION,
            confidence=0.75,
        )

    def _analyze_suspicious_date(
        self, anomaly: Anomaly, txns: list[NormalizedTransaction], policy: str
    ) -> InvestigationResult:
        dates = [t.date for t in txns if t.date]
        return InvestigationResult(
            issue="Suspicious transaction date",
            likely_cause="Transaction date appears unusual (future date, weekend, or holiday).",
            reasoning=f"Transaction dates: {dates}\nAnomaly reason: {anomaly.reason}",
            recommendation=Recommendation.INVESTIGATE_FURTHER,
            confidence=0.60,
        )

    def _analyze_high_amount(
        self, anomaly: Anomaly, txns: list[NormalizedTransaction], policy: str
    ) -> InvestigationResult:
        return InvestigationResult(
            issue=f"Unusually high transaction amount: {anomaly.amount}",
            likely_cause="Transaction amount is a statistical outlier compared to historical data. "
                         "This may be a legitimate large purchase or a data entry error.",
            reasoning=anomaly.reason,
            recommendation=Recommendation.REQUEST_DOCUMENTATION,
            confidence=0.65,
        )

    def _analyze_missing_po(
        self, anomaly: Anomaly, txns: list[NormalizedTransaction], policy: str
    ) -> InvestigationResult:
        return InvestigationResult(
            issue="Missing purchase order for transaction",
            likely_cause="No purchase order reference found. Company policy may require PO for this type of expense.",
            reasoning=anomaly.reason,
            recommendation=Recommendation.REQUEST_DOCUMENTATION,
            confidence=0.60,
        )

    def _analyze_generic(
        self, anomaly: Anomaly, txns: list[NormalizedTransaction], policy: str
    ) -> InvestigationResult:
        return InvestigationResult(
            issue=anomaly.reason,
            likely_cause="Unable to determine specific cause through automated analysis.",
            reasoning=f"Anomaly type: {anomaly.anomaly_type.value}\nSeverity: {anomaly.severity.value}",
            recommendation=Recommendation.INVESTIGATE_FURTHER,
            confidence=0.40,
        )

    def _llm_investigate(
        self,
        anomaly: Anomaly,
        txns: list[NormalizedTransaction],
        policy_context: str,
        fallback: InvestigationResult,
    ) -> InvestigationResult:
        """Use LLM for complex investigation when deterministic analysis is inconclusive."""
        try:
            from app.llm.prompts import INVESTIGATION_PROMPT, FINANCIAL_SAFETY_PREAMBLE

            txn_text = "\n".join(
                f"- {t.source}: {t.vendor} | {t.amount} {t.currency} | {t.date} | ref={t.reference}"
                for t in txns
            )
            doc_text = "\n".join(
                f"- doc_id={t.document_id}, invoice={t.invoice_number}"
                for t in txns if t.document_id
            )
            policy_text = f"Relevant company policy:\n{policy_context}" if policy_context else "No company policy available."

            prompt = INVESTIGATION_PROMPT.format(
                anomaly_type=anomaly.anomaly_type.value,
                severity=anomaly.severity.value,
                reason=anomaly.reason,
                amount=anomaly.amount,
                transactions=txn_text or "No related transactions",
                documents=doc_text or "No related documents",
                policy_context=policy_text,
            )

            result = self.llm.structured_generate(prompt, InvestigationResult, FINANCIAL_SAFETY_PREAMBLE)
            if result:
                # Preserve IDs and refs from the deterministic analysis
                result.investigation_id = fallback.investigation_id
                result.anomaly_id = fallback.anomaly_id
                result.related_documents = fallback.related_documents
                result.related_transactions = fallback.related_transactions
                result.policy_references = fallback.policy_references
                result.evidence = fallback.evidence
                result.requires_human_review = True  # LLM results always need review
                return result
        except Exception as e:
            logger.warning("LLM investigation failed: %s", e)
        return fallback
