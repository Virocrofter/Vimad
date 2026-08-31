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
- Docker & Docker Compose (for local Postgres + Redis)

### 1. Install dependencies

```bash
npm install
```

### 2. Start local infrastructure

```bash
docker compose up -d
```

### 3. Run database migrations

```bash
npm run db:migrate
npm run db:seed
```

### 4. Start dev servers

```bash
npm run dev
```

- Web app: http://localhost:5173
- API docs: http://localhost:3001/docs

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

## Environments

- `develop` → auto-deploys to Staging
- `main` → deploys to Production (manual approval)

See `.github/workflows/` for CI/CD details.
