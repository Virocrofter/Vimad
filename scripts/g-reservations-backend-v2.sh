#!/usr/bin/env bash
cd "$(dirname "$0")/.." || exit 1
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
BASE="http://localhost:3001/v1"
AUTH="http://localhost:3001/auth"
J(){ node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);const r=$1;console.log(r==null?'':r)}catch{console.log('')}})"; }

echo "== B1 api typecheck =="
if (cd apps/api && npx tsc --noEmit) >/dev/null 2>&1; then ok "api typecheck"; else bad "api typecheck"; fi

if ! curl -s -m 2 "$BASE/health/live" >/dev/null 2>&1; then
  echo "api not up - restart it (backend changed) and re-run"
  bad "api reachable"
  echo "== $PASS passed, $FAIL failed =="
  exit 1
fi
ok "api reachable"

TOKEN=$(curl -s -X POST "$AUTH/login" -H 'content-type: application/json' -d '{"email":"admin@demo.com","password":"admin123","tenantSlug":"demo-hotel"}' | J "j.token||j.accessToken||(j.data&&(j.data.token||j.data.accessToken))||''")
[ -n "$TOKEN" ] && ok "login" || { bad "login"; echo "== $PASS passed, $FAIL failed =="; exit 1; }

PID=$(curl -s "$BASE/properties" -H "Authorization: Bearer $TOKEN" | J "(j.data&&j.data[0]&&j.data[0].id)||(j[0]&&j[0].id)||''")
GID=$(curl -s "$BASE/guests" -H "Authorization: Bearer $TOKEN" | J "(j.data&&j.data[0]&&j.data[0].id)||(j[0]&&j[0].id)||''")
ARR=$(date -v+40d -u +%Y-%m-%d)
DEP=$(date -v+42d -u +%Y-%m-%d)

echo "== B2 no-show =="
RID=$(curl -s -X POST "$BASE/reservations" -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' -d "{\"propertyId\":\"$PID\",\"guestId\":\"$GID\",\"arrivalDate\":\"$ARR\",\"departureDate\":\"$DEP\",\"nights\":2}" | J "(j.data&&j.data.id)||j.id||''")
[ -n "$RID" ] && ok "create" || bad "create"
CODE=$(curl -s -o /tmp/ns.json -w '%{http_code}' -X POST "$BASE/reservations/$RID/no-show" -H "Authorization: Bearer $TOKEN")
NS_STATUS=$(J "j.data&&j.data.status" < /tmp/ns.json)
[ "$CODE" = "200" ] && [ "$NS_STATUS" = "no_show" ] && ok "no-show 200 + status" || bad "no-show ($CODE $NS_STATUS)"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/reservations/$RID/no-show" -H "Authorization: Bearer $TOKEN")
[ "$CODE" = "409" ] && ok "no-show idempotent 409" || bad "no-show repeat ($CODE)"

echo "== B3 traces =="
TID=$(curl -s -X POST "$BASE/reservations" -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' -d "{\"propertyId\":\"$PID\",\"guestId\":\"$GID\",\"arrivalDate\":\"$ARR\",\"departureDate\":\"$DEP\",\"nights\":2}" | J "(j.data&&j.data.id)||j.id||''")
TRACE=$(curl -s -X POST "$BASE/reservations/$TID/traces" -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"body":"VIP arrival - champagne ready","department":"front_desk"}')
TRACE_ID=$(echo "$TRACE" | J "(j.data&&j.data.id)||j.id||''")
[ -n "$TRACE_ID" ] && ok "trace created" || bad "trace create ($TRACE)"
TLIST=$(curl -s "$BASE/reservations/$TID/traces" -H "Authorization: Bearer $TOKEN" | J "(j.data&&j.data.length)||0")
[ "$TLIST" -ge 1 ] && ok "traces listed" || bad "traces list"
RCODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/reservations/traces/$TRACE_ID/resolve" -H "Authorization: Bearer $TOKEN")
[ "$RCODE" = "200" ] && ok "trace resolved" || bad "trace resolve ($RCODE)"

echo "== B4 resend confirmation =="
RCODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/reservations/$TID/resend-confirmation" -H "Authorization: Bearer $TOKEN")
[ "$RCODE" = "200" ] && ok "resend confirmation" || bad "resend ($RCODE)"

echo "== B5 detail includes traces+companions =="
HAS=$(curl -s "$BASE/reservations/$TID" -H "Authorization: Bearer $TOKEN" | J "j.data&&Array.isArray(j.data.traces)&&Array.isArray(j.data.companions)?'yes':''")
[ "$HAS" = "yes" ] && ok "detail includes traces/companions" || bad "detail includes"

echo "== B6 cancel stores reason + lifecycle =="
CCODE=$(curl -s -o /tmp/cx.json -w '%{http_code}' -X POST "$BASE/reservations/$TID/cancel" -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"reason":"gate test"}')
CREASON=$(J "j.data&&j.data.cancelReason" < /tmp/cx.json)
CDATE=$(J "j.data&&j.data.cancelledAt?'set':''" < /tmp/cx.json)
[ "$CCODE" = "200" ] && [ "$CREASON" = "gate test" ] && [ "$CDATE" = "set" ] && ok "cancel reason + timestamp" || bad "cancel fields ($CCODE reason=$CREASON ts=$CDATE)"

echo "== $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "SHIPPED" || exit 1
