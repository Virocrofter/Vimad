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
PID=$(printf '%s' "$PROPS" | python3 -c 'import sys,json;d=json.load(sys.stdin);items=d if isinstance(d,list) else (d.get("data") or d.get("properties") or []);print((items[0] or {}).get("id",""))')
CODE=$(printf '%s' "$PROPS" | python3 -c 'import sys,json;d=json.load(sys.stdin);items=d if isinstance(d,list) else (d.get("data") or d.get("properties") or []);print((items[0] or {}).get("code",""))')
PLANS=$(curl -s "$API/v1/rates/plans?propertyId=$PID" -H "Authorization: Bearer $TOKEN")
PARENT=$(printf '%s' "$PLANS" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or [];p=next((x for x in d if x.get("calculationMethod")=="fixed"),None);print(json.dumps({"id":p["id"],"base":float(p["baseRate"]),"roomTypeId":p["roomTypeId"]}) if p else "none")')
[ "$PARENT" != "none" ] && ok "fixed parent plan resolved" || { bad "no fixed plan"; exit 1; }
PBID=$(printf '%s' "$PARENT" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
PBASE=$(printf '%s' "$PARENT" | python3 -c 'import sys,json;print(json.load(sys.stdin)["base"])')
RTID=$(printf '%s' "$PARENT" | python3 -c 'import sys,json;print(json.load(sys.stdin)["roomTypeId"])')
FROM=$(date +%F); TO=$(date -v+2d +%F)
CHILD=$(curl -s -X POST "$API/v1/rates/derived-plans?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"parentRatePlanId\":\"$PBID\",\"calculationMethod\":\"percent\",\"calculationValue\":10,\"name\":\"+10% derived\"}")
CHILDID=$(printf '%s' "$CHILD" | python3 -c 'import sys,json;print((json.load(sys.stdin).get("data") or {}).get("id",""))')
[ -n "$CHILDID" ] && ok "derived (child) plan created" || { bad "derived: $(printf '%s' "$CHILD" | head -c 300)"; exit 1; }
Q0=$(curl -s "$API/v1/rates/quote?propertyId=$PID&roomTypeId=$RTID&from=$FROM&to=$TO&ratePlanId=$CHILDID" -H "Authorization: Bearer $TOKEN")
DERIVED_BASE=$(python3 -c "print(round(float('$PBASE')*1.1,2))")
CHAINOK=$(printf '%s' "$Q0" | python3 -c "import sys,json;d=json.load(sys.stdin).get('data') or {};print('yes' if abs(float(d.get('baseRate',0))-float('$DERIVED_BASE'))<0.01 else 'no:'+repr(d.get('baseRate')))")
[ "$CHAINOK" = "yes" ] && ok "parent/child chain resolves (base $PBASE → $DERIVED_BASE)" || bad "chain: $CHAINOK"
RULE=$(curl -s -X POST "$API/v1/rates/rules?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"name":"occ +15","type":"occupancy","conditions":{"occupancyGte":0,"daysWithin":30},"adjustment":{"method":"percent","value":15},"priority":100}')
RID=$(printf '%s' "$RULE" | python3 -c 'import sys,json;print((json.load(sys.stdin).get("data") or {}).get("id",""))')
curl -s -X POST "$API/v1/rates/rules/evaluate?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"from\":\"$FROM\",\"to\":\"$TO\"}" > /dev/null
EXP=$(python3 -c "print(round(float('$PBASE')*1.15,2))")
ROOMLIST=$(curl -s "$API/v1/rooms?propertyId=$PID&pageSize=50" -H "Authorization: Bearer $TOKEN")
(cd apps/api && npx tsx ../../scripts/reset-rooms.ts > /dev/null 2>&1)
for D in $FROM $(date -v+1d +%F) $TO; do for RT in $(printf '%s' "$PLANS" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or [];[print(p.get("roomTypeId","")) for p in d]' | sort -u); do curl -s -X PUT "$API/v1/inventory/restrictions" -H "Authorization: Bearer $TOKEN" -H "X-Property-Id: $PID" -H 'Content-Type: application/json' -d "{"roomTypeId":"$RT","date":"$D","stopSell":false,"closeToArrival":false,"closeToDeparture":false}" > /dev/null; done; done
CLEARDBG=$(curl -s "$API/v1/inventory/grid?from=$FROM&to=$FROM" -H "Authorization: Bearer $TOKEN" -H "X-Property-Id: $PID" | python3 -c "import sys,json;d=json.load(sys.stdin).get('data') or {};rt=next((r for r in (d.get('roomTypes') or []) if r.get('id')=='$RTID'),None);c=(rt.get('cells') or [{}])[0] if rt else {};print('stopSell=',c.get('stopSell'),'cta=',c.get('closeToArrival'))")
echo "CLEARDBG: $CLEARDBG"
sleep 2
AVBODY=$(curl -s "$API/v1/public/properties/$CODE/availability?checkIn=$FROM&checkOut=$(date -v+1d +%F)&adults=2")
AV=$(printf '%s' "$AVBODY" | python3 -c "import sys,json
raw=sys.stdin.read()
try:
    d=json.loads(raw).get('data') or []
except Exception:
    print('no-rt raw='+raw[:200]); sys.exit()
rts=d if isinstance(d,list) else (d.get('roomTypes') or [])
rt=next((r for r in rts if r.get('roomTypeId')=='$RTID' or r.get('id')=='$RTID' or r.get('typeId')=='$RTID'),None)
if not rt: print('no-rt ids='+repr([(r.get('roomTypeId'),r.get('name')) for r in rts])+' wanted=$RTID'); sys.exit()
rates=[n.get('rate') for n in (rt.get('nightly') or [])]
exp=float('$EXP')
print('yes' if rates and all(abs(r-exp)<0.01 for r in rates) else 'no:'+repr(rates)+' exp='+str(exp))")
[ "$AV" = "yes" ] && ok "PUBLIC BOOKING reads ledger: nightly == derived×1.15 ($EXP) end-to-end" || bad "public wire: $AV"
BULK=$(curl -s -X POST "$API/v1/rates/bulk-update?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"ratePlanId\":\"$CHILDID\",\"from\":\"$FROM\",\"to\":\"$TO\",\"method\":\"fixed\",\"value\":1234}")
printf '%s' "$BULK" | grep -q '"written"' && ok "bulk override written" || bad "bulk: $(printf '%s' "$BULK" | head -c 200)"
curl -s -X POST "$API/v1/rates/rules/evaluate?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"from\":\"$FROM\",\"to\":\"$TO\"}" > /dev/null
Q1=$(curl -s "$API/v1/rates/quote?propertyId=$PID&roomTypeId=$RTID&from=$FROM&to=$TO&ratePlanId=$CHILDID" -H "Authorization: Bearer $TOKEN")
printf '%s' "$Q1" | grep -q '"rate":1234' && ok "manual override survives re-evaluate (rules recalc around it)" || bad "preserve: $(printf '%s' "$Q1" | head -c 300)"
curl -s -X POST "$API/v1/rates/bulk-update?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"ratePlanId\":\"$CHILDID\",\"from\":\"$FROM\",\"to\":\"$TO\",\"method\":\"clear\"}" > /dev/null
RESTR=$(curl -s -X POST "$API/v1/rates/rules?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"name":"high occupancy stop-sell","type":"restriction","conditions":{"occupancyGte":0,"daysWithin":30},"adjustment":{},"priority":200}')
RESTRID=$(printf '%s' "$RESTR" | python3 -c 'import sys,json;print((json.load(sys.stdin).get("data") or {}).get("id",""))')
[ -n "$RESTRID" ] && ok "restriction rule created" || bad "restriction rule: $(printf '%s' "$RESTR" | head -c 300)"
curl -s -X POST "$API/v1/rates/rules/evaluate?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"from\":\"$FROM\",\"to\":\"$TO\"}" > /dev/null
SUG=$(curl -s "$API/v1/rates/restrictions-review?propertyId=$PID&from=$FROM&to=$TO" -H "Authorization: Bearer $TOKEN")
SUGID=$(printf '%s' "$SUG" | python3 -c "import sys,json;rows=json.load(sys.stdin).get('data') or [];p=next((s for s in rows if s.get('roomTypeId')=='$RTID'),None);print(p.get('id','') if p else '')")
[ -n "$SUGID" ] && ok "restriction suggestion queued for review" || bad "suggestions: $(printf '%s' "$SUG" | head -c 300)"
APPLY=$(curl -s -X POST "$API/v1/rates/restrictions-review/$SUGID/apply" -H "Authorization: Bearer $TOKEN")
printf '%s' "$APPLY" | grep -q '"applied":true' && ok "review wizard applies stop-sell to inventory" || bad "apply: $(printf '%s' "$APPLY" | head -c 300)"
GRID=$(curl -s "$API/v1/inventory/grid?from=$FROM&to=$TO" -H "Authorization: Bearer $TOKEN" -H "X-Property-Id: $PID")
printf '%s' "$GRID" | python3 -c "import sys,json
d=json.load(sys.stdin).get('data') or {}
rt=next((r for r in (d.get('roomTypes') or []) if r.get('id')=='$RTID'),None)
c=next((c for c in (rt.get('cells') or []) if c.get('date')=='$FROM'),None)
print('yes' if c and c.get('stopSell') else 'no')" > /tmp/ss.txt
[ "$(cat /tmp/ss.txt)" = "yes" ] && ok "stop-sell live in inventory grid (no-exceptions)" || bad "grid stop-sell missing"
VCH=$(curl -s -X POST "$API/v1/rates/vouchers?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"discountPercent":10,"maxUses":50}')
VOK=$(printf '%s' "$VCH" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or {};c=d.get("code","");l=d.get("deepLink","");print("yes" if c and "voucher="+c in l else "no:"+repr(d))')
[ "$VOK" = "yes" ] && ok "voucher deep link generated (code in link)" || bad "voucher: $(printf '%s' "$VCH" | head -c 300)"
[ -s apps/web/src/app/app/rates/pricing/page.jsx ] && ok "pricing console UI on disk" || bad "UI missing"
grep -q "bulk-update" apps/web/src/app/app/rates/pricing/page.jsx && grep -q "restrictions-review" apps/web/src/app/app/rates/pricing/page.jsx && grep -q "vouchers" apps/web/src/app/app/rates/pricing/page.jsx && ok "UI wired to all four APIs" || bad "UI wiring incomplete"
grep -q "rates/pricing" apps/web/src/router.tsx && grep -q "'Pricing'" apps/web/src/components/layout/Sidebar.tsx && ok "route + sidebar registered" || bad "wiring missing"
curl -s -X DELETE "$API/v1/rates/rules/$RID" -H "Authorization: Bearer $TOKEN" > /dev/null
curl -s -X DELETE "$API/v1/rates/rules/$RESTRID" -H "Authorization: Bearer $TOKEN" > /dev/null
[ -n "$SUGID" ] && curl -s -X POST "$API/v1/rates/restrictions-review/$SUGID/dismiss" -H "Authorization: Bearer $TOKEN" > /dev/null
echo "== C1 full gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "C1' COMPLETE" || echo "C1' NOT COMPLETE"
