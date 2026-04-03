import json
import threading
from pathlib import Path

from app.core.config import settings

_lock = threading.Lock()


def _store_path() -> Path:
    return Path(settings.agent_profiles_path) / "profiles.json"


def _ensure_dir() -> None:
    Path(settings.agent_profiles_path).mkdir(parents=True, exist_ok=True)


def _load_all() -> dict:
    path = _store_path()
    if not path.is_file():
        return {}
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def _save_all(data: dict) -> None:
    _ensure_dir()
    path = _store_path()
    tmp = path.with_suffix(".json.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    tmp.replace(path)


def get_profile(user_id: str, agent_id: str) -> dict | None:
    with _lock:
        allp = _load_all()
    uid = str(user_id)
    aid = str(agent_id)
    u = allp.get(uid)
    if not isinstance(u, dict):
        return None
    row = u.get(aid)
    if not isinstance(row, dict):
        return None
    return {"name": row.get("name"), "description": row.get("description")}


def create_profile(
    *, user_id: str, agent_id: str, name: str | None, description: str | None
) -> dict | None:
    """Retourne le profil créé, ou None si un profil existe déjà pour ce couple user_id / agent_id."""
    with _lock:
        allp = _load_all()
        uid = str(user_id)
        aid = str(agent_id)
        u = allp.get(uid)
        if isinstance(u, dict) and aid in u:
            return None
        if uid not in allp or not isinstance(allp[uid], dict):
            allp[uid] = {}
        row = {
            "name": (name or "").strip() or None,
            "description": (description or "").strip() or None,
        }
        allp[uid][aid] = row
        _save_all(allp)
        return dict(row)


def write_profile(*, user_id: str, agent_id: str, row: dict) -> None:
    with _lock:
        allp = _load_all()
        uid = str(user_id)
        aid = str(agent_id)
        if uid not in allp or not isinstance(allp[uid], dict):
            allp[uid] = {}
        allp[uid][aid] = {
            "name": row.get("name"),
            "description": row.get("description"),
        }
        _save_all(allp)


def delete_profile(user_id: str, agent_id: str) -> bool:
    with _lock:
        allp = _load_all()
        uid = str(user_id)
        aid = str(agent_id)
        if uid not in allp or not isinstance(allp[uid], dict) or aid not in allp[uid]:
            return False
        del allp[uid][aid]
        if not allp[uid]:
            del allp[uid]
        _save_all(allp)
        return True
