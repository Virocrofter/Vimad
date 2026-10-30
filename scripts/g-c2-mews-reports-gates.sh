#!/usr/bin/env bash
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
API="http://localhost:3001"
cd ~/Desktop/Vimad || exit 1
(cd apps/api && npx tsx ../../scripts/room-block.ts cleanup > /dev/null 2>&1)
TOKEN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"tenantSlug":"demo-hotel","email":"admin@demo.com","password":"admin123"}' | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("token") or d.get("accessToken") or (d.get("data") or {}).get("token") or "")')
[ -n "$TOKEN" ] && ok "login" || { bad "login"; exit 1; }
DEFS=$(curl -s "$API/v1/reports/definitions" -H "Authorization: Bearer $TOKEN")
MISSING=$(printf '%s' "$DEFS" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or [];keys={x.get("key") for x in d};need={"pace","forecast","revenue_breakdown","market_segments","space_status","cancellation_lead"};print(",".join(sorted(need-keys)) if need-keys else "none")')
[ "$MISSING" = "none" ] && ok "6 Mews-depth definitions registered" || bad "missing: $MISSING"
FROM=$(date +%F); TO=$(date -v+13d +%F)
FR=$(curl -s -X POST "$API/v1/reports/run" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"definitionKey\":\"forecast\",\"params\":{\"dateFrom\":\"$FROM\",\"dateTo\":\"$TO\"}}")
FC=$(printf '%s' "$FR" | python3 -c 'import sys,json;r=json.load(sys.stdin).get("data") or {};rows=(r.get("result") or {}).get("rows") or [];print("yes" if r.get("status")=="COMPLETED" and len(rows)==14 else "no:%s:%s"%(r.get("status"),len(rows)))')
[ "$FC" = "yes" ] && ok "forecast 14d COMPLETED with OTB rows" || bad "forecast: $FC"
FRID=$(printf '%s' "$FR" | python3 -c 'import sys,json;print((json.load(sys.stdin).get("data") or {}).get("id",""))')
EXP=$(curl -s -o /dev/null -w "%{http_code}" "$API/v1/reports/runs/$FRID/export" -H "Authorization: Bearer $TOKEN")
[ "$EXP" = "200" ] && ok "forecast CSV export 200" || bad "export: $EXP"
P1=$(date -v+1d +%F); P7=$(date -v+7d +%F); CM5=$(date -v-5d +%F); CP1=$(date -v+1d +%F)
PR=$(curl -s -X POST "$API/v1/reports/run" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"definitionKey\":\"pace\",\"params\":{\"dateFrom\":\"$P1\",\"dateTo\":\"$P7\"}}")
PCOMPSOLD=$(printf '%s' "$PR" | python3 -c 'import sys,json;r=json.load(sys.stdin).get("data") or {};rows=(r.get("result") or {}).get("rows") or [];print(r.get("status"),sum(x.get("compSold",0) for x in rows))')
[ "${PCOMPSOLD%% *}" = "COMPLETED" ] && ok "pace COMPLETED (comp sold sum: ${PCOMPSOLD##* })" || bad "pace: $PCOMPSOLD"
OCC=$(curl -s -X POST "$API/v1/reports/run" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"definitionKey\":\"occupancy\",\"params\":{\"dateFrom\":\"$CM5\",\"dateTo\":\"$CP1\"}}")
OCCSOLD=$(printf '%s' "$OCC" | python3 -c 'import sys,json;r=json.load(sys.stdin).get("data") or {};rows=(r.get("result") or {}).get("rows") or [];print(sum(x.get("sold",0) for x in rows))')
[ "$OCCSOLD" = "${PCOMPSOLD##* }" ] && ok "pace compSold == occupancy sold over comparison window ($OCCSOLD)" || bad "pace mismatch: pace=${PCOMPSOLD##* } occ=$OCCSOLD"
R60=$(date -v-60d +%F)
RV=$(curl -s -X POST "$API/v1/reports/run" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"definitionKey\":\"revenue\",\"params\":{\"dateFrom\":\"$R60\",\"dateTo\":\"$FROM\"}}")
RB=$(curl -s -X POST "$API/v1/reports/run" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"definitionKey\":\"revenue_breakdown\",\"params\":{\"dateFrom\":\"$R60\",\"dateTo\":\"$FROM\"}}")
XCHECK=$(python3 - "$RV" "$RB" <<'PY'
import sys,json
rv=json.loads(sys.argv[1]).get('data') or {}
rb=json.loads(sys.argv[2]).get('data') or {}
a=sum(x.get('revenue',0) for x in (rv.get('result') or {}).get('rows') or [])
b=sum(x.get('revenue',0) for x in (rb.get('result') or {}).get('rows') or [])
print('yes' if rv.get('status')=='COMPLETED' and rb.get('status')=='COMPLETED' and abs(a-b)<0.01 else 'no: %s vs %s'%(a,b))
PY
)
[ "$XCHECK" = "yes" ] && ok "revenue_breakdown total == revenue report total (charge-type math consistent)" || bad "xcheck: $XCHECK"
MS=$(curl -s -X POST "$API/v1/reports/run" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"definitionKey\":\"market_segments\",\"params\":{\"dateFrom\":\"$R60\",\"dateTo\":\"$TO\"}}")
MSOK=$(printf '%s' "$MS" | python3 -c 'import sys,json;r=json.load(sys.stdin).get("data") or {};rows=(r.get("result") or {}).get("rows") or [];print("yes" if r.get("status")=="COMPLETED" and len(rows)>=1 else "no")')
[ "$MSOK" = "yes" ] && ok "market_segments COMPLETED" || bad "market_segments: $MSOK"
SS=$(curl -s -X POST "$API/v1/reports/run" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"definitionKey":"space_status","params":{}}')
SSOK=$(printf '%s' "$SS" | python3 -c 'import sys,json;r=json.load(sys.stdin).get("data") or {};rows=(r.get("result") or {}).get("rows") or [];s=r.get("result",{}).get("summary") or [];rooms=next((x.get("value") for x in s if x.get("label")=="Rooms"),0);print("yes" if r.get("status")=="COMPLETED" and len(rows)>=20 and rooms>=20 else "no:%s:%s"%(r.get("status"),len(rows)))')
[ "$SSOK" = "yes" ] && ok "space_status lists all rooms with service status" || bad "space_status: $SSOK"
SEED=$(cd apps/api && npx tsx ../../scripts/seed-cancellation.ts 2>/dev/null)
[ "$SEED" = "seeded-cancellation" ] && ok "demo cancellation seeded (cancelledAt set)" || bad "seed: $SEED"
CL=$(curl -s -X POST "$API/v1/reports/run" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"definitionKey\":\"cancellation_lead\",\"params\":{\"dateFrom\":\"$(date -v-5d +%F)\",\"dateTo\":\"$(date -v+30d +%F)\"}}")
CLOK=$(printf '%s' "$CL" | python3 -c 'import sys,json;r=json.load(sys.stdin).get("data") or {};rows=(r.get("result") or {}).get("rows") or [];print("yes" if r.get("status")=="COMPLETED" and sum(x.get("cancellations",0) for x in rows)>=1 else "no")')
[ "$CLOK" = "yes" ] && ok "cancellation_lead buckets cancellations by lead time" || bad "cancellation_lead: $CLOK"
echo "== C2 Mews-depth gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "C2+ MEWS REPORTING SHIPPED" || echo "C2+ NOT SHIPPED"
