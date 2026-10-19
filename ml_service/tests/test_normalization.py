from app.normalization.transaction_normalizer import TransactionNormalizer
from app.schemas.transactions import NormalizedTransaction

def test_vendor_normalization():
    normalizer = TransactionNormalizer()
    assert normalizer.normalize_vendor('ABC Technologies Pvt Ltd') == 'ABC TECHNOLOGIES'
    assert normalizer.normalize_vendor('abc tech pvt. ltd.') == 'ABC TECH'

def test_date_normalization():
    normalizer = TransactionNormalizer()
    assert normalizer.normalize_date('10-Aug-2026') == '2026-08-10'
    assert normalizer.normalize_date('10/08/2026') == '2026-08-10'

def test_amount_normalization():
    normalizer = TransactionNormalizer()
    assert normalizer.normalize_amount('₹1,00,000') == 100000.0
    assert normalizer.normalize_amount('$100,000.00') == 100000.0

def test_reference_normalization():
    normalizer = TransactionNormalizer()
    assert normalizer.normalize_reference('INV-1023') == 'INV1023'
    assert normalizer.normalize_reference('PO-501') == 'PO501'

def test_preserves_originals(sample_invoice_transaction):
    normalizer = TransactionNormalizer()
    result = normalizer.normalize(sample_invoice_transaction)
    
    assert result.vendor_original == 'ABC Technologies Pvt Ltd'
    assert result.amount_original == 118000
    assert result.date_original == '2026-08-10'

def test_batch_normalization(sample_invoice_transaction, sample_bank_transactions):
    normalizer = TransactionNormalizer()
    batch = [sample_invoice_transaction] + sample_bank_transactions
    results = normalizer.normalize_batch(batch)
    
    assert len(results.normalized) == 2
    assert results.total == 2
    assert isinstance(results.normalized[0], NormalizedTransaction)
