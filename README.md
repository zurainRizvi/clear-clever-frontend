# ClearClever — Frontend

[![CI](https://github.com/zurainRizvi/clear-clever-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/zurainRizvi/clear-clever-frontend/actions/workflows/ci.yml)

React + Vite UI for the ClearClever insurance aggregator (FYP).

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:5000`) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (used by Vercel and CI) |
| `npm run preview` | Preview production build |

## CI / CD

GitHub Actions: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

| Trigger | Job | Steps |
|---------|-----|-------|
| `push` / `pull_request` to `main` | `build` | `npm ci` → `vite build` (with `VITE_API_URL` from repo Variable, fallback to the Render URL) → upload `dist` artifact |
| `push` to `main` after `build` passes | `deploy-trigger` | Vercel auto-deploys via the Git integration |

[`vercel.json`](vercel.json) ensures React Router routes (e.g. `/dashboard`, `/signin`) are rewritten to `index.html` so deep links work after refresh.

### Configure `VITE_API_URL`

This must be set **before** the Vite build runs (it's baked into the bundle).

| Where | How |
|-------|-----|
| **Vercel** | Project → **Settings** → **Environment Variables** → add `VITE_API_URL` = your Render API URL (Production scope) |
| **GitHub Actions** | Repo → **Settings** → **Secrets and variables** → **Actions** → **Variables** tab → add `VITE_API_URL` (so PR build artifacts use the same URL) |

If you don't set the GitHub variable, CI falls back to `https://clearclever-api.onrender.com` so the build still works.

### Optional: drive Vercel from CI instead of Git integration

Uncomment the `Vercel deploy via CLI` step in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) and add these GitHub secrets:

| Secret | How to get |
|--------|------------|
| `VERCEL_TOKEN` | Vercel → Account → **Tokens** → Create |
| `VERCEL_ORG_ID` | Vercel → Project → **Settings** → General → Organization ID |
| `VERCEL_PROJECT_ID` | Vercel → Project → **Settings** → General → Project ID |

## Repository

https://github.com/zurainRizvi/clear-clever-frontend
