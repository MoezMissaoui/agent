from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_LOG_LEVELS = frozenset(
    {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL", "NOTSET"}
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Active LLM for /internal/v1/chat: gemini | openai
    llm_provider: Literal["gemini", "openai"] = "gemini"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    # Si non vide, exige l'en-tête X-API-Key sur les routes /internal/v1 (voir app.core.auth).
    internal_api_key: str = ""
    chroma_persist_path: str = "./chroma_data"
    global_collection_name: str = "global_rag_collection"
    # JSON store for agent name + description (per user_id / agent_id), see /internal/v1/agents/profile
    agent_profiles_path: str = "./agent_profiles"
    # Taille max du fichier .txt « description » (POST/PUT multipart)
    agent_profile_description_max_bytes: int = Field(default=512_000, ge=1_000, le=10_000_000)
    # Max chunks from semantic search (top-K). Not "all rows in Chroma"; see README.
    rag_n_results: int = Field(default=15, ge=1, le=50_000)
    # Plafond caractères pour le texte des chunks envoyés au LLM (hors system / historique).
    # ~280k caractères ≈ marge sous une fenêtre 128k tokens ; augmenter si modèle plus grand.
    rag_max_context_chars: int = Field(default=280_000, ge=2_000, le=5_000_000)
    # If set, use SentenceTransformerEmbeddingFunction(model_name=...); else Chroma default.
    embedding_model: str | None = None
    log_dir: str = "./logs"
    # Fichiers nommés YYYY-MM-DD.log ; on garde ce nombre de jours (incluant aujourd'hui).
    log_retention_days: int = Field(default=5, ge=1, le=3650)
    # DEBUG = tous les niveaux (DEBUG→CRITICAL). INFO = sans DEBUG seulement.
    log_level: str = "DEBUG"

    @field_validator("log_level", mode="before")
    @classmethod
    def normalize_log_level(cls, v: object) -> str:
        s = str(v).strip().upper() if v is not None else "DEBUG"
        return s if s in _LOG_LEVELS else "DEBUG"


settings = Settings()
