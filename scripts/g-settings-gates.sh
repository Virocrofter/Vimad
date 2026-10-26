#!/usr/bin/env bash
# g-settings-gates.sh — Settings module binary gates. Shipped = 0 failed.
cd "$(dirname "$0")/.." || exit 1
PASS=0; FAIL=0
ok()  { echo "PASS: $1"; PASS=$((PASS+1)); }
bad() { echo "FAIL: $1"; FAIL=$((FAIL+1)); }

FILES="apps/api/src/modules/tenant-settings/tenant-settings.routes.ts apps/web/src/api/tenantSettings.ts apps/web/src/lib/diagnostics.ts apps/web/src/app/app/settings/page.jsx"
for f in $FILES; do
  [ -f "$f" ] && ok "file exists: $f" || bad "missing file: $f"
done

grep -q "app.use('/v1/tenant', tenantSettingsRouter);" apps/api/src/index.ts \
  && ok "router mounted in index.ts" || bad "router not mounted in index.ts"
grep -q "requestCardCaptureLink" apps/web/src/app/app/settings/page.jsx \
  && ok "card capture wired to tenant api" || bad "card capture not wired"
grep -q "getTenantProfile\|listMyInvoices\|requestPlanChange\|getDiagnostics" apps/web/src/app/app/settings/page.jsx \
  && ok "settings page wired to real api" || bad "settings page not wired to api"
grep -Eqi "\bmock|faker|placeholder.*lorem" apps/web/src/app/app/settings/page.jsx \
  && bad "mock data detected in settings page" || ok "no mocks in settings page"
grep -q "Copy logs\|copyLogs\|diagnostics" apps/web/src/app/app/settings/page.jsx \
  && ok "support & diagnostics row present" || bad "diagnostics row missing"

( cd apps/api && npx tsc --noEmit ) >/dev/null 2>&1 \
  && ok "api typecheck" || bad "api typecheck"
( cd apps/web && npm run build ) >/dev/null 2>&1 \
  && ok "web build" || bad "web build"

echo "== $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ]
