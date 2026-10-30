#!/usr/bin/env bash
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
API="http://localhost:3001"
cd ~/Desktop/Vimad || exit 1
TOKEN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"tenantSlug":"demo-hotel","email":"admin@demo.com","password":"admin123"}' | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("token") or (d.get("data") or {}).get("token") or "")')
[ -n "$TOKEN" ] && ok "login" || { bad "login"; exit 1; }
PROPS=$(curl -s "$API/v1/properties" -H "Authorization: Bearer $TOKEN")
PID=$(printf '%s' "$PROPS" | python3 -c 'import sys,json;d=json.load(sys.stdin);items=d if isinstance(d,list) else (d.get("data") or []);p=next((x for x in items if x.get("code")=="DEMO-01"),items[0] if items else {});print(p.get("id",""))')
PROD=$(curl -s -X POST "$API/v1/upsell/products?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"name":"Late Checkout","price":350,"category":"extra"}')
PRODID=$(printf '%s' "$PROD" | python3 -c 'import sys,json;print((json.load(sys.stdin).get("data") or {}).get("id",""))')
[ -n "$PRODID" ] && ok "C7: upsell product created" || bad "product: $(printf '%s' "$PROD" | head -c 200)"
RESID=$(cd apps/api && npx tsx -e "import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); (async () => { const t = await p.tenant.findUniqueOrThrow({ where: { slug: 'demo-hotel' } }); const r = await p.reservation.findFirstOrThrow({ where: { tenantId: t.id, confirmationNumber: 'DEMO-4101' } }); console.log(r.id); await p.\$disconnect(); })();" 2>/dev/null | tail -1)
SELL=$(curl -s -X POST "$API/v1/upsell/sell" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"productId\":\"$PRODID\",\"reservationId\":\"$RESID\",\"quantity\":2}")
SELLTOT=$(printf '%s' "$SELL" | python3 -c 'import sys,json;print((json.load(sys.stdin).get("data") or {}).get("total",""))')
[ "$SELLTOT" = "700" ] && ok "C7: sale posts R700 to folio (2 x R350)" || bad "sell: $(printf '%s' "$SELL" | head -c 200)"
SR=$(curl -s "$API/v1/upsell/sales?propertyId=$PID&from=$(date -v-1d +%F)&to=$(date +%F)" -H "Authorization: Bearer $TOKEN")
SROK=$(printf '%s' "$SR" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or {};bp=d.get("byProduct") or [];print("yes" if d.get("totalRevenue",0)>=700 and any(x.get("name")=="Late Checkout" for x in bp) else "no")')
[ "$SROK" = "yes" ] && ok "C7: sales report aggregates by product" || bad "sales: $(printf '%s' "$SR" | head -c 200)"
TOMCFG=$(curl -s -X PUT "$API/v1/tomsa/config?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"enabled":true,"pct":1}')
printf '%s' "$TOMCFG" | grep -q '"enabled":true' && ok "SA-1: levy enabled at 1%" || bad "config: $(printf '%s' "$TOMCFG" | head -c 200)"
(cd apps/api && npx tsx ../../scripts/seed-roomcharge.ts > /dev/null 2>&1)
TODAY=$(date +%F)
TP=$(curl -s -X POST "$API/v1/tomsa/post-day" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"propertyId\":\"$PID\",\"date\":\"$TODAY\"}")
TPRINT=$(printf '%s' "$TP" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or {};print(str(d.get("posted"))+":"+str(d.get("totalLevy")))')
[ "$TPRINT" = "1:10" ] && ok "SA-1: levy posted = 1% of R1000 room charge" || bad "post-day: $TPRINT ($(printf '%s' "$TP" | head -c 200))"
TP2=$(curl -s -X POST "$API/v1/tomsa/post-day" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"propertyId\":\"$PID\",\"date\":\"$TODAY\"}")
TP2P=$(printf '%s' "$TP2" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or {};print(d.get("posted"))')
[ "$TP2P" = "0" ] && ok "SA-1: re-post idempotent (no double levy)" || bad "idempotence: $TP2P"
TS=$(curl -s "$API/v1/tomsa/summary?propertyId=$PID&from=$TODAY&to=$TODAY" -H "Authorization: Bearer $TOKEN")
TSLEVY=$(printf '%s' "$TS" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or {};print(d.get("levyDue"))')
[ "$TSLEVY" = "10" ] || [ "$TSLEVY" = "10.0" ] && ok "SA-1: summary levyDue R10 (return-form number)" || bad "summary: $TSLEVY"
curl -s -X PUT "$API/v1/tomsa/config?propertyId=$PID" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"enabled":false,"pct":1}' > /dev/null
PLANID=$(curl -s "$API/v1/rates/plans?propertyId=$PID" -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or [];p=next((x for x in d if x.get("code")=="STD-Q-RACK"),None);print(p.get("id","") if p else "")')
COM=$(curl -s -X PUT "$API/v1/rates/plans/$PLANID/commission" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"commissionPct":15}')
printf '%s' "$COM" | grep -q '"commissionPct":15' && ok "SA-3: 15% commission set on STD-Q-RACK" || bad "commission: $(printf '%s' "$COM" | head -c 200)"
(cd apps/api && npx tsx ../../scripts/seed-netbooking.ts > /dev/null 2>&1)
NP=$(curl -s -X POST "$API/v1/reports/run" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"definitionKey\":\"net_pricing\",\"params\":{\"dateFrom\":\"$(date -v+7d +%F)\",\"dateTo\":\"$(date -v+30d +%F)\"}}")
NPM=$(printf '%s' "$NP" | python3 -c 'import sys,json
r=json.load(sys.stdin).get("data") or {}
rows=(r.get("result") or {}).get("rows") or []
row=next((x for x in rows if x.get("label")=="STD-Q-RACK"),None)
if not row or row.get("grossRevenue",0)<1000: print("no-row")
else:
    g=float(row["grossRevenue"]); c=float(row["commission"]); n=float(row["netRevenue"])
    exp=g*0.15/1.15
    print("yes" if abs(c-exp)<0.05 and abs(n-(g-c))<0.01 else "no:%s"%row)')
[ "$NPM" = "yes" ] && ok "SA-3: net pricing math (gross/1.15 = net, commission = gross-net)" || bad "net_pricing: $NPM"
DEFOK=$(curl -s "$API/v1/reports/definitions" -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or [];print("yes" if any(x.get("key")=="net_pricing" for x in d) else "no")')
[ "$DEFOK" = "yes" ] && ok "net_pricing in report library" || bad "definition missing"
echo "== C7/SA gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "C7+SA1+SA3 SHIPPED" || echo "NOT SHIPPED"
