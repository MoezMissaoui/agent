import httpx

from app.core.config import settings
from app.rag.chat_logging import log_llm_request
from app.rag.prompts import build_rag_user_content
from app.schemas import ChatHistoryItem


async def generate_openai_rag_reply(
    *,
    query: str,
    context_chunks: list[str],
    history: list[ChatHistoryItem],
    system_prompt: str,
) -> str:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    context_text = "\n\n---\n\n".join(context_chunks) if context_chunks else ""
    user_block = build_rag_user_content(context_text, query)

    messages: list[dict[str, str]] = [
        {"role": "system", "content": system_prompt},
    ]
    for item in history:
        messages.append({"role": item.role, "content": item.content})
    messages.append({"role": "user", "content": user_block})

    payload = {
        "model": settings.openai_model,
        "temperature": 0.0,
        "messages": messages,
    }

    log_llm_request("openai", payload)

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    choices = data.get("choices") or []
    if not choices:
        return ""
    msg = choices[0].get("message") or {}
    content = msg.get("content")
    return (content or "").strip()
