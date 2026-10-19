"""Anomaly detector orchestrating multiple rules."""
from __future__ import annotations

import uuid

from app.anomaly.rules import (
    AmountMismatchRule,
    DuplicateInvoiceNumberRule,
    DuplicatePaymentRule,
    MissingBankTransactionRule,
    MissingInvoiceRule,
    SuspiciousDateRule,
    UnusuallyHighAmountRule,
    MissingPORule,
    InvalidCurrencyRule
)
from app.schemas.anomalies import Anomaly, AnomalyDetectionResult, AnomalySeverity, AnomalyType
from app.schemas.reconciliation import ReconciliationResult
from app.schemas.transactions import NormalizedTransaction


def _generate_id() -> str:
    return uuid.uuid4().hex[:16]


def _iqr_outliers(amounts: list[float]) -> list[int]:
    """Return indices of outlier amounts using IQR method."""
    if not amounts or len(amounts) < 4:
        return []
        
    sorted_amounts = sorted(amounts)
    n = len(sorted_amounts)
    q1 = sorted_amounts[n // 4]
    q3 = sorted_amounts[(n * 3) // 4]
    iqr = q3 - q1
    
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    
    outliers = []
    for i, amount in enumerate(amounts):
        if amount < lower_bound or amount > upper_bound:
            outliers.append(i)
    return outliers


class AnomalyDetector:
    def __init__(self):
        self.rules = [
            DuplicatePaymentRule(),
            AmountMismatchRule(),
            MissingInvoiceRule(),
            MissingBankTransactionRule(),
            DuplicateInvoiceNumberRule(),
            SuspiciousDateRule(),
            UnusuallyHighAmountRule(),
            MissingPORule(),
            InvalidCurrencyRule()
        ]

    def detect(
        self,
        transactions: list[NormalizedTransaction],
        reconciliation_results: list[ReconciliationResult]
    ) -> AnomalyDetectionResult:
        all_anomalies: list[Anomaly] = []
        
        # Run all rules
        for rule in self.rules:
            anomalies = rule.check(transactions, reconciliation_results)
            all_anomalies.extend(anomalies)
            
        # Statistical detection using IQR
        amounts = [t.amount for t in transactions if t.amount is not None]
        valid_txns = [t for t in transactions if t.amount is not None]
        outlier_indices = _iqr_outliers(amounts)
        
        for i in outlier_indices:
            txn = valid_txns[i]
            all_anomalies.append(
                Anomaly(
                    anomaly_id=_generate_id(),
                    anomaly_type=AnomalyType.STATISTICAL_OUTLIER,
                    severity=AnomalySeverity.LOW,
                    confidence=0.7,
                    amount=txn.amount,
                    reason=f"Statistical outlier amount {txn.amount} (IQR method)",
                    evidence=[{"document_id": txn.document_id, "transaction_id": txn.transaction_id, "amount": txn.amount}],
                    related_transaction_ids=[txn.transaction_id]
                )
            )

        # Deduplicate anomalies
        deduped_anomalies = self._deduplicate(all_anomalies)
        
        high_sev = sum(1 for a in deduped_anomalies if a.severity in (AnomalySeverity.HIGH, AnomalySeverity.CRITICAL))
        req_review = sum(1 for a in deduped_anomalies if a.requires_human_review)
        
        return AnomalyDetectionResult(
            total_transactions=len(transactions),
            anomalies_found=len(deduped_anomalies),
            anomalies=deduped_anomalies,
            high_severity_count=high_sev,
            requires_human_review=req_review
        )

    def _deduplicate(self, anomalies: list[Anomaly]) -> list[Anomaly]:
        # Key by (transaction_ids tuple, anomaly_type)
        best_anomalies = {}
        for a in anomalies:
            key = (tuple(sorted(a.related_transaction_ids)), a.anomaly_type)
            if key not in best_anomalies:
                best_anomalies[key] = a
            else:
                if a.confidence > best_anomalies[key].confidence:
                    best_anomalies[key] = a
                    
        return list(best_anomalies.values())
