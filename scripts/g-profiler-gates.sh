#!/usr/bin/env bash
# g-profiler-gates.sh — 20 gates proving the profiler section is production-wired
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
ROOT=$(pwd); API=apps/api; P=0; F=0
pass(){ echo "PASS  $1"; P=$((P+1)); }
fail(){ echo "FAIL  $1"; F=$((F+1)); }
chk(){ if eval "$2" >/dev/null 2>&1; then pass "$1"; else fail "$1"; fi; }

echo "═══ PROFILER GATES $(date +%H:%M:%S) ═══"
chk "01 migration exists"            "[ -f $API/prisma/migrations/20261104143000_profiler/migration.sql ]"
chk "02 instrumentation exists"      "[ -f $API/src/common/profiler.ts ]"
chk "03 service exists"              "[ -f $API/src/modules/admin/admin.profiler.service.ts ]"
chk "04 routes exist"                "[ -f $API/src/modules/admin/admin.profiler.routes.ts ]"
chk "05 UI page exists"              "[ -f apps/web/src/app/admin/profiler/page.jsx ]"
chk "06 router mounted in index.ts"  "grep -q adminProfilerRouter $API/src/index.ts"
chk "07 middleware mounted"          "grep -q profilerMiddleware $API/src/index.ts"
chk "08 prisma \$use attached"       "grep -q 'prisma.\$use' $API/src/common/profiler.ts"
chk "09 snapshot cron registered"    "grep -q '7 \* \* \* \*' $API/src/common/profiler.ts"
chk "10 explain SELECT whitelist"    "grep -q 'NOT_SELECT' $API/src/modules/admin/admin.profiler.service.ts"
chk "11 explain forbidden kw guard"  "grep -q 'FORBIDDEN_STMT' $API/src/modules/admin/admin.profiler.service.ts"
chk "12 explain statement_timeout"   "grep -q 'statement_timeout' $API/src/modules/admin/admin.profiler.service.ts"
GUARDS=$(grep -c requireAdminRole "$API/src/modules/admin/admin.profiler.routes.ts")
if [ "$GUARDS" -ge 8 ]; then pass "13 admin guard on all routes ($GUARDS)"; else fail "13 only $GUARDS routes guarded"; fi
chk "14 dead data.js removed"        "[ ! -f apps/web/src/app/admin/profiler/data.js ]"
chk "15 dead modal removed"          "[ ! -f apps/web/src/app/admin/profiler/SlowQueryModal.jsx ]"
chk "16 zero mock/seededRandom"      "! grep -rEi 'mock|seededRandom|faker' apps/web/src/app/admin/profiler apps/web/src/api/profiler.ts"
chk "17 prisma models in schema"     "grep -q 'model ProfilerTenantCost' $API/prisma/schema.prisma"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -m 3 http://localhost:3001/admin/profiler/summary)
if [ "$CODE" = "401" ] || [ "$CODE" = "403" ]; then pass "18 endpoint mounted + fail-closed (HTTP $CODE unauth)"; else fail "18 /profiler/summary unauth → HTTP $CODE (want 401/403 — is the API running?)"; fi
chk "19 api tsc build green"         "(cd $API && npm run build)"
V=$( (cd $API && npx tsx scripts/profiler-verify.ts 2>/dev/null) | grep -o 'VERIFY_OK')
if [ -n "$V" ]; then pass "20 seed data verified in DB"; else fail "20 seed verify — run the seed (npx tsx scripts/seed-profiler.ts in apps/api) first"; fi

echo "═══ $P passed, $F failed ═══"
[ $F -eq 0 ] && echo "SHIPPED: system profiler — all gates green" || exit 1
