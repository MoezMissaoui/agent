import uuid

import fitz
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.services.chroma import get_collection


def _extract_pdf(data: bytes) -> str:
    doc = fitz.open(stream=data, filetype="pdf")
    try:
        parts: list[str] = []
        for page in doc:
            parts.append(page.get_text() or "")
        return "\n".join(parts)
    finally:
        doc.close()


def _extract_txt(data: bytes) -> str:
    return data.decode("utf-8", errors="replace")


def ingest_file_bytes(
    *,
    data: bytes,
    filename: str,
    user_id: str,
    agent_id: str,
    is_pdf: bool,
) -> int:
    text = _extract_pdf(data) if is_pdf else _extract_txt(data)
    if not text.strip():
        return 0

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
    )
    chunks = splitter.split_text(text)
    if not chunks:
        return 0

    collection = get_collection()
    ids = [str(uuid.uuid4()) for _ in chunks]
    metadatas = [
        {"user_id": user_id, "agent_id": agent_id, "filename": filename}
        for _ in chunks
    ]
    collection.add(ids=ids, documents=chunks, metadatas=metadatas)
    return len(chunks)
