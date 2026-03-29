from pydantic import BaseModel, Field


class ChatHistoryItem(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    user_id: str
    agent_id: str
    session_id: str | None = None
    query: str = Field(
        ...,
        description="Current user question (used for Chroma retrieval). Use the real text, not the placeholder 'string'.",
    )
    history: list[ChatHistoryItem] = Field(default_factory=list)
    source_filename: str | None = Field(
        None,
        description="Optional. Exact upload filename; limits RAG to that file only (see GET /internal/v1/documents).",
    )


class ChatResponse(BaseModel):
    answer: str
    session_id: str | None = None


class IngestAcceptedResponse(BaseModel):
    status: str = "accepted"
    message: str
    job_id: str


class IngestJobStatusResponse(BaseModel):
    job_id: str
    status: str  # pending | completed | failed
    user_id: str
    agent_id: str
    filename: str
    chunks_indexed: int | None = None
    error: str | None = None


class TenantDocumentItem(BaseModel):
    filename: str
    chunk_count: int


class DocumentListResponse(BaseModel):
    user_id: str
    agent_id: str
    documents: list[TenantDocumentItem]


class DocumentDeleteResponse(BaseModel):
    user_id: str
    agent_id: str
    filename: str | None = None
    chunks_removed: int


class AgentProfileResponse(BaseModel):
    user_id: str
    agent_id: str
    name: str | None = None
    description: str | None = None
