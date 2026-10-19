import structlog
from app.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()

def extract_text_from_image(file_path: str) -> str:
    """Extract text from an image file using OCR."""
    if not settings.OCR_ENABLED:
        logger.warning("OCR is disabled in settings", file_path=file_path)
        return ""

    try:
        from PIL import Image, ImageEnhance, ImageOps
        import pytesseract
        
        # Open image
        img = Image.open(file_path)
        
        # Preprocessing: convert to grayscale
        img = ImageOps.grayscale(img)
        
        # Preprocessing: increase contrast
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(2.0)
        
        text = pytesseract.image_to_string(img)
        return text
    except ImportError as e:
        logger.warning("OCR libraries not available", error=str(e))
        return ""
    except Exception as e:
        logger.warning("Failed to extract text from image", file_path=file_path, error=str(e))
        return ""
