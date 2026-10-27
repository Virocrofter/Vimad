#!/usr/bin/env bash
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PASS=0
FAIL=0
ok(){ PASS=$((PASS+1)); printf 'PASS: %s\n' "$1"; }
bad(){ FAIL=$((FAIL+1)); printf 'FAIL: %s\n' "$1"; }

f(){ [ -f "$1" ] && ok "$2" || bad "$2"; }
f apps/api/prisma/migrations/20261028010000_add_onboarding/migration.sql 'migration file'
f apps/api/src/modules/onboarding/onboarding.routes.ts 'backend routes'
f apps/api/src/modules/onboarding/onboarding.service.ts 'backend service'
f apps/api/src/modules/onboarding/onboarding.csv.ts 'backend csv'
f apps/web/src/app/app/onboarding/page.jsx 'web page'
f apps/web/src/app/app/onboarding/onboarding.css 'web css'
f apps/web/src/api/onboarding.ts 'web api client'
f apps/web/src/hooks/useOnboarding.ts 'web hook'

grep -q "onboarding.routes.js" apps/api/src/index.ts 2>/dev/null && ok 'api mount wired' || bad 'api mount wired (run node scripts/apply-c6-wiring.mjs)'
grep -q "onboardingModule" apps/api/src/common/openapi.ts 2>/dev/null && ok 'openapi wired' || bad 'openapi wired'
grep -q "model OnboardingImport" apps/api/prisma/schema.prisma 2>/dev/null && ok 'prisma models' || bad 'prisma models'
grep -qi "onboarding" apps/web/src/router.tsx 2>/dev/null && ok 'router wired' || bad 'router wired'
grep -qi "onboarding" apps/web/src/components/layout/Sidebar.tsx 2>/dev/null && ok 'sidebar wired' || bad 'sidebar wired'

(cd apps/api && npx prisma validate >/tmp/c6-prisma.log 2>&1) && ok 'prisma validate' || { bad 'prisma validate'; tail -6 /tmp/c6-prisma.log; }
(cd apps/api && npx prisma generate >/dev/null 2>&1) && ok 'prisma generate' || bad 'prisma generate'
(cd apps/api && npx tsc --noEmit >/tmp/c6-tsc.log 2>&1) && ok 'api typecheck' || { bad 'api typecheck'; tail -10 /tmp/c6-tsc.log; }
(npm run build --workspace=apps/web >/tmp/c6-web.log 2>&1) && ok 'web build' || { bad 'web build'; tail -10 /tmp/c6-web.log; }

API="http://localhost:3001"
if curl -s -m 2 -o /dev/null "$API/health/live" 2>/dev/null; then
  LOGIN=$(curl -s -m 10 -X POST "$API/auth/login" -H 'content-type: application/json' -d '{"email":"admin@demo.com","password":"admin123","tenantSlug":"demo-hotel"}')
  TOKEN=$(printf '%s' "$LOGIN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);let t='';(function w(o){if(!o||typeof o!=='object'||t)return;for(const[k,v]of Object.entries(o)){if((k==='token'||k==='accessToken')&&typeof v==='string'&&v.length>10){t=v;return}w(v)}})(j);console.log(t)}catch(e){console.log('')}})")
  if [ -n "$TOKEN" ]; then
    ok 'smoke: login'
    AUTH="Authorization: Bearer $TOKEN"
    CODE="C6G$(date +%H%M%S)"
    curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API/v1/onboarding/template.csv" | grep -q 200 && ok 'smoke: template.csv' || bad 'smoke: template.csv'
    CSV="propertyCode,propertyName,city,country,timezone,currency,roomTypeCode,roomTypeName,baseOccupancy,maxOccupancy,roomNumber,floor,ratePlanCode,ratePlanName,baseRate
$CODE,Gate Test Hotel,Durban,ZA,Africa/Johannesburg,ZAR,GQ,Queen,2,2,101,1,GQ-RACK,Queen Rack,1450
$CODE,Gate Test Hotel,Durban,ZA,Africa/Johannesburg,ZAR,GK,King,2,3,102,1,GK-RACK,King Rack,1890"
    BODY=$(node -e 'console.log(JSON.stringify({fileName:"gate.csv",csv:process.argv[1]}))' "$CSV")
    IMP=$(curl -s -m 15 -X POST "$API/v1/onboarding/imports" -H "$AUTH" -H 'content-type: application/json' -d "$BODY")
    IID=$(printf '%s' "$IMP" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);console.log(j.id||'')}catch(e){console.log('')}})")
    [ -n "$IID" ] && ok 'smoke: stage import' || bad "smoke: stage import $(printf '%s' "$IMP" | head -c 200)"
    EX=$(curl -s -m 20 -X POST "$API/v1/onboarding/imports/$IID/execute" -H "$AUTH" -H 'content-type: application/json' -d '{}')
    printf '%s' "$EX" | grep -q '"completed"' && ok 'smoke: execute import' || bad "smoke: execute import $(printf '%s' "$EX" | head -c 200)"
    PROPS=$(curl -s -m 10 -H "$AUTH" "$API/v1/properties")
    printf '%s' "$PROPS" | grep -q "$CODE" && ok 'smoke: property live' || bad 'smoke: property live'
    SRCID=$(printf '%s' "$PROPS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);const arr=Array.isArray(j)?j:(j.data||[]);const p=arr.find(x=>x.code==='$CODE')||arr[0]||{};console.log(p.id||'')}catch(e){console.log('')}})")
    CLONE=$(curl -s -m 15 -X POST "$API/v1/onboarding/clone" -H "$AUTH" -H 'content-type: application/json' -d "$(node -e 'console.log(JSON.stringify({sourcePropertyId:process.argv[1],name:"Gate Clone",code:process.argv[2]}))' "$SRCID" "${CODE}X")")
    printf '%s' "$CLONE" | grep -q '"property"' && ok 'smoke: clone' || bad "smoke: clone $(printf '%s' "$CLONE" | head -c 200)"
    curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API/v1/onboarding/templates" | grep -q 200 && ok 'smoke: templates list' || bad 'smoke: templates list'
  else
    bad 'smoke: login (token not parsed)'
  fi
else
  printf 'SKIP: api not up — static gates only\n'
fi

echo "== C6: $PASS passed, $FAIL failed =="
if [ "$FAIL" -eq 0 ]; then echo "C6 SHIPPED"; else echo "C6 NOT SHIPPED"; fi
exit $([ "$FAIL" -eq 0 ] && echo 0 || echo 1)
