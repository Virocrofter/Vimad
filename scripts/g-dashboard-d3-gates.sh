#!/usr/bin/env bash
# g-dashboard-d3-gates.sh — D3 layout, room board, deltas, command palette
set -u
PASS=0; FAIL=0
API=apps/api/src
WEB=apps/web/src
DASH=$WEB/app/app/dashboard

ok()  { PASS=$((PASS+1)); echo "PASS: $1"; }
bad() { FAIL=$((FAIL+1)); echo "FAIL: $1"; }

[ -f "$API/modules/dashboard/dashboard-deltas.service.ts" ] && ok "deltas service exists" || bad "deltas service missing"
grep -q "getKpiDeltas" "$API/modules/dashboard/dashboard.routes.ts" && ok "/dashboard/deltas route mounted" || bad "/deltas missing"
grep -q "DeltasSchema" "$API/modules/dashboard/dashboard.routes.ts" && ok "deltas schema registered" || bad "deltas schema missing"

[ -f "$WEB/hooks/useDashboardDeltas.ts" ] && ok "useDashboardDeltas hook exists" || bad "deltas hook missing"
[ -f "$DASH/CommandPalette.jsx" ] && ok "CommandPalette exists" || bad "palette missing"
grep -q "CommandPalette" "$DASH/page.jsx" && ok "palette mounted" || bad "palette not mounted"
grep -q "paletteOpen" "$DASH/page.jsx" && ok "palette state wired" || bad "palette state missing"
grep -q "useDashboardDeltas" "$DASH/page.jsx" && ok "deltas consumed" || bad "deltas unused"
grep -q "occupancyDelta" "$DASH/page.jsx" && ok "occupancy delta computed" || bad "occupancy delta missing"
grep -q "revenueDeltaPct" "$DASH/page.jsx" && ok "revenue delta computed" || bad "revenue delta missing"

grep -q "delta.trend" "$DASH/components.jsx" && ok "KpiCard renders delta" || bad "KpiCard delta missing"
grep -q "roomFilters" "$DASH/components.jsx" && ok "room board filter chips" || bad "room board filters missing"
grep -q "Floor \${r.floor}" "$DASH/components.jsx" && ok "room board floor grouping" || bad "floor grouping missing"
grep -q "md:hidden" "$DASH/components.jsx" && ok "FAB mobile-only (quick actions in header)" || bad "FAB not demoted"

grep -q "metaKey" "$DASH/CommandPalette.jsx" && ok "Cmd/Ctrl+K hotkey" || bad "hotkey missing"
grep -q "'/guests'" "$DASH/CommandPalette.jsx" && ok "palette searches guests" || bad "guest search missing"
grep -q "'/reservations'" "$DASH/CommandPalette.jsx" && ok "palette searches reservations" || bad "reservation search missing"
grep -q "ArrowDown" "$DASH/CommandPalette.jsx" && ok "keyboard navigation" || bad "keyboard nav missing"

echo "== files on disk =="
ls -la "$API/modules/dashboard/dashboard-deltas.service.ts" "$WEB/hooks/useDashboardDeltas.ts" "$DASH/CommandPalette.jsx" 2>&1

(cd apps/api && npx tsc --noEmit) > /tmp/d3-api-tsc.log 2>&1 && ok "api typecheck" || bad "api typecheck (see /tmp/d3-api-tsc.log)"
(cd apps/web && npx tsc --noEmit) > /tmp/d3-web-tsc.log 2>&1 && ok "web typecheck" || bad "web typecheck (see /tmp/d3-web-tsc.log)"

echo "== $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "D3 SHIPPED" || exit 1
