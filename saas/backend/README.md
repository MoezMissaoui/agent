# Control Plane — Backend (NestJS)

API **NestJS** (TypeScript) avec **TypeORM** et **MySQL**. Gère les métadonnées multi-tenant (utilisateurs, clés API, agents, documents, sessions de chat, messages).

## Stack

- NestJS, TypeORM, `mysql2`, `@nestjs/config`

## Configuration

Copier `.env.example` vers `.env` et adapter :

| Variable | Description |
|----------|-------------|
| `PORT` | Port HTTP (défaut **8547**) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Connexion MySQL |
| `NODE_ENV` | En `production`, **synchronize** TypeORM est désactivé |

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
