import re
import uuid
from dateutil import parser
from app.schemas.transactions import NormalizedTransaction, NormalizationResult

class TransactionNormalizer:
    @staticmethod
    def normalize_vendor(name: str | None) -> str | None:
        if not name:
            return None
        norm = str(name).upper()
        suffixes = ['PVT LTD', 'PVT. LTD.', 'PRIVATE LIMITED', 'LTD', 'LTD.', 'INC', 'INC.', 'LLC', 'CORP', 'CORPORATION', 'CO.', 'LIMITED']
        suffixes.sort(key=len, reverse=True)
        escaped_suffixes = [re.escape(s) for s in suffixes]
        pattern = r'\b(' + '|'.join(escaped_suffixes) + r')\s*$'
        norm = re.sub(pattern, '', norm).strip()
        norm = re.sub(r'\s+', ' ', norm)
        return norm if norm else None

    @staticmethod
    def normalize_date(date_str: str | None) -> str | None:
        if not date_str:
            return None
        try:
            dt = parser.parse(str(date_str), dayfirst=True)
            return dt.strftime("%Y-%m-%d")
        except Exception:
            return None
            
    @staticmethod
    def normalize_amount(amount: str | float | int | None) -> float | None:
        if amount is None:
            return None
        if isinstance(amount, (int, float)):
            return float(amount)
        amt_str = str(amount).strip()
        
        is_negative = False
        if amt_str.startswith('(') and amt_str.endswith(')'):
            is_negative = True
            amt_str = amt_str[1:-1].strip()
        
        amt_str = re.sub(r'[₹$€£a-zA-Z]', '', amt_str).strip()
        amt_str = amt_str.replace(',', '')
        
        try:
            val = float(amt_str)
            return -val if is_negative else val
        except ValueError:
            return None

    @staticmethod
    def normalize_reference(ref: str | None) -> str | None:
        if not ref:
            return None
        return re.sub(r'[\-\s\.]', '', str(ref).upper())

    @staticmethod
    def detect_currency(text: str | None) -> str:
        if not text:
            return "INR"
        text = str(text).upper()
        if 'USD' in text or '$' in text: return 'USD'
        if 'EUR' in text or '€' in text: return 'EUR'
        if 'GBP' in text or '£' in text: return 'GBP'
        return "INR"

    @classmethod
    def normalize(cls, raw: dict, source: str = '') -> NormalizedTransaction:
        txn_id = raw.get('transaction_id') or uuid.uuid4().hex
        
        orig_vendor = raw.get('vendor')
        orig_date = raw.get('date')
        orig_amount = raw.get('amount')
        orig_reference = raw.get('reference')
        orig_desc = raw.get('description')
        orig_po = raw.get('po_number')
        orig_inv = raw.get('invoice_number')
        
        amount_original_val = float(orig_amount) if isinstance(orig_amount, (int, float)) else None
        
        # Determine currency from the raw dict representation
        raw_str = str(raw)
        
        norm_txn = NormalizedTransaction(
            transaction_id=str(txn_id),
            source=source,
            vendor=cls.normalize_vendor(orig_vendor),
            vendor_original=str(orig_vendor) if orig_vendor is not None else None,
            date=cls.normalize_date(orig_date),
            date_original=str(orig_date) if orig_date is not None else None,
            amount=cls.normalize_amount(orig_amount),
            amount_original=amount_original_val,
            currency=cls.detect_currency(raw_str),
            reference=cls.normalize_reference(orig_reference),
            reference_original=str(orig_reference) if orig_reference is not None else None,
            description=str(orig_desc) if orig_desc is not None else None,
            description_original=str(orig_desc) if orig_desc is not None else None,
            po_number=str(orig_po) if orig_po is not None else None,
            po_number_original=str(orig_po) if orig_po is not None else None,
            invoice_number=str(orig_inv) if orig_inv is not None else None,
            invoice_number_original=str(orig_inv) if orig_inv is not None else None,
            debit=cls.normalize_amount(raw.get('debit')),
            credit=cls.normalize_amount(raw.get('credit')),
            document_id=str(raw.get('document_id', ''))
        )
        return norm_txn

    @classmethod
    def normalize_batch(cls, transactions: list[dict], source: str = '') -> NormalizationResult:
        result = NormalizationResult()
        for raw in transactions:
            try:
                norm = cls.normalize(raw, source=source)
                result.normalized.append(norm)
            except Exception as e:
                result.errors.append(f"Error normalizing transaction: {str(e)}")
        result.total = len(result.normalized)
        return result
