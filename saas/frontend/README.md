# Control Plane — Frontend (React)

Application **React** (TypeScript) construite avec **Vite** et **TailwindCSS**. Le client HTTP prévu est **Axios** (dépendance installée ; intégration API à brancher ultérieurement).

## Scripts

```bash
npm run dev       # Vite — port 8548, host 0.0.0.0 via config
npm run build
npm run preview
```

## Configuration

- Port et host : [`vite.config.ts`](vite.config.ts) (`server.port` **8548**, `server.host: true` pour Docker / réseau local).

## Docker (dev)

```bash
docker build -t synapse-control-ui .
docker run --rm -p 8548:8548 synapse-control-ui
```

Le conteneur expose **8548** et lance Vite avec `--host 0.0.0.0 --port 8548`.
