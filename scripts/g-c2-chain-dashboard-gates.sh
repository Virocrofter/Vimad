#!/usr/bin/env bash
set -u
cd ~/Desktop/Vimad || exit 1
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
API="http://localhost:3001"
echo "== C2 chain dashboard gates =="

for f in apps/api/src/modules/chain-dashboard/chain-dashboard.routes.ts apps/api/src/modules/chain-dashboard/chain-dashboard.service.ts apps/web/src/api/chainDashboard.ts apps/web/src/app/app/chain-dashboard/page.jsx; do
  [ -f "$f" ] && ok "file exists: $f" || bad "file exists: $f"
done

grep -q "chain-dashboard" apps/api/src/index.ts && ok "api router mounted in index.ts" || bad "api router mounted in index.ts"
grep -q "chain-dashboard" apps/web/src/router.tsx && ok "web route registered in router.tsx" || bad "web route registered in router.tsx"
grep -q "Chain Dashboard" apps/web/src/components/layout/Sidebar.tsx && ok "sidebar entry present" || bad "sidebar entry present"

if (cd apps/api && npx tsc --noEmit) >/tmp/c2-tsc.log 2>&1; then
  ok "api typecheck (tsc --noEmit)"
else
  bad "api typecheck (see /tmp/c2-tsc.log)"
fi

if npm run build --workspace=apps/web >/tmp/c2-webbuild.log 2>&1; then
  ok "web build (vite build)"
else
  bad "web build (see /tmp/c2-webbuild.log)"
fi

if ! curl -sf -m 2 "$API/health/live" >/dev/null 2>&1; then
  echo "api not up — starting dev server (log: /tmp/c2-dev.log)..."
  (npm run dev >/tmp/c2-dev.log 2>&1 &)
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
  echo "login failed once — re-seeding demo data (log: /tmp/c2-seed.log) and retrying..."
  (cd apps/api && npx prisma db seed) >/tmp/c2-seed.log 2>&1
  LOGIN=$(do_login)
  TOKEN=$(printf '%s' "$LOGIN" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.data&&j.data.token)||"")}catch(e){}})')
fi
if [ -n "$TOKEN" ]; then
  ok "login (admin@demo.com)"
else
  bad "login (admin@demo.com)"
  echo "raw login response: $LOGIN" | head -c 500
  echo
fi

CHAIN_ID=""
if [ -n "$TOKEN" ]; then
  CHAIN_ID=$(curl -s "$API/v1/chains" -H "Authorization: Bearer $TOKEN" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const c=j.data&&j.data[0];process.stdout.write(c?c.id:"")}catch(e){}})')
fi
[ -n "$CHAIN_ID" ] && ok "chain resolved ($CHAIN_ID)" || bad "chain resolved"

FROM=$(date +%F)
TO=$(date -v+13d +%F)

if [ -n "$TOKEN" ] && [ -n "$CHAIN_ID" ]; then
  TAPE=$(curl -s -w '\n%{http_code}' "$API/v1/chain-dashboard/chains/$CHAIN_ID/tape-chart?from=$FROM&to=$TO" -H "Authorization: Bearer $TOKEN")
  CODE=${TAPE##*$'\n'}
  [ "$CODE" = "200" ] && ok "tape-chart HTTP 200" || bad "tape-chart HTTP 200 ($CODE)"
  if printf '%s' "${TAPE%$'\n'*}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const d=j.data;if(!d||!Array.isArray(d.days)||d.days.length!==14)process.exit(1);if(!Array.isArray(d.properties)||d.properties.length<1)process.exit(1);for(const p of d.properties){if(!Array.isArray(p.rooms)||typeof p.cells!=="object"||typeof p.occupancy!=="object")process.exit(1);if(typeof p.businessDate!=="string")process.exit(1)}process.exit(0)}catch(e){process.exit(1)}})'; then
    ok "tape-chart shape (14 days, per-property rooms/cells/occupancy)"
  else
    bad "tape-chart shape"
  fi

  ROLL=$(curl -s -w '\n%{http_code}' "$API/v1/chain-dashboard/chains/$CHAIN_ID/rollup?from=$FROM&to=$TO" -H "Authorization: Bearer $TOKEN")
  CODE=${ROLL##*$'\n'}
  [ "$CODE" = "200" ] && ok "rollup HTTP 200" || bad "rollup HTTP 200 ($CODE)"
  if printf '%s' "${ROLL%$'\n'*}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const d=j.data;if(!d||!d.consolidated||!d.consolidated.totals)process.exit(1);const r2=n=>Math.round(n*100)/100;const sum=(arr,f)=>r2(arr.reduce((a,p)=>a+f(p),0));const ps=d.properties;const ct=d.consolidated.totals;const checks=[["roomRevenue",sum(ps,p=>p.totals.roomRevenue),ct.roomRevenue],["folioRevenue",sum(ps,p=>p.totals.folioRevenue),ct.folioRevenue],["occupiedNights",sum(ps,p=>p.totals.occupiedNights),ct.occupiedNights],["availableNights",sum(ps,p=>p.totals.availableNights),ct.availableNights]];for(const [k,a,b] of checks){if(Math.abs(a-b)>0.005){console.error(k+" "+a+" !== "+b);process.exit(1)}}if(!Array.isArray(d.consolidated.daily)||d.consolidated.daily.length!==d.days.length)process.exit(1);process.exit(0)}catch(e){process.exit(1)}})'; then
    ok "rollup consolidated == sum of per-property (to the cent)"
  else
    bad "rollup consolidated == sum of per-property"
  fi

  EXC=$(curl -s -w '\n%{http_code}' "$API/v1/chain-dashboard/chains/$CHAIN_ID/exceptions?days=7" -H "Authorization: Bearer $TOKEN")
  CODE=${EXC##*$'\n'}
  [ "$CODE" = "200" ] && ok "exceptions HTTP 200" || bad "exceptions HTTP 200 ($CODE)"
  if printf '%s' "${EXC%$'\n'*}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const d=j.data;if(!d||!Array.isArray(d.exceptions)||typeof d.summary!=="object")process.exit(1);const total=d.summary.critical+d.summary.warning+d.summary.info;if(total!==d.exceptions.length)process.exit(1);for(const e of d.exceptions){if(!e.severity||!e.type||!e.propertyName||!e.title)process.exit(1)}process.exit(0)}catch(e){process.exit(1)}})'; then
    ok "exceptions feed shape + summary counts consistent"
  else
    bad "exceptions feed shape"
  fi

  CODE=$(curl -s -o /dev/null -w '%{http_code}' "$API/v1/chain-dashboard/chains/does-not-exist/rollup?from=$FROM&to=$TO" -H "Authorization: Bearer $TOKEN")
  [ "$CODE" = "404" ] && ok "unknown chain returns 404" || bad "unknown chain returns 404 ($CODE)"
else
  bad "smoke gates skipped (no token/chain)"
fi

echo "== $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "C2 SHIPPED" || echo "C2 NOT SHIPPED"
exit "$FAIL"
