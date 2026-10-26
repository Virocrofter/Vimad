#!/usr/bin/env bash
set -u
cd ~/Desktop/Vimad || exit 1
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
API="http://localhost:3001"
echo "== C4 central reservations gates =="

for f in apps/api/src/modules/central-reservations/central-reservations.routes.ts apps/api/src/modules/central-reservations/central-reservations.service.ts apps/web/src/api/centralReservations.ts apps/web/src/app/app/central-reservations/page.jsx; do
  [ -f "$f" ] && ok "file exists: $f" || bad "file exists: $f"
done

grep -q "central-reservations" apps/api/src/index.ts && ok "api router mounted in index.ts" || bad "api router mounted in index.ts"
grep -q "central-reservations" apps/web/src/router.tsx && ok "web route registered in router.tsx" || bad "web route registered in router.tsx"
grep -q "Central Reservations" apps/web/src/components/layout/Sidebar.tsx && ok "sidebar entry present" || bad "sidebar entry present"

if (cd apps/api && npx tsc --noEmit) >/tmp/c4-tsc.log 2>&1; then
  ok "api typecheck (tsc --noEmit)"
else
  bad "api typecheck (see /tmp/c4-tsc.log)"
fi

if npm run build --workspace=apps/web >/tmp/c4-webbuild.log 2>&1; then
  ok "web build (vite build)"
else
  bad "web build (see /tmp/c4-webbuild.log)"
fi

if ! curl -sf -m 2 "$API/health/live" >/dev/null 2>&1; then
  echo "api not up — starting dev server (log: /tmp/c4-dev.log)..."
  (npm run dev >/tmp/c4-dev.log 2>&1 &)
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
  (cd apps/api && npx prisma db seed) >/tmp/c4-seed.log 2>&1
  LOGIN=$(do_login)
  TOKEN=$(printf '%s' "$LOGIN" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.data&&j.data.token)||"")}catch(e){}})')
fi
[ -n "$TOKEN" ] && ok "login (admin@demo.com)" || bad "login (admin@demo.com)"

CODE=$(curl -s -o /dev/null -w '%{http_code}' "$API/v1/central-reservations")
[ "$CODE" = "401" ] && ok "unauthenticated request rejected (401)" || bad "unauthenticated request rejected (401) ($CODE)"

FROM=$(date -v+7d +%F)
TO=$(date -v+9d +%F)

AV=$(curl -s -w '\n%{http_code}' "$API/v1/central-reservations/availability?from=$FROM&to=$TO" -H "Authorization: Bearer $TOKEN")
CODE=${AV##*$'\n'}
[ "$CODE" = "200" ] && ok "availability HTTP 200" || bad "availability HTTP 200 ($CODE)"
TARGET=$(printf '%s' "${AV%$'\n'*}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const d=j.data;if(!d||!Array.isArray(d.properties))process.exit(1);for(const p of d.properties){if(!Array.isArray(p.roomTypes))process.exit(1);for(const rt of p.roomTypes){if(typeof rt.available!=="boolean"||typeof rt.minRemaining!=="number")process.exit(1)}}const p=d.properties.find(x=>x.roomTypes.some(rt=>rt.available));if(!p)process.exit(1);const rt=p.roomTypes.find(x=>x.available);const alt=p.roomTypes.find(x=>x.id!==rt.id);process.stdout.write(JSON.stringify({propertyId:p.id,roomTypeId:rt.id,altRoomTypeId:alt?alt.id:""}))}catch(e){process.exit(1)}})')
[ -n "$TARGET" ] && ok "availability shape + bookable target found" || bad "availability shape + bookable target found"

GUEST_ID=$(curl -s "$API/v1/guests?pageSize=1" -H "Authorization: Bearer $TOKEN" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const arr=Array.isArray(j.data)?j.data:((j.data&&j.data.data)||[]);process.stdout.write(arr[0]?arr[0].id:"")}catch(e){}})')
[ -n "$GUEST_ID" ] && ok "guest pool resolved" || bad "guest pool resolved"

if [ -n "$TARGET" ] && [ -n "$GUEST_ID" ]; then
  PID=$(printf '%s' "$TARGET" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{process.stdout.write(JSON.parse(s).propertyId)})')
  RT=$(printf '%s' "$TARGET" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{process.stdout.write(JSON.parse(s).roomTypeId)})')
  ALT=$(printf '%s' "$TARGET" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{process.stdout.write(JSON.parse(s).altRoomTypeId||"")})')

  CRE=$(curl -s -w '\n%{http_code}' -X POST "$API/v1/central-reservations" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"propertyId\":\"$PID\",\"roomTypeId\":\"$RT\",\"arrivalDate\":\"$FROM\",\"departureDate\":\"$TO\",\"adults\":2,\"children\":0,\"guestId\":\"$GUEST_ID\"}")
  CODE=${CRE##*$'\n'}
  [ "$CODE" = "201" ] && ok "create booking HTTP 201" || bad "create booking HTTP ($CODE)"
  RES_ID=$(printf '%s' "${CRE%$'\n'*}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const d=j.data;if(!d||!/^VMD-/.test(d.confirmationNumber||"")||!d.property||!d.guest)process.exit(1);process.stdout.write(d.id)}catch(e){process.exit(1)}})')
  [ -n "$RES_ID" ] && ok "booking created with VMD confirmation" || bad "booking created with VMD confirmation"

  if [ -n "$RES_ID" ]; then
    printf '%s' "${CRE%$'\n'*}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const d=j.data;process.exit(d.stayCount===2&&d.nights===2?0:1)}catch(e){process.exit(1)}})' \
      && ok "booking has 2 stay rows / 2 nights" || bad "booking stay rows"

    LIST=$(curl -s "$API/v1/central-reservations" -H "Authorization: Bearer $TOKEN")
    printf '%s' "$LIST" | RES_ID="$RES_ID" node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const arr=j.data||[];const r=arr.find(x=>x.id===process.env.RES_ID);process.exit(r&&r.property&&r.guest?0:1)}catch(e){process.exit(1)}})' \
      && ok "desk list contains new booking with property + guest" || bad "desk list contains new booking"

    if [ -n "$ALT" ]; then
      MOV=$(curl -s -w '\n%{http_code}' -X POST "$API/v1/central-reservations/$RES_ID/move" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"propertyId\":\"$PID\",\"roomTypeId\":\"$ALT\"}")
      CODE=${MOV##*$'\n'}
      [ "$CODE" = "200" ] && ok "move reservation HTTP 200" || bad "move reservation HTTP ($CODE)"
      printf '%s' "${MOV%$'\n'*}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const d=j.data;process.exit(d&&d.roomType&&d.roomType.id&&d.stayCount===2?0:1)}catch(e){process.exit(1)}})' \
        && ok "move swapped room type, stays intact" || bad "move result"
    fi

    CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/v1/central-reservations/$RES_ID/move" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"propertyId":"does-not-exist"}')
    [ "$CODE" = "404" ] && ok "move to unknown property returns 404" || bad "move to unknown property returns 404 ($CODE)"
  fi

  CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/v1/central-reservations" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"propertyId\":\"$PID\",\"arrivalDate\":\"$FROM\",\"departureDate\":\"$TO\"}")
  [ "$CODE" = "400" ] && ok "booking without guest rejected (400)" || bad "booking without guest rejected (400) ($CODE)"
else
  bad "smoke gates skipped (no target/guest)"
fi

echo "== $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "C4 SHIPPED" || echo "C4 NOT SHIPPED"
exit "$FAIL"
