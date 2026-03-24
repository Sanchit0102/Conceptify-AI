"""
OCR and PDF text extraction utility for "Conceptify Assist".
Uses pdfminer.six for PDFs and pytesseract for images.
"""
import logging
import pytesseract
from PIL import Image
from io import BytesIO
from pdfminer.high_level import extract_text as extract_pdf_text
import os
import sys

logger = logging.getLogger(__name__)

# Try to find Tesseract-OCR on common Windows paths
if sys.platform == "win32":
    tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    if os.path.exists(tesseract_path):
        pytesseract.pytesseract.tesseract_cmd = tesseract_path

def extract_text_from_file(file_bytes: bytes, file_type: str) -> str:
    """Extract text from either a PDF or an Image."""
    if file_type.lower() == 'pdf':
        try:
            return extract_pdf_text(BytesIO(file_bytes)).strip()
        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
            return ""
    else:
        # Assume it's an image (PNG, JPG, etc.)
        try:
            image = Image.open(BytesIO(file_bytes))
            text = pytesseract.image_to_string(image)
            return text.strip()
        except Exception as e:
            logger.error(f"OCR extraction error: {e}")
            # If tesseract is not installed, this will fail. 
            # In a real environment, we'd need tesseract-ocr system package.
            return f"[Error: OCR extraction failed. Ensure Tesseract-OCR is installed. Details: {str(e)}]"
