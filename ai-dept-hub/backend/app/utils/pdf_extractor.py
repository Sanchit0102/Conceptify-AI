"""
PDF text extraction utility using pdfminer.six.
"""
from io import BytesIO
from pdfminer.high_level import extract_text


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF file given its bytes."""
    try:
        text = extract_text(BytesIO(file_bytes))
        return text.strip() if text else ""
    except Exception as e:
        return f"[PDF extraction error: {str(e)}]"


def extract_text_from_path(file_path: str) -> str:
    """Extract text from a PDF file given its file path."""
    try:
        text = extract_text(file_path)
        return text.strip() if text else ""
    except Exception as e:
        return f"[PDF extraction error: {str(e)}]"
