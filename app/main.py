from pathlib import Path

from fastapi import FastAPI

from app.api.routes import agents, chat, documents
from app.core.config import settings
from app.core.logging_setup import configure_app_package_logging
from app.services.chroma import get_collection

app = FastAPI(title="Data/AI Plane", version="1.0.0")
app.include_router(documents.router)
app.include_router(agents.router)
app.include_router(chat.router)


@app.on_event("startup")
def _startup() -> None:
    configure_app_package_logging()
    Path(settings.chroma_persist_path).mkdir(parents=True, exist_ok=True)
    Path(settings.agent_profiles_path).mkdir(parents=True, exist_ok=True)
    get_collection()
