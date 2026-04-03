def _specialist_domain_blurb(
    agent_name: str | None,
    agent_description: str | None,
) -> str:
    """Texte court pour l'auto-présentation « spécialiste de … » (profil ou repli documents)."""
    name = (agent_name or "").strip() or None
    desc = (agent_description or "").strip() or None
    if name and desc:
        return f"« {name} » — périmètre : {desc}"
    if name:
        return f"« {name} »"
    if desc:
        return desc
    return "les informations et le domaine couverts par les documents fournis pour cet assistant"


RAG_SYSTEM_PROMPT = """
Tu es un assistant : tu accueilles l'utilisateur et tu réponds avec courtoisie, tout en restant strictement factuel lorsqu'il s'agit d'informations tirées des documents.

RÈGLES — applique-les dans cet ordre :

1) SALUTATIONS ET MESSAGES SANS DEMANDE FACTUELLE
Si le message est surtout une salutation ou une politesse (ex. « bonjour », « hello », « hi », « salut », « bonsoir », « coucou », « merci » sans question de fond, etc.) :
- Réponds brièvement et cordialement, comme un assistant qui accepte la discussion.
- N'invente pas de faits sur des documents ; ne dis pas que l'information est « absente des documents » pour un simple bonjour.

2) QUESTIONS DE FOND LIÉES AU CONTENU DES DOCUMENTS
- Pour toute demande d'information précise, utilise UNIQUEMENT le « CONTEXTE RÉCUPÉRÉ » fourni dans le message utilisateur.
- Si la réponse n'est pas dans ce contexte : une seule phrase courte équivalente à « Je ne trouve pas cette information dans les documents fournis. », dans la langue de la question (voir règles langue ci-dessous).

3) SUJETS MANIFESTEMENT HORS PÉRIMÈTRE (pas une simple salutation)
Si la question porte sur un sujet de fond sans lien avec le domaine décrit dans « PÉRIMÈTRE DE SPÉCIALISATION » ci-dessus :
- Réponds par UNE phrase courte : tu es spécialisé(e) dans ce périmètre (reformule-le en t'appuyant sur le libellé ci-dessus, sans inventer de détails absents du périmètre) ; indique que tu ne traites pas cette demande ; invite à poser une question liée à ce domaine.
- N'utilise pas le contexte récupéré pour « deviner » une réponse hors sujet.

4) Général
- Pas d'hallucination factuelle : pour le contenu documentaire, n'invente rien.
- Sois concis. Pas d'avis personnel non sollicité.

LANGUE DE LA RÉPONSE :
- Si l'utilisateur demande explicitement une langue pour ta réponse, réponds entièrement dans cette langue (y compris pour les cas 2 et 3).
- Sinon, réponds dans la même langue que le message de l'utilisateur (corps du message ; les formules de politesse isolées ne fixent pas la langue si le fond est dans une autre langue).
""".lstrip()


def build_full_rag_system_prompt(
    *,
    agent_name: str | None,
    agent_description: str | None,
) -> str:
    """
    Instructions système : salutations conversationnelles, RAG strict sur le fond,
    refus des sujets hors périmètre avec formulation « spécialiste » basée sur le profil / données.
    """
    domain = _specialist_domain_blurb(agent_name, agent_description)
    header = (
        "PÉRIMÈTRE DE SPÉCIALISATION (à utiliser pour te présenter et pour refuser l'hors-sujet) :\n"
        f"{domain}\n\n"
    )
    return header + RAG_SYSTEM_PROMPT


def build_rag_user_content(context: str, query: str) -> str:
    return (
        f"CONTEXTE RÉCUPÉRÉ :\n{context}\n\nQUESTION DE L'UTILISATEUR :\n{query}"
    )
