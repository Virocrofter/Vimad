#!/usr/bin/env bash
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
cd ~/Desktop/Vimad || { echo "FAIL: repo not found"; exit 1; }
[ -z "$(git status --porcelain)" ] && ok "working tree clean" || bad "uncommitted changes remain"
git log -1 --pretty=%s | grep -q "0.1" && ok "0.1 commit is HEAD" || bad "0.1 commit is not HEAD"
for f in apps/web/src/app/app/settings/page.jsx apps/web/src/app/app/settings/email/page.jsx apps/web/src/app/app/marketing/analytics.tsx apps/web/src/app/app/marketing/automation-list.tsx apps/web/src/app/app/dashboard/page.jsx apps/web/src/app/app/dashboard/CommandPalette.jsx apps/web/src/app/app/dashboard/CrmPulse.jsx apps/web/src/app/app/room-plan/page.tsx apps/web/src/app/app/reservations/page.tsx apps/api/src/modules/tenant-settings/tenant-settings.routes.ts apps/api/src/modules/marketing/marketing.routes.ts; do
  [ -s "$f" ] && ok "$f on disk" || bad "$f missing or empty"
done
LINES=$(wc -l < apps/web/src/app/app/settings/page.jsx 2>/dev/null || echo 0)
[ "$LINES" -gt 100 ] && ok "settings page is real ($LINES lines)" || bad "settings page looks like a stub ($LINES lines)"
grep -rliE "fixture|mockData|dummy" apps/web/src/app/app/settings apps/web/src/app/app/marketing apps/web/src/app/app/dashboard 2>/dev/null && bad "fixture/mock data left behind" || ok "no fixtures in settings/marketing/dashboard"
git ls-files --others --exclude-standard | grep -q . && bad "untracked files exist" || ok "no untracked files"
echo "== 0.1 gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "0.1 SHIPPED" || echo "0.1 NOT SHIPPED"
