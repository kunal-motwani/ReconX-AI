import pytest
from pathlib import Path
from app.schemas.transactions import NormalizedTransaction

@pytest.fixture
def sample_invoice_text():
    return """
ABC Technologies Pvt Ltd
Invoice Number: INV-1023
Date: 10-Aug-2026
Due Date: 10-Sep-2026
PO Number: PO-501

Bill To:
XYZ Corporation
123 Business Park, Mumbai

Description                  Qty    Unit Price    Amount
Cloud Infrastructure          1     ₹80,000       ₹80,000
Technical Support              1     ₹20,000       ₹20,000

Subtotal: ₹1,00,000
GST (18%): ₹18,000
Total: ₹1,18,000

Payment Terms: Net 30
Bank: HDFC Bank, Account: 1234567890
"""

@pytest.fixture
def sample_bank_csv_path():
    return Path("c:/Users/Kamesh yadav/Documents/Vsc/recon/ai-service/data/demo/sample_bank_statement.csv")

@pytest.fixture
def sample_invoice_transaction():
    return {
        "source": "invoice",
        "vendor": "ABC Technologies Pvt Ltd",
        "amount": 118000,
        "date": "2026-08-10",
        "reference": "INV-1023"
    }

@pytest.fixture
def sample_bank_transactions():
    return [
        {
            "source": "bank_statement",
            "vendor": "ABC TECHNOLOGIES",
            "amount": 118000,
            "date": "2026-08-11",
            "reference": "INV1023"
        }
    ]

@pytest.fixture
def normalized_invoice():
    return NormalizedTransaction(
        transaction_id="txn_inv_1",
        source="invoice",
        vendor="ABC TECHNOLOGIES",
        vendor_original="ABC Technologies Pvt Ltd",
        amount=118000.0,
        amount_original=118000.0,
        date="2026-08-10",
        date_original="10-Aug-2026",
        reference="INV1023",
        reference_original="INV-1023"
    )

@pytest.fixture
def normalized_bank_txn():
    return NormalizedTransaction(
        transaction_id="txn_bank_1",
        source="bank_statement",
        vendor="ABC TECHNOLOGIES",
        vendor_original="ABC TECHNOLOGIES",
        amount=118000.0,
        amount_original=118000.0,
        date="2026-08-11",
        date_original="2026-08-11",
        reference="INV1023",
        reference_original="INV1023",
        invoice_number="INV1023"
    )

@pytest.fixture
def sample_transactions_for_anomaly(normalized_invoice, normalized_bank_txn):
    return [normalized_invoice, normalized_bank_txn]
