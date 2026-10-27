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
RATES=$(curl -s "$API/v1/rates/plans?propertyId=$PID" -H "Authorization: Bearer $TOKEN")
PLAN=$(printf '%s' "$RATES" | python3 -c 'import sys,json
d=json.load(sys.stdin)
def walk(o):
  if isinstance(o,dict):
    if "baseRate" in o and o.get("calculationMethod","fixed")=="fixed" and o.get("id"): return o
    for v in o.values():
      r=walk(v)
      if r: return r
  elif isinstance(o,list):
    for i in o:
      r=walk(i)
      if r: return r
  return None
p=walk(d)
print(json.dumps({"id":p["id"],"base":float(p["baseRate"])}) if p else "none")')
[ "$PLAN" != "none" ] && ok "fixed rate plan resolved ($PLAN)" || { bad "no fixed rate plan: $(printf '%s' "$RATES" | head -c 300)"; exit 1; }
PLANID=$(printf '%s' "$PLAN" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
BASE=$(printf '%s' "$PLAN" | python3 -c 'import sys,json;print(json.load(sys.stdin)["base"])')
FROM=$(date +%F); TO=$(date -v+13d +%F)
RULE=$(curl -s -X POST "$API/v1/rates/rules?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"name":"occupancy >80% within 14 days","type":"occupancy","conditions":{"occupancyGte":0,"daysWithin":30},"adjustment":{"method":"percent","value":15},"priority":100}')
RID=$(printf '%s' "$RULE" | python3 -c 'import sys,json;print((json.load(sys.stdin).get("data") or {}).get("id",""))')
[ -n "$RID" ] && ok "occupancy rule created ($RID)" || { bad "rule: $(printf '%s' "$RULE" | head -c 300)"; exit 1; }
EV=$(curl -s -X POST "$API/v1/rates/rules/evaluate?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"from\":\"$FROM\",\"to\":\"$TO\"}")
printf '%s' "$EV" | grep -q '"evaluated"' && ok "season evaluated (14 days)" || bad "evaluate: $(printf '%s' "$EV" | head -c 300)"
EFF=$(curl -s "$API/v1/rates/effective?propertyId=$PID&from=$FROM&to=$TO" -H "Authorization: Bearer $TOKEN")
MATH=$(printf '%s' "$EFF" | python3 -c "import sys,json
rows=[r for r in (json.load(sys.stdin).get('data') or []) if r.get('ratePlanId')=='$PLANID']
exp=round(float('$BASE')*1.15,2)
okv=len(rows)==14 and all(abs(float(r['effectiveRate'])-exp)<0.01 and abs(float(r['baseRate'])-float('$BASE'))<0.01 for r in rows)
print('yes' if okv else 'no: rows=%s sample=%s exp=%s' % (len(rows), rows[:1], exp))")
[ "$MATH" = "yes" ] && ok "+15% derived rates correct for all 14 days (base $BASE → $BASE*1.15)" || bad "math: $MATH"
EV2=$(curl -s -X POST "$API/v1/rates/rules/evaluate?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"from\":\"$FROM\",\"to\":\"$TO\"}")
IDEM=$(printf '%s' "$EV2" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or {};print("yes" if d.get("evaluated") else "no")')
[ "$IDEM" = "yes" ] && ok "re-run idempotent (upsert, no dupes)" || bad "idempotence"
curl -s -X POST "$API/v1/rates/rules/$RID/toggle" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"isActive":false}' > /dev/null
curl -s -X POST "$API/v1/rates/rules/evaluate?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"from\":\"$FROM\",\"to\":\"$TO\"}" > /dev/null
CLEARED=$(curl -s "$API/v1/rates/effective?propertyId=$PID&from=$FROM&to=$TO" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;rows=json.load(sys.stdin).get('data') or [];print('yes' if all(r.get('ratePlanId')!='$PLANID' for r in rows) else 'no')")
[ "$CLEARED" = "yes" ] && ok "rule off → override reversible, base rates rule again" || bad "reversal failed"
DR=$(curl -s -X POST "$API/v1/rates/rules?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"name":"festive flat","type":"date_range","conditions":{"dateFrom":"'$(date +%F)'","dateTo":"'$(date -v+2d +%F)'"},"adjustment":{"method":"fixed","value":999},"priority":200}')
DRID=$(printf '%s' "$DR" | python3 -c 'import sys,json;print((json.load(sys.stdin).get("data") or {}).get("id",""))')
curl -s -X POST "$API/v1/rates/rules/evaluate?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"from\":\"$FROM\",\"to\":\"$TO\"}" > /dev/null
DRM=$(curl -s "$API/v1/rates/effective?propertyId=$PID&from=$FROM&to=$TO" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json
rows=[r for r in (json.load(sys.stdin).get('data') or []) if r.get('ratePlanId')=='$PLANID']
by={r['date'][:10]:float(r['effectiveRate']) for r in rows}
import datetime
d0='$FROM'; d1='$FROM'; d2=(datetime.date.fromisoformat('$FROM')+datetime.timedelta(days=2)).isoformat()
okv=by.get(d0)==999 and by.get(d2)==999 and by.get((datetime.date.fromisoformat('$FROM')+datetime.timedelta(days=3)).isoformat(),None) is None
print('yes' if okv else 'no:'+repr(by))")
[ "$DRM" = "yes" ] && ok "date_range rule wins on priority (flat 999 for 3 days only)" || bad "date_range: $DRM"
curl -s -X DELETE "$API/v1/rates/rules/$RID" -H "Authorization: Bearer $TOKEN" > /dev/null
curl -s -X DELETE "$API/v1/rates/rules/$DRID" -H "Authorization: Bearer $TOKEN" > /dev/null
curl -s -X POST "$API/v1/rates/rules/evaluate?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"from\":\"$FROM\",\"to\":\"$TO\"}" > /dev/null
FINAL=$(curl -s "$API/v1/rates/effective?propertyId=$PID&from=$FROM&to=$TO" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;rows=[r for r in (json.load(sys.stdin).get('data') or []) if r.get('ratePlanId')=='$PLANID'];print('yes' if not rows else 'no')")
[ "$FINAL" = "yes" ] && ok "rules deleted → ledger clean (full reversal)" || bad "cleanup: rows remain"
echo "== C1 gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "C1 ENGINE SHIPPED" || echo "C1 ENGINE NOT SHIPPED"
