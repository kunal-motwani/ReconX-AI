"""Anomaly agent."""
from __future__ import annotations

import structlog

from app.anomaly.detector import AnomalyDetector
from app.config import get_settings
from app.schemas.anomalies import AnomalyDetectionResult
from app.schemas.reconciliation import ReconciliationResult
from app.schemas.transactions import NormalizedTransaction

logger = structlog.get_logger(__name__)


class AnomalyAgent:
    def __init__(self):
        self.detector = AnomalyDetector()
        self.settings = get_settings()

    def analyze(
        self,
        transactions: list[NormalizedTransaction],
        reconciliation_results: list[ReconciliationResult]
    ) -> AnomalyDetectionResult:
        logger.info("Starting anomaly detection", transaction_count=len(transactions))
        
        result = self.detector.detect(transactions, reconciliation_results)
        
        # Apply review threshold
        for anomaly in result.anomalies:
            if anomaly.confidence < self.settings.ANOMALY_REVIEW_THRESHOLD:
                anomaly.requires_human_review = True
            elif anomaly.severity in ("high", "critical"):
                anomaly.requires_human_review = True
            else:
                anomaly.requires_human_review = False
                
        # Recalculate requires_human_review count
        result.requires_human_review = sum(1 for a in result.anomalies if a.requires_human_review)
        
        logger.info(
            "Anomaly detection completed",
            anomalies_found=result.anomalies_found,
            high_severity=result.high_severity_count,
            requires_review=result.requires_human_review
        )
        return result
