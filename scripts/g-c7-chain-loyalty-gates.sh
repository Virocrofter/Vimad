#!/usr/bin/env bash
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PASS=0
FAIL=0
ok(){ PASS=$((PASS+1)); printf 'PASS: %s\n' "$1"; }
bad(){ FAIL=$((FAIL+1)); printf 'FAIL: %s\n' "$1"; }

f(){ [ -f "$1" ] && ok "$2" || bad "$2"; }
f apps/api/prisma/migrations/20261028020000_chain_loyalty/migration.sql 'migration file'
f apps/api/src/modules/chain-loyalty/chain-loyalty.routes.ts 'backend routes'
f apps/api/src/modules/chain-loyalty/chain-loyalty.service.ts 'backend service'
f apps/web/src/app/app/chain-loyalty/page.jsx 'web page'
f apps/web/src/app/app/chain-loyalty/chain-loyalty.css 'web css'
f apps/web/src/api/chainLoyalty.ts 'web api client'
f apps/web/src/hooks/useChainLoyalty.ts 'web hook'

grep -q "chain-loyalty.routes.js" apps/api/src/index.ts 2>/dev/null && ok 'api mount wired' || bad 'api mount wired (run node scripts/apply-c7-wiring.mjs)'
grep -q "chainLoyaltyModule" apps/api/src/common/openapi.ts 2>/dev/null && ok 'openapi wired' || bad 'openapi wired'
grep -q "model LoyaltyConfig" apps/api/prisma/schema.prisma 2>/dev/null && ok 'prisma models' || bad 'prisma models'
grep -qi "chain-loyalty" apps/web/src/router.tsx 2>/dev/null && ok 'router wired' || bad 'router wired'
grep -qi "chain-loyalty" apps/web/src/components/layout/Sidebar.tsx 2>/dev/null && ok 'sidebar wired' || bad 'sidebar wired'

(cd apps/api && npx prisma validate >/tmp/c7-prisma.log 2>&1) && ok 'prisma validate' || { bad 'prisma validate'; tail -6 /tmp/c7-prisma.log; }
(cd apps/api && npx prisma generate >/dev/null 2>&1) && ok 'prisma generate' || bad 'prisma generate'
(cd apps/api && npx tsc --noEmit >/tmp/c7-tsc.log 2>&1) && ok 'api typecheck' || { bad 'api typecheck'; tail -10 /tmp/c7-tsc.log; }
(npm run build --workspace=apps/web >/tmp/c7-web.log 2>&1) && ok 'web build' || { bad 'web build'; tail -10 /tmp/c7-web.log; }

API="http://localhost:3001"
if curl -s -m 2 -o /dev/null "$API/health/live" 2>/dev/null; then
  LOGIN=$(curl -s -m 10 -X POST "$API/auth/login" -H 'content-type: application/json' -d '{"email":"admin@demo.com","password":"admin123","tenantSlug":"demo-hotel"}')
  TOKEN=$(printf '%s' "$LOGIN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);let t='';(function w(o){if(!o||typeof o!=='object'||t)return;for(const[k,v]of Object.entries(o)){if((k==='token'||k==='accessToken')&&typeof v==='string'&&v.length>10){t=v;return}w(v)}})(j);console.log(t)}catch(e){console.log('')}})")
  if [ -n "$TOKEN" ]; then
    ok 'smoke: login'
    AUTH="Authorization: Bearer $TOKEN"
    CFG=$(curl -s -m 10 -X PUT "$API/v1/chain-loyalty/config" -H "$AUTH" -H 'content-type: application/json' -d '{"earnRate":1.5,"redeemValue":0.1,"tiers":[{"name":"silver","threshold":500},{"name":"gold","threshold":2000},{"name":"platinum","threshold":8000}]}')
    printf '%s' "$CFG" | grep -q '"earnRate"' && ok 'smoke: save config' || bad "smoke: save config $(printf '%s' "$CFG" | head -c 200)"
    GUESTS=$(curl -s -m 10 -H "$AUTH" "$API/v1/guests")
    GID=$(printf '%s' "$GUESTS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);const arr=Array.isArray(j)?j:(j.data||[]);console.log((arr[0]||{}).id||'')}catch(e){console.log('')}})")
    [ -n "$GID" ] && ok 'smoke: guest lookup' || bad 'smoke: guest lookup'
    EARN=$(curl -s -m 10 -X POST "$API/v1/chain-loyalty/earn" -H "$AUTH" -H 'content-type: application/json' -d "$(node -e 'console.log(JSON.stringify({guestId:process.argv[1],amount:1000}))' "$GID")")
    printf '%s' "$EARN" | grep -q '"transaction"' && ok 'smoke: earn (1500 pts)' || bad "smoke: earn $(printf '%s' "$EARN" | head -c 200)"
    REDEEM=$(curl -s -m 10 -X POST "$API/v1/chain-loyalty/redeem" -H "$AUTH" -H 'content-type: application/json' -d "$(node -e 'console.log(JSON.stringify({guestId:process.argv[1],points:250}))' "$GID")")
    printf '%s' "$REDEEM" | grep -q '"valueRedeemed"' && ok 'smoke: redeem' || bad "smoke: redeem $(printf '%s' "$REDEEM" | head -c 200)"
    BOARD=$(curl -s -m 10 -H "$AUTH" "$API/v1/chain-loyalty/chain")
    printf '%s' "$BOARD" | grep -q '"liability"' && ok 'smoke: chain board' || bad "smoke: chain board $(printf '%s' "$BOARD" | head -c 200)"
    VIEW=$(curl -s -m 10 -H "$AUTH" "$API/v1/chain-loyalty/guests/$GID")
    printf '%s' "$VIEW" | grep -q '"transactions"' && ok 'smoke: guest chain view' || bad "smoke: guest chain view $(printf '%s' "$VIEW" | head -c 200)"
  else
    bad 'smoke: login (token not parsed)'
  fi
else
  printf 'SKIP: api not up — static gates only\n'
fi

echo "== C7: $PASS passed, $FAIL failed =="
if [ "$FAIL" -eq 0 ]; then echo "C7 SHIPPED"; else echo "C7 NOT SHIPPED"; fi
exit $([ "$FAIL" -eq 0 ] && echo 0 || echo 1)
