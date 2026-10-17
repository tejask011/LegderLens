import hashlib
import csv
import logging
from pathlib import Path
from typing import Tuple, Dict, Any, List
import pymupdf
from app.services.ocr_service import ocr_service

logger = logging.getLogger(__name__)

class DocumentParser:
    @staticmethod
    def compute_sha256(file_path: Path) -> str:
        """Compute SHA256 hash of a file for duplicate checking."""
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                sha256.update(chunk)
        return sha256.hexdigest()

    @staticmethod
    def extract_from_pdf(file_path: Path) -> Tuple[str, str]:
        """
        Extract text from PDF using PyMuPDF.
        If extracted text is negligible, attempts OCR if available.
        Returns (extracted_text, method_used).
        """
        extracted_text_pages = []
        try:
            doc = pymupdf.open(str(file_path))
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()
                if text.strip():
                    extracted_text_pages.append(text.strip())
            doc.close()
        except Exception as e:
            logger.error(f"Error reading PDF {file_path}: {e}")
            return f"[Error reading PDF: {e}]", "pymupdf_error"

        full_text = "\n\n".join(extracted_text_pages).strip()

        # If ordinary text is present, return it
        if len(full_text) > 30:
            return full_text, "pymupdf"

        # If very little or no text, it might be a scanned document
        if ocr_service.is_available():
            try:
                doc = pymupdf.open(str(file_path))
                ocr_pages = []
                for page_num in range(min(len(doc), 3)):  # Limit OCR to first 3 pages for performance
                    page = doc[page_num]
                    pix = page.get_pixmap()
                    temp_img_path = file_path.with_suffix(f".p{page_num}.png")
                    pix.save(str(temp_img_path))
                    page_ocr = ocr_service.extract_text_from_image(str(temp_img_path))
                    if temp_img_path.exists():
                        temp_img_path.unlink()
                    if page_ocr:
                        ocr_pages.append(page_ocr)
                doc.close()
                if ocr_pages:
                    return "\n\n".join(ocr_pages), "tesseract_ocr"
            except Exception as e:
                logger.warning(f"PDF OCR fallback failed: {e}")

        return full_text or "[Empty PDF or scanned document without OCR]", "pymupdf"

    @staticmethod
    def extract_from_image(file_path: Path) -> Tuple[str, str]:
        """Extract text from an image file using OCR."""
        text = ocr_service.extract_text_from_image(str(file_path))
        method = "tesseract_ocr" if ocr_service.is_available() else "image_no_ocr"
        return text, method

    @staticmethod
    def extract_from_csv(file_path: Path) -> Tuple[str, str, List[Dict[str, Any]]]:
        """
        Parse CSV transactions and return representation and row objects.
        Detects common headers (date, merchant, description, amount, total).
        """
        rows_data = []
        text_lines = []
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                # Sniff delimiter
                sample = f.read(2048)
                f.seek(0)
                try:
                    dialect = csv.Sniffer().sniff(sample)
                    delimiter = dialect.delimiter
                except Exception:
                    delimiter = ","

                reader = csv.DictReader(f, delimiter=delimiter)
                for i, row in enumerate(reader):
                    if i >= 500:  # Safety limit for MVP
                        break
                    rows_data.append(row)
                    # Create representative line for text preview
                    line_str = " | ".join(f"{k}: {v}" for k, v in row.items() if v)
                    text_lines.append(line_str)
        except Exception as e:
            logger.error(f"Error parsing CSV {file_path}: {e}")
            return f"[Error parsing CSV: {e}]", "csv_error", []

        summary_text = f"CSV with {len(rows_data)} rows:\n" + "\n".join(text_lines[:20])
        return summary_text, "csv_parser", rows_data

    @classmethod
    def parse_file(cls, file_path: Path) -> Tuple[str, str, str, List[Dict[str, Any]]]:
        """
        Main entry point for document parsing.
        Returns (file_hash, extracted_text, extraction_method, parsed_rows_if_csv).
        """
        file_hash = cls.compute_sha256(file_path)
        ext = file_path.suffix.lower()

        if ext == ".pdf":
            text, method = cls.extract_from_pdf(file_path)
            return file_hash, text, method, []
        elif ext in {".png", ".jpg", ".jpeg"}:
            text, method = cls.extract_from_image(file_path)
            return file_hash, text, method, []
        elif ext == ".csv":
            text, method, rows = cls.extract_from_csv(file_path)
            return file_hash, text, method, rows
        else:
            return file_hash, f"[Unsupported file type {ext}]", "unsupported", []

document_parser = DocumentParser()
