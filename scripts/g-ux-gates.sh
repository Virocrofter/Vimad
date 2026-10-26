#!/usr/bin/env bash
# g-ux-gates.sh — fixture cleanup + UX polish gates (staff app)
cd "$(dirname "$0")/.." || exit 1
APP=apps/web/src/app/app
PASS=0; FAIL=0
ok(){ echo "PASS: $1"; PASS=$((PASS+1)); }
bad(){ echo "FAIL: $1"; FAIL=$((FAIL+1)); }

echo "== G1: orphaned fixtures deleted, zero dangling imports =="
for f in groups/store.js users/store.js users/data.js keys/data.js; do
  [ ! -f "$APP/$f" ] && ok "$f deleted" || bad "$f still exists"
done
if grep -rn "groups/store\|users/store\|users/data\.\|from '.*users/data'\|keys/data" apps/web/src --include="*.jsx" --include="*.tsx" --include="*.js"; then
  bad "dangling references to deleted fixtures"
else
  ok "zero dangling references"
fi
[ -f "$APP/groups/data.js" ] && ok "groups/data.js intact (live helpers)" || bad "groups/data.js missing"

echo "== G2: inline fixture audit (staff app) =="
if grep -rEn "mock[A-Z][A-Za-z]+|initial[A-Z][A-Za-z]+|seedData|fixtureData|dummyData" "$APP" --include="*.jsx" --include="*.tsx"; then
  bad "fixture-pattern residue in staff app"
else
  ok "zero fixture patterns in staff app"
fi

echo "== G3: critical flows — skeleton, empty, tablet =="
for f in "dashboard/page.jsx" "housekeeping/page.jsx" "reservations/front-desk/page.tsx"; do
  grep -Eq "Skeleton|isLoading" "$APP/$f" && ok "$f loading skeleton" || bad "$f no skeleton"
done
grep -q "EmptyState" "$APP/housekeeping/page.jsx" && ok "housekeeping empty state" || bad "housekeeping no empty state"
grep -Eq "length === 0" "$APP/reservations/front-desk/page.tsx" && ok "front-desk empty state" || bad "front-desk no empty state"
grep -q "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" "$APP/housekeeping/page.jsx" \
  && ok "HK kanban tablet-safe (2-col at iPad portrait)" || bad "HK kanban breakpoints wrong"
grep -q "flex flex-wrap items-center justify-between gap-4" "$APP/housekeeping/page.jsx" \
  && ok "HK header wraps on narrow screens" || bad "HK header not wrapped"
grep -q "hex: '#eab308'" "$APP/housekeeping/page.jsx" && ok "HK column border colors valid" || bad "HK border color bug regressed"

echo "== G4: web build =="
if [ "$SKIP_BUILD" = "1" ]; then
  echo "SKIP: web build"
else
  (cd apps/web && npx vite build > /tmp/ux-build.log 2>&1) \
    && ok "web build" \
    || { bad "web build — tail /tmp/ux-build.log"; tail -5 /tmp/ux-build.log; }
fi

echo "== RESULT: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "SHIPPED" || exit 1
