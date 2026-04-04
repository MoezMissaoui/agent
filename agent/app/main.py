from pathlib import Path

from fastapi import Depends, FastAPI

from app.api.routes import chat, documents
from app.core.auth import require_internal_api_key
from app.core.config import settings
from app.core.logging_setup import configure_app_package_logging
from app.services.chroma import get_collection

app = FastAPI(
    title="Data/AI Plane",
    version="1.0.0",
    swagger_ui_parameters={"persistAuthorization": True},
)
_internal_deps = [Depends(require_internal_api_key)]
app.include_router(documents.router, dependencies=_internal_deps)
app.include_router(chat.router, dependencies=_internal_deps)


@app.on_event("startup")
def _startup() -> None:
    configure_app_package_logging()
    Path(settings.chroma_persist_path).mkdir(parents=True, exist_ok=True)
    get_collection()
