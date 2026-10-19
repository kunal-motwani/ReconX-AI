import re
import structlog
from datetime import datetime
from typing import Optional
from app.schemas.documents import ExtractedInvoice, LineItem, DocumentType

logger = structlog.get_logger(__name__)

class InvoiceExtractor:
    def _parse_amount(self, text: str) -> Optional[float]:
        if not text:
            return None
        # Remove currency symbols and whitespace
        clean_text = re.sub(r'[^\d.,-]', '', text)
        if not clean_text:
            return None
        
        # Handle Indian notation (1,00,000.00) or standard (100,000.00)
        # If there's a comma and a dot, comma is likely thousands separator
        if ',' in clean_text and '.' in clean_text:
            clean_text = clean_text.replace(',', '')
        elif clean_text.count(',') == 1 and clean_text.count('.') == 0:
            # might be European format 100,00 -> 100.00
            # Let's check the position of comma. If it's 2 digits from end, likely decimal.
            parts = clean_text.split(',')
            if len(parts) == 2 and len(parts[1]) == 2:
                clean_text = clean_text.replace(',', '.')
            else:
                clean_text = clean_text.replace(',', '')
        else:
            clean_text = clean_text.replace(',', '')
            
        try:
            return float(clean_text)
        except ValueError:
            return None

    def _parse_date(self, text: str) -> Optional[str]:
        if not text:
            return None
        
        # Common date formats
        formats = [
            "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", 
            "%d %b %Y", "%d %B %Y", "%Y/%m/%d"
        ]
        
        # Try extracting just the date part
        date_pattern = re.search(r'\b(\d{1,4}[-/ \.]\d{1,2}[-/ \.]\d{1,4})\b', text)
        if date_pattern:
            date_str = date_pattern.group(1).replace('.', '/')
            for fmt in formats:
                try:
                    parsed_date = datetime.strptime(date_str, fmt)
                    return parsed_date.strftime("%Y-%m-%d")
                except ValueError:
                    continue
        return None

    def extract(self, text: str) -> ExtractedInvoice:
        invoice = ExtractedInvoice(document_type=DocumentType.INVOICE)
        fields_found = 0
        total_fields = 8 # vendor, invoice_number, invoice_date, due_date, subtotal, tax, total, po_number
        
        # Vendor Name (very naive heuristic: first line or near top)
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if lines:
            invoice.vendor = lines[0]
            fields_found += 1
            
        # Invoice Number
        inv_match = re.search(r'(?i)(?:invoice\s*(?:#|no|number)?\s*[:.-]?\s*)([A-Z0-9-]+)', text)
        if inv_match:
            invoice.invoice_number = inv_match.group(1).strip()
            fields_found += 1
            
        # PO Number
        po_match = re.search(r'(?i)(?:po\s*(?:#|no|number)?\s*[:.-]?\s*|purchase\s*order\s*[:.-]?\s*)([A-Z0-9-]+)', text)
        if po_match:
            invoice.po_number = po_match.group(1).strip()
            fields_found += 1
            
        # Dates
        date_match = re.search(r'(?i)(?:invoice\s*date\s*[:.-]?\s*)([^\n]+)', text)
        if date_match:
            invoice.invoice_date = self._parse_date(date_match.group(1))
            if invoice.invoice_date: fields_found += 1
            
        due_date_match = re.search(r'(?i)(?:due\s*date\s*[:.-]?\s*)([^\n]+)', text)
        if due_date_match:
            invoice.due_date = self._parse_date(due_date_match.group(1))
            if invoice.due_date: fields_found += 1
            
        # Amounts
        subtotal_match = re.search(r'(?i)(?:subtotal|sub-total)\s*[:.-]?\s*([₹$€£]?\s*[\d,.]+)', text)
        if subtotal_match:
            invoice.subtotal = self._parse_amount(subtotal_match.group(1))
            if invoice.subtotal is not None: fields_found += 1
            
        tax_match = re.search(r'(?i)(?:tax|gst|vat)\s*[:.-]?\s*([₹$€£]?\s*[\d,.]+)', text)
        if tax_match:
            invoice.tax = self._parse_amount(tax_match.group(1))
            if invoice.tax is not None: fields_found += 1
            
        total_match = re.search(r'(?i)(?:total|amount\s*due|balance\s*due)\s*[:.-]?\s*([₹$€£]?\s*[\d,.]+)', text)
        if total_match:
            invoice.total = self._parse_amount(total_match.group(1))
            if invoice.total is not None: fields_found += 1
            
        # Currency
        if '₹' in text or 'INR' in text:
            invoice.currency = 'INR'
        elif '$' in text or 'USD' in text:
            invoice.currency = 'USD'
        elif '€' in text or 'EUR' in text:
            invoice.currency = 'EUR'
            
        # Confidence score
        invoice.confidence = fields_found / total_fields if total_fields > 0 else 0.0
        
        return invoice
