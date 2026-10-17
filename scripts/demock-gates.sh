#!/usr/bin/env bash
# demock-gates.sh — run: bash demock-gates.sh   (from ~/Desktop/Vimad)
# Verifies backend contracts for the democked sections + frontend build.
API="http://localhost:3001"
PY='import sys,json
try:
  d=json.load(sys.stdin).get("data",{})
  print(d.get("token") or d.get("accessToken") or "")
except Exception:
  sys.exit(1)'

PASS=0; FAIL=0
say()  { if [ "$1" = "0" ]; then echo "PASS: $2"; PASS=$((PASS+1)); else echo "FAIL: $2"; FAIL=$((FAIL+1)); fi; }

echo "== Gate 1: API up =="
curl -sf "$API/health/live" >/dev/null
say $? "api live"

LOGIN_BODY=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.com","password":"admin123","tenantSlug":"demo-hotel"}')
TOKEN=$(echo "$LOGIN_BODY" | python3 -c "$PY")
if [ -z "$TOKEN" ]; then
  echo "FAIL: login — raw response:"
  echo "$LOGIN_BODY" | head -c 500; echo
  exit 1
fi
say 0 "login (token len ${#TOKEN})"
AUTH="Authorization: Bearer $TOKEN"
CT="Content-Type: application/json"

echo "== Gate 2: folios =="
curl -sf "$API/v1/folios?pageSize=5" -H "$AUTH" | grep -q '"meta"'
say $? "GET /v1/folios"

FOLIO_ID=$(curl -s "$API/v1/folios?pageSize=1" -H "$AUTH" | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"][0]["id"])')
[ -n "$FOLIO_ID" ] && curl -sf "$API/v1/folios/$FOLIO_ID" -H "$AUTH" | grep -q '"items"'
say $? "GET /v1/folios/:id"

CHARGE=$(curl -s -X POST "$API/v1/folios/$FOLIO_ID/charges" -H "$AUTH" -H "$CT" \
  -d '{"type":"incidental","description":"Gate test minibar","amount":9.5,"quantity":1}')
CHARGE_ID=$(echo "$CHARGE" | python3 -c 'import sys,json
try:
  print(json.load(sys.stdin)["data"]["id"])
except Exception:
  sys.exit(1)')
[ -n "$CHARGE_ID" ]
say $? "POST charge"

if [ -n "$CHARGE_ID" ]; then
  curl -s -X POST "$API/v1/folios/$FOLIO_ID/charges/$CHARGE_ID/reverse" \
    -H "$AUTH" -H "$CT" -d '{"reason":"gate test rollback"}' | grep -q '"id"'
  say $? "POST charge reverse"
else
  say 1 "POST charge reverse (no charge id)"
fi

echo "== Gate 3: dashboard stats =="
curl -sf "$API/v1/dashboard/stats" -H "$AUTH" | grep -q '"occupancyRate"'
say $? "GET /v1/dashboard/stats"

echo "== Gate 4: channel =="
curl -sf "$API/v1/channel/status" -H "$AUTH" | grep -q '"stats"'
say $? "GET /v1/channel/status"
curl -sf "$API/v1/channel/channels" -H "$AUTH" | grep -q '"data"'
say $? "GET /v1/channel/channels"

echo "== Gate 5: parking bays =="
curl -sf "$API/v1/parking/bays" -H "$AUTH" | grep -q '"data"'
say $? "GET /v1/parking/bays"

BAY=$(curl -s -X POST "$API/v1/parking/bays" -H "$AUTH" -H "$CT" \
  -d '{"label":"GATE-'$RANDOM'","zone":"standard"}')
BAY_ID=$(echo "$BAY" | python3 -c 'import sys,json
try:
  print(json.load(sys.stdin)["data"]["id"])
except Exception:
  sys.exit(1)')
[ -n "$BAY_ID" ]
say $? "POST bay"

if [ -n "$BAY_ID" ]; then
  curl -s -X PATCH "$API/v1/parking/bays/$BAY_ID" -H "$AUTH" -H "$CT" \
    -d '{"status":"out_of_service"}' | grep -q '"updated":true'
  say $? "PATCH bay"
  curl -s -X DELETE "$API/v1/parking/bays/$BAY_ID" -H "$AUTH" | grep -q '"deleted":true'
  say $? "DELETE bay"
else
  say 1 "PATCH bay (no bay id)"
  say 1 "DELETE bay (no bay id)"
fi

echo "== Gate 6: tenant audit trail (new route) =="
BODY=$(curl -s "$API/v1/audit-logs?pageSize=10" -H "$AUTH")
echo "$BODY" | grep -q '"meta"'
say $? "GET /v1/audit-logs"
curl -s -D- -o /dev/null "$API/v1/audit-logs/export" -H "$AUTH" | grep -qi 'text/csv'
say $? "GET /v1/audit-logs/export (CSV)"

echo "== Gate 7: web build =="
if [ -d apps/web ]; then
  (cd apps/web && npm run build >/dev/null 2>&1)
  say $? "web production build"
else
  say 1 "web build (run from repo root)"
fi

echo ""
echo "=================================="
echo "GATES COMPLETE — $PASS passed, $FAIL failed"
echo "=================================="
exit $FAIL