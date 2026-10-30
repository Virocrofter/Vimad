#!/usr/bin/env bash
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
cd ~/Desktop/Vimad || exit 1
npm run build --workspace=apps/web 2>&1 | tail -2 | grep -q "built in" && ok "web build green" || bad "build failed"
grep -q "check-in/online" apps/web/src/router.tsx && grep -q "guest-portal/timeline" apps/web/src/router.tsx && ok "both portal routes registered" || bad "router wiring missing"
grep -q "guest-portal/checkin/start" apps/web/src/app/guest-portal/check-in/online/page.jsx && grep -q "registration-card" apps/web/src/app/guest-portal/check-in/online/page.jsx && grep -q "deposit/confirm" apps/web/src/app/guest-portal/check-in/online/page.jsx && grep -q "key-status" apps/web/src/app/guest-portal/check-in/online/page.jsx && ok "check-in page wired to all gated endpoints" || bad "page wiring incomplete"
grep -q "guest-portal/checkin/timeline" apps/web/src/app/guest-portal/timeline/page.jsx && grep -q "getGuestToken" apps/web/src/app/guest-portal/timeline/page.jsx && ok "timeline page wired to gated endpoint" || bad "timeline wiring incomplete"
[ "$(wc -l < apps/web/src/app/guest-portal/check-in/online/page.jsx | tr -d ' ')" -gt 200 ] && ok "check-in page substantial" || bad "page too small"
echo "== C4'b UI gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "C4'B UI SHIPPED" || echo "C4'B UI NOT SHIPPED"
