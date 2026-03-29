# Data / AI Plane

Backend microservice for **document ingestion**, **vector search**, and **RAG chat**. It is meant to sit beside a separate control plane (users, billing, sessions): this service only handles files, ChromaDB, and calls to **Google Gemini** or **OpenAI**.

## What it does

- Accepts **PDF** and **TXT** uploads, extracts text, chunks it, embeds it, and stores vectors in **ChromaDB** (`PersistentClient`, default path `./chroma_data`).
- Answers questions with **retrieval-augmented generation**: similar chunks are fetched from Chroma, then an LLM answers using that context only (strict system prompt, temperature 0).
- **Multi-tenant isolation** uses a single collection `global_rag_collection` and **metadata filters** on every query: `user_id` and `agent_id` must match.
- **Agent profile** (optional): a **name** and **description** per `(user_id, agent_id)` define what the assistant covers (company, product, service). They are stored on disk via `POST /internal/v1/agents/profile` (création) puis `PUT` (modification) and **prepended to the RAG system prompt** on chat when a profile exists.

## Stack

- **FastAPI** (async), **Pydantic** / **pydantic-settings**
- **ChromaDB** (persistent local store)
- **PyMuPDF** (PDF), **LangChain** text splitters (`RecursiveCharacterTextSplitter`)
- **httpx** for Gemini and OpenAI HTTP APIs

## Requirements

- Python **3.10+** (3.11+ recommended)
- API keys: **Gemini** and/or **OpenAI** (depending on `LLM_PROVIDER`)

## Setup

```bash
cd agent
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux / macOS:
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # Windows; use cp on Unix
```

Edit `.env` with your keys and options (see below).

### Optional: custom embeddings

By default Chroma uses its built-in embedding function. To use **Sentence Transformers** instead, set e.g. `EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2` and install:

```bash
pip install sentence-transformers
```

Use the **same** embedding configuration for the lifetime of a given `chroma_data` directory; changing it after data is stored requires re-ingestion.

## Configuration (`.env`)

| Variable | Description |
|----------|-------------|
| `LLM_PROVIDER` | `gemini` or `openai` — which backend handles `/internal/v1/chat` |
| `GEMINI_API_KEY` | Google AI API key (if using Gemini) |
| `GEMINI_MODEL` | Gemini model id for `generateContent` (default `gemini-2.5-flash`) |
| `OPENAI_API_KEY` | OpenAI API key (if using OpenAI) |
| `OPENAI_MODEL` | Chat Completions model (default `gpt-4o-mini`) |
| `API_HOST` | Bind address for the HTTP server (default `0.0.0.0`) |
| `API_PORT` | Listen port (default `8000`) |
| `CHROMA_PERSIST_PATH` | Chroma persistence directory (default `./chroma_data`) |
| `GLOBAL_COLLECTION_NAME` | Collection name (default `global_rag_collection`) |
| `AGENT_PROFILES_PATH` | Directory for `profiles.json` (name + description per agent; default `./agent_profiles`) |
| `AGENT_PROFILE_DESCRIPTION_MAX_BYTES` | Max size for the `.txt` description upload on POST/PUT (default `512000`) |
| `EMBEDDING_MODEL` | Optional Sentence Transformers model name |
| `RAG_N_RESULTS` | **Top‑K** semantic neighbors Chroma returns (ordered most relevant first). Can be large; see `RAG_MAX_CONTEXT_CHARS`. |
| `RAG_MAX_CONTEXT_CHARS` | Hard cap on **total characters** from those chunks before calling the LLM (default `280000`). Prevents errors like OpenAI “maximum context length” when `RAG_N_RESULTS` is huge. Increase only if your model allows a much bigger window (and you accept cost). |

See `.env.example` for a template.

### Logging

- **Console** : logs `app.*` sur stderr selon **`LOG_LEVEL`** (défaut **`DEBUG`** = tous les niveaux DEBUG, INFO, WARNING, ERROR, CRITICAL). Avec **`INFO`**, les lignes **DEBUG** ne sont pas affichées ; **`WARNING`** et plus restent visibles. `run.py` transmet le même niveau à **Uvicorn** (requêtes, erreurs serveur).
- **Fichier** : un fichier par jour **`LOG_DIR/YYYY-MM-DD.log`** (ex. `2026-03-29.log`). Au changement de jour, un nouveau fichier est utilisé automatiquement. Seuls les **`LOG_RETENTION_DAYS`** derniers jours sont conservés (défaut **5**), les fichiers datés plus anciens sont supprimés à l’ouverture d’un nouveau jour.
- Paramètres : `LOG_DIR`, `LOG_RETENTION_DAYS`, `LOG_LEVEL`.
- Les requêtes HTTP sont aussi dans ce fichier via `uvicorn.access` ; les erreurs serveur via `uvicorn` / `uvicorn.error`.

## Run the server

From the project root, with `.env` present (so `API_HOST` / `API_PORT` are applied):

```bash
python run.py
```

Alternatively, call Uvicorn directly and set the port yourself (it does not read `.env` unless the shell exports variables):

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **OpenAPI / Swagger UI:** `http://127.0.0.1:<API_PORT>/docs` (default port `8000`)
- **ReDoc:** `http://127.0.0.1:<API_PORT>/redoc`

## API usage

### Ingest a document

`POST /internal/v1/documents/ingest` — `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | file | `.pdf` or `.txt` |
| `user_id` | string | Tenant user id |
| `agent_id` | string | Agent / bot id |

Returns **202 Accepted** immediately; processing runs in a background task.

**Example (curl):**

```bash
curl -X POST "http://127.0.0.1:8000/internal/v1/documents/ingest" \
  -F "file=@./notes.txt" \
  -F "user_id=user-1" \
  -F "agent_id=agent-1"
```

### Agent profile (mission / périmètre)

Define what each assistant is for (enterprise, product, or service). Stored under `AGENT_PROFILES_PATH` as `profiles.json`. The pair **`user_id` + `agent_id`** identifies the agent (same as ingest / chat).

**`POST` et `PUT` utilisent `multipart/form-data`** (pas de JSON) : la **description longue** se fait via un **fichier `.txt`** (`description`), encodé UTF-8 ; les retours à la ligne du fichier sont conservés. Le **nom** reste un champ formulaire `name`. Taille max du fichier : **`AGENT_PROFILE_DESCRIPTION_MAX_BYTES`** (défaut 512000).

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/internal/v1/agents/profile` | **Création** — form: `user_id`, `agent_id`, `name?`, fichier `description` (`.txt`) ?. Au moins **un** `name` non vide **ou** un fichier description non vide. **409** si profil déjà présent. **201**. |
| `PUT` | `/internal/v1/agents/profile` | **Modification** — même principe : envoyer `name` (optionnel ; chaîne vide efface le nom) et/ou un nouveau fichier `description` `.txt`. **404** si aucun profil. **400** si rien à mettre à jour ou si name+description deviennent tous vides. |
| `GET` | `/internal/v1/agents/profile?user_id=&agent_id=` | Lecture (JSON avec `description` en chaîne) ; **404** si absent |
| `DELETE` | `/internal/v1/agents/profile?user_id=&agent_id=` | Suppression du profil |

**Exemple `curl` (création avec fichier) :**

```bash
curl -X POST "http://127.0.0.1:8000/internal/v1/agents/profile" \
  -F "user_id=user-1" \
  -F "agent_id=agent-1" \
  -F "name=Assistant Galerie MART" \
  -F "description=@./mission.txt;type=text/plain"
```

Chat uses **only** the stored profile for that `(user_id, agent_id)` (if any). Créer le profil avec **POST**, le faire évoluer avec **PUT** (pas via le corps du chat).

### Chat (RAG + LLM)

`POST /internal/v1/chat` — JSON body

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | Must match ingest metadata |
| `agent_id` | string | Must match ingest metadata |
| `session_id` | string, optional | Echoed back in the response |
| `query` | string | **Current question** — used for vector search and for the model. Do not leave the Swagger default `"string"`; put the real question here. If you only send it inside `history`, it is used when `query` is empty or a common placeholder. |
| `history` | array | Optional; items `{ "role": "user" \| "assistant", "content": "..." }` |
| `source_filename` | string, optional | Exact filename from `GET /internal/v1/documents`. Limits RAG to that file when the agent has **several** documents (e.g. a PDF + a `.txt` log). |

**Example:**

```bash
curl -X POST "http://127.0.0.1:8000/internal/v1/chat" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"user-1\",\"agent_id\":\"agent-1\",\"query\":\"What is in the document?\",\"history\":[]}"
```

Response shape: `{ "answer": "...", "session_id": null }` (or your `session_id` if sent).

## Security notes

- Keep `.env` out of version control (it is listed in `.gitignore`).
- Protect these **internal** routes at the network or gateway level (API keys, mTLS, private network) so only your control plane can call them.
- Rotate API keys if they are ever committed or leaked.

## Project layout

```
agent/
  run.py                    # Start server (host/port from .env)
  app/
    main.py                 # FastAPI app, startup, router mounting
    core/
      config.py             # pydantic-settings
      logging_setup.py      # Daily log files + retention
    schemas/
      models.py             # Request/response Pydantic models
    services/
      chroma.py             # Persistent client, tenant filter
      ingestion.py          # Extract, chunk, index
      ingest_jobs.py        # In-memory ingest job status
      documents.py          # List / delete by tenant or filename
      agent_profiles.py     # name + description JSON store per agent
    rag/
      context.py            # Context char budget
      query.py              # Retrieval text vs question resolution
      prompts.py              # System prompt + user block builder
      chat_logging.py         # Chroma + LLM structured logs
      llm_errors.py           # Upstream error formatting
      gemini.py               # Gemini generateContent
      openai.py               # OpenAI chat completions
      llm_router.py           # Dispatches by LLM_PROVIDER
    api/
      routes/
        documents.py        # Ingest, jobs, list, delete
        agents.py             # Agent profile POST/PUT/GET/DELETE
        chat.py             # RAG chat endpoint
  requirements.txt
  .env.example
  README.md
```
