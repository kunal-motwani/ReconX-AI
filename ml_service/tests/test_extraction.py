from app.extraction.invoice_extractor import InvoiceExtractor
from app.extraction.bank_statement_extractor import BankStatementExtractor

def test_invoice_extraction_basic(sample_invoice_text):
    extractor = InvoiceExtractor()
    result = extractor.extract(sample_invoice_text)
    
    assert "ABC Technologies" in result.get("vendor", "")
    assert "1023" in result.get("invoice_number", "")
    
def test_invoice_extraction_missing_fields():
    extractor = InvoiceExtractor()
    result = extractor.extract("Just some random text with no details")
    
    # Assert missing fields handle gracefully, no crash
    assert result.get("vendor") is None or result.get("vendor") == ""
    assert result.get("amount") is None or result.get("amount") == 0

def test_bank_statement_csv_extraction(sample_bank_csv_path):
    extractor = BankStatementExtractor()
    if sample_bank_csv_path.exists():
        result = extractor.extract_from_csv(str(sample_bank_csv_path))
        assert len(result) > 0

def test_amount_parsing():
    extractor = InvoiceExtractor()
    assert extractor._parse_amount('₹1,00,000') == 100000.0
    assert extractor._parse_amount('$100,000.00') == 100000.0
    assert extractor._parse_amount('(5,000)') == -5000.0
    assert extractor._parse_amount('1234.56') == 1234.56

def test_date_parsing():
    extractor = InvoiceExtractor()
    assert extractor._parse_date('10-Aug-2026') == '2026-08-10'
    assert extractor._parse_date('2026-08-10') == '2026-08-10'
    assert extractor._parse_date('10/08/2026') == '2026-08-10'
