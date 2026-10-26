#!/usr/bin/env bash
cd "$(dirname "$0")/.." || exit 1
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "PASS: $1"; }
bad() { FAIL=$((FAIL+1)); echo "FAIL: $1"; }
has() { grep -q "$2" "$1" && ok "$3" || bad "$3"; }

API=apps/api/src/modules/room-plan/room-plan.service.ts
ROUTES=apps/api/src/modules/room-plan/room-plan.routes.ts
PAGE=apps/web/src/app/app/room-plan/page.tsx
TAPE=apps/web/src/components/room-plan/TapeChart.jsx
GRID=apps/web/src/components/room-plan/TapeGrid.jsx
BLOCK=apps/web/src/components/room-plan/ReservationBlock.jsx
POP=apps/web/src/components/room-plan/ReservationPopover.jsx
CLIENT=apps/web/src/api/room-plan.ts

has "$API" "getRoomPlan" "service exports getRoomPlan"
has "$API" "room_blocks" "service reads room_blocks"
has "$API" "occupancyPct" "day stats computed"
has "$ROUTES" "room-plan" "routes mounted"
has "$CLIENT" "fetchRoomPlan" "web client exists"
has "$CLIENT" "createRoomBlock" "block client exists"
has "$PAGE" "TapeChart" "page renders TapeChart"
has "$TAPE" "UnassignedStrip" "unassigned strip"
has "$TAPE" "STATUS_META" "status metas"
has "$TAPE" "formatMoney" "currency formatter"
has "$GRID" "ReservationBlock" "grid renders blocks"
has "$GRID" "onMoveReservation" "drag move wired"
has "$GRID" "occupancyPct" "day header occupancy"
has "$BLOCK" "openTraces" "trace badge on block"
has "$POP" "Balance" "popover shows balance"
grep -q "roomPlanRoutes" apps/api/src/index.ts && ok "index.ts mounts router" || bad "index.ts mounts router"
grep -q "room_blocks" apps/api/prisma/schema.prisma && ok "RoomBlock model present" || bad "RoomBlock model present"

echo "== typechecks =="
( cd apps/api && npx tsc --noEmit ) >/tmp/rp-api.log 2>&1 && ok "api typecheck" || { bad "api typecheck"; tail -5 /tmp/rp-api.log; }
( cd apps/web && npx tsc --noEmit ) >/tmp/rp-web.log 2>&1 && ok "web typecheck" || { bad "web typecheck"; tail -5 /tmp/rp-web.log; }

echo "== live endpoint =="
for i in 1 2 3; do
  RESP=$(curl --noproxy '*' -s -m 8 -w "\n__HTTP__:%{http_code}" -X POST http://localhost:3001/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@demo.com","password":"admin123","tenantSlug":"demo-hotel"}')
  CODE=$(echo "$RESP" | sed -n 's/__HTTP__://p')
  JSON=$(echo "$RESP" | sed '/__HTTP__/d')
  TOKEN=$(echo "$JSON" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('data',{}).get('token','') if isinstance(d,dict) else '')" 2>/dev/null)
  [ -n "$TOKEN" ] && break
  echo "login attempt $i: http=$CODE body=$(echo "$JSON" | head -c 200)"
  sleep 2
done
[ -n "$TOKEN" ] && ok "login" || bad "login"
PID=$(curl -s -m 5 "http://localhost:3001/v1/properties" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(next((p['id'] for p in d if p.get('code')=='DEMO-01'),''))" 2>/dev/null)
BODY=$(curl --noproxy '*' -s -m 10 "http://localhost:3001/v1/room-plan?propertyId=$PID&from=$(date -u +%F)&to=$(date -u -v+14d +%F)" -H "Authorization: Bearer $TOKEN")
echo "$BODY" | grep -q '"dayStats"' && ok "room-plan 200 with dayStats" || bad "room-plan endpoint"
echo "$BODY" | grep -q '"rooms":\[\]' && bad "room-plan empty rooms for DEMO-01" || ok "room-plan has rooms"

echo "=============================="
echo "== PASS: $PASS, FAIL: $FAIL =="
[ "$FAIL" -eq 0 ] && echo SHIPPED || echo "NOT SHIPPED"
exit $FAIL
