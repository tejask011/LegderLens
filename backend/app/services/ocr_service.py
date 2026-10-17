import shutil
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        self._tesseract_available: Optional[bool] = None

    def is_available(self) -> bool:
        """Check if Tesseract OCR binary is installed and reachable in PATH."""
        if self._tesseract_available is None:
            cmd = shutil.which("tesseract")
            self._tesseract_available = cmd is not None
        return self._tesseract_available

    def extract_text_from_image(self, image_path: str) -> str:
        """
        Extract text from an image using pytesseract if available.
        Gracefully returns fallback explanation if OCR is not installed.
        """
        if not self.is_available():
            logger.info("Tesseract OCR is not installed in system PATH. Skipping OCR.")
            return "[OCR not available: Tesseract binary not detected on host system. Install Tesseract for scanned image extraction.]"

        try:
            from PIL import Image
            import pytesseract

            with Image.open(image_path) as img:
                # Convert to RGB if needed
                if img.mode not in ("L", "RGB"):
                    img = img.convert("RGB")
                text = pytesseract.image_to_string(img)
                return text.strip()
        except Exception as e:
            logger.warning(f"OCR extraction failed for {image_path}: {e}")
            return f"[OCR extraction error: {e}]"

ocr_service = OCRService()
