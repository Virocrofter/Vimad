#!/usr/bin/env bash
# g-guest-portal-g5b-gates.sh — Phase 5 follow-ups: sockets, staff desk, CRM 360 reviews, deep links

cd "$(dirname "$0")/.." || exit 1
API="http://localhost:3001"
PASS=0
FAIL=0
say()  { printf '%s\n' "$*"; }
pass() { PASS=$((PASS+1)); say "PASS: $1"; }
fail() { FAIL=$((FAIL+1)); say "FAIL: $1"; }
jqd() { python3 -c "import sys,json;d=json.load(sys.stdin);print($1)" 2>/dev/null; }

say "── G5b gates: files & wiring ──"
grep -q "guest-portal" apps/api/src/common/socket-auth.ts && pass "socket-auth accepts portal tokens" || fail "socket-auth portal branch missing"
grep -q "emitToReservation" apps/api/src/common/socket.ts && pass "socket.ts emitToReservation" || fail "emit helper missing"
grep -q "reservation:\${guestReservationId}" apps/api/src/common/socket.ts && pass "guest sockets join reservation room" || fail "reservation room join missing"
grep -q "chat:guest_message" apps/api/src/modules/guest-portal/guest-comms.routes.ts && pass "guest message push wired" || fail "guest push missing"
grep -q "chat:message" apps/api/src/modules/guest-portal/comms.routes.ts && pass "staff reply push wired" || fail "staff push missing"
grep -q "reviews," apps/api/src/modules/crm/crm.service.ts && pass "CRM guest360 includes reviews" || fail "crm reviews missing"
grep -q "{/\\* Reviews \\*/}" apps/web/src/app/app/crm/guests/\[id\]/page.jsx && pass "CRM page renders reviews" || fail "crm page reviews section missing"
grep -q "Rate your stay" apps/api/src/jobs/email.worker.ts && pass "folio email has review deep link" || fail "email CTA missing"
grep -q "guestLastName" apps/api/src/modules/notifications/transactional.service.ts && pass "folio payload carries last name" || fail "payload missing"
grep -q "URLSearchParams" apps/web/src/app/guest-portal/reviews/page.jsx && pass "reviews page auto-verifies deep links" || fail "deep-link handling missing"
grep -q "socket.io-client" apps/web/src/app/guest-portal/messages/page.jsx && pass "guest chat uses socket push" || fail "guest socket hookup missing"
[ -f apps/web/src/app/app/comms/page.jsx ] && pass "staff Comms Desk page exists" || fail "comms page missing"
grep -q "'comms'" apps/web/src/router.tsx && pass "router registers /app/comms" || fail "router missing"
grep -q "/app/comms" apps/web/src/components/layout/Sidebar.tsx && pass "sidebar Comms Desk entry" || fail "sidebar missing"

say "── G5b gates: builds ──"
npm run build --workspace=apps/api >/dev/null 2>&1 && pass "api tsc build" || fail "api tsc build"
( cd apps/web && npm run build >/dev/null 2>&1 ) && pass "web vite build" || fail "web vite build"

say "── G5b gates: live ──"
up=""
for i in $(seq 1 60); do
  code=$(curl -s -m 2 -o /dev/null -w "%{http_code}" "$API/health/live" 2>/dev/null)
  [ "$code" = "200" ] && { up="1"; break; }
  sleep 1
done
[ -n "$up" ] && pass "api health" || { fail "api not up"; exit 1; }

TOKEN=$(curl -s -m 5 -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"tenantSlug":"demo-hotel","email":"admin@demo.com","password":"admin123"}' | jqd "d.get('data',{}).get('token') or d.get('token','')")
[ -n "$TOKEN" ] && pass "staff login" || { fail "staff login"; exit 1; }

code=$(curl -s -m 5 -o /tmp/g5b-inbox.json -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API/v1/comms/chat/inbox?status=all")
{ [ "$code" = "200" ] && grep -q '"threads"' /tmp/g5b-inbox.json; } && pass "staff inbox live 200" || fail "staff inbox ($code)"

code=$(curl -s -m 5 -o /tmp/g5b-reviews.json -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API/v1/comms/reviews?status=all")
{ [ "$code" = "200" ] && grep -q '"reviews"' /tmp/g5b-reviews.json; } && pass "review queue live 200" || fail "review queue ($code)"

say ""
say "== PASS=$PASS FAIL=$FAIL =="
if [ "$FAIL" -eq 0 ]; then say "G5b SHIPPED"; else say "G5b NOT SHIPPED"; fi
exit "$FAIL"
