# Control Plane — Frontend (React)

Client web **React 19** + **TypeScript**, **Vite 8**, **TailwindCSS**, **React Router 7**, **Axios** (appels vers l’API Nest du Control Plane). UI admin : layout avec sidebar, **Framer Motion** pour les modales / transitions.

## Scripts

```bash
npm install
npm run dev       # Vite — port 8548, host 0.0.0.0 (voir vite.config.ts)
npm run build     # tsc + build production
npm run preview
npm run lint
```

## Variables d’environnement

Fichier **`.env`** à la racine de ce dossier — modèle : [`.env.example`](.env.example).

| Variable | Rôle |
|----------|------|
| `VITE_API_URL` | URL de base du backend (ex. `http://localhost:8547`) — préfixe `/api/v1.0` ajouté dans les modules API |
| `VITE_API_KEY` | Clé `X-API-Key` attendue par le Control Plane (ne pas committer de secret réel) |
| `VITE_APP_NAME` | Nom affiché (défaut : Synapse) — [`src/lib/brand.ts`](src/lib/brand.ts) |
| `VITE_GOOGLE_AUTH_ENABLED` | `true` pour afficher « Continue with Google » sur login / register |

## Routes admin (`/admin`)

| Chemin | Page |
|--------|------|
| `/admin` | Dashboard (métriques utilisateur + quick start) |
| `/admin/agents` | Gestion des agents, documents, chat |
| `/admin/api-keys` | Documentation produit — accès API |
| `/admin/settings` | Paramètres workspace (lien profil / agents) |
| `/admin/profile` | Compte utilisateur |

Toutes les requêtes authentifiées envoient le **Bearer JWT** (stockage local) en plus de **`X-API-Key`** si configurée.

## Docker

```bash
docker build -t synapse-control-ui .
docker run --rm -p 8548:8548 synapse-control-ui
```

Le conteneur expose **8548** et lance Vite avec `--host 0.0.0.0 --port 8548`.

Voir le **README** à la racine du dépôt pour la stack Compose complète (MySQL, backend, frontend, agent).
