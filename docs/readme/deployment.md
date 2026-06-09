# 11. Deployment & Production Setup

[← Back to README](../../README.md)

---

## 11.1 Docker Setup

- Dockerfile included ✅
- docker-compose.yml included ✅

**`Dockerfile`** — multi-stage production build (`base → deps → builder → runner`):

```dockerfile
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* are passed as build args and inlined into the client bundle
ARG NEXT_PUBLIC_FIREBASE_API_KEY
# ... (remaining NEXT_PUBLIC_* args) ...
RUN npx prisma generate
RUN npm run build

FROM base AS runner
# non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/generated ./generated
USER nextjs
EXPOSE 3010
ENV NODE_ENV=production PORT=3010 HOSTNAME=0.0.0.0
HEALTHCHECK CMD node -e "fetch('http://127.0.0.1:3010/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server.js"]
```

> Key details: Node 22 (Debian slim, not Alpine — Prisma needs `openssl`), Next.js **standalone** output, runs as a **non-root** `nextjs` user, ships the generated Prisma client (`/app/generated`), and has a built-in `/api/health` HEALTHCHECK.

**`docker-compose.yml`** — profile-based:

- **`local` profile** (dev): runs `db` (Postgres 16) + `minio` + `app` so the full stack comes up with `docker compose --profile local up`.
- **Production** (no profile): only `minio` and `app` run. The database is **Neon** (serverless managed PostgreSQL) — reached via `DATABASE_URL`, not started by compose.

```yaml
name: classmate

services:
  db:
    profiles: ['local'] # dev only — prod uses an external managed Postgres
    image: postgres:16-alpine
    # ...

  minio:
    profiles: ['local'] # in prod, started explicitly by the deploy job
    image: minio/minio:latest
    command: server /data --console-address :9001
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - '127.0.0.1:9000:9000'
      - '127.0.0.1:9001:9001'
    restart: unless-stopped

  app:
    image: ${DOCKER_USERNAME:-local}/classmate:${IMAGE_TAG:-latest}
    build:
      context: .
      args: # NEXT_PUBLIC_* inlined at build time
        NEXT_PUBLIC_BETTER_AUTH_URL: ${NEXT_PUBLIC_BETTER_AUTH_URL}
        # ... Firebase NEXT_PUBLIC_* ...
    env_file:
      - .env.production
    ports:
      - '3010:3010'
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:
```

---

## 11.2 Production Environment

### Environment Variables

| Variable                                   | Purpose                                        |
| :----------------------------------------- | :--------------------------------------------- |
| `DATABASE_URL`                             | Neon (serverless PostgreSQL) connection string |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase client API key                        |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain                           |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Firebase project ID                            |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket                        |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID                   |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Firebase app ID                                |
| `FIREBASE_PROJECT_ID`                      | Firebase Admin project ID                      |
| `FIREBASE_CLIENT_EMAIL`                    | Firebase Admin client email                    |
| `FIREBASE_PRIVATE_KEY`                     | Firebase Admin private key (base64)            |
| `MINIO_ENDPOINT`                           | MinIO server hostname                          |
| `MINIO_PORT`                               | MinIO server port (default 9000)               |
| `MINIO_USE_SSL`                            | TLS for MinIO (`true`/`false`)                 |
| `MINIO_ACCESS_KEY`                         | MinIO access key                               |
| `MINIO_SECRET_KEY`                         | MinIO secret key                               |
| `MINIO_BUCKET_NAME`                        | MinIO bucket name                              |
| `OLLAMA_MODEL`                             | Override chat model (default `gemma4:26b`)     |
| `BETTER_AUTH_SECRET`                       | Better Auth session signing secret             |
| `BETTER_AUTH_URL`                          | Better Auth base URL                           |

### Secrets Handling

- All secrets are stored as **environment variables** — never committed to the repository.
- `.env` and `.env.local` are in `.gitignore`.
- In production, secrets are injected by the GitHub Actions deploy workflow, which writes a `.env.production` file on the VPS from GitHub Secrets before starting the container.
- The Firebase private key is stored base64-encoded and decoded at runtime to avoid newline issues in environment variables.

### HTTPS Configuration

- HTTPS is handled by the hosting platform's reverse proxy / load balancer.
- The application itself runs on HTTP internally; TLS termination happens at the platform edge.
- Session cookies are set with `Secure: true` in production, ensuring they are only sent over HTTPS.

### Domain Configuration

- Domain is configured via the hosting platform's DNS settings.
- Cloudflare is used for DNS management and DDoS protection (as provided by the lab instructor).

---

## 11.3 Live Application URL

https://e2526-wads-b4ac.csbihub.id/

---

## 16. Setup Instructions (Local Development)

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or use Docker Compose)
- npm

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/kennytangg/classmate.git
cd classmate

# 2. Install dependencies
npm install

# 3. Copy environment template and fill in values
cp .env.example .env.local
# Edit .env.local with your Firebase, MinIO, and PostgreSQL credentials

# 4. Generate Prisma client
npx prisma generate

# 5. Apply database migrations
npx prisma migrate dev

# 6. Seed the database (optional)
npx prisma db seed

# 7. Start the development server
npm run dev
# App available at http://localhost:3000 (dev port; production runs on 3010)
```

### Using Docker

```bash
# Start the full stack (local profile includes Postgres + MinIO)
docker compose --profile local up --build

# In a separate terminal, run migrations
docker compose exec app npx prisma migrate deploy

# App available at http://localhost:3010
```

---

## 17. Deployment Instructions

### Deploy to Production

Production is deployed automatically via GitHub Actions on every push to `main`. To trigger manually:

```bash
git push origin main
# GitHub Actions runs quality → build → deploy
```

Manual steps if needed on the VPS (via Cloudflare Access tunnel or campus network):

```bash
# Pull latest image
docker compose pull app

# Restart app (Prisma migrations run automatically on startup)
docker compose up -d --no-deps --wait app

# Smoke-test
curl http://127.0.0.1:3010/api/health
```

### CI/CD via GitHub Actions

`.github/workflows/ci.yml` runs automatically on every push to `main`:

1. **quality** — `npm run lint`, `npm test`, `npm run build`
2. **build** — Docker image built and pushed to Docker Hub
3. **deploy** — self-hosted runner on the BINUS VPS:
   - Writes `.env.production` from GitHub Secrets
   - Pulls new image, starts MinIO, starts/replaces app container
   - Smoke-tests `http://127.0.0.1:3010/api/health`
   - Removes `.env.production`, prunes dangling images

### Environment Variables in Production

All variables listed in Section 11.2 are stored as **GitHub Secrets** and injected at deploy time. Never commit `.env` files.
