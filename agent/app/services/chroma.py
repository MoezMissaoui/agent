from typing import Any

import chromadb
from chromadb.utils import embedding_functions

from app.core.config import settings

_client: Any = None
_collection: Any = None


def _embedding_function():
    if settings.embedding_model:
        return embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=settings.embedding_model
        )
    return embedding_functions.DefaultEmbeddingFunction()


def get_collection():
    global _client, _collection
    if _collection is not None:
        return _collection
    _client = chromadb.PersistentClient(path=settings.chroma_persist_path)
    _collection = _client.get_or_create_collection(
        name=settings.global_collection_name,
        embedding_function=_embedding_function(),
    )
    return _collection


def tenant_where(
    user_id: str, agent_id: str, source_filename: str | None = None
) -> dict:
    clauses: list[dict] = [
        {"user_id": {"$eq": user_id}},
        {"agent_id": {"$eq": agent_id}},
    ]
    if source_filename:
        clauses.append({"filename": {"$eq": source_filename}})
    return {"$and": clauses}


def chat_tenant_error_message(user_id: str, agent_id: str) -> str | None:
    """
    Vérifie dans Chroma s'il existe au moins un chunk pour l'utilisateur, puis pour le couple (user, agent).
    Retourne un message d'erreur en français, ou None si le tenant est connu côté index.
    """
    collection = get_collection()
    r_user = collection.get(
        where={"user_id": {"$eq": user_id}},
        limit=1,
        include=[],
    )
    if not (r_user.get("ids") or []):
        return "Utilisateur inexistant."
    r_tenant = collection.get(
        where=tenant_where(user_id, agent_id),
        limit=1,
        include=[],
    )
    if not (r_tenant.get("ids") or []):
        return "Agent inexistant pour cet utilisateur."
    return None
