#!/usr/bin/env bash
# g-guest-portal-g2-gates.sh — Guest Portal Phase 2 (Money): guest checkout + split billing
# Binary exit: every check PASS → "G2 SHIPPED". Run from repo root with API up on :3001.

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

# lookup/verify are strict-rate-limited (they mint tokens) — retry with backoff.
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

say "── G2 gates: files ──"
[ -f apps/api/src/modules/guest-portal/guest-pay.routes.ts ] && pass "guest-pay.routes.ts exists" || fail "guest-pay.routes.ts missing"
[ -f apps/api/prisma/migrations/20261028060000_guest_portal_g2_pay/migration.sql ] && pass "migration present" || fail "migration missing"
grep -q "folioSplitRequests FolioSplitRequest\[\]" apps/api/prisma/schema.prisma && pass "schema: Tenant back-relation" || fail "schema: Tenant back-relation missing"
grep -q "splitRequests      FolioSplitRequest\[\]" apps/api/prisma/schema.prisma && pass "schema: Reservation back-relation" || fail "schema: Reservation back-relation missing"
grep -q "guestPayRouter" apps/api/src/index.ts && pass "router mounted in index.ts" || fail "router not mounted"
grep -q "strictLimiter, guestPayRouter" apps/api/src/index.ts && pass "pay paths strict-limited" || fail "pay paths not rate limited"
grep -q "from '.*data.js'" apps/web/src/app/guest-portal/billing/page.jsx && fail "billing page imports fixtures" || pass "billing page fixture-free"
grep -q "from '.*data.js'" apps/web/src/app/guest-portal/billing/split/page.jsx && fail "split page imports fixtures" || pass "split page fixture-free"
grep -q "postedToFolio" apps/api/src/modules/payments/payments.service.ts && pass "folio posting idempotency guard present" || fail "posting guard missing"

say "── G2 gates: prisma + builds ──"
( cd apps/api && npx prisma validate >/dev/null 2>&1 ) && pass "prisma validate" || fail "prisma validate"
( cd apps/api && npx prisma migrate deploy >/dev/null 2>&1 ) && pass "migration applied" || fail "migration apply"
( cd apps/api && npx prisma generate >/dev/null 2>&1 ) && pass "prisma generate" || fail "prisma generate"
npm run build --workspace=apps/api >/dev/null 2>&1 && pass "api tsc build" || fail "api tsc build"
( cd apps/web && npm run build >/dev/null 2>&1 ) && pass "web vite build" || fail "web vite build"

say "── G2 gates: live API ──"
curl -s -m 3 -o /dev/null -w "%{http_code}" "$API/health/live" 2>/dev/null | grep -q "200" && pass "api health" || fail "api not up on :3001"

TOKEN=$(curl -s -m 5 -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"tenantSlug":"demo-hotel","email":"admin@demo.com","password":"admin123"}' | jqd "d.get('data',{}).get('token') or d.get('token','')")
[ -n "$TOKEN" ] && pass "staff login (tenantSlug)" || fail "staff login"

# Second guest = any CONFIRMED reservation (never hard-code one that tests may cancel).
CN2=$(DBQ "SELECT r.confirmation_number FROM reservations r WHERE r.tenant_id=(SELECT id FROM tenants WHERE slug='demo-hotel') AND r.status='confirmed' AND r.confirmation_number<>'DEMO-4101' ORDER BY r.arrival_date LIMIT 1;" | tr -d '[:space:]')
LN2=$(DBQ "SELECT g.last_name FROM reservations r JOIN guests g ON g.id=r.guest_id WHERE r.confirmation_number='$CN2';" | tr -d '[:space:]')
if [ -z "$CN2" ] || [ -z "$LN2" ]; then CN2="DEMO-4201"; LN2="Patel"; fi

LK=$(curl -s -m 5 -X POST "$API/v1/guest-portal/lookup" -H 'Content-Type: application/json' \
  -d '{"confirmationNumber":"DEMO-4101","lastName":"Smith"}')
echo "$LK" | grep -q '"found":true' && pass "portal lookup DEMO-4101" || fail "portal lookup"

GT=$(mint_token DEMO-4101 Smith)
[ -n "$GT" ] && pass "portal token issued" || fail "portal verify"

GT2=$(mint_token "$CN2" "$LN2")
[ -n "$GT2" ] && pass "second portal token ($CN2 / $LN2)" || fail "second portal token"

code=$(curl -s -m 5 -o /tmp/g2-payments.json -w "%{http_code}" "$API/v1/guest-portal/pay/$GT/payments")
[ "$code" = "200" ] && grep -q '"payments"' /tmp/g2-payments.json && pass "GET payments 200" || fail "GET payments ($code)"

code=$(curl -s -m 5 -o /dev/null -w "%{http_code}" "$API/v1/guest-portal/pay/bad-token/payments")
[ "$code" = "401" ] && pass "no/invalid token → 401" || fail "invalid token not rejected ($code)"

code=$(curl -s -m 5 -o /tmp/g2-req.json -w "%{http_code}" "$API/v1/guest-portal/pay/$GT/requests")
[ "$code" = "200" ] && pass "GET payment requests 200" || fail "GET payment requests ($code)"

code=$(curl -s -m 5 -o /tmp/g2-split.json -w "%{http_code}" -X POST "$API/v1/guest-portal/pay/$GT/split" \
  -H 'Content-Type: application/json' \
  -d '{"toName":"Test Roommate","toEmail":"roommate@test.co.za","amount":250.00,"note":"G2 gate"}')
SPLIT_ID=$(jqd "d.get('data',{}).get('id','')" < /tmp/g2-split.json)
[ "$code" = "200" ] && [ -n "$SPLIT_ID" ] && pass "split created ($SPLIT_ID)" || fail "split create ($code)"

row=$(DBQ "SELECT status FROM folio_split_requests WHERE id='$SPLIT_ID';" | tr -d '[:space:]')
if [ -z "$row" ]; then
  say "WARN: DB unreachable — skipping row asserts"
elif [ "$row" = "pending" ]; then
  pass "DB: split row pending"
else
  fail "DB: split status '$row'"
fi

taskrow=$(DBQ "SELECT count(*) FROM tasks WHERE reservation_id=(SELECT id FROM reservations WHERE confirmation_number='DEMO-4101') AND dedupe_key='split-offer-$SPLIT_ID';" | tr -d '[:space:]')
if [ -n "$taskrow" ]; then [ "$taskrow" -ge "1" ] && pass "DB: front-desk task created" || fail "DB: no front-desk task"; fi

code=$(curl -s -m 5 -o /tmp/g2-splits.json -w "%{http_code}" "$API/v1/guest-portal/pay/$GT/splits")
grep -q "$SPLIT_ID" /tmp/g2-splits.json && pass "GET splits lists new request" || fail "GET splits"

code=$(curl -s -m 5 -o /dev/null -w "%{http_code}" -X POST "$API/v1/guest-portal/pay/$GT/split/$SPLIT_ID/respond" \
  -H 'Content-Type: application/json' -d '{"action":"accept"}')
[ "$code" = "200" ] && pass "split accept 200" || fail "split accept ($code)"

row=$(DBQ "SELECT status FROM folio_split_requests WHERE id='$SPLIT_ID';" | tr -d '[:space:]')
if [ -n "$row" ]; then [ "$row" = "accepted" ] && pass "DB: split accepted" || fail "DB: split '$row'"; fi

# Cross-reservation isolation: second guest's token must NOT act on this reservation's
# split. Retry — a dropped connection here must not read as a pass or a leak.
xcode=""
for i in 1 2 3; do
  xcode=$(curl -s -m 10 -o /tmp/g2-cross.json -w "%{http_code}" -X POST \
    "$API/v1/guest-portal/pay/$GT2/split/$SPLIT_ID/respond" \
    -H 'Content-Type: application/json' -d '{"action":"decline"}')
  [ -n "$xcode" ] && [ "$xcode" != "000" ] && break
  sleep 3
done
if [ "$xcode" = "200" ]; then
  fail "cross-reservation respond LEAKED (200)"
elif [ "$xcode" = "403" ] || [ "$xcode" = "404" ] || [ "$xcode" = "409" ] || [ "$xcode" = "401" ]; then
  pass "cross-reservation respond blocked ($xcode)"
else
  say "WARN: cross-check body: $(cat /tmp/g2-cross.json 2>/dev/null)"
  fail "cross-reservation check inconclusive ($xcode)"
fi

K1="g2-gate-$(date +%s)"
code=$(curl -s -m 20 -o /tmp/g2-init.json -w "%{http_code}" -X POST "$API/v1/guest-portal/pay/$GT" \
  -H 'Content-Type: application/json' -d "{\"idempotencyKey\":\"$K1\"}")
REF1=$(jqd "d.get('data',{}).get('reference','')" < /tmp/g2-init.json)
if [ "$code" = "503" ]; then
  grep -q "PAYMENTS_NOT_CONFIGURED" /tmp/g2-init.json && pass "graceful 503 when Paystack unconfigured" || fail "503 shape wrong"
elif [ "$code" = "200" ] && [ -n "$REF1" ]; then
  pass "checkout initialized ($REF1)"
  prow=$(DBQ "SELECT status FROM payments WHERE reference='$REF1';" | tr -d '[:space:]')
  if [ -n "$prow" ]; then [ "$prow" = "pending" ] && pass "DB: payment row pending" || fail "DB: payment '$prow'"; fi
else
  fail "checkout initialize ($code)"
fi

code=$(curl -s -m 20 -o /tmp/g2-init2.json -w "%{http_code}" -X POST "$API/v1/guest-portal/pay/$GT" \
  -H 'Content-Type: application/json' -d "{\"idempotencyKey\":\"$K1\"}")
REF2=$(jqd "d.get('data',{}).get('reference','')" < /tmp/g2-init2.json)
if [ -n "$REF1" ] && [ "$REF1" = "$REF2" ]; then
  pass "idempotency: same key → same reference"
elif [ "$code" = "503" ]; then
  pass "idempotency replay path (503-config ok)"
else
  fail "idempotency replay mismatch"
fi

code=$(curl -s -m 5 -o /dev/null -w "%{http_code}" -X POST "$API/v1/guest-portal/pay/$GT" \
  -H 'Content-Type: application/json' -d '{"idempotencyKey":"g2-bad","amountMinor":0}')
{ [ "$code" = "400" ] || [ "$code" = "409" ]; } && pass "zero/nothing-to-pay rejected ($code)" || fail "bad amount accepted ($code)"

say ""
say "== PASS=$PASS FAIL=$FAIL =="
if [ "$FAIL" -eq 0 ]; then
  say "G2 SHIPPED"
else
  say "G2 NOT SHIPPED"
fi
exit "$FAIL"
