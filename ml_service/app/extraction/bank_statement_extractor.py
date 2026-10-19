import csv
import structlog
from typing import List, Optional
from datetime import datetime
from app.schemas.documents import ExtractedBankTransaction, DocumentType

logger = structlog.get_logger(__name__)

class BankStatementExtractor:
    def _parse_amount(self, text: str) -> Optional[float]:
        if not text:
            return None
        clean_text = text.replace(',', '').strip()
        try:
            return float(clean_text)
        except ValueError:
            return None

    def _parse_date(self, text: str) -> Optional[str]:
        if not text:
            return None
        formats = ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"]
        for fmt in formats:
            try:
                parsed_date = datetime.strptime(text.strip(), fmt)
                return parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                continue
        return None

    def extract(self, text: str) -> List[ExtractedBankTransaction]:
        """Parse tabular bank statement data from text."""
        transactions = []
        lines = text.split('\n')
        
        for line in lines:
            parts = [p.strip() for p in line.split('|')]
            if len(parts) >= 6:
                # date | description | reference | debit | credit | balance
                tx = ExtractedBankTransaction(document_type=DocumentType.BANK_STATEMENT)
                tx.transaction_date = self._parse_date(parts[0])
                tx.description = parts[1] if parts[1] else None
                tx.reference = parts[2] if parts[2] else None
                tx.debit = self._parse_amount(parts[3])
                tx.credit = self._parse_amount(parts[4])
                tx.balance = self._parse_amount(parts[5])
                
                if tx.debit is not None:
                    tx.amount = -tx.debit
                elif tx.credit is not None:
                    tx.amount = tx.credit
                    
                if tx.transaction_date and (tx.debit is not None or tx.credit is not None):
                    transactions.append(tx)
                    
        return transactions

    def extract_from_csv(self, file_path: str) -> List[ExtractedBankTransaction]:
        transactions = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                headers = next(reader, None)
                for row in reader:
                    if len(row) >= 6:
                        tx = ExtractedBankTransaction(document_type=DocumentType.BANK_STATEMENT)
                        tx.transaction_date = self._parse_date(row[0])
                        tx.description = row[1] if row[1] else None
                        tx.reference = row[2] if row[2] else None
                        tx.debit = self._parse_amount(row[3])
                        tx.credit = self._parse_amount(row[4])
                        tx.balance = self._parse_amount(row[5])
                        
                        if tx.debit is not None:
                            tx.amount = -tx.debit
                        elif tx.credit is not None:
                            tx.amount = tx.credit
                            
                        if tx.transaction_date and (tx.debit is not None or tx.credit is not None):
                            transactions.append(tx)
        except Exception as e:
            logger.error("Failed to extract from CSV", error=str(e), file_path=file_path)
            
        return transactions

    def extract_from_excel(self, file_path: str) -> List[ExtractedBankTransaction]:
        # Placeholder for excel extraction if needed
        logger.warning("Excel extraction not implemented yet", file_path=file_path)
        return []
