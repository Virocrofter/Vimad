#!/usr/bin/env bash
# g-dashboard-d2-gates.sh — D2 ops-today + socket live gates
set -u
PASS=0; FAIL=0
API=apps/api/src
WEB=apps/web/src
DASH=$WEB/app/app/dashboard

ok()  { PASS=$((PASS+1)); echo "PASS: $1"; }
bad() { FAIL=$((FAIL+1)); echo "FAIL: $1"; }

[ -f "$API/common/socket-auth.ts" ] && ok "socket-auth.ts exists" || bad "socket-auth.ts missing"
grep -q "socket-auth.js" "$API/common/socket.ts" && ok "socket.ts decoupled from auth.service" || bad "socket.ts still imports auth.service"
grep -q "common/socket.js" "$API/modules/audit/audit.events.ts" && ok "audit events emit live" || bad "audit.events still no-op"
grep -q "ops:mutation" "$API/modules/audit/audit.events.ts" && ok "ops:mutation tenant broadcast present" || bad "ops:mutation missing"
grep -q "^import { createSocketServer }" "$API/index.ts" && ok "index.ts imports createSocketServer" || bad "index.ts import still commented"
grep -q "^  createSocketServer(server);" "$API/index.ts" && ok "socket server boots" || bad "createSocketServer still commented"

[ -f "$API/modules/dashboard/ops-today.service.ts" ] && ok "ops-today.service.ts exists" || bad "ops-today.service missing"
grep -q "getOpsToday" "$API/modules/dashboard/dashboard.routes.ts" && ok "/ops-today route mounted" || bad "/ops-today missing"
grep -q "OpsTodaySchema" "$API/modules/dashboard/dashboard.routes.ts" && ok "ops-today OpenAPI schema" || bad "ops-today schema missing"

[ -f "$WEB/hooks/useOpsToday.ts" ] && ok "useOpsToday hook exists" || bad "useOpsToday missing"
[ -f "$DASH/dashWidgets.jsx" ] && ok "dashWidgets.jsx exists" || bad "dashWidgets missing"
grep -q "TodayStrip" "$DASH/page.jsx" && ok "today strip rendered" || bad "today strip missing"
grep -q "TasksMiniBoard" "$DASH/page.jsx" && ok "tasks mini-board rendered" || bad "tasks mini-board missing"
grep -q "UnsettledDepartures" "$DASH/page.jsx" && ok "un-settled departures rendered" || bad "unsettled panel missing"
grep -q "VipArrivals" "$DASH/page.jsx" && ok "VIP arrivals rendered" || bad "VIP panel missing"
grep -q "useSocket" "$DASH/page.jsx" && ok "socket hook wired" || bad "socket hook missing"
grep -q "ops:mutation" "$DASH/page.jsx" && ok "dashboard subscribes to ops:mutation" || bad "subscription missing"

echo "== files on disk =="
ls -la "$API/common/socket-auth.ts" "$API/modules/dashboard/ops-today.service.ts" "$WEB/hooks/useOpsToday.ts" "$DASH/dashWidgets.jsx" 2>&1

(cd apps/api && npx tsc --noEmit) > /tmp/d2-api-tsc.log 2>&1 && ok "api typecheck" || bad "api typecheck (see /tmp/d2-api-tsc.log)"
(cd apps/web && npx tsc --noEmit) > /tmp/d2-web-tsc.log 2>&1 && ok "web typecheck" || bad "web typecheck (see /tmp/d2-web-tsc.log)"

echo "== $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "D2 STATIC GATES PASSED" || exit 1
