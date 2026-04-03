from app.core.config import settings
from app.rag.chat_logging import log_llm_response
from app.rag.gemini import generate_gemini_rag_reply
from app.rag.openai import generate_openai_rag_reply
from app.schemas import ChatHistoryItem


async def generate_rag_reply(
    *,
    query: str,
    context_chunks: list[str],
    history: list[ChatHistoryItem],
    system_prompt: str,
) -> str:
    if settings.llm_provider == "openai":
        answer = await generate_openai_rag_reply(
            query=query,
            context_chunks=context_chunks,
            history=history,
            system_prompt=system_prompt,
        )
        log_llm_response("openai", answer)
        return answer
    answer = await generate_gemini_rag_reply(
        query=query,
        context_chunks=context_chunks,
        history=history,
        system_prompt=system_prompt,
    )
    log_llm_response("gemini", answer)
    return answer
