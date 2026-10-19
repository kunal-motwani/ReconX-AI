from app.anomaly.detector import AnomalyDetector
from app.schemas.reconciliation import ReconciliationResult, ReconciliationStatus
from app.schemas.anomalies import AnomalyType

def test_duplicate_payment(normalized_bank_txn):
    detector = AnomalyDetector()
    txn2 = normalized_bank_txn.model_copy()
    txn2.transaction_id = "txn_bank_2"
    anomalies = detector.detect([normalized_bank_txn, txn2], [])
    
    # We expect some anomalies, specifically duplicate payment
    types = [a.anomaly_type for a in anomalies.anomalies]
    assert AnomalyType.DUPLICATE_PAYMENT in types

def test_amount_mismatch_anomaly(normalized_invoice, normalized_bank_txn):
    detector = AnomalyDetector()
    normalized_bank_txn.amount = 105000.0
    rec_res = ReconciliationResult(
        status=ReconciliationStatus.PARTIAL_MATCH,
        confidence=0.8,
        source_transaction_id=normalized_invoice.transaction_id,
        matched_transaction_id=normalized_bank_txn.transaction_id
    )
    
    anomalies = detector.detect([normalized_invoice, normalized_bank_txn], [rec_res])
    types = [a.anomaly_type for a in anomalies.anomalies]
    assert AnomalyType.AMOUNT_MISMATCH in types

def test_missing_invoice(normalized_bank_txn):
    detector = AnomalyDetector()
    rec_res = ReconciliationResult(
        status=ReconciliationStatus.UNMATCHED,
        source_transaction_id=normalized_bank_txn.transaction_id
    )
    anomalies = detector.detect([normalized_bank_txn], [rec_res])
    types = [a.anomaly_type for a in anomalies.anomalies]
    assert AnomalyType.MISSING_INVOICE in types

def test_high_amount_outlier(normalized_bank_txn):
    detector = AnomalyDetector()
    txns = []
    for i in range(5):
        t = normalized_bank_txn.model_copy()
        t.transaction_id = f"txn_{i}"
        t.amount = 1000.0
        txns.append(t)
    t = normalized_bank_txn.model_copy()
    t.transaction_id = "txn_outlier"
    t.amount = 100000.0
    txns.append(t)
    
    anomalies = detector.detect(txns, [])
    types = [a.anomaly_type for a in anomalies.anomalies]
    assert AnomalyType.STATISTICAL_OUTLIER in types or AnomalyType.UNUSUALLY_HIGH_AMOUNT in types

def test_no_anomalies(normalized_invoice, normalized_bank_txn):
    detector = AnomalyDetector()
    rec_res = ReconciliationResult(
        status=ReconciliationStatus.MATCHED,
        source_transaction_id=normalized_invoice.transaction_id,
        matched_transaction_id=normalized_bank_txn.transaction_id
    )
    anomalies = detector.detect([normalized_invoice, normalized_bank_txn], [rec_res])
    assert len(anomalies.anomalies) == 0

def test_missing_po(normalized_invoice):
    from app.anomaly.detector import AnomalyDetector
    from app.schemas.anomalies import AnomalyType
    detector = AnomalyDetector()
    normalized_invoice.po_number = None
    anomalies = detector.detect([normalized_invoice], [])
    types = [a.anomaly_type for a in anomalies.anomalies]
    assert AnomalyType.MISSING_PO in types

def test_invalid_currency(normalized_bank_txn):
    from app.anomaly.detector import AnomalyDetector
    from app.schemas.anomalies import AnomalyType
    detector = AnomalyDetector()
    normalized_bank_txn.currency = 'XYZ'
    anomalies = detector.detect([normalized_bank_txn], [])
    types = [a.anomaly_type for a in anomalies.anomalies]
    assert AnomalyType.INVALID_CURRENCY in types
