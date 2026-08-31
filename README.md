# Unified PMS

A modern, cloud-native property management system (PMS) for hotels and hospitality groups.

## Monorepo Structure

```
.
├── apps/
│   ├── web/          # React + Vite + Tailwind CSS frontend (staff PMS, guest portal, admin)
│   └── api/          # Node.js + Express + Prisma backend
├── packages/
│   └── shared/       # Shared types, validators, and utilities
├── docker-compose.yml
└── turbo.json
```

## Quick Start

### Prerequisites

- Node.js >= 22
- npm >= 10
- PostgreSQL 16+ (local or via `docker compose`)
- Redis 7+ (optional for Phase 1)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Update `apps/api/.env` with your Postgres connection string.

### 3. Start Postgres

With Docker Compose:

```bash
docker compose up -d
```

Or use any locally running Postgres and update `DATABASE_URL` accordingly.

### 4. Run database migrations

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start dev servers

```bash
npm run dev
```

- Web app: http://localhost:5173
- API: http://localhost:3001

## Scripts

| Command              | Description                   |
| -------------------- | ----------------------------- |
| `npm run dev`        | Start all dev servers         |
| `npm run build`      | Build all apps and packages   |
| `npm run test`       | Run all tests                 |
| `npm run lint`       | Lint all code                 |
| `npm run typecheck`  | Type-check all code           |
| `npm run format`     | Format all code with Prettier |
| `npm run db:migrate` | Run database migrations       |
| `npm run db:seed`    | Seed the database             |

## Core API Endpoints (Phase 1)

| Method | Endpoint         | Auth     | Description                     |
| ------ | ---------------- | -------- | ------------------------------- |
| `POST` | `/auth/register` | Public   | Create tenant + owner user      |
| `POST` | `/auth/login`    | Public   | Login and receive JWT           |
| `GET`  | `/health`        | Public   | Health check with DB status     |
| `GET`  | `/properties`    | Required | List properties (tenant-scoped) |
| `POST` | `/properties`    | Required | Create property                 |
| `GET`  | `/guests`        | Required | List guests                     |
| `POST` | `/guests`        | Required | Create guest                    |
| `GET`  | `/reservations`  | Required | List reservations               |
| `POST` | `/reservations`  | Required | Create reservation              |

All protected endpoints require `Authorization: Bearer <token>`.

## Environments

- `develop` → auto-deploys to Staging
- `main` → deploys to Production (manual approval)

See `.github/workflows/` for CI/CD details.
