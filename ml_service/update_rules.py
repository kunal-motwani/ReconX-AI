import sys

code = '''
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
'''

with open('app/anomaly/rules.py', 'a') as f:
    f.write('\n' + code)
