#!/usr/bin/env bash
# g-guest-portal-gates.sh — Guest Portal Phase 1 (de-mocked core loop) verification
set -u
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
PASS=0; FAIL=0
gate() { if eval "$2" >/dev/null 2>&1; then echo "PASS: $1"; PASS=$((PASS+1)); else echo "FAIL: $1"; FAIL=$((FAIL+1)); fi; }

echo "== 1. backend source =="
gate "guest-portal service extended (modify/cancel/folio/invoices)" "grep -q 'export async function modifyBooking' '$ROOT/apps/api/src/modules/guest-portal/guest-portal.service.ts' && grep -q 'export async function cancelBooking' '$ROOT/apps/api/src/modules/guest-portal/guest-portal.service.ts' && grep -q 'export async function getGuestFolio' '$ROOT/apps/api/src/modules/guest-portal/guest-portal.service.ts'"
gate "guest booking routes file" "test -f '$ROOT/apps/api/src/modules/guest-portal/guest-booking.routes.ts'"
gate "guest billing routes file" "test -f '$ROOT/apps/api/src/modules/guest-portal/guest-billing.routes.ts'"
gate "booking router mounted before main portal router" "awk \"/guestBookingRouter/ {b=NR} /guestPortalRouter\\);/ && !p {p=NR} END {exit !(b && p && b < p)}\" '$ROOT/apps/api/src/index.ts'"
gate "billing router mounted before main portal router" "awk \"/guestBillingRouter/ {b=NR} /guestPortalRouter\\);/ && !p {p=NR} END {exit !(b && p && b < p)}\" '$ROOT/apps/api/src/index.ts'"
gate "cancel-quote endpoint" "grep -q '/cancel-quote/:token' '$ROOT/apps/api/src/modules/guest-portal/guest-booking.routes.ts'"
gate "modify endpoint" "grep -q \"'/modify'\" '$ROOT/apps/api/src/modules/guest-portal/guest-booking.routes.ts'"
gate "cancel endpoint" "grep -q \"'/cancel'\" '$ROOT/apps/api/src/modules/guest-portal/guest-booking.routes.ts'"
gate "folio endpoint" "grep -q \"'/folio/:token'\" '$ROOT/apps/api/src/modules/guest-portal/guest-billing.routes.ts'"
gate "invoice endpoint" "grep -q \"'/invoice/:token/:invoiceId'\" '$ROOT/apps/api/src/modules/guest-portal/guest-billing.routes.ts'"
gate "preferences GET endpoint" "grep -q \"'/preferences/:token'\" '$ROOT/apps/api/src/modules/guest-portal/guest-billing.routes.ts'"
gate "documents endpoints" "grep -q \"'/documents/:token'\" '$ROOT/apps/api/src/modules/guest-portal/guest-billing.routes.ts' && test \$(grep -c \"'/documents'\" '$ROOT/apps/api/src/modules/guest-portal/guest-billing.routes.ts') -ge 1 && grep -q 'guestBillingRouter.post' '$ROOT/apps/api/src/modules/guest-portal/guest-billing.routes.ts'"

echo "== 2. frontend source =="
gate "modify page real (no fixture import)" "! grep -qE \"from '(\.\./)*data'\" '$ROOT/apps/web/src/app/guest-portal/booking/modify/page.jsx'"
gate "cancel page real" "! grep -qE \"from '(\.\./)*data'\" '$ROOT/apps/web/src/app/guest-portal/booking/cancel/page.jsx'"
gate "booking page real" "! grep -qE \"from '(\.\./)*data'\" '$ROOT/apps/web/src/app/guest-portal/booking/page.jsx'"
gate "billing page real" "! grep -qE \"from '(\.\./)*data'\" '$ROOT/apps/web/src/app/guest-portal/billing/page.jsx'"
gate "invoice page real" "! grep -qE \"from '(\.\./)*data'\" '$ROOT/apps/web/src/app/guest-portal/billing/invoice/page.jsx'"
gate "split page real" "! grep -qE \"from '(\.\./)*data'\" '$ROOT/apps/web/src/app/guest-portal/billing/split/page.jsx'"
gate "housekeeping page real" "! grep -qE \"from '(\.\./)*data'\" '$ROOT/apps/web/src/app/guest-portal/stay/housekeeping/page.jsx'"
gate "issues page real" "! grep -qE \"from '(\.\./)*data'\" '$ROOT/apps/web/src/app/guest-portal/stay/issues/page.jsx'"
gate "preferences page real" "! grep -qE \"from '(\.\./)*data'\" '$ROOT/apps/web/src/app/guest-portal/profile/preferences/page.jsx'"
gate "documents page real" "! grep -qE \"from '(\.\./)*data'\" '$ROOT/apps/web/src/app/guest-portal/profile/documents/page.jsx'"
gate "room-service page real" "! grep -qE \"from '(\.\./)*data'\" '$ROOT/apps/web/src/app/guest-portal/stay/room-service/page.jsx'"
gate "layout real" "! grep -qE \"from '(\.\./)*data'\" '$ROOT/apps/web/src/app/guest-portal/layout.tsx'"
gate "components.jsx real" "! grep -qE \"from '(\.\./)*data'\" '$ROOT/apps/web/src/app/guest-portal/components.jsx'"
gate "booking components real" "! grep -qE \"from '(\.\./)*data'\" '$ROOT/apps/web/src/app/guest-portal/booking/components.jsx'"
gate "zustand store removed" "test ! -f '$ROOT/apps/web/src/app/guest-portal/store.ts'"
gate "no useGuestStore references left" "! grep -rq 'useGuestStore' '$ROOT/apps/web/src/app/guest-portal/'"
gate "api client has folio/modify/cancel calls" "grep -q 'folio' '$ROOT/apps/web/src/hooks/guestPortalApi.ts' && grep -q 'modifyBooking' '$ROOT/apps/web/src/hooks/guestPortalApi.ts' && grep -q 'cancelBooking' '$ROOT/apps/web/src/hooks/guestPortalApi.ts' && grep -q 'documents' '$ROOT/apps/web/src/hooks/guestPortalApi.ts'"
gate "hooks expose new queries" "grep -q 'useGuestFolio' '$ROOT/apps/web/src/hooks/useGuestPortalData.ts' && grep -q 'useModifyBooking' '$ROOT/apps/web/src/hooks/useGuestPortalData.ts' && grep -q 'useCancelQuote' '$ROOT/apps/web/src/hooks/useGuestPortalData.ts'"
gate "tierBenefits lives in guest-utils" "grep -q 'tierBenefits' '$ROOT/apps/web/src/lib/guest-utils.ts'"

echo "== 3. typecheck + build =="
gate "api tsc" "( cd '$ROOT/apps/api' && npx tsc --noEmit )"
gate "web build" "( cd '$ROOT/apps/web' && npx vite build )"

echo "== 4. runtime smoke (skipped if dev stack is down) =="
if curl -s -m 2 http://localhost:3001/health/live >/dev/null 2>&1; then
  DB_CONTAINER=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -iE 'postgres' | head -1)
  RES=""
  if [ -n "$DB_CONTAINER" ]; then
    RES=$(docker exec -i "$DB_CONTAINER" psql -U postgres -d vimad -tAc "SELECT r.\"confirmationNumber\", g.\"lastName\" FROM \"Reservation\" r JOIN \"Guest\" g ON g.id = r.\"guestId\" WHERE r.status IN ('confirmed','checked_in') ORDER BY r.\"arrivalDate\" DESC LIMIT 1" 2>/dev/null | head -1)
  fi
  if [ -z "$RES" ]; then
    echo "SKIP: could not read a live reservation from the DB — runtime gates skipped"
  else
    CONF=$(echo "$RES" | awk -F'|' '{print $1}')
    LNAME=$(echo "$RES" | awk -F'|' '{print $2}')
    gate "lookup reservation" "curl -s -m 5 -X POST http://localhost:3001/v1/guest-portal/lookup -H 'Content-Type: application/json' -d '{\"confirmationNumber\":\"$CONF\",\"lastName\":\"$LNAME\"}' | grep -q '\"found\":true'"
    TOKEN=$(curl -s -m 5 -X POST http://localhost:3001/v1/guest-portal/verify -H 'Content-Type: application/json' -d "{\"confirmationNumber\":\"$CONF\",\"lastName\":\"$LNAME\"}" | python3 -c 'import sys,json
def find(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if "token" in k.lower() and isinstance(v, str) and v: return v
            r = find(v)
            if r: return r
    return ""
print(find(json.load(sys.stdin)))' 2>/dev/null)
    gate "verify identity -> guest token" "test -n \"${TOKEN:-}\""
    if [ -n "${TOKEN:-}" ]; then
      gate "GET stay/:token 200" "curl -s -m 5 -o /dev/null -w '%{http_code}' http://localhost:3001/v1/guest-portal/stay/$TOKEN | grep -q 200"
      gate "GET folio/:token 200" "curl -s -m 5 -o /dev/null -w '%{http_code}' http://localhost:3001/v1/guest-portal/folio/$TOKEN | grep -q 200"
      gate "GET cancel-quote/:token 200" "curl -s -m 5 -o /dev/null -w '%{http_code}' http://localhost:3001/v1/guest-portal/cancel-quote/$TOKEN | grep -q 200"
      gate "GET preferences/:token 200" "curl -s -m 5 -o /dev/null -w '%{http_code}' http://localhost:3001/v1/guest-portal/preferences/$TOKEN | grep -q 200"
      gate "GET documents/:token 200" "curl -s -m 5 -o /dev/null -w '%{http_code}' http://localhost:3001/v1/guest-portal/documents/$TOKEN | grep -q 200"
      DOCNO="GP$(date +%s)"
      gate "POST documents 200" "curl -s -m 5 -o /dev/null -w '%{http_code}' -X POST http://localhost:3001/v1/guest-portal/documents -H 'Content-Type: application/json' -d '{\"token\":\"$TOKEN\",\"type\":\"passport\",\"number\":\"$DOCNO\"}' | grep -q 200"
    fi
  fi
else
  echo "SKIP: dev stack not reachable on :3001 — start it, then re-run"
fi

echo "== RESULT: PASS=$PASS FAIL=$FAIL =="
[ "$FAIL" -eq 0 ]
