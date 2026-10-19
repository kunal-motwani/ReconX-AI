from app.matching.matcher import TransactionMatcher
from app.schemas.reconciliation import ReconciliationStatus
from app.agents.reconciliation_agent import ReconciliationAgent

def test_exact_match(normalized_invoice, normalized_bank_txn):
    matcher = TransactionMatcher()
    result = matcher.calculate_match_score(normalized_invoice, normalized_bank_txn)
    
    assert result.confidence >= 0.95
    assert result.status == ReconciliationStatus.MATCHED

def test_date_offset_match(normalized_invoice, normalized_bank_txn):
    # offset date
    normalized_bank_txn.date = '2026-08-12'
    matcher = TransactionMatcher()
    result = matcher.calculate_match_score(normalized_invoice, normalized_bank_txn)
    
    assert result.confidence >= 0.8
    assert result.status == ReconciliationStatus.MATCHED

def test_vendor_variation(normalized_invoice, normalized_bank_txn):
    normalized_bank_txn.vendor = 'ABC TECH'
    matcher = TransactionMatcher()
    result = matcher.calculate_match_score(normalized_invoice, normalized_bank_txn)
    
    assert result.score_breakdown.vendor > 0.8

def test_amount_mismatch(normalized_invoice, normalized_bank_txn):
    normalized_bank_txn.amount = 105000.0
    matcher = TransactionMatcher()
    result = matcher.calculate_match_score(normalized_invoice, normalized_bank_txn)
    
    assert result.status in [ReconciliationStatus.PARTIAL_MATCH, ReconciliationStatus.MISMATCH]
    assert result.score_breakdown.amount < 0.9

def test_unmatched_transaction(normalized_invoice, normalized_bank_txn):
    normalized_bank_txn.vendor = 'COMPLETELY DIFFERENT'
    normalized_bank_txn.amount = 5555.0
    normalized_bank_txn.date = '2025-01-01'
    normalized_bank_txn.reference = 'NOPE'
    
    matcher = TransactionMatcher()
    result = matcher.calculate_match_score(normalized_invoice, normalized_bank_txn)
    
    assert result.status == ReconciliationStatus.UNMATCHED
    assert result.confidence < 0.5

def test_score_breakdown_present(normalized_invoice, normalized_bank_txn):
    matcher = TransactionMatcher()
    result = matcher.calculate_match_score(normalized_invoice, normalized_bank_txn)
    
    assert hasattr(result.score_breakdown, 'amount')
    assert hasattr(result.score_breakdown, 'vendor')
    assert hasattr(result.score_breakdown, 'date')
    assert hasattr(result.score_breakdown, 'reference')
    assert hasattr(result.score_breakdown, 'description')

def test_reconciliation_batch(normalized_invoice, normalized_bank_txn):
    agent = ReconciliationAgent()
    result = agent.reconcile([normalized_invoice], [normalized_bank_txn])
    
    assert result.matched >= 1
    assert result.total_source == 1
    assert result.total_target == 1
