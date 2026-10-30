#!/usr/bin/env bash
# g-guest-portal-p0-gates.sh v2 — Guest Portal Phase 0 (Foundation) exit gate.
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "PASS: $1"; }
bad()  { FAIL=$((FAIL+1)); echo "FAIL: $1"; }
check(){ [ "$1" = "0" ] && ok "$2" || bad "$2"; }

cd "$(dirname "$0")/.." || exit 1
API="http://localhost:3001"
CONF="${GP0_CONF:-GP0-$(date +%s)}"
export CONF

J() { python3 -c "import sys,json;d=json.load(sys.stdin);v=eval(\"d$1\");print('' if v is None else v)" 2>/dev/null; }
field() { local v; v=$(J "$2" <<< "$1"); [ -n "$v" ] && [ "$v" != "" ]; }

curl -s -m 2 -o /dev/null "$API/health/live"; check $? "api healthy"

(cd apps/api && npx tsx ../../scripts/gp0-seed.mts) > /tmp/gp0-seed.log 2>&1 && grep -q "SEEDED $CONF" /tmp/gp0-seed.log; S=$?; [ "$S" -ne 0 ] && tail -8 /tmp/gp0-seed.log; check $S; check $? "synthetic reservation $CONF seeded"

LOOKUP=$(curl -s -X POST "$API/v1/guest-portal/lookup" -H 'Content-Type: application/json' \
  -d "{\"confirmationNumber\":\"$CONF\",\"lastName\":\"Runner\"}")
[ "$(J "['data']['found']" <<< "$LOOKUP")" = "True" ]; check $? "lookup finds reservation"

VERIFY=$(curl -s -X POST "$API/v1/guest-portal/verify" -H 'Content-Type: application/json' \
  -d "{\"confirmationNumber\":\"$CONF\",\"lastName\":\"Runner\"}")
TOKEN=$(J "['data']['token']" <<< "$VERIFY")
[ -n "$TOKEN" ]; check $? "verify mints portal token"

STAY=$(curl -s "$API/v1/guest-portal/stay/$TOKEN")
[ "$(J "['data']['checkedIn']" <<< "$STAY")" = "False" ]; check $? "stay details (pre check-in)"

REFRESH=$(curl -s -X POST "$API/v1/guest-portal/refresh" -H 'Content-Type: application/json' \
  -d "{\"token\":\"$TOKEN\"}")
NEWTOKEN=$(J "['data']['token']" <<< "$REFRESH")
{ [ -n "$NEWTOKEN" ] && [ "$NEWTOKEN" != "$TOKEN" ]; }; check $? "refresh returns a NEW token (sliding 12h)"
STAY2=$(curl -s "$API/v1/guest-portal/stay/$NEWTOKEN")
field "$STAY2" "['data']['guestName']"; check $? "refreshed token works on /stay"

CI=$(curl -s -X POST "$API/v1/guest-portal/check-in" -H 'Content-Type: application/json' -d "{
  \"token\":\"$NEWTOKEN\",
  \"estimatedArrivalTime\":\"14:00\",
  \"idDocument\":\"P000GP0\",
  \"signature\":\"data:image/png;base64,iVBORw0KGgo=\"
}")
[ "$(J "['data']['checkedIn']" <<< "$CI")" = "True" ] || echo "$CI" | grep -q '"checkedIn": *true'; check $? "check-in accepted (ETA + ID + signature)"
KEY=$(curl -s "$API/v1/guest-portal/digital-key/$NEWTOKEN")
field "$KEY" "['data']['keyCode']"; check $? "digital key issued after check-in"

SR=$(curl -s -o /tmp/gp0-sr.json -w "%{http_code}" -X POST "$API/v1/guest-portal/service-request" \
  -H 'Content-Type: application/json' \
  -d "{\"token\":\"$NEWTOKEN\",\"type\":\"housekeeping\",\"message\":\"Extra towels (gate)\"}")
{ [ "$SR" = "201" ] || [ "$SR" = "200" ]; } && field "$(cat /tmp/gp0-sr.json)" "['data']['id']"; check $? "service request created ($SR + id)"
PR=$(curl -s -o /tmp/gp0-pr.json -w "%{http_code}" -X PATCH "$API/v1/guest-portal/preferences/$NEWTOKEN" \
  -H 'Content-Type: application/json' -d '{"preferences":{"pillow":"firm"}}')
[ "$PR" = "200" ] && [ "$(J "['data']['preferences']['pillow']" < /tmp/gp0-pr.json)" = "firm" ]; check $? "preferences round-trip"

BAD=$(curl -s -o /dev/null -w "%{http_code}" "$API/v1/guest-portal/stay/not-a-real-token")
{ [ "$BAD" = "401" ] || [ "$BAD" = "404" ]; }; check $? "garbage token rejected on /stay ($BAD)"
BADR=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/v1/guest-portal/refresh" \
  -H 'Content-Type: application/json' -d '{"token":"not-a-real-token"}')
[ "$BADR" = "401" ]; check $? "garbage token rejected on /refresh"

for p in "guest-portal/my-stays/$NEWTOKEN" "concierge/guest/requests" "guest-portal/support/tickets"; do
  CT=$(curl -s -o /tmp/gp0-sat.json -w "%{content_type}" "$API/v1/$p")
  echo "$CT" | grep -q "application/json"; check $? "satellite router mounted + JSON: /v1/$p"
done

LIMITED=0
for i in $(seq 1 15); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/v1/guest-portal/lookup" \
    -H 'Content-Type: application/json' \
    -d "{\"confirmationNumber\":\"$CONF\",\"lastName\":\"Runner\"}")
  [ "$CODE" = "429" ] && LIMITED=$((LIMITED+1))
done
[ "$LIMITED" -ge 1 ]; check $? "lookup rate-limits after 10/min (${LIMITED}x 429)"

(cd apps/api && npx tsc --noEmit) > /tmp/gp0-tsc.log 2>&1; check $? "api tsc clean"
(cd apps/web && npx vite build) > /tmp/gp0-vite.log 2>&1; check $? "web vite build green"
grep -rq "guest-portal/layout" apps/web/src && ok "layout in tree"
grep -q "guestPortalRefreshRouter" apps/api/src/index.ts && ok "refresh router mounted in index.ts"

echo "=============================="
echo "  $PASS passed, $FAIL failed"
echo "=============================="
if [ "$FAIL" -eq 0 ]; then
  echo "GUEST PORTAL PHASE 0 SHIPPED"
else
  echo "PHASE 0 NOT SHIPPED"
  exit 1
fi
