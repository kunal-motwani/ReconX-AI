import os
import structlog
from app.schemas.documents import (
    ExtractionRequest, ExtractionResult, DocumentType, DocumentClassification
)
from app.extraction.pdf_extractor import extract_text_from_pdf
from app.extraction.image_extractor import extract_text_from_image
from app.extraction.invoice_extractor import InvoiceExtractor
from app.extraction.bank_statement_extractor import BankStatementExtractor

logger = structlog.get_logger(__name__)

class DocumentAgent:
    def __init__(self):
        self.invoice_extractor = InvoiceExtractor()
        self.bank_extractor = BankStatementExtractor()

    def process(self, request: ExtractionRequest) -> ExtractionResult:
        result = ExtractionResult(document_id=request.document_id)
        
        # 1. File type detection & Text extraction
        text = request.file_content or ""
        file_path = request.file_path
        
        if not text and file_path:
            ext = os.path.splitext(file_path)[1].lower()
            try:
                if ext == '.pdf':
                    text = extract_text_from_pdf(file_path)
                elif ext in ['.jpg', '.jpeg', '.png', '.tiff']:
                    text = extract_text_from_image(file_path)
                elif ext == '.csv':
                    # CSV might be handled directly by bank statement extractor
                    pass
                else:
                    result.errors.append(f"Unsupported file extension: {ext}")
            except Exception as e:
                logger.error("Text extraction failed", error=str(e))
                result.errors.append(f"Text extraction failed: {str(e)}")
                
        result.raw_text = text
        
        if not text and not (file_path and file_path.endswith('.csv')):
            result.errors.append("No text extracted from document")
            return result

        # 2. Document Classification
        classification = self._classify_document(text, file_path)
        result.document_type = classification.document_type
        result.classification_confidence = classification.confidence

        # 3. Field Extraction
        try:
            if result.document_type == DocumentType.INVOICE:
                invoice_data = self.invoice_extractor.extract(text)
                result.extracted_data = invoice_data.model_dump()
                result.confidence = invoice_data.confidence
                
            elif result.document_type == DocumentType.BANK_STATEMENT:
                if file_path and file_path.endswith('.csv'):
                    tx_data = self.bank_extractor.extract_from_csv(file_path)
                else:
                    tx_data = self.bank_extractor.extract(text)
                result.extracted_data = {"transactions": [tx.model_dump() for tx in tx_data]}
                result.confidence = 0.9 if tx_data else 0.0
                
            else:
                result.warnings.append(f"No specific extractor for document type: {result.document_type}")
                
        except Exception as e:
            logger.error("Field extraction failed", error=str(e))
            result.errors.append(f"Field extraction failed: {str(e)}")

        # 4. Validation
        self._validate_result(result)
        
        return result

    def _classify_document(self, text: str, file_path: str | None = None) -> DocumentClassification:
        text_lower = text.lower()
        
        invoice_score = sum(1 for kw in ['invoice', 'inv', 'bill to', 'due date', 'subtotal'] if kw in text_lower)
        bank_score = sum(1 for kw in ['bank', 'statement', 'balance', 'debit', 'credit', 'opening balance'] if kw in text_lower)
        po_score = sum(1 for kw in ['purchase order', 'po', 'delivery date'] if kw in text_lower)
        
        if file_path and file_path.endswith('.csv'):
            # CSV is very likely a bank statement in this context
            bank_score += 5
            
        scores = {
            DocumentType.INVOICE: invoice_score,
            DocumentType.BANK_STATEMENT: bank_score,
            DocumentType.PURCHASE_ORDER: po_score
        }
        
        best_type = max(scores.items(), key=lambda x: x[1])
        
        if best_type[1] > 0:
            confidence = min(best_type[1] / 5.0, 1.0)
            return DocumentClassification(
                document_type=best_type[0],
                confidence=confidence,
                reason=f"Keyword score: {best_type[1]}"
            )
            
        return DocumentClassification(
            document_type=DocumentType.UNKNOWN,
            confidence=0.0,
            reason="No matching keywords found"
        )

    def _validate_result(self, result: ExtractionResult):
        if result.document_type == DocumentType.INVOICE:
            total = result.extracted_data.get('total')
            if total is not None and total < 0:
                result.warnings.append("Invoice total is negative")
                
            subtotal = result.extracted_data.get('subtotal')
            tax = result.extracted_data.get('tax')
            
            if total is not None and subtotal is not None and tax is not None:
                if abs(total - (subtotal + tax)) > 0.01:
                    result.warnings.append("Total does not match subtotal + tax")
