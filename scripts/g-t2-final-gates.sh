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
ROOMS=$(curl -s "$API/v1/rooms?propertyId=$PID&pageSize=10" -H "Authorization: Bearer $TOKEN")
PAIRS=$(printf '%s' "$ROOMS" | python3 -c 'import sys,json;d=json.load(sys.stdin);items=d if isinstance(d,list) else (d.get("data") or d.get("rooms") or d.get("items") or []);ids=[r.get("id") for r in items if r.get("id")];print(ids[0]+" "+ids[1] if len(ids)>=2 else "")')
PARENT=$(echo "$PAIRS" | cut -d' ' -f1)
CHILD=$(echo "$PAIRS" | cut -d' ' -f2)
[ -n "$PARENT" ] && ok "two rooms resolved" || { bad "need 2 rooms"; exit 1; }
(cd apps/api && npx tsx ../../scripts/link-rooms.ts link "$CHILD" "$PARENT" > /dev/null 2>&1) && ok "child linked to parent" || bad "link failed"
PNUM=$(printf '%s' "$ROOMS" | python3 -c 'import sys,json;d=json.load(sys.stdin);items=d if isinstance(d,list) else (d.get("data") or d.get("rooms") or []);print(next((r.get("number","") for r in items if r.get("id")=="'$PARENT'"),""))')
curl -s -X POST "$API/v1/housekeeping/rooms/$PARENT/status" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"serviceStatus":"ooo","reason":"parent cascade gate"}' > /dev/null
GRID=$(curl -s "$API/v1/housekeeping/space-status?propertyId=$PID" -H "Authorization: Bearer $TOKEN")
CASCADE=$(printf '%s' "$GRID" | python3 -c "import sys,json
d=json.load(sys.stdin).get('data') or {}
rooms={r['id']:r for r in (d.get('rooms') or [])}
p=rooms.get('$PARENT'); c=rooms.get('$CHILD')
ok = p and c and p.get('serviceStatus')=='ooo' and c.get('serviceStatus')=='ooo' and 'cascade' in (c.get('serviceReason') or '')
print('yes' if ok else 'no:'+repr({'p':p and p.get('serviceStatus'),'c':c and c.get('serviceStatus'),'reason':c and c.get('serviceReason')}))")
[ "$CASCADE" = "yes" ] && ok "parent OOO cascaded to child with cascade reason" || bad "cascade: $CASCADE"
curl -s -X POST "$API/v1/housekeeping/rooms/$PARENT/status" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"serviceStatus":"active","reason":"gate restore"}' > /dev/null
curl -s -X POST "$API/v1/housekeeping/rooms/$CHILD/status" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"serviceStatus":"active","reason":"gate restore"}' > /dev/null
(cd apps/api && npx tsx ../../scripts/link-rooms.ts unlink "$CHILD" > /dev/null 2>&1)
RESTORED=$(curl -s "$API/v1/housekeeping/space-status?propertyId=$PID" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin).get('data') or {};rooms={r['id']:r for r in (d.get('rooms') or [])};print('yes' if rooms.get('$PARENT',{}).get('serviceStatus')=='active' and rooms.get('$CHILD',{}).get('serviceStatus')=='active' else 'no')")
[ "$RESTORED" = "yes" ] && ok "rooms restored to active" || bad "restore failed"
[ -s apps/web/src/app/app/housekeeping/mobile/page.jsx ] && ok "HK mobile page on disk" || bad "mobile page missing"
grep -q "useSpaceStatus" apps/web/src/app/app/housekeeping/mobile/page.jsx && grep -q "useRoomStatusTransition" apps/web/src/app/app/housekeeping/mobile/page.jsx && ok "mobile page wired to live hooks" || bad "mobile page not wired"
grep -qE "fixture|mockData" apps/web/src/app/app/housekeeping/mobile/page.jsx && bad "mobile page has fixtures" || ok "mobile page fixture-free"
LINES=$(wc -l < apps/web/src/app/app/housekeeping/mobile/page.jsx)
[ "$LINES" -gt 150 ] && ok "mobile page substantial ($LINES lines)" || bad "mobile page small ($LINES)"
grep -q "housekeeping/mobile" apps/web/src/router.tsx && ok "mobile route registered" || bad "mobile route missing"
echo "== T2 final gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "T2 COMPLETE" || echo "T2 NOT COMPLETE"
