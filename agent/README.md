# Data / AI Plane

> **Synapse — Data / AI Plane :** ce service est le plan **données / IA** (RAG, Chroma, LLM), distinct du **Control Plane** dans `saas/`. Vue d’ensemble du dépôt : [README à la racine](../README.md) · [Documentation technique](../docs/TECHNICAL.md).

Microservice **FastAPI** : ingestion **PDF / TXT** → **ChromaDB** (vecteurs + métadonnées `user_id`, `agent_id`), puis **chat RAG** via **Gemini** ou **OpenAI** (prompt strict, température 0). Le nom / la mission de l’assistant peuvent être passés en option dans le corps JSON du chat (`agent_name`, `agent_description`) — la source de vérité métier est le Control Plane (MySQL).

**Prérequis :** Python 3.10+, clé API selon `LLM_PROVIDER`. Stack : Chroma, PyMuPDF, LangChain (split), httpx.

## Démarrage

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate   |  Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # ou copy sous Windows
python run.py
```

- **Swagger :** `http://127.0.0.1:<API_PORT>/docs` (port défaut `8000`).
- **Uvicorn direct :** `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` (sans charger `.env` sauf variables exportées).

**Embeddings optionnels :** `EMBEDDING_MODEL` (ex. Sentence Transformers) — ne pas changer le modèle après indexation sans ré-ingérer ; installer `sentence-transformers` si besoin.

## Docker

Le **Compose** du dépôt est à la **racine** (`docker-compose.yml`) : il orchestre MySQL, le Control Plane et ce service **agent**. Il n’y a plus de `docker-compose` dans ce dossier.

Prérequis : **Docker** et **Docker Compose** v2, `.env` à la racine du dépôt et `agent/.env` (clés LLM).

```bash
# depuis la racine du dépôt (parent de agent/)
cp .env.example .env
cp agent/.env.example agent/.env   # renseigner les clés API, API_PORT=8546 pour le port hôte, etc.
docker compose --env-file .env --env-file agent/.env up --build
```

**Développement** (reload Nest + Vite + agent, code monté) :

```bash
docker compose --env-file .env --env-file agent/.env -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Équivalent : depuis la **racine** du dépôt, `make dev-build` puis `make dev` (voir le `Makefile` racine).

- **Swagger :** `http://127.0.0.1:<API_PORT>/docs` — `API_PORT` dans **`agent/.env`** (port **hôte**, ex. **8546** ; l’app écoute en **8000** dans le conteneur).
- **Données persistantes** (volumes nommés du compose racine) : Chroma `/data/chroma`, logs `/data/logs`.
- **Image seule :** `docker build -t data-ai-plane .` puis `docker run --env-file .env -e API_PORT=8000 -e CHROMA_PERSIST_PATH=/data/chroma -v chroma:/data/chroma -p 8546:8000 data-ai-plane` (adapter volumes et variables).

Avec **`EMBEDDING_MODEL`** (Sentence Transformers), étendre le `Dockerfile` (`pip install sentence-transformers` + dépendances éventuelles) : l’image de base ne les inclut pas.

## Configuration

Toutes les variables sont documentées dans **`.env.example`**. Les plus utilisées :

| Variable | Rôle |
|----------|------|
| `LLM_PROVIDER` | `gemini` ou `openai` |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Appel Gemini |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | Appel OpenAI |
| `API_HOST` / `API_PORT` | Écoute HTTP |
| `CHROMA_PERSIST_PATH` | Dossier persistance Chroma |
| `RAG_N_RESULTS` / `RAG_MAX_CONTEXT_CHARS` | Top-K retrieval puis plafond caractères contexte LLM |
| `LOG_DIR` / `LOG_LEVEL` / `LOG_RETENTION_DAYS` | Logs fichier journalier + rétention ; `app.*` et uvicorn vers le même fichier |

**Intégration Control Plane (Nest)** : le backend appelle ce service avec la base URL `DATA_PLANE_BASE_URL` et, si configuré, l’en-tête **`X-API-Key`** (`AGENT_API_X_KEY` côté Nest). Côté agent, définir **`INTERNAL_API_KEY`** avec la **même** valeur pour exiger cette clé sur les routes `/internal/v1/*` (voir `.env.example`).

### Où sont les fichiers `.log` ?

- **En local** (`python run.py` depuis `agent/`, répertoire courant = `agent/`) : **`./logs/YYYY-MM-DD.log`** (dossier `logs/` à côté du code).
- **Docker Compose (fichier racine uniquement)** : `LOG_DIR` vaut `/data/logs` dans le conteneur ; les fichiers sont dans le **volume nommé** `logs` (pas dans `agent/logs` du dépôt sur l’hôte). Pour les voir :  
  `docker compose exec agent ls -la /data/logs`  
  ou inspecter le volume : `docker volume inspect synapseia_logs` (le nom peut varier selon le préfixe du projet).
- **Docker Compose + `docker-compose.dev.yml`** : montage **`./agent/logs` → `/data/logs`**, les fichiers **`agent/logs/YYYY-MM-DD.log`** sur la machine hôte sont bien ceux du service.

Si vous n’avez **aucune** ligne `app.*` dans le fichier, les routes **documents** peuvent ne rien émettre avant ; un appel **chat** ou une ligne **ingest** (après mise à jour) produit des entrées `INFO`.

## API — référence groupée

Isolation multi-tenant : **`user_id`** + **`agent_id`** sur toutes les routes ci-dessous.

### Documents

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `POST` | `/internal/v1/documents/ingest` | `multipart` : `file` (.pdf / .txt), `user_id`, `agent_id` → **202** + `job_id` ; traitement en arrière-plan |
| `GET` | `/internal/v1/documents/ingest/status/{job_id}` | Statut : `processing` \| `completed` \| `failed` ; `progress` (0–100) ; `current_step` (ex. extraction, embeddings, stockage) ; query `user_id`, `agent_id` |
| `GET` | `/internal/v1/documents` | Liste des fichiers indexés (query `user_id`, `agent_id`) |
| `DELETE` | `/internal/v1/documents/file` | Supprime les chunks d’un fichier (query `user_id`, `agent_id`, `filename`) |
| `DELETE` | `/internal/v1/documents/all` | Supprime tous les chunks du tenant |

### Chat

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `POST` | `/internal/v1/chat` | **JSON** : `user_id`, `agent_id`, `query`, `history` (optionnel), `session_id` (optionnel), `source_filename` (optionnel), `agent_name` / `agent_description` (optionnels — périmètre du prompt, typiquement depuis le Control Plane) |

**Erreurs avant appel LLM :** **404** si aucun chunk Chroma pour ce `user_id` → `Utilisateur inexistant.` ; si l’utilisateur a des données mais pas ce couple agent → `Agent inexistant pour cet utilisateur.`

**Astuce :** ne pas laisser le placeholder Swagger `"string"` dans `query` ; sinon une vraie question peut être prise depuis `history` (rôle `user`).

## Exemples `curl`

```bash
# Ingestion
curl -X POST "http://127.0.0.1:8000/internal/v1/documents/ingest" \
  -F "file=@./notes.txt" -F "user_id=user-1" -F "agent_id=agent-1"

# Chat (optionnel : agent_name / agent_description pour le périmètre du prompt)
curl -X POST "http://127.0.0.1:8000/internal/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user-1","agent_id":"agent-1","query":"Résumé du document ?","history":[],"agent_name":"Mon assistant","agent_description":"..."}'
```

## Sécurité

- Ne pas versionner `.env`.
- Exposer ces routes **internes** uniquement derrière réseau privé / gateway (auth, mTLS, etc.).
- Révoquer les clés API en cas de fuite.
