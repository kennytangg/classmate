# 11. Deployment & Production Setup

[← Back to README](../../README.md)

---

## 11.1 Docker Setup

- Dockerfile included ✅
- docker-compose.yml included ✅

**`Dockerfile`** — multi-stage production build:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

**`docker-compose.yml`** — full stack (app + PostgreSQL):

```yaml
services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/classmate
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: classmate
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## 11.2 Production Environment

### Environment Variables

| Variable                                   | Purpose                                    |
| :----------------------------------------- | :----------------------------------------- |
| `DATABASE_URL`                             | PostgreSQL connection string               |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase client API key                    |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain                       |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Firebase project ID                        |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket                    |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID               |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Firebase app ID                            |
| `FIREBASE_PROJECT_ID`                      | Firebase Admin project ID                  |
| `FIREBASE_CLIENT_EMAIL`                    | Firebase Admin client email                |
| `FIREBASE_PRIVATE_KEY`                     | Firebase Admin private key (base64)        |
| `MINIO_ENDPOINT`                           | MinIO server hostname                      |
| `MINIO_PORT`                               | MinIO server port (default 9000)           |
| `MINIO_USE_SSL`                            | TLS for MinIO (`true`/`false`)             |
| `MINIO_ACCESS_KEY`                         | MinIO access key                           |
| `MINIO_SECRET_KEY`                         | MinIO secret key                           |
| `MINIO_BUCKET_NAME`                        | MinIO bucket name                          |
| `OLLAMA_MODEL`                             | Override chat model (default `gemma4:26b`) |
| `BETTER_AUTH_SECRET`                       | Better Auth session signing secret         |
| `BETTER_AUTH_URL`                          | Better Auth base URL                       |

### Secrets Handling

- All secrets are stored as **environment variables** — never committed to the repository.
- `.env` and `.env.local` are in `.gitignore`.
- In production, secrets are injected via the hosting platform's secret manager (e.g., Railway, Vercel, Render environment settings).
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
# App available at http://localhost:3000
```

### Using Docker

```bash
# Start the full stack
docker compose up --build

# In a separate terminal, run migrations
docker compose exec app npx prisma migrate deploy

# App available at http://localhost:3000
```

---

## 17. Deployment Instructions

### Deploy to Production

```bash
# 1. Build the production image
docker build -t classmate:latest .

# 2. Push to container registry (example: Docker Hub)
docker tag classmate:latest your-registry/classmate:latest
docker push your-registry/classmate:latest

# 3. On the production server, pull and run
docker compose -f docker-compose.prod.yml up -d

# 4. Apply database migrations in production
docker compose exec app npx prisma migrate deploy
```

### CI/CD via GitHub Actions

`.github/workflows/ci.yml` runs automatically on every push to `main`:

1. Install dependencies
2. Run `npm run lint`
3. Run `npm test`
4. Build the Docker image
5. Push to registry (on `main` branch only)
6. Deploy to production server

### Environment Variables in Production

Set all variables listed in Section 11.2 in your hosting platform's environment / secret manager. Never commit `.env` files.
