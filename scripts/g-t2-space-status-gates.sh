#!/usr/bin/env bash
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
API="http://localhost:3001"
cd ~/Desktop/Vimad || exit 1
TOKEN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"tenantSlug":"demo-hotel","email":"admin@demo.com","password":"admin123"}' | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("token") or d.get("accessToken") or (d.get("data") or {}).get("token") or "")')
[ -n "$TOKEN" ] && ok "login" || { bad "login"; exit 1; }
PROPS=$(curl -s "$API/v1/properties" -H "Authorization: Bearer $TOKEN")
PID=$(printf '%s' "$PROPS" | python3 -c 'import sys,json;d=json.load(sys.stdin);items=d if isinstance(d,list) else (d.get("data") or d.get("properties") or []);print((items[0] or {}).get("id","") if items else "")')
ROOMS=$(curl -s "$API/v1/rooms?propertyId=$PID&pageSize=5" -H "Authorization: Bearer $TOKEN")
RID=$(printf '%s' "$ROOMS" | python3 -c 'import sys,json
d=json.load(sys.stdin)
items=d if isinstance(d,list) else (d.get("data") or d.get("rooms") or d.get("items") or [])
print(items[0].get("id","") if items else "")')
[ -n "$RID" ] && ok "room resolved ($RID)" || { bad "no room: $(printf '%s' "$ROOMS" | head -c 300)"; exit 1; }
GRID0=$(curl -s "$API/v1/housekeeping/space-status?propertyId=$PID" -H "Authorization: Bearer $TOKEN")
printf '%s' "$GRID0" | grep -q "byHousekeeping" && ok "space-status grid responds" || bad "grid: $(printf '%s' "$GRID0" | head -c 300)"
NOREASON=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/v1/housekeeping/rooms/$RID/status" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"serviceStatus":"oos"}')
[ "$NOREASON" = "400" ] && ok "reason mandatory for OOS (400)" || bad "OOS without reason returned $NOREASON"
SET=$(curl -s -X POST "$API/v1/housekeeping/rooms/$RID/status" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"serviceStatus":"oos","reason":"lift maintenance","note":"T2 gate"}')
printf '%s' "$SET" | grep -q '"serviceStatus"' && ok "OOS set with reason" || bad "transition: $(printf '%s' "$SET" | head -c 300)"
GRID1=$(curl -s "$API/v1/housekeeping/space-status?propertyId=$PID" -H "Authorization: Bearer $TOKEN")
printf '%s' "$GRID1" | grep -q "lift maintenance" && ok "reason visible in grid" || bad "reason not in grid"
HKSET=$(curl -s -X POST "$API/v1/housekeeping/rooms/$RID/status" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"housekeepingStatus":"dirty","reason":"deep clean needed"}')
printf '%s' "$HKSET" | grep -q '"housekeepingStatus"' && ok "HK status transition recorded" || bad "hk transition: $(printf '%s' "$HKSET" | head -c 200)"
RESTORE=$(curl -s -X POST "$API/v1/housekeeping/rooms/$RID/status" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"housekeepingStatus":"clean","serviceStatus":"active","reason":"T2 gate restore"}')
printf '%s' "$RESTORE" | grep -q '"serviceStatus"' && ok "restore to active/clean" || bad "restore: $(printf '%s' "$RESTORE" | head -c 200)"
RULE=$(curl -s -X POST "$API/v1/housekeeping/rules/hk-stagnant-vacant/run" -H "Authorization: Bearer $TOKEN")
printf '%s' "$RULE" | grep -q '"flipped"' && ok "stagnant rule executes ($(printf '%s' "$RULE" | python3 -c 'import sys,json;print((json.load(sys.stdin).get("data") or {}).get("flipped"))') flipped)" || bad "rule run: $(printf '%s' "$RULE" | head -c 300)"
RULE2=$(curl -s -X POST "$API/v1/housekeeping/rules/hk-inspected-overnight/run" -H "Authorization: Bearer $TOKEN")
printf '%s' "$RULE2" | grep -q '"flipped"' && ok "overnight rule executes" || bad "overnight: $(printf '%s' "$RULE2" | head -c 300)"
CODE=$(curl -s -o /tmp/space-status.csv -D /tmp/space-status.hdr -w "%{http_code}" "$API/v1/housekeeping/space-status/export?propertyId=$PID" -H "Authorization: Bearer $TOKEN")
ATT=$(grep -ci "content-disposition: attachment" /tmp/space-status.hdr 2>/dev/null || echo 0)
[ "$CODE" = "200" ] && [ "$ATT" -ge 1 ] && ok "CSV export 200 + attachment" || bad "export code=$CODE"
AUDIT=$(curl -s "$API/v1/audit-logs?entity=room&pageSize=5" -H "Authorization: Bearer $TOKEN")
printf '%s' "$AUDIT" | grep -q "housekeeping.status_change" && ok "transitions audited" || bad "no audit rows for room transitions"
echo "== T2 gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "T2 FOUNDATION SHIPPED" || echo "T2 FOUNDATION NOT SHIPPED"
