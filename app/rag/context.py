def apply_context_char_budget(chunks: list[str], max_chars: int) -> list[str]:
    """
    Garde les chunks dans l'ordre (déjà triés par pertinence côté Chroma) jusqu'à
    max_chars caractères au total, pour rester sous la limite de contexte du LLM.
    """
    if max_chars <= 0:
        return []
    out: list[str] = []
    used = 0
    for c in chunks:
        if not c:
            continue
        remaining = max_chars - used
        if remaining <= 0:
            break
        if len(c) <= remaining:
            out.append(c)
            used += len(c)
        else:
            out.append(c[:remaining] + "\n… [contexte tronqué]")
            break
    return out
