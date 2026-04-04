# Synapse IA

Monorepo pour une plateforme **RAG multi-tenant** : un **Control Plane** (SaaS — métadonnées, API applicative) et un **Data / AI Plane** (ingestion vectorielle et chat RAG).

| Composant | Chemin | Rôle |
|-----------|--------|------|
| Control Plane — API | [`saas/backend`](saas/backend) | NestJS, TypeORM, MySQL — utilisateurs, agents, documents (statut), sessions, messages |
| Control Plane — UI | [`saas/frontend`](saas/frontend) | React, Vite, Tailwind — application web |
| Data / AI Plane | [`agent`](agent) | FastAPI, ChromaDB, LLM (Gemini / OpenAI) — ingestion et chat internes |

Documentation technique consolidée : [`docs/TECHNICAL.md`](docs/TECHNICAL.md).

## Interface web (Control Plane UI)

Application React dans [`saas/frontend`](saas/frontend) : authentification (email / mot de passe, Google si `VITE_GOOGLE_AUTH_ENABLED`), shell admin avec sidebar, thème clair / sombre.

| Zone | Contenu |
|------|---------|
| **Dashboard** | Indicateurs pour l’utilisateur connecté (agents, documents indexés, chat 24h), sessions récentes, liens rapides |
| **Agents** | Création / édition d’agents, ingestion de documents (PDF / TXT), chat RAG avec sessions |
| **API access** / **Settings** | Pages produit (intégration API, réglages workspace) — pas de placeholder générique |
| **Profil** | Compte, mot de passe |

La navigation met l’accent sur **Agents** (flux principal). Détails techniques du client HTTP, variables `VITE_*` : voir [`saas/frontend/README.md`](saas/frontend/README.md).

## Prérequis

- **Node.js 20** (npm) pour `saas/backend` et `saas/frontend`
- **MySQL 8** (ou compatible) pour le Control Plane
- **Python 3.10+** pour `agent` (voir le README du dossier `agent`)
- **Docker** (optionnel) pour les Dockerfiles de dev et pour le compose du service `agent`

## Docker — stack complète (racine)

Fichiers : [`docker-compose.yml`](docker-compose.yml), [`docker-compose.dev.yml`](docker-compose.dev.yml) (hot reload Nest + Vite + agent), [`.env.example`](.env.example). Raccourcis : [`Makefile`](Makefile) à la racine (`make help`, `make up-build`, `make dev-build`, etc.).

1. Copier `.env.example` vers `.env` à la racine (`MYSQL_ROOT_PASSWORD`, ports `CONTROL_*`, `API_PORT=8546` par défaut pour le port hôte de l’agent).
2. Copier `agent/.env.example` vers `agent/.env` (clés LLM ; y définir **`API_PORT=8546`** pour le port hôte si tu utilises la commande ci-dessous).
3. Lancer (recommandé — `API_PORT` lu depuis `agent/.env`) :

```bash
docker compose --env-file .env --env-file agent/.env up --build
```

Sinon : `docker compose up --build` (port hôte agent **8546** par défaut, sauf `API_PORT` dans le seul `.env` racine).

Services exposés : **MySQL** (`MYSQL_PORT`, défaut 3306), **phpMyAdmin** (`PHPMYADMIN_PORT`, défaut **8550** — connexion serveur `mysql`, utilisateur `root`), **Control API** (8547), **Control UI** (8548), **agent** (**8546** ou la valeur de `API_PORT` → **8000** dans le conteneur). Le backend attend MySQL via le hostname Docker `mysql`.

Développement (reload backend, frontend et agent sans rebuild à chaque edit) :

```bash
docker compose --env-file .env --env-file agent/.env -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Le fichier [`docker-compose.dev.yml`](docker-compose.dev.yml) monte le code (`agent/app`, `run.py`) et mappe **`./agent/logs` → `/data/logs`** dans le conteneur agent pour voir les journaux sur l’hôte.

Puis `make dev` pour relancer sans `--build` quand seul le code change.

## Démarrage rapide

1. **MySQL** : créer une base (ex. `synapse_control`) et copier [`saas/backend/.env.example`](saas/backend/.env.example) vers `saas/backend/.env`.
2. **Backend** : `cd saas/backend && npm run start:dev` — écoute par défaut sur le port **8547** (voir `.env`).
3. **Frontend** : `cd saas/frontend && npm run dev` — port **8548** (voir `vite.config.ts`).
4. **Agent** : suivre [`agent/README.md`](agent/README.md) (Python ou Docker Compose).

Les README de chaque dossier détaillent les commandes et variables d’environnement.
