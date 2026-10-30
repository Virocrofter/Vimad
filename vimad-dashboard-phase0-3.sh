#!/usr/bin/env bash
# Vimad — Phase 0 + Dashboard Slice bootstrap (hotel dashboard focus)
# Run from repo root. Idempotent: safe to re-run; evidence lands in ./.vimad-evidence/
set -uo pipefail

EVIDENCE=".vimad-evidence/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$EVIDENCE"
log(){ echo -e "\n\033[1;36m== $* \033[0m"; }
ok(){ echo -e "\033[1;32m   OK: $*\033[0m"; }
warn(){ echo -e "\033[1;33m   WARN: $*\033[0m"; }

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
log "Repo root: $ROOT"

# ─── STEP 1 — Bring the stack up (API + Postgres + Redis + web)
log "STEP 1: docker compose up (db, redis, api, web)"
docker compose up -d --build 2>&1 | tee "$EVIDENCE/01-docker-up.log"
sleep 8
for i in $(seq 1 30); do
  curl -fsS http://localhost:3001/health/live >/dev/null 2>&1 && break
  sleep 2
done
curl -fsS http://localhost:3001/health/live | tee "$EVIDENCE/02-api-health.json" && ok "API healthy" || warn "API not healthy — check 01-docker-up.log"

# ─── STEP 2 — PHASE 0 GATE 1: schema drift (shadow DB diff, review only)
log "STEP 2: shadow DB drift check (schema.prisma vs migrations)"
docker compose up -d postgres 2>/dev/null
docker compose exec -T postgres psql -U vimad -c "DROP DATABASE IF EXISTS vimad_shadow;" -c "CREATE DATABASE vimad_shadow;" 2>/dev/null \
  || warn "shadow DB not created — migrate diff will fail; check service name with: docker compose config --services"
npx prisma migrate diff \
  --from-migrations ./apps/api/prisma/migrations \
  --to-schema-datamodel ./apps/api/prisma/schema.prisma \
  --shadow-database-url "postgresql://vimad:vimad_dev_password@localhost:5432/vimad_shadow" \
  --script > "$EVIDENCE/03-schema-drift.sql" 2>"$EVIDENCE/03-schema-drift.err" \
  && ok "drift SQL written to $EVIDENCE/03-schema-drift.sql" || warn "migrate diff failed — see 03-schema-drift.err"
grep -Ei "Marketing|DROP|CREATE TABLE" "$EVIDENCE/03-schema-drift.sql" 2>/dev/null | head -40 | tee "$EVIDENCE/04-drift-summary.txt"
echo ">>> REVIEW 03-schema-drift.sql BEFORE any 'prisma migrate dev'."

# ─── STEP 3 — PHASE 0 GATE 2: migrate + seed demo data
log "STEP 3: prisma migrate deploy + seed"
(cd apps/api && npx prisma migrate deploy 2>&1 | tee "../../$EVIDENCE/05-migrate.log") \
  && ok "migrations applied" || warn "migrate deploy issues — check log"
(cd apps/api && npx prisma db seed 2>&1 | tee "../../$EVIDENCE/06-seed.log") \
  && ok "seed complete" || warn "seed failed — check log"

# ─── STEP 4 — PHASE 0 GATE 3: audit-trail smoke
log "STEP 4: audit smoke (ticket 3)"
TOKEN=$(curl -fsS -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.com","password":"admin123"}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('accessToken') or d.get('token',''))" 2>/dev/null)
if [ -n "${TOKEN:-}" ]; then
  echo "$TOKEN" > "$EVIDENCE/07-token.txt"
  curl -fsS http://localhost:3001/api/audit-logs -H "Authorization: Bearer $TOKEN" \
    | python3 -c "import sys,json;d=json.load(sys.stdin);print('audit rows:',len(d if isinstance(d,list) else d.get('data',d.get('items',[]))))" \
    | tee "$EVIDENCE/08-audit-smoke.txt" && ok "audit trail reachable"
else
  warn "login failed — check 05-migrate.log / 06-seed.log"
fi

# ─── STEP 5 — Dashboard gate scripts
log "STEP 5: run dashboard-related gate scripts"
for g in scripts/g-dashboard-gates.sh scripts/g-dashboard-d2-gates.sh scripts/g-dashboard-d3-gates.sh; do
  if [ -f "$g" ]; then
    bash "$g" 2>&1 | tee "$EVIDENCE/09-$(basename "$g" .sh).log" \
      && ok "$g passed" || warn "$g FAILED — inspect log"
  else
    warn "$g not found"
  fi
done

# ─── STEP 6 — Web build + API typecheck (baseline before dashboard work)
log "STEP 6: web build & typecheck"
npm run build --workspace=apps/web 2>&1 | tee "$EVIDENCE/10-web-build.log" \
  && ok "web builds" || warn "web build failed — fix baseline before dashboard slice"
(cd apps/api && npx tsc --noEmit 2>&1 | tee "../../$EVIDENCE/11-api-tsc.log") \
  && ok "api typecheck clean" || warn "api typecheck warnings — see log"

# ─── STEP 7 — Dev environment ready
log "STEP 7: start dev servers for dashboard work"
echo "  API:  npm run dev --workspace=apps/api    (port 3001)"
echo "  Web:  npm run dev --workspace=apps/web    (port 5173)"
echo "  Demo login: admin@demo.com / admin123  |  frontdesk@demo.com / frontdesk123"
log "DONE — evidence in $EVIDENCE/"
echo "Next manual checks (record in tracker):"
echo "  1. Open http://localhost:5173/app/dashboard — screenshot Today view into $EVIDENCE/"
echo "  2. Ticket 7: document current nav/roles/empty-error states in tracker"
echo "  3. Ticket 8: build Today cockpit slice behind feature flag"
