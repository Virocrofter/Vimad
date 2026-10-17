#!/usr/bin/env bash
set -uo pipefail
ROOT=~/Desktop/Vimad
PASS=0; FAIL=0
gate() { if ( eval "$2" ) >/dev/null 2>&1; then echo "PASS: $1"; PASS=$((PASS+1)); else echo "FAIL: $1"; FAIL=$((FAIL+1)); fi; }

gate "g1: prisma validate"   "cd $ROOT/apps/api && npx prisma validate"
gate "g2: api typecheck"     "cd $ROOT/apps/api && npx tsc --noEmit"
gate "g3: web build"         "cd $ROOT/apps/web && npm run build"
gate "g4: web api client"    "test -f $ROOT/apps/web/src/api/salesCatering.ts"
gate "g5: hooks exist"       "test -f $ROOT/apps/web/src/hooks/useSalesCatering.ts"
gate "g6: module mounted"    "grep -q salesCateringRouter $ROOT/apps/api/src/index.ts"
gate "g7: migration exists"  "test -f $ROOT/apps/api/prisma/migrations/20261015000000_add_sales_catering/migration.sql"
gate "g8: api running"       "curl -s -m 2 http://localhost:3001/health/live"
echo "── $PASS passed, $FAIL failed ──"
[ "$FAIL" -eq 0 ]
