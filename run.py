import uvicorn

from app.core.config import settings


def _uvicorn_log_level() -> str:
    """Aligne Uvicorn sur LOG_LEVEL (debug → trace n'est pas utilisé)."""
    u = settings.log_level.lower()
    if u in ("critical", "error", "warning", "info", "debug", "trace"):
        return u
    if u == "notset":
        return "debug"
    return "debug"


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True,
        log_level=_uvicorn_log_level(),
    )
