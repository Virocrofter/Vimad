#!/usr/bin/env bash
set -u
cd ~/Desktop/Vimad || exit 1
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
API="http://localhost:3001"
echo "== C5 chain corporate billing gates =="

for f in apps/api/src/modules/chain-billing/chain-billing.routes.ts apps/api/src/modules/chain-billing/chain-billing.service.ts apps/web/src/api/chainBilling.ts apps/web/src/app/app/chain-billing/page.jsx; do
  [ -f "$f" ] && ok "file exists: $f" || bad "file exists: $f"
done

grep -q "chain-billing" apps/api/src/index.ts && ok "api router mounted in index.ts" || bad "api router mounted in index.ts"
grep -q "chain-billing" apps/web/src/router.tsx && ok "web route registered in router.tsx" || bad "web route registered in router.tsx"
grep -q "Chain Billing" apps/web/src/components/layout/Sidebar.tsx && ok "sidebar entry present" || bad "sidebar entry present"

if (cd apps/api && npx tsc --noEmit) >/tmp/c5-tsc.log 2>&1; then
  ok "api typecheck (tsc --noEmit)"
else
  bad "api typecheck"
  tail -15 /tmp/c5-tsc.log
fi

if npm run build --workspace=apps/web >/tmp/c5-webbuild.log 2>&1; then
  ok "web build (vite build)"
else
  bad "web build"
  tail -15 /tmp/c5-webbuild.log
fi

if ! curl -sf -m 2 "$API/health/live" >/dev/null 2>&1; then
  echo "api not up — starting dev server (log: /tmp/c5-dev.log)..."
  (npm run dev >/tmp/c5-dev.log 2>&1 &)
  for i in $(seq 1 60); do
    curl -sf -m 2 "$API/health/live" >/dev/null 2>&1 && break
    sleep 2
  done
fi
curl -sf -m 2 "$API/health/live" >/dev/null 2>&1 && ok "api health" || bad "api health"

do_login(){
  curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
    -d '{"email":"admin@demo.com","password":"admin123","tenantSlug":"demo-hotel"}'
}
LOGIN=$(do_login)
TOKEN=$(printf '%s' "$LOGIN" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.data&&j.data.token)||"")}catch(e){}})')
if [ -z "$TOKEN" ]; then
  echo "login failed once — re-seeding and retrying..."
  (cd apps/api && npx prisma db seed) >/tmp/c5-seed.log 2>&1
  LOGIN=$(do_login)
  TOKEN=$(printf '%s' "$LOGIN" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.data&&j.data.token)||"")}catch(e){}})')
fi
[ -n "$TOKEN" ] && ok "login (admin@demo.com)" || bad "login (admin@demo.com)"

CODE=$(curl -s -o /dev/null -w '%{http_code}' "$API/v1/chain-billing/accounts")
[ "$CODE" = "401" ] && ok "unauthenticated request rejected (401)" || bad "unauthenticated request rejected (401) ($CODE)"

ACCOUNT_ID=$(curl -s "$API/v1/chain-billing/accounts" -H "Authorization: Bearer $TOKEN" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const arr=j.data||[];if(!arr.length||typeof arr[0].outstanding!=="number"||!Array.isArray(arr[0].perProperty))process.exit(1);process.stdout.write(arr[0].id)}catch(e){process.exit(1)}})')
[ -n "$ACCOUNT_ID" ] && ok "accounts list shape + account resolved" || bad "accounts list shape + account resolved"

FOLIO_PICK=$(curl -s "$API/v1/chain-billing/folios" -H "Authorization: Bearer $TOKEN" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const arr=j.data||[];for(const f of arr){if(typeof f.invariantOk!=="boolean"||!f.property||!f.guest)process.exit(1)}const withBal=arr.filter(f=>f.balance>0);if(!withBal.length)process.exit(1);process.stdout.write(JSON.stringify({id:withBal[0].id,guestId:withBal[0].guest.id,balance:withBal[0].balance}))}catch(e){process.exit(1)}})')
[ -n "$FOLIO_PICK" ] && ok "folios list shape + open folio resolved" || bad "folios list shape + open folio resolved"

if [ -n "$ACCOUNT_ID" ] && [ -n "$FOLIO_PICK" ]; then
  FGID=$(printf '%s' "$FOLIO_PICK" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{process.stdout.write(JSON.parse(s).guestId)})')

  PSTART=$(date -v-30d +%F)
  PEND=$(date +%F)
  INV=$(curl -s -w '\n%{http_code}' -X POST "$API/v1/chain-billing/accounts/$ACCOUNT_ID/invoices" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"periodStart\":\"$PSTART\",\"periodEnd\":\"$PEND\",\"guestIds\":[\"$FGID\"]}")
  CODE=${INV##*$'\n'}
  [ "$CODE" = "201" ] && ok "consolidated invoice HTTP 201" || bad "consolidated invoice HTTP ($CODE)"
  printf '%s' "${INV%$'\n'*}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const d=j.data;const r2=n=>Math.round(n*100)/100;if(!d||!/^CAR-/.test(d.number||"")||!d.items.length)process.exit(1);const sub=r2(d.items.reduce((a,i)=>a+i.amount,0));if(Math.abs(sub-d.subtotal)>0.005)process.exit(1);if(Math.abs(r2(d.subtotal*1.15)-d.total)>0.005)process.exit(1);if(!d.properties.length)process.exit(1);process.exit(0)}catch(e){process.exit(1)}})' \
    && ok "invoice totals == sum of lines to the cent (VAT 15%)" || bad "invoice totals"

  INV_FOLIO=$(printf '%s' "${INV%$'\n'*}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.data.items[0].folioId||"")}catch(e){}})')
  if [ -n "$INV_FOLIO" ]; then
    curl -s "$API/v1/chain-billing/folios" -H "Authorization: Bearer $TOKEN" | INV_FOLIO="$INV_FOLIO" node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const f=(j.data||[]).find(x=>x.id===process.env.INV_FOLIO);process.exit(f&&f.invariantOk===true?0:1)}catch(e){process.exit(1)}})' \
      && ok "invoiced folio still audit-clean (balance == charges - payments)" || bad "invoiced folio invariant"
    curl -s "$API/v1/chain-billing/transfers" -H "Authorization: Bearer $TOKEN" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const t=(j.data||[]).find(x=>x.type==="ar_transfer");process.exit(t?0:1)}catch(e){process.exit(1)}})' \
      && ok "AR transfer line visible in transfer feed" || bad "AR transfer line in feed"
  fi

  PAIR=$(curl -s "$API/v1/chain-billing/folios" -H "Authorization: Bearer $TOKEN" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const wb=(j.data||[]).filter(f=>f.balance>0);if(wb.length<2)process.exit(1);process.stdout.write(JSON.stringify({a:wb[0].id,b:wb[1].id,aBal:wb[0].balance,bBal:wb[1].balance}))}catch(e){process.exit(1)}})')
  if [ -n "$PAIR" ]; then
    FA=$(printf '%s' "$PAIR" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{process.stdout.write(JSON.parse(s).a)})')
    FB=$(printf '%s' "$PAIR" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{process.stdout.write(JSON.parse(s).b)})')
    ABAL=$(printf '%s' "$PAIR" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{process.stdout.write(String(JSON.parse(s).aBal))})')
    BBAL=$(printf '%s' "$PAIR" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{process.stdout.write(String(JSON.parse(s).bBal))})')
    TR=$(curl -s -w '\n%{http_code}' -X POST "$API/v1/chain-billing/folios/transfer" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"fromFolioId\":\"$FA\",\"toFolioId\":\"$FB\",\"amount\":50,\"reason\":\"gate test\"}")
    CODE=${TR##*$'\n'}
    [ "$CODE" = "200" ] && ok "inter-property transfer HTTP 200" || bad "inter-property transfer HTTP ($CODE)"
    printf '%s' "${TR%$'\n'*}" | ABAL="$ABAL" BBAL="$BBAL" node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const d=j.data;const expF=Number(process.env.ABAL)-50;const expT=Number(process.env.BBAL)+50;const okAll=d.from.invariantOk&&d.to.invariantOk&&Math.abs(d.from.balance-expF)<=0.005&&Math.abs(d.to.balance-expT)<=0.005;if(!okAll){console.error("DEBUG from.balance="+d.from.balance+" expected="+expF+" to.balance="+d.to.balance+" expected="+expT+" invFrom="+d.from.invariantOk+" invTo="+d.to.invariantOk)}process.exit(okAll?0:1)}catch(e){console.error("DEBUG parse: "+e.message);process.exit(1)}})' \
      && ok "both folios audit-clean, balances moved ±50.00 exactly" || bad "transfer balance math"
    CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/v1/chain-billing/folios/transfer" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"fromFolioId\":\"$FA\",\"toFolioId\":\"$FB\",\"amount\":9999999}")
    [ "$CODE" = "409" ] && ok "over-balance transfer rejected (409)" || bad "over-balance transfer rejected (409) ($CODE)"
  else
    bad "two open folios for transfer test"
  fi

  CODE=$(curl -s -o /dev/null -w '%{http_code}' "$API/v1/chain-billing/accounts/does-not-exist/invoices" -H "Authorization: Bearer $TOKEN")
  [ "$CODE" = "404" ] && ok "unknown account returns 404" || bad "unknown account returns 404 ($CODE)"
else
  bad "smoke gates skipped (no account/folio)"
fi

echo "== $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "C5 SHIPPED" || echo "C5 NOT SHIPPED"
exit "$FAIL"
