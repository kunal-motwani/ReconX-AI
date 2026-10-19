"""Anomaly detection rules."""
from __future__ import annotations

import datetime
import uuid
from typing import Any

from app.schemas.anomalies import Anomaly, AnomalySeverity, AnomalyType
from app.schemas.reconciliation import ReconciliationResult, ReconciliationStatus
from app.schemas.transactions import NormalizedTransaction


def _generate_id() -> str:
    return uuid.uuid4().hex[:16]


class DuplicatePaymentRule:
    def check(
        self,
        transactions: list[NormalizedTransaction],
        reconciliation_results: list[ReconciliationResult]
    ) -> list[Anomaly]:
        anomalies = []
        bank_txns = [t for t in transactions if t.source in ("bank_statement", "bank")]
        
        # Group bank transactions by invoice_number
        invoice_map = {}
        for t in bank_txns:
            if t.invoice_number:
                invoice_map.setdefault(t.invoice_number, []).append(t)
        
        for inv_num, txns in invoice_map.items():
            if len(txns) > 1:
                # Compare all pairs
                for i in range(len(txns)):
                    for j in range(i + 1, len(txns)):
                        anomalies.append(
                            Anomaly(
                                anomaly_id=_generate_id(),
                                anomaly_type=AnomalyType.DUPLICATE_PAYMENT,
                                severity=AnomalySeverity.HIGH,
                                confidence=1.0,
                                amount=txns[i].amount,
                                reason=f"Bank transactions {txns[i].transaction_id} and {txns[j].transaction_id} reference the same invoice number {inv_num}",
                                evidence=[
                                    {"document_id": txns[i].document_id, "transaction_id": txns[i].transaction_id},
                                    {"document_id": txns[j].document_id, "transaction_id": txns[j].transaction_id},
                                ],
                                related_transaction_ids=[txns[i].transaction_id, txns[j].transaction_id]
                            )
                        )
        return anomalies


class AmountMismatchRule:
    def check(
        self,
        transactions: list[NormalizedTransaction],
        reconciliation_results: list[ReconciliationResult]
    ) -> list[Anomaly]:
        anomalies = []
        txn_map = {t.transaction_id: t for t in transactions}
        
        for res in reconciliation_results:
            if res.status in (ReconciliationStatus.PARTIAL_MATCH, ReconciliationStatus.MISMATCH):
                if res.score_breakdown.amount < 1.0:
                    src_txn = txn_map.get(res.source_transaction_id)
                    tgt_txn = txn_map.get(res.matched_transaction_id)
                    
                    if src_txn and tgt_txn and src_txn.amount and tgt_txn.amount:
                        diff = abs(src_txn.amount - tgt_txn.amount)
                        max_amt = max(abs(src_txn.amount), abs(tgt_txn.amount))
                        diff_pct = diff / max_amt if max_amt else 0.0
                        
                        severity = AnomalySeverity.HIGH if diff_pct >= 0.05 else AnomalySeverity.MEDIUM
                        
                        anomalies.append(
                            Anomaly(
                                anomaly_id=_generate_id(),
                                anomaly_type=AnomalyType.AMOUNT_MISMATCH,
                                severity=severity,
                                confidence=1.0 - res.score_breakdown.amount,
                                amount=diff,
                                reason=f"Amount mismatch: {src_txn.amount} vs {tgt_txn.amount}",
                                evidence=[
                                    {"document_id": src_txn.document_id, "transaction_id": src_txn.transaction_id, "amount": src_txn.amount},
                                    {"document_id": tgt_txn.document_id, "transaction_id": tgt_txn.transaction_id, "amount": tgt_txn.amount}
                                ],
                                related_transaction_ids=[src_txn.transaction_id, tgt_txn.transaction_id]
                            )
                        )
        return anomalies


class MissingInvoiceRule:
    def check(
        self,
        transactions: list[NormalizedTransaction],
        reconciliation_results: list[ReconciliationResult]
    ) -> list[Anomaly]:
        anomalies = []
        txn_map = {t.transaction_id: t for t in transactions}
        
        for res in reconciliation_results:
            if res.status == ReconciliationStatus.UNMATCHED:
                src_txn = txn_map.get(res.source_transaction_id)
                if src_txn and src_txn.source in ("bank_statement", "bank"):
                    anomalies.append(
                        Anomaly(
                            anomaly_id=_generate_id(),
                            anomaly_type=AnomalyType.MISSING_INVOICE,
                            severity=AnomalySeverity.MEDIUM,
                            confidence=0.9,
                            amount=src_txn.amount,
                            reason=f"Bank transaction {src_txn.transaction_id} has no matching invoice",
                            evidence=[{"document_id": src_txn.document_id, "transaction_id": src_txn.transaction_id}],
                            related_transaction_ids=[src_txn.transaction_id]
                        )
                    )
        return anomalies


class MissingBankTransactionRule:
    def check(
        self,
        transactions: list[NormalizedTransaction],
        reconciliation_results: list[ReconciliationResult]
    ) -> list[Anomaly]:
        anomalies = []
        txn_map = {t.transaction_id: t for t in transactions}
        
        for res in reconciliation_results:
            if res.status == ReconciliationStatus.UNMATCHED:
                src_txn = txn_map.get(res.source_transaction_id)
                if src_txn and src_txn.source == "invoice":
                    anomalies.append(
                        Anomaly(
                            anomaly_id=_generate_id(),
                            anomaly_type=AnomalyType.MISSING_BANK_TRANSACTION,
                            severity=AnomalySeverity.MEDIUM,
                            confidence=0.9,
                            amount=src_txn.amount,
                            reason=f"Invoice {src_txn.transaction_id} has no matching bank transaction",
                            evidence=[{"document_id": src_txn.document_id, "transaction_id": src_txn.transaction_id}],
                            related_transaction_ids=[src_txn.transaction_id]
                        )
                    )
        return anomalies


class DuplicateInvoiceNumberRule:
    def check(
        self,
        transactions: list[NormalizedTransaction],
        reconciliation_results: list[ReconciliationResult]
    ) -> list[Anomaly]:
        anomalies = []
        invoices = [t for t in transactions if t.source == "invoice"]
        
        # vendor + invoice_number
        vendor_inv_map = {}
        for t in invoices:
            if t.vendor and t.invoice_number:
                key = (t.vendor.lower(), t.invoice_number.lower())
                vendor_inv_map.setdefault(key, []).append(t)
        
        for (vendor, inv_num), txns in vendor_inv_map.items():
            if len(txns) > 1:
                txn_ids = [t.transaction_id for t in txns]
                evidence = [{"document_id": t.document_id, "transaction_id": t.transaction_id} for t in txns]
                
                anomalies.append(
                    Anomaly(
                        anomaly_id=_generate_id(),
                        anomaly_type=AnomalyType.DUPLICATE_INVOICE_NUMBER,
                        severity=AnomalySeverity.HIGH,
                        confidence=1.0,
                        amount=txns[0].amount,
                        reason=f"Multiple invoices found with number {inv_num} for vendor {vendor}",
                        evidence=evidence,
                        related_transaction_ids=txn_ids
                    )
                )
        return anomalies


class SuspiciousDateRule:
    def check(
        self,
        transactions: list[NormalizedTransaction],
        reconciliation_results: list[ReconciliationResult]
    ) -> list[Anomaly]:
        anomalies = []
        now = datetime.datetime.utcnow().date()
        
        for t in transactions:
            if t.date:
                try:
                    dt = datetime.datetime.fromisoformat(t.date).date()
                    is_future = dt > now
                    is_weekend = dt.weekday() >= 5
                    
                    if is_future or is_weekend:
                        reason = "Future date" if is_future else "Weekend date"
                        anomalies.append(
                            Anomaly(
                                anomaly_id=_generate_id(),
                                anomaly_type=AnomalyType.SUSPICIOUS_DATE,
                                severity=AnomalySeverity.LOW,
                                confidence=0.8,
                                amount=t.amount,
                                reason=f"Suspicious transaction date: {t.date} ({reason})",
                                evidence=[{"document_id": t.document_id, "transaction_id": t.transaction_id, "date": t.date}],
                                related_transaction_ids=[t.transaction_id]
                            )
                        )
                except ValueError:
                    pass
        return anomalies


class UnusuallyHighAmountRule:
    def check(
        self,
        transactions: list[NormalizedTransaction],
        reconciliation_results: list[ReconciliationResult]
    ) -> list[Anomaly]:
        anomalies = []
        amounts = [t.amount for t in transactions if t.amount is not None]
        if not amounts or len(amounts) < 2:
            return anomalies
            
        mean = sum(amounts) / len(amounts)
        variance = sum((a - mean) ** 2 for a in amounts) / len(amounts)
        std_dev = variance ** 0.5
        
        if std_dev == 0:
            return anomalies
            
        for t in transactions:
            if t.amount is not None:
                z_score = abs(t.amount - mean) / std_dev
                if z_score > 3.0:
                    anomalies.append(
                        Anomaly(
                            anomaly_id=_generate_id(),
                            anomaly_type=AnomalyType.UNUSUALLY_HIGH_AMOUNT,
                            severity=AnomalySeverity.MEDIUM,
                            confidence=min(1.0, 0.5 + (z_score - 3.0) * 0.1),
                            amount=t.amount,
                            reason=f"Unusually high amount {t.amount} (z-score: {z_score:.2f})",
                            evidence=[{"document_id": t.document_id, "transaction_id": t.transaction_id, "amount": t.amount, "z_score": z_score}],
                            related_transaction_ids=[t.transaction_id]
                        )
                    )
        return anomalies


class MissingPORule:
    def check(self, transactions, reconciliation_results):
        from app.schemas.anomalies import Anomaly, AnomalyType, AnomalySeverity
        from app.anomaly.rules import _generate_id
        anomalies = []
        for t in transactions:
            if t.source == "invoice" and not t.po_number:
                anomalies.append(
                    Anomaly(
                        anomaly_id=_generate_id(),
                        anomaly_type=AnomalyType.MISSING_PO,
                        severity=AnomalySeverity.LOW,
                        confidence=0.8,
                        amount=t.amount,
                        reason=f"Invoice {t.transaction_id} is missing a PO number",
                        evidence=[{"document_id": t.document_id, "transaction_id": t.transaction_id}],
                        related_transaction_ids=[t.transaction_id]
                    )
                )
        return anomalies

class InvalidCurrencyRule:
    def check(self, transactions, reconciliation_results):
        from app.schemas.anomalies import Anomaly, AnomalyType, AnomalySeverity
        from app.anomaly.rules import _generate_id
        anomalies = []
        for t in transactions:
            if t.currency and t.currency.upper() not in ("USD", "INR", "EUR", "GBP"):
                anomalies.append(
                    Anomaly(
                        anomaly_id=_generate_id(),
                        anomaly_type=AnomalyType.INVALID_CURRENCY,
                        severity=AnomalySeverity.MEDIUM,
                        confidence=0.9,
                        amount=t.amount,
                        reason=f"Transaction {t.transaction_id} has invalid/unsupported currency: {t.currency}",
                        evidence=[{"document_id": t.document_id, "transaction_id": t.transaction_id, "currency": t.currency}],
                        related_transaction_ids=[t.transaction_id]
                    )
                )
        return anomalies
