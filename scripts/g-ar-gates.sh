#!/usr/bin/env bash
# g-ar-gates.sh — AR module ship gates. 0 failed = shipped.
set -u
cd "$(dirname "$0")/.."
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "PASS: $1"; }
bad() { FAIL=$((FAIL+1)); echo "FAIL: $1"; }

echo "== AR gates =="

[ -f apps/api/prisma/migrations/20261026000000_add_ar/migration.sql ] \
  && ok "migration exists" || bad "migration exists"

grep -q "model ArInvoice " apps/api/prisma/schema.prisma \
  && ok "schema: ArInvoice" || bad "schema: ArInvoice"
grep -q "model ArPayment " apps/api/prisma/schema.prisma \
  && ok "schema: ArPayment" || bad "schema: ArPayment"

[ -f apps/api/src/modules/ar/ar.routes.ts ] && ok "ar.routes.ts" || bad "ar.routes.ts"
[ -f apps/api/src/modules/ar/ar.service.ts ] && ok "ar.service.ts" || bad "ar.service.ts"
[ -f apps/api/src/jobs/ar.job.ts ] && ok "ar.job.ts" || bad "ar.job.ts"

grep -q "'/v1/ar', arRouter" apps/api/src/index.ts \
  && ok "router mounted" || bad "router mounted"

(cd apps/api && npx prisma validate >/dev/null 2>&1) \
  && ok "prisma validate" || bad "prisma validate"

(cd apps/api && npm run build >/dev/null 2>&1) \
  && ok "api tsc build" || bad "api tsc build"

grep -q "useArInvoices" apps/web/src/app/app/ar/page.jsx \
  && ok "page uses real api" || bad "page uses real api"
grep -qiE "const (corporateAccounts|invoices|payments) *= *\[" apps/web/src/app/app/ar/page.jsx \
  && bad "no fixture arrays left" || ok "no fixture arrays left"
[ -f apps/web/src/api/ar.ts ] && ok "api/ar.ts" || bad "api/ar.ts"
[ -f apps/web/src/hooks/useAr.ts ] && ok "useAr.ts" || bad "useAr.ts"

(cd apps/web && npm run build >/dev/null 2>&1) \
  && ok "web build" || bad "web build"

echo "== $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ]
