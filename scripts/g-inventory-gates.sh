#!/usr/bin/env bash
set -uo pipefail
cd ~/Desktop/Vimad
API="${API_URL:-http://localhost:3001}"
FROM=$(date +%F); TO=$(date -v+13d +%F)
PASS=0; FAIL=0; SKIP=0
gate(){ local n="$1"; shift; if "$@" >/tmp/inv-gate.log 2>&1; then echo "GATE $n PASS"; PASS=$((PASS+1)); else echo "GATE $n FAIL"; sed -n '1,30p' /tmp/inv-gate.log; FAIL=$((FAIL+1)); fi; }
skip(){ echo "GATE $1 SKIP ($2)"; SKIP=$((SKIP+1)); }

echo "== I1 INVENTORY GATES =="

gate 1 "npx" --yes prisma validate --schema apps/api/prisma/schema.prisma
gate 2 "sh" -c "cd apps/api && npx prisma migrate deploy"
gate 3 "npm" run build --workspace=apps/api
gate 4 "npm" run build --workspace=apps/web

curl -sf -m 3 "$API/health/live" >/dev/null
if [ $? -ne 0 ]; then
  skip 5 "API not running at $API"
  for n in 6 7 8 9 10 11 12 13 14 15; do skip $n "no API"; done
else
  echo "GATE 5 PASS"; PASS=$((PASS+1))

  TOKEN=""
  for i in 1 2 3; do
    BODY=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
      -d '{"email":"admin@demo.com","password":"admin123","tenantSlug":"demo-hotel"}')
    TOKEN=$(printf '%s' "$BODY" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);console.log(j.token||j.accessToken||(j.data&&(j.data.token||j.data.accessToken))||'')}catch(e){}})")
    [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ] && break
    echo "login attempt $i failed: $BODY"
    sleep 20
  done
  [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]
  gate 6 "test" $? -eq 0

  if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    for n in 7 8 9 10 11 12 13 14 15; do skip $n "no token"; done
  else
    AUTH=(-H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json')
    curl -sf "${AUTH[@]}" "$API/v1/inventory/grid?from=$FROM&to=$TO" | grep -q '"roomTypes"'
    gate 7 "test" $? -eq 0

    RT=$(curl -s "${AUTH[@]}" "$API/v1/inventory/grid?from=$FROM&to=$TO" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log((j.data&&j.data.roomTypes&&j.data.roomTypes[0]&&j.data.roomTypes[0].id)||'')})")
    [ -n "$RT" ]
    gate 8 "test" $? -eq 0

    curl -sf -X PUT "${AUTH[@]}" "$API/v1/inventory/restrictions" \
      -d "{\"roomTypeId\":\"$RT\",\"date\":\"$FROM\",\"stopSell\":true}" | grep -q '"stopSell":true'
    gate 9 "test" $? -eq 0

    curl -s "${AUTH[@]}" "$API/v1/inventory/grid?from=$FROM&to=$TO" \
      | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);const rt=j.data.roomTypes.find(r=>r.id==='$RT');process.exit(rt&&rt.cells[0].stopSell===true?0:1)})"
    gate 10 "test" $? -eq 0

    curl -sf -X PUT "${AUTH[@]}" "$API/v1/inventory/restrictions" \
      -d "{\"roomTypeId\":\"$RT\",\"date\":\"$FROM\",\"stopSell\":false}" >/dev/null
    gate 11 "test" $? -eq 0

    HOLD=$(curl -s -X POST "${AUTH[@]}" "$API/v1/inventory/allocations" \
      -d "{\"roomTypeId\":\"$RT\",\"type\":\"maintenance_block\",\"name\":\"GATE TEST\",\"quantity\":1,\"date\":\"$FROM\"}" \
      | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);console.log(j.data&&j.data.allocations&&j.data.allocations[0]&&j.data.allocations[0].id||'')}catch(e){}})")
    [ -n "$HOLD" ]
    gate 12 "test" $? -eq 0

    if [ -n "$HOLD" ]; then
      curl -s "${AUTH[@]}" "$API/v1/inventory/allocations?status=active" | grep -q "$HOLD"
      gate 13 "test" $? -eq 0

      curl -sf -X PATCH "${AUTH[@]}" "$API/v1/inventory/allocations/$HOLD/release" -d '{}' | grep -q '"released":true'
      gate 14 "test" $? -eq 0
    else
      skip 13 "no hold"; skip 14 "no hold"
    fi

    COUNT=$(cd apps/api && npx tsx -e "import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); p.auditLog.count({ where: { entity: 'inventory' } }).then(async (n) => { console.log(n); await p.\$disconnect(); });" 2>/dev/null | tr -d '[:space:]')
    [ "${COUNT:-0}" -gt 0 ]
    gate 15 "test" $? -eq 0
  fi
fi

echo
echo "== RESULT: $PASS passed, $FAIL failed, $SKIP skipped =="
[ "$FAIL" -eq 0 ]
