#!/bin/zsh
set -u
cd "$(dirname "$0")/.."
P=0; F=0
gate() { if eval "$2" >/dev/null 2>&1; then echo "PASS  $1"; P=$((P+1)); else echo "FAIL  $1"; F=$((F+1)); fi; }
echo "═══ SYSTEM HEALTH PRODUCTION GATES ═══"
gate "1.  migration exists"          "test -f apps/api/prisma/migrations/20261104120000_health_production/migration.sql"
gate "2.  heartbeat module"        "test -f apps/api/src/common/heartbeat.ts"
gate "3.  health service"            "test -f apps/api/src/modules/admin/admin.health.service.ts"
gate "4.  health routes"             "test -f apps/api/src/modules/admin/admin.health.routes.ts"
gate "5.  index.ts patch installed"  "grep -q installHeartbeatPatch apps/api/src/index.ts"
gate "6.  router mounted"            "grep -q adminHealthRouter apps/api/src/index.ts"
gate "7.  11 endpoints wired"        "test $(grep -c 'adminHealthRouter\.\(get\|post\|patch\)' apps/api/src/modules/admin/admin.health.routes.ts) -eq 11"
gate "8.  web client rewritten"      "grep -q getHealthOverview apps/web/src/api/health.ts"
gate "9.  page rewritten (7 tabs)"   "grep -q 'Cron Heartbeats' apps/web/src/app/admin/health/page.jsx"
gate "10. components rewritten"      "grep -q HeartbeatGrid apps/web/src/app/admin/health/components.jsx"
gate "11. css design system"         "test -f apps/web/src/app/admin/health/health.css"
gate "12. mocks retired"             "grep -q HEALTH_DATA apps/web/src/app/admin/health/data.js"
gate "13. sidebar health link"       "grep -q /admin/platform/health apps/web/src/app/admin/components/AdminSidebar.jsx"
gate "14. seed script"               "test -f scripts/seed-health-demo.ts"
gate "17. public status route"       "test -f apps/api/src/modules/health/public.status.routes.ts"
gate "18. public status mounted"     "grep -q publicStatusRouter apps/api/src/index.ts"
gate "19. marketing status live"     "grep -q getPublicStatus apps/web/src/app/marketing/status/page.jsx"
gate "20. guest status live"         "grep -q getPublicStatus apps/web/src/app/guest-portal/status/page.jsx"
gate "21. tenant scoping"            "grep -q tenantId apps/api/src/modules/health/public.status.routes.ts"
gate "22. banner component"        "test -f apps/web/src/components/StatusBanner.tsx"
gate "23. banner mounted"            "grep -q StatusBanner apps/web/src/app/app/layout.tsx"
gate "24. staff status route+page"   "grep -q 'support/status' apps/web/src/router.tsx && test -f apps/web/src/app/app/support/status/page.jsx"
gate "25. journeys expose tenantId"    "grep -q 'AS \"tenantId\"' apps/api/src/modules/admin/admin.health.service.ts"
gate "26. board is landing tab"        "grep -q 'Hotels & Guests' apps/web/src/app/admin/health/page.jsx && grep -q HealthBoard apps/web/src/app/admin/health/components.jsx"
echo "── builds ──"
( cd apps/api && npm run build ) >/tmp/hl-api-build.log 2>&1
gate "15. API tsc build"             "test $? -eq 0"
( cd apps/web && npm run build ) >/tmp/hl-web-build.log 2>&1
gate "16. WEB vite build"            "test $? -eq 0"
echo "═══ RESULT: $P passed, $F failed ═══"
test $F -eq 0
