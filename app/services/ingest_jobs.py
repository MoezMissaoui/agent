import threading
import time
import uuid
from typing import Any

_lock = threading.Lock()
_jobs: dict[str, dict[str, Any]] = {}
# Limite mémoire : les jobs terminés restent consultables un temps, les plus anciens sont retirés.
_MAX_JOBS = 8_000


def _evict_oldest_if_needed() -> None:
    if len(_jobs) <= _MAX_JOBS:
        return
    finished = [
        jid
        for jid, row in _jobs.items()
        if row.get("status") in ("completed", "failed")
    ]
    finished.sort(key=lambda j: _jobs[j]["created_at"])
    for jid in finished:
        if len(_jobs) <= _MAX_JOBS - 500:
            return
        del _jobs[jid]
    while len(_jobs) > _MAX_JOBS:
        oldest = min(_jobs.keys(), key=lambda j: _jobs[j]["created_at"])
        del _jobs[oldest]


def create_job(*, user_id: str, agent_id: str, filename: str) -> str:
    job_id = str(uuid.uuid4())
    with _lock:
        _evict_oldest_if_needed()
        _jobs[job_id] = {
            "status": "pending",
            "user_id": user_id,
            "agent_id": agent_id,
            "filename": filename,
            "chunks_indexed": None,
            "error": None,
            "created_at": time.time(),
        }
    return job_id


def mark_completed(job_id: str, chunks_indexed: int) -> None:
    with _lock:
        row = _jobs.get(job_id)
        if not row:
            return
        row["status"] = "completed"
        row["chunks_indexed"] = chunks_indexed


def mark_failed(job_id: str, error: str) -> None:
    with _lock:
        row = _jobs.get(job_id)
        if not row:
            return
        row["status"] = "failed"
        row["error"] = error


def get_job(job_id: str) -> dict[str, Any] | None:
    with _lock:
        row = _jobs.get(job_id)
        if row is None:
            return None
        return dict(row)
