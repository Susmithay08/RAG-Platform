import io
import re
from typing import Generator
import logging

logger = logging.getLogger(__name__)

CHUNK_SIZE = 500      # words per chunk
CHUNK_OVERLAP = 50   # words overlap between chunks


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks by word count."""
    # Clean up whitespace
    text = re.sub(r"\s+", " ", text).strip()
    words = text.split()
    if not words:
        return []

    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        if len(chunk.strip()) > 50:  # skip tiny chunks
            chunks.append(chunk)
        start += chunk_size - overlap

    return chunks


def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        raise ValueError(f"Could not extract text from PDF: {e}")


def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        import docx
        doc = docx.Document(io.BytesIO(file_bytes))
        return "\n".join(para.text for para in doc.paragraphs if para.text.strip())
    except Exception as e:
        logger.error(f"DOCX extraction error: {e}")
        raise ValueError(f"Could not extract text from DOCX: {e}")


def extract_text(file_bytes: bytes, file_type: str) -> str:
    ft = file_type.lower().strip(".")
    if ft == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ft in ("txt", "md"):
        return file_bytes.decode("utf-8", errors="replace")
    elif ft == "docx":
        return extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def process_document(file_bytes: bytes, file_type: str) -> list[str]:
    text = extract_text(file_bytes, file_type)
    chunks = chunk_text(text)
    logger.info(f"Processed document: {len(chunks)} chunks from {len(text)} chars")
    return chunks
