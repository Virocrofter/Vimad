#!/usr/bin/env bash
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
API="http://localhost:3001"
cd ~/Desktop/Vimad || exit 1
TOKEN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"tenantSlug":"demo-hotel","email":"admin@demo.com","password":"admin123"}' | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("token") or d.get("accessToken") or (d.get("data") or {}).get("token") or "")')
[ -n "$TOKEN" ] && ok "login token acquired" || { bad "login failed"; echo "== 0.3 gates: $PASS passed, $FAIL failed =="; exit 1; }
PROPS=$(curl -s "$API/v1/properties" -H "Authorization: Bearer $TOKEN")
PID=$(printf '%s' "$PROPS" | python3 -c 'import sys,json;d=json.load(sys.stdin);items=d if isinstance(d,list) else (d.get("data") or d.get("properties") or []);print((items[0] or {}).get("id","") if items else "")')
[ -n "$PID" ] && ok "property resolved ($PID)" || bad "no property resolved: $(printf '%s' "$PROPS" | head -c 200)"
FROM=$(date +%F); TO=$(date -v+3d +%F); TOMORROW=$(date -v+1d +%F)
GRID=$(curl -s "$API/v1/inventory/grid?from=$FROM&to=$TO" -H "Authorization: Bearer $TOKEN" -H "X-Property-Id: $PID")
RTID=$(printf '%s' "$GRID" | python3 -c 'import sys,json;d=json.load(sys.stdin);data=d.get("data",d);rts=data.get("roomTypes") or [];print(rts[0].get("id","") if rts else "")')
[ -n "$RTID" ] && ok "roomType resolved ($RTID)" || bad "no roomType in grid: $(printf '%s' "$GRID" | head -c 300)"
PUT=$(curl -s -X PUT "$API/v1/inventory/restrictions" -H "Authorization: Bearer $TOKEN" -H "X-Property-Id: $PID" -H 'Content-Type: application/json' -d "{\"roomTypeId\":\"$RTID\",\"date\":\"$TOMORROW\",\"stopSell\":true,\"notes\":\"0.3 audit smoke\"}")
printf '%s' "$PUT" | grep -q "stopSell" && ok "stop-sell set (audited action)" || bad "restriction PUT failed: $(printf '%s' "$PUT" | head -c 300)"
sleep 1
LOGS=$(curl -s "$API/v1/audit-logs?entity=inventory&page=1&pageSize=5" -H "Authorization: Bearer $TOKEN" -H "X-Property-Id: $PID")
printf '%s' "$LOGS" | grep -q "inventory.adjust" && ok "audit row visible via filtered list" || bad "no inventory.adjust row: $(printf '%s' "$LOGS" | head -c 300)"
printf '%s' "$LOGS" | grep -q "severity" && ok "severity metadata present" || bad "severity missing in row"
printf '%s' "$LOGS" | grep -qi "admin" && ok "actor metadata present" || bad "actor missing in row"
CODE=$(curl -s -o /tmp/audit-export.csv -D /tmp/audit-export.hdr -w "%{http_code}" "$API/v1/audit-logs/export" -H "Authorization: Bearer $TOKEN" -H "X-Property-Id: $PID")
ATT=$(grep -ci "content-disposition: attachment" /tmp/audit-export.hdr 2>/dev/null || echo 0)
HDR=$(head -1 /tmp/audit-export.csv 2>/dev/null)
[ "$CODE" = "200" ] && [ "$ATT" -ge 1 ] && printf '%s' "$HDR" | grep -q "Timestamp" && ok "CSV export 200 + attachment + header" || bad "export code=$CODE attachment=$ATT header=$HDR"
UNAUTH=$(curl -s -o /dev/null -w "%{http_code}" "$API/v1/audit-logs")
[ "$UNAUTH" = "401" ] && ok "unauthenticated read rejected (401)" || bad "unauth read returned $UNAUTH"
echo "== 0.3 gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "0.3 AUDIT SMOKES SHIPPED" || echo "0.3 AUDIT SMOKES NOT SHIPPED"
