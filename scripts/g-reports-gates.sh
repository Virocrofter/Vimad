#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/.."
API="${API_URL:-http://localhost:3001}"
LOGIN_EMAIL="${REPORTS_LOGIN_EMAIL:-admin@demo-hotel.com}"
LOGIN_PASSWORD="${REPORTS_LOGIN_PASSWORD:-password123}"
PASS=0; FAIL=0
ok(){ echo "PASS: $1"; PASS=$((PASS+1)); }
bad(){ echo "FAIL: $1"; FAIL=$((FAIL+1)); }
has(){ grep -q "$2" "$1" 2>/dev/null && ok "$3" || bad "$3"; }

test -d apps/api/src/modules/reports && ok "module dir exists" || bad "module dir exists"
has apps/api/prisma/schema.prisma "model ReportRun" "schema: ReportRun"
has apps/api/prisma/schema.prisma "model ScheduledReport" "schema: ScheduledReport"
has apps/api/prisma/schema.prisma "arrivalDate" "field: Reservation.arrivalDate"
has apps/api/prisma/schema.prisma "totalAmount" "field: Reservation.totalAmount"
has apps/api/prisma/schema.prisma "housekeepingStatus" "field: Room.housekeepingStatus"
has apps/api/prisma/schema.prisma "postedAt" "field: FolioItem.postedAt"
has apps/api/prisma/schema.prisma "corporateAccountId" "field: Invoice.corporateAccountId"
has apps/api/prisma/schema.prisma "model CorporateAccount" "model: CorporateAccount"
has apps/api/prisma/schema.prisma "model Property" "model: Property"
has apps/api/prisma/schema.prisma "model RoomType" "model: RoomType"
has apps/api/prisma/schema.prisma "model ArInvoice" "model: ArInvoice"
has apps/api/src/index.ts "/v1/reports" "mounted: /v1/reports"
has apps/api/src/index.ts "startReportsScheduler" "scheduler started"
has apps/api/src/modules/reports/reports.routes.ts "reportsRouter" "routes file present"
has apps/api/src/jobs/reports.job.ts "startReportsScheduler" "job file present"
(cd apps/api && npx tsc --noEmit) >/dev/null 2>&1 && ok "api typecheck" || bad "api typecheck"
(cd apps/web && npx tsc --noEmit) >/dev/null 2>&1 && ok "web typecheck" || bad "web typecheck"
! grep -rEq "libraryReports|generateReportData|admin/reports" apps/web/src/app/app/reports 2>/dev/null && ok "web: no mocks / admin routes" || bad "web: still references mocks or /admin/reports"

TOKEN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"tenantSlug\":\"demo-hotel\",\"email\":\"$LOGIN_EMAIL\",\"password\":\"$LOGIN_PASSWORD\"}" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("data",{}).get("token") or d.get("token") or "")' 2>/dev/null)
[ -n "$TOKEN" ] && ok "login" || bad "login (set REPORTS_LOGIN_EMAIL/REPORTS_LOGIN_PASSWORD)"
AUTH="Authorization: Bearer $TOKEN"
[ "$(curl -s -o /dev/null -w '%{http_code}' "$API/health")" = "200" ] && ok "health" || bad "health"
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$API/v1/reports/definitions" -H "$AUTH"); [ "$CODE" = "200" ] && ok "GET definitions" || bad "GET definitions ($CODE)"
RUN=$(curl -s -X POST "$API/v1/reports/run" -H "$AUTH" -H 'Content-Type: application/json' -d '{"definitionKey":"occupancy","params":{}}')
echo "$RUN" | grep -q '"status":"COMPLETED"' && ok "run occupancy" || bad "run occupancy: $RUN"
RUN_ID=$(echo "$RUN" | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["id"])' 2>/dev/null)
[ -n "$RUN_ID" ] && ok "run id returned" || bad "run id returned"
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$API/v1/reports/runs" -H "$AUTH"); [ "$CODE" = "200" ] && ok "GET runs" || bad "GET runs ($CODE)"
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$API/v1/reports/runs/$RUN_ID" -H "$AUTH"); [ "$CODE" = "200" ] && ok "GET run by id" || bad "GET run by id ($CODE)"
CT=$(curl -s -o /dev/null -w '%{content_type}' "$API/v1/reports/runs/$RUN_ID/export" -H "$AUTH"); echo "$CT" | grep -q "text/csv" && ok "CSV export" || bad "CSV export ($CT)"
SCHED=$(curl -s -X POST "$API/v1/reports/schedules" -H "$AUTH" -H 'Content-Type: application/json' -d '{"definitionKey":"revenue","name":"gate-test","frequency":"DAILY","timeOfDay":"06:00","recipients":[]}')
SCHED_ID=$(echo "$SCHED" | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["id"])' 2>/dev/null)
[ -n "$SCHED_ID" ] && ok "create schedule" || bad "create schedule: $SCHED"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$API/v1/reports/schedules/$SCHED_ID" -H "$AUTH" -H 'Content-Type: application/json' -d '{"isActive":false}'); [ "$CODE" = "200" ] && ok "pause schedule" || bad "pause schedule ($CODE)"
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$API/v1/reports/schedules" -H "$AUTH"); [ "$CODE" = "200" ] && ok "list schedules" || bad "list schedules ($CODE)"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE "$API/v1/reports/schedules/$SCHED_ID" -H "$AUTH"); [ "$CODE" = "204" ] && ok "delete schedule" || bad "delete schedule ($CODE)"

echo "== $PASS passed, $FAIL failed =="
exit $([ "$FAIL" -eq 0 ] && echo 0 || echo 1)
