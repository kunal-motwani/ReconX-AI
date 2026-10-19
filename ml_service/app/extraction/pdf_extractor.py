import fitz  # PyMuPDF
import structlog
from typing import List
from app.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()

def extract_text_from_pdf(file_path: str) -> str:
    """Extract all text from a PDF file."""
    text = ""
    try:
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
        
        if not text.strip() and settings.OCR_ENABLED:
            logger.info("PDF has no text layer, falling back to OCR", file_path=file_path)
            # Try OCR fallback if no text found and OCR is enabled
            try:
                import pytesseract
                from PIL import Image
                import io
                
                with fitz.open(file_path) as doc:
                    for page in doc:
                        pix = page.get_pixmap()
                        img = Image.open(io.BytesIO(pix.tobytes("png")))
                        text += pytesseract.image_to_string(img)
            except Exception as ocr_e:
                logger.warning("OCR fallback failed", file_path=file_path, error=str(ocr_e))
                
    except Exception as e:
        logger.warning("Failed to extract text from PDF", file_path=file_path, error=str(e))
        return ""
        
    return text

def extract_tables_from_pdf(file_path: str) -> List[List[List[str]]]:
    """Extract tables from a PDF file page by page."""
    tables = []
    try:
        with fitz.open(file_path) as doc:
            for page in doc:
                page_tables = page.find_tables()
                if page_tables:
                    for table in page_tables:
                        tables.append(table.extract())
    except Exception as e:
        logger.warning("Failed to extract tables from PDF", file_path=file_path, error=str(e))
        
    return tables
