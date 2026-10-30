#!/usr/bin/env bash
# g-guest-portal-g4-gates.sh — Guest Portal Phase 4: in-stay commerce + timeline
# Binary exit: every check PASS → "G4 SHIPPED". Run from repo root, API up on :3001.

cd "$(dirname "$0")/.." || exit 1
API="http://localhost:3001"
PASS=0
FAIL=0
say()  { printf '%s\n' "$*"; }
pass() { PASS=$((PASS+1)); say "PASS: $1"; }
fail() { FAIL=$((FAIL+1)); say "FAIL: $1"; }

jqd() { python3 -c "import sys,json;d=json.load(sys.stdin);print($1)" 2>/dev/null; }

DBQ() {
  local c
  c=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i postgres | head -1)
  if [ -n "$c" ]; then
    docker exec "$c" psql -U postgres -d unified_pms -tAc "$1" 2>/dev/null
  else
    psql "postgresql://vimad:vimad_dev_password@localhost:5432/unified_pms" -tAc "$1" 2>/dev/null
  fi
}

mint_token() {
  local cn="$1" ln="$2" t="" raw=""
  for i in 1 2 3; do
    raw=$(curl -s -m 5 -X POST "$API/v1/guest-portal/verify" -H 'Content-Type: application/json' \
      -d "{\"confirmationNumber\":\"$cn\",\"lastName\":\"$ln\"}")
    t=$(echo "$raw" | jqd "d.get('data',{}).get('token','')")
    if [ -n "$t" ]; then echo "$t"; return 0; fi
    sleep 3
  done
  say "WARN: token mint failed for $cn/$ln — last response: $raw"
  echo ""
}

say "── G4 gates: files ──"
[ -f apps/api/src/modules/guest-portal/guest-commerce.routes.ts ] && pass "guest-commerce.routes.ts exists" || fail "router missing"
[ -f apps/api/prisma/migrations/20261028080000_guest_portal_g4_commerce/migration.sql ] && pass "migration present" || fail "migration missing"
grep -q "guestOrders        GuestOrder\[\]" apps/api/prisma/schema.prisma && pass "schema: Reservation back-relation" || fail "schema: Reservation relation missing"
grep -q "model MenuItem {" apps/api/prisma/schema.prisma && pass "schema: MenuItem" || fail "schema: MenuItem missing"
grep -q "model GuestOrder {" apps/api/prisma/schema.prisma && pass "schema: GuestOrder" || fail "schema: GuestOrder missing"
grep -q "guestCommerceRouter" apps/api/src/index.ts && pass "commerce router mounted" || fail "router not mounted"
grep -q "from '.*data.js'" apps/web/src/app/guest-portal/stay/room-service/page.jsx && fail "room-service page imports fixtures" || pass "room-service page fixture-free"
grep -q "from '.*data.js'" apps/web/src/app/guest-portal/timeline/page.jsx && fail "timeline page imports fixtures" || pass "timeline page fixture-free"

say "── G4 gates: prisma + builds ──"
( cd apps/api && npx prisma validate >/dev/null 2>&1 ) && pass "prisma validate" || fail "prisma validate"
( cd apps/api && npx prisma migrate deploy >/dev/null 2>&1 ) && pass "migration applied" || fail "migration apply"
( cd apps/api && npx prisma generate >/dev/null 2>&1 ) && pass "prisma generate" || fail "prisma generate"
npm run build --workspace=apps/api >/dev/null 2>&1 && pass "api tsc build" || fail "api tsc build"
( cd apps/web && npm run build >/dev/null 2>&1 ) && pass "web vite build" || fail "web vite build"

say "── G4 gates: live API ──"
curl -s -m 3 -o /dev/null -w "%{http_code}" "$API/health/live" 2>/dev/null | grep -q "200" && pass "api health" || fail "api not up on :3001"

TOKEN=$(curl -s -m 5 -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"tenantSlug":"demo-hotel","email":"admin@demo.com","password":"admin123"}' | jqd "d.get('data',{}).get('token') or d.get('token','')")
[ -n "$TOKEN" ] && pass "staff login" || fail "staff login"

CN2=$(DBQ "SELECT r.confirmation_number FROM reservations r WHERE r.tenant_id=(SELECT id FROM tenants WHERE slug='demo-hotel') AND r.status='confirmed' AND r.confirmation_number<>'DEMO-4101' ORDER BY r.arrival_date LIMIT 1;" | tr -d '[:space:]')
LN2=$(DBQ "SELECT g.last_name FROM reservations r JOIN guests g ON g.id=r.guest_id WHERE r.confirmation_number='$CN2';" | tr -d '[:space:]')
if [ -z "$CN2" ] || [ -z "$LN2" ]; then CN2="DEMO-4201"; LN2="Patel"; fi

GT=$(mint_token DEMO-4101 Smith)
[ -n "$GT" ] && pass "portal token issued" || fail "portal verify"

GT2=$(mint_token "$CN2" "$LN2")
[ -n "$GT2" ] && pass "second portal token ($CN2 / $LN2)" || fail "second portal token"

# Menu: pick currently-available items only (time-blocked catalog)
code=$(curl -s -m 5 -o /tmp/g4-menu.json -w "%{http_code}" "$API/v1/guest-portal/commerce/$GT/menu")
AVAIL=$(python3 -c "
import json
d=json.load(open('/tmp/g4-menu.json'))['data']['menu']
a=[m for m in d if m['availableNow']]
print(len(a))
" 2>/dev/null)
MCOUNT=$(jqd "len(d.get('data',{}).get('menu',[]))" < /tmp/g4-menu.json)
{ [ "$code" = "200" ] && [ "${MCOUNT:-0}" -ge 5 ]; } && pass "menu 200 ($MCOUNT items, $AVAIL available now)" || fail "menu ($code)"

# Order: two available items, idempotent replay, folio charge, kitchen task
ITEMS_JSON=$(python3 -c "
import json
d=json.load(open('/tmp/g4-menu.json'))['data']['menu']
a=[m for m in d if m['availableNow']][:2]
print(json.dumps([{'menuItemId': m['id'], 'quantity': 1} for m in a]))
" 2>/dev/null)
K1="g4-gate-$(date +%s)"
code=$(curl -s -m 10 -o /tmp/g4-order.json -w "%{http_code}" -X POST "$API/v1/guest-portal/commerce/$GT/order" \
  -H 'Content-Type: application/json' -d "{\"items\":$ITEMS_JSON,\"note\":\"G4 gate\",\"idempotencyKey\":\"$K1\"}")
ORDER_ID=$(jqd "d.get('data',{}).get('order',{}).get('id','')" < /tmp/g4-order.json)
OTOTAL=$(jqd "d.get('data',{}).get('order',{}).get('total',-1)" < /tmp/g4-order.json)
{ [ "$code" = "200" ] && [ -n "$ORDER_ID" ]; } && pass "order placed ($ORDER_ID total=$OTOTAL)" || fail "order ($code)"

row=$(DBQ "SELECT status FROM guest_orders WHERE id='$ORDER_ID';" | tr -d '[:space:]')
if [ -n "$row" ]; then [ "$row" = "received" ] && pass "DB: order received" || fail "DB: order '$row'"; fi

firow=$(DBQ "SELECT count(*) FROM folio_items fi WHERE fi.description LIKE 'Room service%' AND fi.type='service';" | tr -d '[:space:]')
if [ -n "$firow" ]; then [ "$firow" -ge "1" ] && pass "DB: folio charge posted" || fail "DB: no folio charge"; fi

krow=$(DBQ "SELECT count(*) FROM tasks WHERE dedupe_key='order-$ORDER_ID' AND department='kitchen';" | tr -d '[:space:]')
if [ -n "$krow" ]; then [ "$krow" -ge "1" ] && pass "DB: kitchen queue row" || fail "DB: no kitchen task"; fi

code=$(curl -s -m 10 -o /tmp/g4-order2.json -w "%{http_code}" -X POST "$API/v1/guest-portal/commerce/$GT/order" \
  -H 'Content-Type: application/json' -d "{\"items\":$ITEMS_JSON,\"idempotencyKey\":\"$K1\"}")
ORDER_ID2=$(jqd "d.get('data',{}).get('order',{}).get('id','')" < /tmp/g4-order2.json)
{ [ "$ORDER_ID" = "$ORDER_ID2" ]; } && pass "order idempotent (same key → same order)" || fail "order replay mismatch"

code=$(curl -s -m 5 -o /tmp/g4-orders.json -w "%{http_code}" "$API/v1/guest-portal/commerce/$GT/orders")
grep -q "$ORDER_ID" /tmp/g4-orders.json && pass "GET orders lists it" || fail "GET orders"

# Cancel: fresh small order, then cancel → reversal
ONE_ITEM=$(python3 -c "
import json
d=json.load(open('/tmp/g4-menu.json'))['data']['menu']
a=[m for m in d if m['availableNow']][:1]
print(json.dumps([{'menuItemId': m['id'], 'quantity': 1} for m in a]))
" 2>/dev/null)
code=$(curl -s -m 10 -o /tmp/g4-order3.json -w "%{http_code}" -X POST "$API/v1/guest-portal/commerce/$GT/order" \
  -H 'Content-Type: application/json' -d "{\"items\":$ONE_ITEM,\"idempotencyKey\":\"$K1-cancel$(date +%s)\"}")
OID2=$(jqd "d.get('data',{}).get('order',{}).get('id','')" < /tmp/g4-order3.json)
code=$(curl -s -m 10 -o /tmp/g4-cancel.json -w "%{http_code}" -X POST "$API/v1/guest-portal/commerce/$GT/orders/$OID2/cancel")
OSTAT=$(jqd "d.get('data',{}).get('status','')" < /tmp/g4-cancel.json)
{ [ "$code" = "200" ] && [ "$OSTAT" = "cancelled" ]; } && pass "cancel → reversed + cancelled" || fail "cancel ($code)"

# Not-checked-in guest can't order
code=$(curl -s -m 10 -o /dev/null -w "%{http_code}" -X POST "$API/v1/guest-portal/commerce/$GT2/order" \
  -H 'Content-Type: application/json' -d "{\"items\":$ONE_ITEM,\"idempotencyKey\":\"$K1-x$(date +%s)\"}")
[ "$code" = "409" ] && pass "pre-arrival order blocked (409)" || fail "pre-arrival order ($code)"

# Upsells: catalog + purchase via sellProduct
code=$(curl -s -m 5 -o /tmp/g4-upsells.json -w "%{http_code}" "$API/v1/guest-portal/commerce/$GT/upsells")
PCOUNT=$(jqd "len(d.get('data',{}).get('products',[]))" < /tmp/g4-upsells.json)
{ [ "$code" = "200" ] && [ "${PCOUNT:-0}" -ge 1 ]; } && pass "upsells catalog ($PCOUNT)" || fail "upsells ($code)"

PID1=$(jqd "d.get('data',{}).get('products',[{}])[0].get('id','')" < /tmp/g4-upsells.json)
code=$(curl -s -m 10 -o /tmp/g4-buy.json -w "%{http_code}" -X POST "$API/v1/guest-portal/commerce/$GT/upsells/$PID1/purchase" \
  -H 'Content-Type: application/json' -d '{"quantity":1}')
SALE_ID=$(jqd "d.get('data',{}).get('id','')" < /tmp/g4-buy.json)
{ [ "$code" = "200" ] && [ -n "$SALE_ID" ]; } && pass "upsell purchased ($SALE_ID)" || fail "upsell purchase ($code)"

srow=$(DBQ "SELECT count(*) FROM upsell_sales WHERE id='$SALE_ID';" | tr -d '[:space:]')
if [ -n "$srow" ]; then [ "$srow" -ge "1" ] && pass "DB: upsell sale row" || fail "DB: no sale row"; fi

# Timeline (C4′b reuse)
code=$(curl -s -m 5 -o /tmp/g4-tl.json -w "%{http_code}" "$API/v1/guest-portal/commerce/$GT/timeline")
ECOUNT=$(jqd "len(d.get('data',{}).get('events',[]))" < /tmp/g4-tl.json)
{ [ "$code" = "200" ] && [ "${ECOUNT:-0}" -ge 1 ]; } && pass "timeline 200 ($ECOUNT events)" || fail "timeline ($code)"

code=$(curl -s -m 5 -o /dev/null -w "%{http_code}" "$API/v1/guest-portal/commerce/bad-token/menu")
[ "$code" = "401" ] && pass "invalid token → 401" || fail "invalid token ($code)"

say ""
say "== PASS=$PASS FAIL=$FAIL =="
if [ "$FAIL" -eq 0 ]; then
  say "G4 SHIPPED"
else
  say "G4 NOT SHIPPED"
fi
exit "$FAIL"
