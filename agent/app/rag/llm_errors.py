import httpx


def format_upstream_llm_error(
    status_code: int, response: httpx.Response, provider: str
) -> str:
    body = ""
    try:
        data = response.json()
        if isinstance(data, dict):
            err = data.get("error")
            if isinstance(err, dict):
                body = str(err.get("message") or err.get("status") or err)
            elif isinstance(err, str):
                body = err
    except Exception:
        body = (response.text or "")[:800]
    body = (body or f"HTTP {status_code}").strip()
    return f"{provider} ({status_code}): {body[:1500]}"
