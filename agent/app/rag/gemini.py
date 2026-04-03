import httpx

from app.core.config import settings
from app.rag.chat_logging import log_llm_request
from app.rag.prompts import build_rag_user_content
from app.schemas import ChatHistoryItem


def _history_to_gemini_contents(history: list[ChatHistoryItem]) -> list[dict]:
    out: list[dict] = []
    for item in history:
        role = "user" if item.role == "user" else "model"
        out.append({"role": role, "parts": [{"text": item.content}]})
    return out


async def generate_gemini_rag_reply(
    *,
    query: str,
    context_chunks: list[str],
    history: list[ChatHistoryItem],
    system_prompt: str,
) -> str:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    context_text = "\n\n---\n\n".join(context_chunks) if context_chunks else ""
    user_block = build_rag_user_content(context_text, query)

    contents = _history_to_gemini_contents(history)
    contents.append({"role": "user", "parts": [{"text": user_block}]})

    payload = {
        "systemInstruction": {
            "role": "system",
            "parts": [{"text": system_prompt}],
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.0,
        },
    }

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
    )

    log_llm_request(
        "gemini",
        {
            "model": settings.gemini_model,
            "endpoint": "generateContent",
            "payload": payload,
        },
    )

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

    candidates = data.get("candidates") or []
    if not candidates:
        return ""

    parts = (candidates[0].get("content") or {}).get("parts") or []
    texts = [p.get("text", "") for p in parts if isinstance(p, dict)]
    return "".join(texts).strip()
