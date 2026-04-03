import json
import logging
from typing import Any

logger = logging.getLogger("app.chat")

# Évite des lignes de log trop longues pour certains handlers.
_MAX_CHUNK = 16_000


def _log_long(label: str, text: str) -> None:
    if len(text) <= _MAX_CHUNK:
        logger.info("%s %s", label, text)
        return
    n = (len(text) + _MAX_CHUNK - 1) // _MAX_CHUNK
    for i in range(0, len(text), _MAX_CHUNK):
        part = i // _MAX_CHUNK + 1
        logger.info("%s [part %d/%d] %s", label, part, n, text[i : i + _MAX_CHUNK])


def log_chroma_retrieval(
    *,
    user_id: str,
    agent_id: str,
    session_id: str | None,
    source_filename: str | None,
    n_results_requested: int,
    retrieval_query: str,
    chunks_before_budget: int,
    chunks_after_budget: int,
    context_chars: int,
    distances: list[float] | None,
    metadatas_preview: list[dict[str, Any]] | None,
    ids_preview: list[str] | None,
) -> None:
    dist_str = (
        [round(d, 6) for d in distances[:10]]
        if distances
        else None
    )
    logger.info(
        "chroma_retrieval user_id=%r agent_id=%r session_id=%r source_filename=%r "
        "n_results_requested=%d chunks_before_budget=%d chunks_after_budget=%d "
        "context_total_chars=%d distances_preview=%s metadatas_preview=%s ids_preview=%s",
        user_id,
        agent_id,
        session_id,
        source_filename,
        n_results_requested,
        chunks_before_budget,
        chunks_after_budget,
        context_chars,
        dist_str,
        metadatas_preview,
        ids_preview,
    )
    _log_long("chroma_retrieval_query=", retrieval_query)


def log_llm_request(provider: str, payload: Any) -> None:
    try:
        text = json.dumps(payload, ensure_ascii=False, default=str)
    except TypeError:
        text = str(payload)
    _log_long(f"llm_request[{provider}]=", text)


def log_llm_response(provider: str, answer: str) -> None:
    _log_long(f"llm_response[{provider}]=", answer if answer else "")
