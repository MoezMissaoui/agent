import logging

import httpx
from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.rag.chat_logging import log_chroma_retrieval
from app.rag.context import apply_context_char_budget
from app.rag.llm_errors import format_upstream_llm_error
from app.rag.llm_router import generate_rag_reply
from app.rag.prompts import build_full_rag_system_prompt
from app.rag.query import resolve_retrieval_and_question
from app.schemas import ChatRequest, ChatResponse
from app.services.chroma import chat_tenant_error_message, get_collection, tenant_where

router = APIRouter(prefix="/internal/v1", tags=["chat"])
_log = logging.getLogger(__name__)


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    try:
        retrieval_text, question = resolve_retrieval_and_question(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    tenant_err = chat_tenant_error_message(req.user_id, req.agent_id)
    if tenant_err:
        raise HTTPException(status_code=404, detail=tenant_err)

    collection = get_collection()
    src_fn = (req.source_filename or "").strip() or None
    where = tenant_where(req.user_id, req.agent_id, src_fn)

    result = collection.query(
        query_texts=[retrieval_text],
        n_results=settings.rag_n_results,
        where=where,
    )

    docs = result.get("documents") or []
    context_chunks: list[str] = []
    if docs and docs[0]:
        context_chunks = [d for d in docs[0] if d]
    chunks_before = len(context_chunks)
    dist_row = (result.get("distances") or [[]])[0]
    distances: list[float] | None = None
    if dist_row:
        distances = [float(x) for x in dist_row if x is not None]
    meta_row = (result.get("metadatas") or [[]])[0]
    metas_preview = list(meta_row[:12]) if meta_row else None
    id_row = (result.get("ids") or [[]])[0]
    ids_preview = list(id_row[:12]) if id_row else None

    context_chunks = apply_context_char_budget(
        context_chunks, settings.rag_max_context_chars
    )
    log_chroma_retrieval(
        user_id=req.user_id,
        agent_id=req.agent_id,
        session_id=req.session_id,
        source_filename=src_fn,
        n_results_requested=settings.rag_n_results,
        retrieval_query=retrieval_text,
        chunks_before_budget=chunks_before,
        chunks_after_budget=len(context_chunks),
        context_chars=sum(len(c) for c in context_chunks),
        distances=distances,
        metadatas_preview=metas_preview,
        ids_preview=ids_preview,
    )

    eff_name = (req.agent_name or "").strip() or None
    eff_desc = (req.agent_description or "").strip() or None
    system_prompt = build_full_rag_system_prompt(
        agent_name=eff_name,
        agent_description=eff_desc,
    )

    try:
        answer = await generate_rag_reply(
            query=question,
            context_chunks=context_chunks,
            history=req.history,
            system_prompt=system_prompt,
        )
    except httpx.HTTPStatusError as e:
        sc = e.response.status_code
        detail = format_upstream_llm_error(
            sc, e.response, settings.llm_provider
        )
        out = 429 if sc == 429 else 502
        raise HTTPException(status_code=out, detail=detail) from e
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        _log.exception("LLM upstream error")
        raise HTTPException(status_code=502, detail="Upstream error") from e

    return ChatResponse(answer=answer, session_id=req.session_id)
