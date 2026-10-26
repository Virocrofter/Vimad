#!/usr/bin/env bash
# g-dashboard-gates.sh — D1 dashboard interlink gates
# Run from repo root: bash scripts/g-dashboard-gates.sh
set -u
PASS=0; FAIL=0
DASH=apps/web/src/app/app/dashboard

ok()  { PASS=$((PASS+1)); echo "PASS: $1"; }
bad() { FAIL=$((FAIL+1)); echo "FAIL: $1"; }

[ -f "$DASH/dashLinks.js" ] && ok "dashLinks.js exists" || bad "dashLinks.js missing"
grep -q "activityTarget" "$DASH/dashLinks.js" && ok "activity feed router present" || bad "activityTarget missing"
grep -q "dismissAlert" "$DASH/dashLinks.js" && ok "dismiss persistence present" || bad "dismissAlert missing"
grep -q "localStorage" "$DASH/dashLinks.js" && ok "dismissal survives refetch" || bad "dismissal not persisted"

grep -q "usePropertyStore" "$DASH/page.jsx" && ok "property scope wired" || bad "page.jsx does not read propertyStore"
grep -q "useDashboardStats(propertyId)" "$DASH/page.jsx" && ok "stats hook scoped" || bad "stats hook not scoped"
grep -q "useFrontDeskSnapshot(propertyId)" "$DASH/page.jsx" && ok "front-desk hook scoped" || bad "front-desk not scoped"
grep -q "useDashboardAlerts(propertyId)" "$DASH/page.jsx" && ok "alerts hook scoped" || bad "alerts not scoped"

grep -q "usePermission" "$DASH/page.jsx" && ok "permission gating present" || bad "no permission checks"
grep -q "canReadFolios" "$DASH/page.jsx" && ok "finance KPIs gated" || bad "folio KPIs not gated"
grep -q "canReadReservations" "$DASH/page.jsx" && ok "reservation sections gated" || bad "reservations not gated"
grep -q "canReadHousekeeping" "$DASH/page.jsx" && ok "room board gated" || bad "room board not gated"

grep -q "filterDismissed" "$DASH/page.jsx" && ok "alerts filtered through persisted store" || bad "filterDismissed unused"
grep -q "dismissAlert(" "$DASH/page.jsx" && ok "dismiss writes localStorage" || bad "dismiss not persisted"

grep -q "if (!to) return card" "$DASH/components.jsx" && ok "KpiCard navigates when to set" || bad "KPI cards still dead"
grep -q "to={LINKS.roomPlan}" "$DASH/page.jsx" && ok "occupancy card -> room plan" || bad "occupancy card dead"

L=$(grep -c "reservationUrl(" "$DASH/components.jsx")
[ "$L" -ge 3 ] && ok "reservation deep-links ($L sites)" || bad "reservation deep-links missing ($L)"
grep -q "activityTarget(item)" "$DASH/components.jsx" && ok "activity rows deep-link" || bad "activity feed still dead"
grep -q "LINKS.housekeeping" "$DASH/components.jsx" && ok "room board links to housekeeping" || bad "room board dead"
grep -q "auditTrail" "$DASH/components.jsx" && ok "activity view-all -> audit-trail" || bad "no view-all link"
grep -q "navigate(reservationUrl(r.id))" "$DASH/components.jsx" && ok "reservation table rows navigate" || bad "table rows dead"

echo "== files on disk =="
ls -la "$DASH"

cd apps/web && npx tsc --noEmit > /tmp/d1-tsc.log 2>&1 && ok "web typecheck" || bad "web typecheck (see /tmp/d1-tsc.log)"
cd ../..

echo "== $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "D1 SHIPPED" || exit 1
