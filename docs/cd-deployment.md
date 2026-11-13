# Continuous Deployment (CD) Guide for NextGM

NextGM features an automated Continuous Deployment (CD) pipeline powered by GitHub Actions, GitHub Container Registry (GHCR), and Render.

---

## Architecture Overview

```text
Git Push to main / Manual Dispatch
               │
               ▼
   [ GitHub Actions CD Workflow ]
               │
   ┌───────────┴───────────┐
   ▼                       ▼
Client Tests & Build    Server Tests & Build (PostgreSQL + Redis)
   │                       │
   └───────────┬───────────┘
               ▼
[ Build & Publish Docker Images to GHCR ]
  ├── ghcr.io/<org>/nextgm-server:<sha> / :latest
  └── ghcr.io/<org>/nextgm-client:<sha> / :latest
               │
               ▼
[ Trigger Render Deployment Hooks ]
  ├── NextGM API Service (POST /deploy/srv-...)
  ├── NextGM Background Worker (POST /deploy/srv-...)
  └── NextGM Client Frontend (POST /deploy/srv-...)
               │
               ▼
[ Post-Deployment Health Check ]
  └── Poll https://<your-service>.onrender.com/health
               │
               ▼
[ GitHub Step Summary Report ]
```

---

## 1. Automated GitHub Actions CD (`.github/workflows/cd.yml`)

The CD workflow triggers on:
1. **Push to `main` branch:** Whenever code is merged into `main`, the CD pipeline runs pre-deployment checks, builds Docker images, pushes them to GHCR, and fires the Render deployment hooks.
2. **Manual Dispatch (`workflow_dispatch`):** Run on-demand from GitHub's **Actions** tab with configurable options:
   - `environment`: `production` or `staging`
   - `deploy_api`: `true` / `false`
   - `deploy_client`: `true` / `false`
   - `skip_tests`: `false` (set `true` only for emergency production hotfixes)

### Pipeline Stages

1. **Pre-deployment Verification (`verify`):**
   - Validates client linting and Vite build.
   - Spins up ephemeral PostgreSQL 16 and Redis 7 containers.
   - Runs Prisma generation, migration deploy, TypeScript build, and Vitest test suite.
   - Validates `docker compose config`.
2. **Container Build & Registry Publication (`build-and-push-images`):**
   - Uses Docker Buildx with GitHub Actions caching (`type=gha`).
   - Authenticates using GitHub's automatic `GITHUB_TOKEN` (no external Docker Hub account required).
   - Publishes `server` and `client` images to `ghcr.io/<owner>/<repo>/server` and `ghcr.io/<owner>/<repo>/client` tagged with `:latest` and `:sha-<commit>`.
3. **Trigger Deployment (`deploy`):**
   - Invokes Render Deploy Hooks via secure HTTPS POST requests.
   - Supports individual hooks for API, Worker, and Client.
   - If secrets are not yet configured, cleanly informs the administrator with setup instructions without crashing.
4. **Health Verification (`health-check`):**
   - Periodically polls the `/health` endpoint until HTTP 200 is confirmed (or timeout).
5. **Deployment Summary (`summary`):**
   - Writes a detailed status summary directly into the GitHub Actions run summary.

---

## 2. Infrastructure as Code: Render Blueprint (`render.yaml`)

NextGM provides a complete `render.yaml` blueprint defining the infrastructure stack:

| Resource | Service Type | Runtime | Description |
|---|---|---|---|
| `nextgm-api` | Web Service | Docker | Express REST API server, runs `prisma migrate deploy` on startup, exposes `/health` |
| `nextgm-worker` | Background Worker | Docker | BullMQ worker running `node dist/worker.js` for asynchronous emails and notifications |
| `nextgm-client` | Static Site / Web | Static SPA | Vite + React frontend with client-side routing fallback (`/* -> /index.html`) |
| `nextgm-postgres` | Managed Database | PostgreSQL 16 | Primary ACID relational database |
| `nextgm-redis` | Redis Key-Value Store | Redis | Queue broker for BullMQ and session caching |

### Launching with Render Blueprint
1. Go to the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Blueprint**.
3. Connect your GitHub repository (`RoyalDani12/nextGM`).
4. Render will read `render.yaml` and prompt you for any non-synced secrets (Stripe keys, Cloudinary, etc.).
5. Click **Apply** to deploy the entire stack simultaneously.

---

## 3. GitHub Secrets Configuration

To connect GitHub Actions CD to your deployed Render services:

1. Navigate to your GitHub repository: **Settings** > **Secrets and variables** > **Actions**.
2. Add the following repository secrets:

| Secret Name | Description | Required / Optional |
|---|---|---|
| `RENDER_API_DEPLOY_HOOK` | Render Deploy Hook URL for `nextgm-api` | **Recommended** |
| `RENDER_WORKER_DEPLOY_HOOK` | Render Deploy Hook URL for `nextgm-worker` | Optional |
| `RENDER_CLIENT_DEPLOY_HOOK` | Render Deploy Hook URL for `nextgm-client` | Optional (if deploying client on Render) |
| `HEALTHCHECK_URL` | Production health check URL (e.g. `https://nextgm-1.onrender.com/health`) | **Recommended** |
| `PROD_VITE_API_URL` | Production API endpoint injected into client Docker image | Optional (defaults to production URL) |
| `PROD_VITE_STRIPE_PUBLISHABLE_KEY` | Production Stripe publishable key for client build | Optional |

### How to get a Deploy Hook URL in Render:
1. In Render Dashboard, click your Web Service or Worker (`nextgm-api`).
2. Go to **Settings** > scroll to **Deploy Hook**.
3. Copy the URL (format: `https://api.render.com/deploy/srv-xxxxxxxxxxxx?key=yyyyyyyy`).
4. Paste it into the corresponding GitHub Secret.

---

## 4. Local / Manual Deployment Helper (`scripts/deploy.sh`)

You can also trigger deployments directly from your terminal:

```bash
# Export your deploy hook
export RENDER_API_DEPLOY_HOOK="https://api.render.com/deploy/srv-xxx?key=yyy"
export HEALTHCHECK_URL="https://nextgm-1.onrender.com/health"

# Deploy API only
./scripts/deploy.sh api

# Deploy all services and verify health
VERIFY_HEALTH=1 ./scripts/deploy.sh all
```

---

## 5. Rollback Procedures

If a deployment fails or introduces regressions:

1. **Fast Rollback via Render Dashboard:**
   - Go to `nextgm-api` in Render Dashboard.
   - Click **Events** / **Deploys**.
   - Find the previous known-good deploy and click **Rollback to this deploy**.
2. **Git Revert:**
   ```bash
   git revert HEAD
   git push origin main
   ```
   The CD pipeline will automatically run and redeploy the previous state.
3. **Database Migration Safety:**
   - NextGM runs `npx prisma migrate deploy` on boot.
   - Always write non-destructive migrations (expand before contract) to ensure zero-downtime rollbacks.
   - Never run `prisma migrate reset` in production.
