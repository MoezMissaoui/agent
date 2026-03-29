from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader

from app.core.config import settings

API_KEY_HEADER_NAME = "X-API-Key"

_api_key_header = APIKeyHeader(name=API_KEY_HEADER_NAME, auto_error=False)


async def require_internal_api_key(
    x_api_key: str | None = Security(_api_key_header),
) -> str | None:
    """
    Si INTERNAL_API_KEY est défini dans la config, exige le même valeur dans l'en-tête X-API-Key.
    Si vide, aucune vérification (dev / réseau fermé uniquement).
    Le Security(...) enregistre le schéma dans OpenAPI / Swagger (Authorize).
    """
    expected = (settings.internal_api_key or "").strip()
    if not expected:
        return None
    if not x_api_key or x_api_key.strip() != expected:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing X-API-Key",
        )
    return x_api_key
