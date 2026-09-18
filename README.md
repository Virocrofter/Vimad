# Vimad PMS

Unified Property Management System — a multi-tenant SaaS for hotels: reservations, guest management, folios & billing, housekeeping, channel manager integrations, night audit, and a guest self-service portal.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Staff Web   │  │  Admin Web   │  │  Guest Portal    │  │
│  │  (React/Vite)│  │  (React/Vite)│  │  (React/Vite)    │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         └─────────────────┼───────────────────┘            │
│                           │ HTTPS / WSS                   │
├───────────────────────────┼───────────────────────────────┤
│                    Express API  (:3001)                     │
│  ┌─────────┬─────────┬─────────┬─────────┬───────────────┐ │
│  │  Auth   │  RBAC   │ Reservations │ Folios │ Channel   │ │
│  │ (JWT +  │ (roles +│  Guests    │ Billing │ Manager   │ │
│  │ refresh │ perms)  │  Rooms     │ Night   │ (Booking/ │ │
│  │ tokens) │ API keys│  Rates     │ Audit   │  Expedia) │ │
│  └─────────┴─────────┴─────────┴─────────┴───────────────┘ │
│        │                                                    │
│  BullMQ workers: email · reports · night-audit · billing ·  │
│  gdpr · dead-letter (Redis-backed, Bull Board at            │
│  /admin/queues)                                             │
├───────────────────────────┼───────────────────────────────┤
│  PostgreSQL (Prisma)      │  Redis (queues + rate limits) │
└───────────────────────────┴───────────────────────────────┘
```

- **Monorepo** managed with npm workspaces + Turborepo (`turbo.json`)
- **API**: Express + TypeScript + Prisma + Zod validation, OpenAPI docs at `/api-docs`
- **Web**: React 19 + Vite SPA (staff app, admin panel, guest portal, marketing site in one app)
- **Real-time**: Socket.IO (notifications, audit stream, live updates)
- **Background jobs**: BullMQ workers with dead-letter queue and retry/backoff

## Monorepo Layout

```
Vimad/
├── apps/
│   ├── api/                  # Express API
│   │   ├── prisma/           # Schema, migrations, seed
│   │   ├── src/
│   │   │   ├── common/       # env, logger, prisma, queue, rate-limit,
│   │   │   │                 # storage (S3/local), socket.io, metrics,
│   │   │   │                 # sanitize, idempotency, OpenAPI
│   │   │   ├── modules/      # Domain modules: auth, guests, reservations,
│   │   │   │                 # rooms, rates, folios, channel, housekeeping,
│   │   │   │                 # night-audit, guest-portal, notifications,
│   │   │   │                 # rbac, push, files, admin, audit, sms
│   │   │   ├── jobs/         # BullMQ workers + queue dashboard
│   │   │   └── index.ts      # App bootstrap (middleware order matters)
│   │   └── tests/            # Vitest unit + integration + Playwright e2e
│   └── web/                  # React SPA (see apps/web/README.md)
├── packages/
│   └── shared/               # Shared zod schemas + TS types
├── docker-compose.yml        # Dev: api + web + postgres + redis + mailhog
├── docker-compose.prod.yml   # Production compose
└── scripts/backup.sh         # Database backup script
```

## Quickstart

### Prerequisites

- Node.js 22+
- Docker (for Postgres + Redis + MailHog)

### 1. Clone and install

```bash
git clone <repo-url> && cd Vimad
npm install
```

### 2. Start infrastructure

```bash
docker compose up -d          # postgres, redis, mailhog
```

### 3. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
# Edit: DATABASE_URL, JWT_SECRET (≥32 chars), REDIS_URL
```

### 4. Migrate and seed

```bash
npm run db:migrate --workspace=apps/api
npm run db:seed   --workspace=apps/api
```

Seeds a demo tenant (`demo-hotel`), demo users, rooms, rate plans, a reservation, housekeeping tasks, and RBAC roles/permissions.

### 5. Run

```bash
npm run dev    # api on :3001, web on :5173 (via turbo)
```

| Service                      | URL                                |
| ---------------------------- | ---------------------------------- |
| Web app                      | http://localhost:5173              |
| API                          | http://localhost:3001              |
| API docs (Swagger UI)        | http://localhost:3001/api-docs     |
| OpenAPI JSON                 | http://localhost:3001/openapi.json |
| Queue dashboard (Bull Board) | http://localhost:3001/admin/queues |
| Metrics (Prometheus)         | http://localhost:3001/metrics      |
| MailHog (dev email)          | http://localhost:8025              |

### Demo credentials (from seed)

- Tenant slug: `demo-hotel`
- Emails: `admin@demo.com`, `frontdesk@demo.com` (passwords set via auth flow; the seed leaves passwordHash empty for demo users — register a new tenant or use forgot-password flow in dev)

## Common Commands

```bash
npm run dev                        # Start all apps (turbo)
npm run build                      # Build all
npm run test                       # Run all tests
npm run test --workspace=apps/api  # API tests only (vitest)
npm run lint                       # Lint all
npm run db:migrate --workspace=apps/api   # Prisma migrate dev
npm run db:studio --workspace=apps/api    # Prisma Studio
```

## API Overview

All endpoints are versioned (`/v1/...`) with legacy unversioned aliases. Auth uses JWT access tokens (15 min) + refresh tokens (30 days, DB-persisted with rotation and revocation).

Key route groups:

| Group                      | Base                                       | Notes                                                                    |
| -------------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| Auth                       | `/auth`                                    | register, login, refresh, password reset                                 |
| Properties                 | `/v1/properties`                           | multi-property per tenant                                                |
| Guests                     | `/v1/guests`                               | profiles, preferences, documents                                         |
| Reservations               | `/v1/reservations`                         | lifecycle: confirm → check-in → check-out                                |
| Rooms / Room Types / Rates | `/v1/rooms`, `/v1/room-types`, `/v1/rates` | inventory & pricing                                                      |
| Folios                     | `/v1/folios`                               | charges, payments, reversals, city ledger                                |
| Channel Manager            | `/v1/channel`                              | Booking.com & Expedia adapters, availability/rate push, reservation sync |
| Housekeeping               | `/v1/housekeeping`                         | task workflow with verification                                          |
| Night Audit                | `/v1/night-audit`                          | end-of-day close, idempotent per property/date                           |
| Guest Portal               | `/v1/guest-portal`                         | public: lookup, verify, check-in, digital key                            |
| Notifications / Push       | `/v1/notifications`, `/v1/push`            | in-app + web push (VAPID)                                                |
| RBAC                       | `/v1/rbac`, `/v1/api-keys`                 | roles, permissions, scoped API keys                                      |
| Admin                      | `/admin`                                   | platform-level KPIs, health, reports                                     |

Cross-cutting: request ID logging, Prometheus metrics, tiered rate limiting (per tenant plan), input sanitization, idempotency keys on POSTs, audit logging, Sentry error tracking.

## Deployment

See [OPERATIONS.md](./OPERATIONS.md) for full runbooks (deploy, rollback, backup, monitoring, incident response).

Short version:

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

The API container runs `prisma migrate deploy` on start, then serves traffic on :3001. The web container serves the built SPA via nginx.

## Documentation

- [apps/web/README.md](./apps/web/README.md) — web app conventions
- [OPERATIONS.md](./OPERATIONS.md) — deploy/rollback/backup/monitoring runbooks
- [CONTRIBUTING.md](./CONTRIBUTING.md) — branch strategy, commits, PR checklist
- API reference: live at `/api-docs` on any running instance
