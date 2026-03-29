from app.services.chroma import get_collection, tenant_where

_BATCH = 500


def _count_where(where: dict) -> int:
    collection = get_collection()
    offset = 0
    total = 0
    while True:
        res = collection.get(
            where=where,
            limit=_BATCH,
            offset=offset,
            include=[],
        )
        ids = res.get("ids") or []
        total += len(ids)
        if len(ids) < _BATCH:
            break
        offset += _BATCH
    return total


def list_documents_for_tenant(user_id: str, agent_id: str) -> list[dict[str, int | str]]:
    collection = get_collection()
    where = tenant_where(user_id, agent_id)
    offset = 0
    by_file: dict[str, int] = {}
    while True:
        res = collection.get(
            where=where,
            limit=_BATCH,
            offset=offset,
            include=["metadatas"],
        )
        metadatas = res.get("metadatas") or []
        if not metadatas:
            break
        for m in metadatas:
            if not m:
                continue
            fn = m.get("filename")
            if isinstance(fn, str) and fn:
                by_file[fn] = by_file.get(fn, 0) + 1
        if len(metadatas) < _BATCH:
            break
        offset += _BATCH
    return [
        {"filename": fn, "chunk_count": n}
        for fn, n in sorted(by_file.items(), key=lambda x: x[0].lower())
    ]


def delete_document_by_filename(user_id: str, agent_id: str, filename: str) -> int:
    collection = get_collection()
    where = tenant_where(user_id, agent_id, filename)
    n = _count_where(where)
    if n:
        collection.delete(where=where)
    return n


def delete_all_tenant_documents(user_id: str, agent_id: str) -> int:
    collection = get_collection()
    where = tenant_where(user_id, agent_id)
    n = _count_where(where)
    if n:
        collection.delete(where=where)
    return n
