#!/usr/bin/env bash
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
API="http://localhost:3001"
cd ~/Desktop/Vimad || exit 1
TOKEN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"tenantSlug":"demo-hotel","email":"admin@demo.com","password":"admin123"}' | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("token") or (d.get("data") or {}).get("token") or "")')
[ -n "$TOKEN" ] && ok "login" || { bad "login"; exit 1; }
CID=$(cd apps/api && npx tsx ../../scripts/seed-channel.ts 2>/dev/null | tail -1 | cut -d: -f2)
[ -n "$CID" ] && ok "B1: channel connection ready (known secret)" || { bad "channel seed"; exit 1; }
PUSH=$(curl -s -X POST "$API/v1/channel/connections/$CID/push-now" -H "Authorization: Bearer $TOKEN")
PLAT=$(printf '%s' "$PUSH" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or {};print(d.get("latencyMs",999999))')
[ "$PLAT" -lt 60000 ] && ok "B1: availability push <60s (${PLAT}ms)" || bad "push latency: $PLAT"
LOG=$(curl -s "$API/v1/channel/connections/$CID/push-log" -H "Authorization: Bearer $TOKEN")
printf '%s' "$LOG" | grep -q '"latencyMs"' && ok "B1: push logged with payload" || bad "push log: $(printf '%s' "$LOG" | head -c 200)"
EXT="B1-GATE-$(date +%s)"
BODY=$(python3 - <<PY
import json
print(json.dumps({"hotelId":"DEMO-HOTEL-B1","externalReference":"$EXT","guest":{"firstName":"Web","lastName":"Hook","email":"webhook@b1.demo"},"arrivalDate":"$(date -v+20d +%F)","departureDate":"$(date -v+22d +%F)","roomTypeCode":"STD-Q","totalAmount":"800","adults":"2","children":"0"}))
PY
)
SIG=$(printf '%s' "$BODY" | python3 -c 'import sys,json,hmac,hashlib;print(hmac.new(b"b1-test-secret",json.dumps(json.load(sys.stdin),sort_keys=True,separators=(",",":")).encode(),hashlib.sha256).hexdigest())')
WH=$(curl -s -X POST "$API/v1/channel/webhooks/bookingcom" -H 'Content-Type: application/json' -H "X-Channel-Signature: $SIG" -d "$BODY")
printf '%s' "$WH" | grep -q '"duplicate":false' && ok "B1: signed webhook created booking ($EXT)" || bad "webhook: $(printf '%s' "$WH" | head -c 300)"
WH2=$(curl -s -X POST "$API/v1/channel/webhooks/bookingcom" -H 'Content-Type: application/json' -H "X-Channel-Signature: $SIG" -d "$BODY")
printf '%s' "$WH2" | grep -q '"duplicate":true' && ok "B1: replayed webhook does NOT double-book" || bad "replay: $(printf '%s' "$WH2" | head -c 200)"
BADS=$(curl -s -X POST "$API/v1/channel/webhooks/bookingcom" -H 'Content-Type: application/json' -H "X-Channel-Signature: deadbeef" -d "$BODY")
printf '%s' "$BADS" | grep -q 'BAD_SIGNATURE' && ok "B1: bad signature rejected (401)" || bad "sig check: $(printf '%s' "$BADS" | head -c 200)"
PUB=$(curl -s "$API/v1/public/properties/DEMO-01/availability?checkIn=$(date -v+20d +%F)&checkOut=$(date -v+21d +%F)&adults=2" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or {};rts=d.get("roomTypes") or [];sq=next((r for r in rts if r.get("name","").startswith("Standard")),None);print(sq.get("availableRooms",-1) if sq else "missing")')
[ "$PUB" != "missing" ] && [ "$PUB" -ge 0 ] && ok "B1: channel booking visible in public availability (StdQ remaining $PUB)" || bad "public visibility: $PUB"
F=$(date +%F); T=$(date -v+13d +%F)
GEN=$(curl -s -X POST "$API/v1/rates/suggestions/generate?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"from\":\"$F\",\"to\":\"$T\"}" 2>/dev/null)
PROPS=$(curl -s "$API/v1/properties" -H "Authorization: Bearer $TOKEN")
PID=$(printf '%s' "$PROPS" | python3 -c 'import sys,json;d=json.load(sys.stdin);items=d if isinstance(d,list) else (d.get("data") or []);p=next((x for x in items if x.get("code")=="DEMO-01"),items[0] if items else {});print(p.get("id",""))')
GEN=$(curl -s -X POST "$API/v1/rates/suggestions/generate?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"from\":\"$F\",\"to\":\"$T\"}")
GN=$(printf '%s' "$GEN" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or {};print(d.get("generated",0))')
[ "$GN" -ge 28 ] && ok "D5: suggestions generated ($GN = roomTypes x 14 days)" || bad "generate: $(printf '%s' "$GEN" | head -c 200)"
SUG=$(curl -s "$API/v1/rates/suggestions?propertyId=$PID&from=$F&to=$T" -H "Authorization: Bearer $TOKEN")
SUGID=$(printf '%s' "$SUG" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or [];p=next((x for x in d if x.get("rationale") and float(x.get("occupancyPct",0))>0),d[0] if d else None);print(p.get("id","") if p else "")')
[ -n "$SUGID" ] && ok "D5: suggestions carry written rationale" || bad "suggestions empty"
APP=$(curl -s -X POST "$API/v1/rates/suggestions/$SUGID/apply" -H "Authorization: Bearer $TOKEN")
printf '%s' "$APP" | grep -q '"applied":true' && ok "D5: suggestion applied" || bad "apply: $(printf '%s' "$APP" | head -c 200)"
DTE=$(printf '%s' "$SUG" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or [];p=next((x for x in d if x.get("id")=="'$SUGID'"),None);print(str(p.get("date",""))[:10] if p else "")')
APLAN=$(curl -s "$API/v1/rates/plans?propertyId=$PID" -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or [];print((d[0] or {}).get("id","") if d else "")')
curl -s -X POST "$API/v1/rates/rules/evaluate?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"from\":\"$F\",\"to\":\"$T\"}" > /dev/null
EFF=$(curl -s "$API/v1/rates/effective?propertyId=$PID&from=$DTE&to=$DTE" -H "Authorization: Bearer $TOKEN")
SURV=$(printf '%s' "$EFF" | python3 -c 'import sys,json;rows=json.load(sys.stdin).get("data") or [];print("yes" if any(str(r.get("ruleId","")).startswith("manual:ai:") for r in rows) else "no")')
[ "$SURV" = "yes" ] && ok "D5: applied rate survives rule re-evaluate (manual:ai override)" || bad "survival: $(printf '%s' "$EFF" | head -c 300)"
echo "== B1+D5 gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "B1+D5 SHIPPED" || echo "B1+D5 NOT SHIPPED"
