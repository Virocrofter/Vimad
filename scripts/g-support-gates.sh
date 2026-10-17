#!/usr/bin/env bash
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PASS=0; FAIL=0
gate() { if ( eval "$2" ) >/dev/null 2>&1; then echo "PASS: $1"; PASS=$((PASS+1)); else echo "FAIL: $1"; FAIL=$((FAIL+1)); fi; }

echo "== 1. schema =="
gate "prisma validate" "cd '$ROOT/apps/api' && npx prisma validate"

echo "== 2. migration on disk =="
gate "tickets migration exists" "test -f '$ROOT/apps/api/prisma/migrations/20261017020000_add_support_tickets/migration.sql'"
gate "Ticket model in schema" "grep -q 'model Ticket {' '$ROOT/apps/api/prisma/schema.prisma'"
gate "TicketMessage model" "grep -q 'model TicketMessage {' '$ROOT/apps/api/prisma/schema.prisma'"

echo "== 2b. migration applied to DB =="
if command -v docker >/dev/null 2>&1 && docker compose ps postgres 2>/dev/null | grep -q "Up"; then
  gate "tickets table in DB" "docker compose exec -T postgres psql -U vimad -d unified_pms -tc \"SELECT to_regclass('public.tickets')\" | grep -q tickets"
  gate "ticket permissions in DB" "docker compose exec -T postgres psql -U vimad -d unified_pms -tc \"SELECT count(*) FROM permissions WHERE resource='ticket'\" | grep -q 3"
else
  echo "SKIP: db container not up"
fi

echo "== 3. backend source =="
gate "tickets routes" "test -f '$ROOT/apps/api/src/modules/tickets/tickets.routes.ts'"
gate "tickets guest routes" "test -f '$ROOT/apps/api/src/modules/tickets/tickets.guest.routes.ts'"
gate "tickets service" "test -f '$ROOT/apps/api/src/modules/tickets/tickets.service.ts'"
gate "tickets job" "test -f '$ROOT/apps/api/src/jobs/tickets.job.ts'"
gate "tickets queue registered" "grep -q \"'tickets'\" '$ROOT/apps/api/src/common/queue.ts'"
gate "staff router mounted" "grep -q '/v1/tickets' '$ROOT/apps/api/src/index.ts'"
gate "guest router mounted" "grep -q '/v1/guest-portal/support' '$ROOT/apps/api/src/index.ts'"
gate "openapi module wired" "grep -q ticketsModule '$ROOT/apps/api/src/common/openapi.ts'"
gate "permissions in seed.ts" "grep -q \"resource: 'ticket'\" '$ROOT/apps/api/prisma/seed.ts'"

echo "== 4. typecheck + build =="
gate "api tsc" "cd '$ROOT/apps/api' && npx tsc --noEmit"
gate "web build" "cd '$ROOT/apps/web' && npx vite build"

echo "== 5. runtime smoke =="
if curl -s -m 2 http://localhost:3001/health/live >/dev/null 2>&1; then
  TOKEN=$(curl -s -X POST http://localhost:3001/auth/login -H 'Content-Type: application/json' \
    -d '{"email":"admin@demo.com","password":"admin123","tenantSlug":"demo-hotel"}' \
    | python3 -c '
import sys, json
d = json.load(sys.stdin)
d = d.get("data", d)
print(d.get("accessToken") or d.get("token") or "")
' 2>/dev/null)
  if [ -n "${TOKEN:-}" ]; then
    AUTH="Authorization: Bearer $TOKEN"
    gate "GET /v1/tickets 200" "test \$(curl -s -o /dev/null -w '%{http_code}' -H '$AUTH' http://localhost:3001/v1/tickets) = 200"
    gate "GET /v1/tickets/stats 200" "test \$(curl -s -o /dev/null -w '%{http_code}' -H '$AUTH' http://localhost:3001/v1/tickets/stats) = 200"
    NEW=$(curl -s -X POST -H "$AUTH" -H 'Content-Type: application/json' \
      -d '{"subject":"Gate test ticket","description":"created by gates script","category":"general","priority":"low"}' \
      http://localhost:3001/v1/tickets)
    TID=$(echo "$NEW" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("data",{}).get("id",""))' 2>/dev/null)
    if [ -n "${TID:-}" ]; then
      gate "POST comment" "test \$(curl -s -o /dev/null -w '%{http_code}' -X POST -H '$AUTH' -H 'Content-Type: application/json' -d '{\"message\":\"gate reply\",\"isInternal\":false}' http://localhost:3001/v1/tickets/$TID/comments) = 200"
      gate "resolve" "test \$(curl -s -o /dev/null -w '%{http_code}' -X PUT -H '$AUTH' -H 'Content-Type: application/json' -d '{\"status\":\"resolved\"}' http://localhost:3001/v1/tickets/$TID) = 200"
      gate "close" "test \$(curl -s -o /dev/null -w '%{http_code}' -X POST -H '$AUTH' http://localhost:3001/v1/tickets/$TID/close) = 200"
      echo "  (gate ticket $TID left closed)"
    else
      echo "FAIL: ticket create — response: $(echo "$NEW" | head -c 200)"
      FAIL=$((FAIL+1))
    fi
  else
    echo "SKIP: no login token"
  fi
else
  echo "SKIP: API not running"
fi

echo ""
echo "== RESULT: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ]
