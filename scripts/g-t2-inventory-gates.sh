#!/usr/bin/env bash
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
API="http://localhost:3001"
cd ~/Desktop/Vimad || exit 1
(cd apps/api && npx tsx ../../scripts/room-block.ts cleanup > /dev/null 2>&1)
TOKEN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"tenantSlug":"demo-hotel","email":"admin@demo.com","password":"admin123"}' | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("token") or d.get("accessToken") or (d.get("data") or {}).get("token") or "")')
[ -n "$TOKEN" ] && ok "login" || { bad "login"; exit 1; }
PROPS=$(curl -s "$API/v1/properties" -H "Authorization: Bearer $TOKEN")
PID=$(printf '%s' "$PROPS" | python3 -c 'import sys,json;d=json.load(sys.stdin);items=d if isinstance(d,list) else (d.get("data") or d.get("properties") or []);print((items[0] or {}).get("id","") if items else "")')
ROOMS=$(curl -s "$API/v1/rooms?propertyId=$PID&pageSize=10" -H "Authorization: Bearer $TOKEN")
RID=$(printf '%s' "$ROOMS" | python3 -c 'import sys,json;d=json.load(sys.stdin);items=d if isinstance(d,list) else (d.get("data") or d.get("rooms") or d.get("items") or []);print(items[0].get("id","") if items else "")')
RTID=$(printf '%s' "$ROOMS" | python3 -c 'import sys,json;d=json.load(sys.stdin);items=d if isinstance(d,list) else (d.get("data") or d.get("rooms") or d.get("items") or []);print(items[0].get("roomTypeId","") if items else "")')
FROM=$(date +%F); TO=$(date -v+3d +%F); TOMORROW=$(date -v+1d +%F); AFTER=$(date -v+2d +%F)
curl -s -X POST "$API/v1/housekeeping/rooms/$RID/status" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"serviceStatus":"active","reason":"gate reset"}' > /dev/null
sleep 1
CELL=$(curl -s "$API/v1/inventory/grid?from=$FROM&to=$TO" -H "Authorization: Bearer $TOKEN" -H "X-Property-Id: $PID")
BASES=$(printf '%s' "$CELL" | python3 -c "import sys,json
d=json.load(sys.stdin).get('data') or {}
rt=next((r for r in (d.get('roomTypes') or []) if r.get('id')=='$RTID'),None)
cells=rt.get('cells') or [] if rt else []
def cell(day):
    c=next((c for c in cells if c.get('date')==day),None)
    return {'sellable':c.get('sellable'),'ooo':c.get('ooo')} if c else None
t=cell('$TOMORROW'); a=cell('$AFTER')
print(json.dumps({'t':t,'a':a}) if t and a else 'none')")
[ "$BASES" != "none" ] && ok "baselines captured ($BASES)" || { bad "no cells"; exit 1; }
curl -s -X POST "$API/v1/housekeeping/rooms/$RID/status" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"serviceStatus":"ooo","reason":"inventory gate"}' > /dev/null
sleep 1
OOO=$(curl -s "$API/v1/inventory/grid?from=$FROM&to=$TO" -H "Authorization: Bearer $TOKEN" -H "X-Property-Id: $PID" | python3 -c "import sys,json
b=json.loads('''$BASES''')['t']
d=json.load(sys.stdin).get('data') or {}
rt=next((r for r in (d.get('roomTypes') or []) if r.get('id')=='$RTID'),None)
c=next((c for c in (rt.get('cells') or []) if c.get('date')=='$TOMORROW'),None)
exp=max(b['sellable']-1,0)
print('yes' if c and c.get('ooo')==b['ooo']+1 and c.get('sellable')==exp else 'no:'+json.dumps({'ooo':c.get('ooo'),'sellable':c.get('sellable'),'exp':exp}))")
[ "$OOO" = "yes" ] && ok "serviceStatus=OOO reduces sellable by 1 (clamp-aware)" || bad "OOO math: $OOO"
curl -s -X POST "$API/v1/housekeeping/rooms/$RID/status" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"serviceStatus":"oos","reason":"inventory gate oos"}' > /dev/null
sleep 1
OOS=$(curl -s "$API/v1/inventory/grid?from=$FROM&to=$TO" -H "Authorization: Bearer $TOKEN" -H "X-Property-Id: $PID" | python3 -c "import sys,json
b=json.loads('''$BASES''')['t']
d=json.load(sys.stdin).get('data') or {}
rt=next((r for r in (d.get('roomTypes') or []) if r.get('id')=='$RTID'),None)
c=next((c for c in (rt.get('cells') or []) if c.get('date')=='$TOMORROW'),None)
print('yes' if c and c.get('ooo')==b['ooo'] and c.get('sellable')==b['sellable'] else 'no:'+json.dumps({'ooo':c.get('ooo'),'sellable':c.get('sellable')}))")
[ "$OOS" = "yes" ] && ok "OOS does NOT reduce availability" || bad "OOS math: $OOS"
curl -s -X POST "$API/v1/housekeeping/rooms/$RID/status" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"serviceStatus":"active","reason":"inventory gate restore"}' > /dev/null
BID=$(cd apps/api && npx tsx ../../scripts/room-block.ts insert "$PID" "$RTID" "$TOMORROW" "$TOMORROW" 2>/dev/null)
[ -n "$BID" ] && ok "dated room_block inserted" || bad "block insert failed"
sleep 1
BLOCK=$(curl -s "$API/v1/inventory/grid?from=$FROM&to=$TO" -H "Authorization: Bearer $TOKEN" -H "X-Property-Id: $PID" | python3 -c "import sys,json
bs=json.loads('''$BASES''')
d=json.load(sys.stdin).get('data') or {}
rt=next((r for r in (d.get('roomTypes') or []) if r.get('id')=='$RTID'),None)
cells=rt.get('cells') or []
t=next((c for c in cells if c.get('date')=='$TOMORROW'),None)
a=next((c for c in cells if c.get('date')=='$AFTER'),None)
exp_t=max(bs['t']['sellable']-1,0)
ok_t = t and t.get('sellable')==exp_t
ok_a = a and a.get('sellable')==bs['a']['sellable']
print('yes' if ok_t and ok_a else 'no:'+json.dumps({'t':t and t.get('sellable'),'exp_t':exp_t,'a':a and a.get('sellable'),'exp_a':bs['a']['sellable']}))")
[ "$BLOCK" = "yes" ] && ok "dated OOO block reduces only covered dates" || bad "block math: $BLOCK"
[ -n "$BID" ] && (cd apps/api && npx tsx ../../scripts/room-block.ts delete "$BID" > /dev/null 2>&1)
REFRESH=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/v1/inventory/cache/refresh" -H "Authorization: Bearer $TOKEN" -H "X-Property-Id: $PID")
[ "$REFRESH" = "200" ] && ok "cache refresh runs with new math" || bad "cache refresh: $REFRESH"
echo "== T2 inventory gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "T2 INVENTORY SHIPPED" || echo "T2 INVENTORY NOT SHIPPED"
