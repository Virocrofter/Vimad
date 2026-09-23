---

### Root `OPERATIONS.md`

````markdown
# Vimad PMS — Operations Runbook

## Overview

Vimad is a multi-tenant Property Management System (PMS) for hotels.

**Architecture:**

- `apps/api` — Node.js/Express backend with Prisma/PostgreSQL
- `apps/web` — React frontend (Vite)
- `packages/shared` — Shared TypeScript types/schemas

## Quick Start

### Development

```bash
# 1. Clone and install
git clone <repo>
cd Vimad
npm install

# 2. Start infrastructure
docker-compose up -d  # Postgres, Redis, MailHog

# 3. Setup database
cd apps/api
npx prisma migrate dev
npx prisma db seed

# 4. Start API (terminal 1)
npm run dev

# 5. Start Web (terminal 2)
cd ../web
npm run dev
```
````
