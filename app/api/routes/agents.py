from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile

from app.core.config import settings
from app.schemas import AgentProfileResponse
from app.services.agent_profiles import create_profile, delete_profile, get_profile, write_profile

router = APIRouter(prefix="/internal/v1/agents", tags=["agents"])


async def _description_from_txt_file(description: UploadFile | None) -> str | None:
    if description is None:
        return None
    fn = (description.filename or "").strip()
    if not fn:
        return None
    if not fn.lower().endswith(".txt"):
        raise HTTPException(
            status_code=400,
            detail="Le fichier description doit avoir l'extension .txt",
        )
    raw = await description.read()
    if len(raw) > settings.agent_profile_description_max_bytes:
        raise HTTPException(
            status_code=413,
            detail=(
                "Fichier description trop volumineux "
                f"(max {settings.agent_profile_description_max_bytes} octets)"
            ),
        )
    text = raw.decode("utf-8", errors="replace").strip()
    return text if text else None


@router.post("/profile", response_model=AgentProfileResponse, status_code=201)
async def post_agent_profile(
    user_id: str = Form(..., description="Tenant user id"),
    agent_id: str = Form(..., description="Agent id"),
    name: str | None = Form(None, description="Nom affiché de l'assistant (optionnel si fichier description fourni)"),
    description: UploadFile | None = File(
        None,
        description="Fichier .txt : périmètre / mission (retours à la ligne conservés)",
    ),
) -> AgentProfileResponse:
    eff_name = (name or "").strip() or None
    eff_desc = await _description_from_txt_file(description)
    if not eff_name and not eff_desc:
        raise HTTPException(
            status_code=400,
            detail="Fournissez un name non vide et/ou un fichier description (.txt) non vide.",
        )
    row = create_profile(
        user_id=user_id,
        agent_id=agent_id,
        name=eff_name,
        description=eff_desc,
    )
    if row is None:
        raise HTTPException(
            status_code=409,
            detail="Un profil existe déjà pour ce user_id et agent_id. Utilisez PUT pour le modifier.",
        )
    return AgentProfileResponse(
        user_id=user_id,
        agent_id=agent_id,
        name=row.get("name"),
        description=row.get("description"),
    )


@router.put("/profile", response_model=AgentProfileResponse)
async def put_agent_profile(
    user_id: str = Form(..., description="Tenant user id"),
    agent_id: str = Form(..., description="Agent id"),
    name: str | None = Form(
        None,
        description="Si le champ est envoyé, remplace le nom (chaîne vide = effacer le nom)",
    ),
    description: UploadFile | None = File(
        None,
        description="Si un fichier .txt est envoyé, remplace la description",
    ),
) -> AgentProfileResponse:
    existing = get_profile(user_id, agent_id)
    if existing is None:
        raise HTTPException(
            status_code=404,
            detail="Aucun profil pour ce user_id et agent_id. Utilisez POST pour le créer.",
        )
    eff_desc = await _description_from_txt_file(description)
    has_file = description is not None and (description.filename or "").strip() != ""
    if has_file and eff_desc is None:
        raise HTTPException(
            status_code=400,
            detail="Le fichier description doit être un .txt non vide.",
        )
    merged = dict(existing)
    updated = False
    if name is not None:
        merged["name"] = name.strip() or None
        updated = True
    if has_file:
        merged["description"] = eff_desc
        updated = True
    if not updated:
        raise HTTPException(
            status_code=400,
            detail="Envoyez au moins le champ name (même vide pour l'effacer) ou un fichier description .txt.",
        )
    if not merged.get("name") and not merged.get("description"):
        raise HTTPException(
            status_code=400,
            detail="Après mise à jour, name et description ne peuvent pas être tous les deux vides.",
        )
    write_profile(user_id=user_id, agent_id=agent_id, row=merged)
    return AgentProfileResponse(
        user_id=user_id,
        agent_id=agent_id,
        name=merged.get("name"),
        description=merged.get("description"),
    )


@router.get("/profile", response_model=AgentProfileResponse)
def get_agent_profile(
    user_id: str = Query(..., description="Tenant user id"),
    agent_id: str = Query(..., description="Agent id"),
) -> AgentProfileResponse:
    row = get_profile(user_id, agent_id)
    if row is None:
        raise HTTPException(status_code=404, detail="No profile for this user_id and agent_id")
    return AgentProfileResponse(
        user_id=user_id,
        agent_id=agent_id,
        name=row.get("name"),
        description=row.get("description"),
    )


@router.delete("/profile", response_model=AgentProfileResponse)
def delete_agent_profile(
    user_id: str = Query(..., description="Tenant user id"),
    agent_id: str = Query(..., description="Agent id"),
) -> AgentProfileResponse:
    row = get_profile(user_id, agent_id)
    if row is None:
        raise HTTPException(status_code=404, detail="No profile for this user_id and agent_id")
    delete_profile(user_id, agent_id)
    return AgentProfileResponse(
        user_id=user_id,
        agent_id=agent_id,
        name=row.get("name"),
        description=row.get("description"),
    )
