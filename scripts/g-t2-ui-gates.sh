#!/usr/bin/env bash
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
cd ~/Desktop/Vimad || exit 1
[ -s apps/web/src/app/app/housekeeping/space-status/page.jsx ] && ok "space-status page on disk" || bad "page missing"
grep -q "useSpaceStatus" apps/web/src/app/app/housekeeping/space-status/page.jsx && ok "page wired to live hook" || bad "page not using live hook"
grep -qE "fixture|mockData|pointsHistory|guestProfile" apps/web/src/app/app/housekeeping/space-status/page.jsx && bad "page contains fixtures" || ok "page fixture-free"
grep -q "housekeeping/space-status" apps/web/src/router.tsx && ok "route registered" || bad "route missing"
grep -q "Space Status" apps/web/src/components/layout/Sidebar.tsx && ok "sidebar entry present" || bad "sidebar missing"
LINES=$(wc -l < apps/web/src/app/app/housekeeping/space-status/page.jsx)
[ "$LINES" -gt 150 ] && ok "page is substantial ($LINES lines)" || bad "page too small ($LINES)"
grep -q "SpaceStatusGrid" apps/web/src/api/housekeeping.ts && ok "api client typed" || bad "api client missing"
grep -q "useSpaceStatus" apps/web/src/hooks/useHousekeeping.ts && ok "hook exported" || bad "hook missing"
echo "== T2 UI gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "T2 UI SHIPPED" || echo "T2 UI NOT SHIPPED"
