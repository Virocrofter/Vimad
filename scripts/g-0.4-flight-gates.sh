#!/usr/bin/env bash
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
API="http://localhost:3001"
cd ~/Desktop/Vimad || exit 1
TOKEN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"tenantSlug":"demo-hotel","email":"admin@demo.com","password":"admin123"}' | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("token") or d.get("accessToken") or (d.get("data") or {}).get("token") or "")')
[ -n "$TOKEN" ] && ok "login token acquired" || { bad "login failed"; echo "== 0.4 gates: $PASS passed, $FAIL failed =="; exit 1; }
PROPS=$(curl -s "$API/v1/properties" -H "Authorization: Bearer $TOKEN")
PID=$(printf '%s' "$PROPS" | python3 -c 'import sys,json;d=json.load(sys.stdin);items=d if isinstance(d,list) else (d.get("data") or d.get("properties") or []);print((items[0] or {}).get("id","") if items else "")')
[ -n "$PID" ] && ok "property resolved" || bad "no property"
T0=$(python3 -c 'from datetime import datetime,timedelta,timezone;print((datetime.now(timezone(timedelta(hours=2)))+timedelta(hours=3)).isoformat(timespec="seconds"))')
CREATE=$(curl -s -X POST "$API/v1/concierge" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"propertyId\":\"$PID\",\"type\":\"transfer\",\"title\":\"0.4 Tambo demo pickup\",\"scheduledAt\":\"$T0\",\"flightNumber\":\"SA123\"}")
ITEM=$(printf '%s' "$CREATE" | python3 -c 'import sys,json;d=json.load(sys.stdin);i=d.get("data") or {};print(i.get("id",""))')
[ -n "$ITEM" ] && ok "transfer item created ($ITEM)" || { bad "create failed: $(printf '%s' "$CREATE" | head -c 300)"; echo "== 0.4 gates: $PASS passed, $FAIL failed =="; exit 1; }
SIM1=$(curl -s -X POST "$API/v1/concierge/flights/simulate" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"itemId\":\"$ITEM\",\"status\":\"delayed\",\"delayMinutes\":90}")
printf '%s' "$SIM1" | python3 -c 'import sys,json;d=(json.load(sys.stdin).get("data") or {});ok=lambda b,m:(print("PASS: "+m) if b else print("FAIL: "+m))' 2>/dev/null
R1=$(printf '%s' "$SIM1" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or {};print("yes" if d.get("adjusted") and d.get("taskCreated") and d.get("notified") else "no:"+json.dumps(d))')
[ "$R1" = "yes" ] && ok "90-min delay applied: task created + desk notified" || bad "simulate result: $R1"
ST=$(curl -s "$API/v1/concierge/flights/status/$ITEM" -H "Authorization: Bearer $TOKEN")
MATH=$(printf '%s' "$ST" | python3 -c 'import sys,json
from datetime import datetime
d=json.load(sys.stdin).get("data") or {}
f=d.get("flight") or {}
prev=datetime.fromisoformat(f.get("previousScheduledAt",""))
cur=datetime.fromisoformat((d.get("scheduledAt") or "").replace("Z","+00:00"))
delta=(cur-prev).total_seconds()
ok = f.get("delayMinutes")==90 and abs(delta-5400)<2
print("yes" if ok else "no delay=%s delta=%s" % (f.get("delayMinutes"), delta))')
[ "$MATH" = "yes" ] && ok "pickup re-timed by exactly 90 minutes" || bad "re-time math: $MATH"
SIM2=$(curl -s -X POST "$API/v1/concierge/flights/simulate" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"itemId\":\"$ITEM\",\"status\":\"delayed\",\"delayMinutes\":90}")
R2=$(printf '%s' "$SIM2" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or {};print("yes" if (not d.get("adjusted")) and d.get("alreadyAdjusted") else "no:"+json.dumps(d))')
[ "$R2" = "yes" ] && ok "idempotent: repeat simulate is a no-op" || bad "idempotence: $R2"
echo "== 0.4 gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "0.4 SHIPPED" || echo "0.4 NOT SHIPPED"
