import asyncio
import logging
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, Query, UploadFile, status

from app.schemas import (
    DocumentDeleteResponse,
    DocumentListResponse,
    IngestAcceptedResponse,
    IngestJobStatusResponse,
    TenantDocumentItem,
)
from app.services.documents import (
    delete_all_tenant_documents,
    delete_document_by_filename,
    list_documents_for_tenant,
)
from app.services.ingest_jobs import (
    create_job,
    get_job,
    mark_completed,
    mark_failed,
    update_progress,
)
from app.services.ingestion import ingest_file_bytes

ALLOWED_EXTENSIONS = {".pdf", ".txt"}

router = APIRouter(prefix="/internal/v1/documents", tags=["documents"])
_log = logging.getLogger(__name__)


async def _ingest_task(
    job_id: str,
    data: bytes,
    filename: str,
    user_id: str,
    agent_id: str,
    is_pdf: bool,
) -> None:
    try:
        n = await asyncio.to_thread(
            ingest_file_bytes,
            data=data,
            filename=filename,
            user_id=user_id,
            agent_id=agent_id,
            is_pdf=is_pdf,
            on_progress=lambda p, s: update_progress(job_id, p, s),
        )
        mark_completed(job_id, n)
    except Exception as exc:  # pragma: no cover
        mark_failed(job_id, str(exc))


@router.post(
    "/ingest",
    response_model=IngestAcceptedResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def ingest_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Form(...),
    agent_id: str = Form(...),
) -> IngestAcceptedResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only .pdf and .txt files are allowed",
        )

    data = await file.read()
    is_pdf = suffix == ".pdf"
    job_id = create_job(user_id=user_id, agent_id=agent_id, filename=file.filename)
    _log.info(
        "ingest accepted job_id=%s filename=%s agent_id=%s user_id=%s bytes=%d",
        job_id,
        file.filename,
        agent_id,
        user_id,
        len(data),
    )
    background_tasks.add_task(
        _ingest_task,
        job_id,
        data,
        file.filename,
        user_id,
        agent_id,
        is_pdf,
    )

    return IngestAcceptedResponse(
        message="Traitement du document en cours en arrière-plan.",
        job_id=job_id,
    )


@router.get(
    "/ingest/status/{job_id}",
    response_model=IngestJobStatusResponse,
)
async def ingest_job_status(
    job_id: str,
    user_id: str = Query(..., description="Must match the ingest request"),
    agent_id: str = Query(..., description="Must match the ingest request"),
) -> IngestJobStatusResponse:
    row = get_job(job_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Unknown job_id")
    if row["user_id"] != user_id or row["agent_id"] != agent_id:
        raise HTTPException(status_code=403, detail="job_id does not match this tenant")
    return IngestJobStatusResponse(
        job_id=job_id,
        status=row["status"],
        progress=int(row.get("progress", 0)),
        current_step=str(row.get("current_step", "")),
        user_id=row["user_id"],
        agent_id=row["agent_id"],
        filename=row["filename"],
        chunks_indexed=row.get("chunks_indexed"),
        error=row.get("error"),
    )


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    user_id: str = Query(..., description="Tenant user id"),
    agent_id: str = Query(..., description="Agent id"),
) -> DocumentListResponse:
    rows = await asyncio.to_thread(list_documents_for_tenant, user_id, agent_id)
    return DocumentListResponse(
        user_id=user_id,
        agent_id=agent_id,
        documents=[TenantDocumentItem(**r) for r in rows],
    )


@router.delete("/file", response_model=DocumentDeleteResponse)
async def delete_one_document(
    user_id: str = Query(..., description="Tenant user id"),
    agent_id: str = Query(..., description="Agent id"),
    filename: str = Query(..., description="Exact filename as returned by GET /internal/v1/documents"),
) -> DocumentDeleteResponse:
    name = filename.strip()
    if not name:
        raise HTTPException(status_code=400, detail="filename must be non-empty")
    n = await asyncio.to_thread(delete_document_by_filename, user_id, agent_id, name)
    if n == 0:
        raise HTTPException(status_code=404, detail="No chunks found for this filename and tenant")
    return DocumentDeleteResponse(
        user_id=user_id,
        agent_id=agent_id,
        filename=name,
        chunks_removed=n,
    )


@router.delete("/all", response_model=DocumentDeleteResponse)
async def delete_all_documents_for_agent(
    user_id: str = Query(..., description="Tenant user id"),
    agent_id: str = Query(..., description="Agent id"),
) -> DocumentDeleteResponse:
    n = await asyncio.to_thread(delete_all_tenant_documents, user_id, agent_id)
    return DocumentDeleteResponse(
        user_id=user_id,
        agent_id=agent_id,
        filename=None,
        chunks_removed=n,
    )
