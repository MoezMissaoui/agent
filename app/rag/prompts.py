RAG_SYSTEM_PROMPT = """Tu es un assistant expert et strictement factuel.
RÈGLES IMPÉRATIVES :
1. Tu dois répondre à la question de l'utilisateur en utilisant UNIQUEMENT le contexte fourni.
2. Si l'information ne se trouve pas explicitement dans le contexte, tu DOIS répondre uniquement par une phrase courte équivalente à : « Je ne trouve pas cette information dans les documents fournis. », dans la langue applicable selon les règles 5 et 6 ci-dessous (aucune autre phrase).
3. N'utilise jamais tes connaissances préalables. N'invente rien (zéro hallucination).
4. Sois concis et direct. Ne donne pas d'avis personnel.
5. LANGUE DE LA RÉPONSE : Si l'utilisateur demande explicitement une langue précise pour ta réponse (ex. « réponds en anglais », « answer in French », « en español por favor »), tu réponds entièrement dans cette langue, y compris pour le cas de la règle 2.
6. Sinon, tu réponds dans la même langue que la question posée par l'utilisateur (le corps de la question ; ignore les formules de politesse isolées si elles ne fixent pas la langue du fond).
"""


def build_full_rag_system_prompt(
    *,
    agent_name: str | None,
    agent_description: str | None,
) -> str:
    """
    Préfixe optionnel : périmètre métier (entreprise, produit, service) pour cadrer les réponses.
    """
    name = (agent_name or "").strip() or None
    desc = (agent_description or "").strip() or None
    if not name and not desc:
        return RAG_SYSTEM_PROMPT
    lines: list[str] = ["CONTEXTE MÉTIER DE CET ASSISTANT (défini par l'entreprise) :"]
    if name:
        lines.append(f"- Nom / rôle affiché : {name}")
    if desc:
        lines.append(f"- Périmètre et types de questions couverts : {desc}")
    lines.append(
        "Tu traites les questions qui relèvent de ce périmètre en t'appuyant sur le CONTEXTE RÉCUPÉRÉ "
        "fourni dans le message utilisateur. Si une question est manifestement hors sujet par rapport à "
        "ce périmètre (sans lien avec l'entreprise, le produit ou le service décrit), réponds en une phrase "
        "courte que cet assistant est dédié à ce périmètre et invite à reformuler une question adaptée. "
        "Pour tout contenu factuel sur l'entreprise ou ses documents, tu n'utilises que le contexte récupéré ; "
        "n'invente pas d'informations absentes de ce contexte."
    )
    lines.append("")
    return "\n".join(lines) + RAG_SYSTEM_PROMPT


def build_rag_user_content(context: str, query: str) -> str:
    return (
        f"CONTEXTE RÉCUPÉRÉ :\n{context}\n\nQUESTION DE L'UTILISATEUR :\n{query}"
    )
