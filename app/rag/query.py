from app.schemas import ChatRequest

# Valeurs souvent laissées par défaut dans Swagger / clients de test (pas une vraie question).
_PLACEHOLDER_QUERIES = frozenset(
    {"string", "str", "query", "text", "n/a", "na", "none", "null"}
)


def resolve_retrieval_and_question(req: ChatRequest) -> tuple[str, str]:
    """
    Retourne (texte pour l'embedding Chroma, question courante pour le LLM).
    La recherche vectorielle utilise tout le fil utile ; le modèle reçoit une question explicite.
    """
    history_users = [
        item.content.strip()
        for item in req.history
        if item.role == "user" and item.content.strip()
    ]
    q = req.query.strip()
    if q and q.lower() not in _PLACEHOLDER_QUERIES:
        question = q
    else:
        question = history_users[-1] if history_users else q
    if not question.strip():
        raise ValueError(
            "Aucune question utilisable : renseignez query avec la vraie question "
            "ou placez-la dans history (role=user)."
        )
    parts: list[str] = []
    for p in history_users:
        if p not in parts:
            parts.append(p)
    if question not in parts:
        parts.append(question)
    retrieval_text = "\n\n".join(parts)
    return retrieval_text, question
