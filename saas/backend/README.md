# Control Plane — Backend (NestJS)

API **NestJS** (TypeScript) avec **TypeORM** et **MySQL**. Gère les métadonnées multi-tenant (utilisateurs, clés API, agents, documents, sessions et messages de chat ; appels vers le Data Plane pour l’ingestion et le RAG). Vue d’ensemble : [`README` racine](../../README.md) · UI : [`saas/frontend/README.md`](../frontend/README.md).

Préfixe HTTP global : **`/api/v1.0`**. **Swagger** : `http://localhost:<PORT>/docs` (HTTP Basic — `SWAGGER_USER` / `SWAGGER_PASSWORD`). Les clients envoient en général **`Authorization: Bearer <JWT>`** et **`X-API-Key`** (alignée sur un `token` dans `API_KEYS_JSON`). Exemples de domaines : **auth** (inscription, login, refresh, Google OAuth si configuré), **agents** (CRUD, documents, chat via le backend), **`GET /dashboard`** (indicateurs pour l’utilisateur connecté).

## Stack

- NestJS, TypeORM, `mysql2`, `@nestjs/config`, Passport (JWT, Google OAuth), Swagger, bcrypt, nodemailer, axios (vers l’agent)

## Configuration

Copier `.env.example` vers `.env` et adapter. Les variables essentielles :

| Variable | Description |
|----------|-------------|
| `PORT` | Port HTTP (défaut **8547**) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Connexion MySQL |
| `NODE_ENV` | En `production`, **synchronize** TypeORM est désactivé |
| `API_KEYS_JSON` ou `API_KEYS_FILE` | Clés **`X-API-Key`** (le serveur refuse de démarrer si aucune clé n’est chargée) |
| `JWT_SECRET` | Signature des JWT (et durées `JWT_*_EXPIRES_IN` dans `.env.example`) |
| `FRONTEND_URL` | Origine CORS et liens e-mail / OAuth (ex. `http://localhost:8548`) |
| `BACKEND_PUBLIC_URL` | URL publique du backend (liens dans les e-mails) |
| `DATA_PLANE_BASE_URL` | URL de l’agent FastAPI (ex. `http://127.0.0.1:8546` en local ; sous Docker : `http://agent:8000`) |
| `AGENT_API_X_KEY` | Valeur de l’en-tête **`X-API-Key`** vers le Data Plane — aligner avec **`INTERNAL_API_KEY`** dans `agent/.env` |

Google OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`), SMTP, TTL des tokens et Swagger : voir **`.env.example`**.

## Scripts

```bash
npm run start:dev    # développement (watch)
npm run build
npm run start:prod
npm run test
```

## Docker (dev)

Depuis ce dossier, avec une instance MySQL joignable depuis le conteneur (ex. `host.docker.internal` sous Docker Desktop) :

```bash
docker build -t synapse-control-api .
docker run --rm -p 8547:8547 --env-file .env synapse-control-api
```

Le conteneur expose le port **8547** et lance `npm run start:dev`.
