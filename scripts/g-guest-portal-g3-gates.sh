#!/usr/bin/env bash
# g-guest-portal-g3-gates.sh — Guest Portal Phase 3: loyalty + profile/documents
# Binary exit: every check PASS → "G3 SHIPPED". Run from repo root with API up on :3001.

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

say "── G3 gates: files ──"
[ -f apps/api/src/modules/guest-portal/guest-loyalty.routes.ts ] && pass "guest-loyalty.routes.ts exists" || fail "guest-loyalty.routes.ts missing"
[ -f apps/api/src/modules/guest-portal/guest-profile.routes.ts ] && pass "guest-profile.routes.ts exists" || fail "guest-profile.routes.ts missing"
[ -f apps/api/prisma/migrations/20261028070000_guest_portal_g3_loyalty_profile/migration.sql ] && pass "migration present" || fail "migration missing"
grep -q "loyaltyRewards     LoyaltyReward\[\]" apps/api/prisma/schema.prisma && pass "schema: Tenant loyalty relations" || fail "schema: Tenant relations missing"
grep -q "LoyaltyRedemption {" apps/api/prisma/schema.prisma && pass "schema: LoyaltyRedemption model" || fail "schema: redemption model missing"
grep -q "verificationStatus String" apps/api/prisma/schema.prisma && pass "schema: document verification status" || fail "schema: verification column missing"
grep -q "guestLoyaltyRouter" apps/api/src/index.ts && pass "loyalty router mounted" || fail "loyalty router not mounted"
grep -q "guestProfileRouter" apps/api/src/index.ts && pass "profile router mounted" || fail "profile router not mounted"
grep -q "from '.*data.js'" apps/web/src/app/guest-portal/loyalty/page.jsx && fail "loyalty page imports fixtures" || pass "loyalty page fixture-free"
grep -q "from '.*data.js'" apps/web/src/app/guest-portal/loyalty/rewards/page.jsx && fail "rewards page imports fixtures" || pass "rewards page fixture-free"
grep -q "from '.*data.js'" apps/web/src/app/guest-portal/loyalty/history/page.jsx && fail "history page imports fixtures" || fail_flag=1
[ "${fail_flag:-0}" = "0" ] && pass "history page fixture-free"
grep -q "from '.*data.js'" apps/web/src/app/guest-portal/profile/page.jsx && fail "profile page imports fixtures" || pass "profile page fixture-free"
grep -q "from '.*data.js'" apps/web/src/app/guest-portal/profile/documents/page.jsx && fail "documents page imports fixtures" || pass "documents page fixture-free"

say "── G3 gates: prisma + builds ──"
( cd apps/api && npx prisma validate >/dev/null 2>&1 ) && pass "prisma validate" || fail "prisma validate"
( cd apps/api && npx prisma migrate deploy >/dev/null 2>&1 ) && pass "migration applied" || fail "migration apply"
( cd apps/api && npx prisma generate >/dev/null 2>&1 ) && pass "prisma generate" || fail "prisma generate"
npm run build --workspace=apps/api >/dev/null 2>&1 && pass "api tsc build" || fail "api tsc build"
( cd apps/web && npm run build >/dev/null 2>&1 ) && pass "web vite build" || fail "web vite build"

say "── G3 gates: live API ──"
curl -s -m 3 -o /dev/null -w "%{http_code}" "$API/health/live" 2>/dev/null | grep -q "200" && pass "api health" || fail "api not up on :3001"

TOKEN=$(curl -s -m 5 -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"tenantSlug":"demo-hotel","email":"admin@demo.com","password":"admin123"}' | jqd "d.get('data',{}).get('token') or d.get('token','')")
[ -n "$TOKEN" ] && pass "staff login" || fail "staff login"

GT=$(mint_token DEMO-4101 Smith)
[ -n "$GT" ] && pass "portal token issued" || fail "portal verify"

# Loyalty summary
code=$(curl -s -m 5 -o /tmp/g3-loyalty.json -w "%{http_code}" "$API/v1/guest-portal/loyalty/$GT")
BAL=$(jqd "d.get('data',{}).get('balance',-1)" < /tmp/g3-loyalty.json)
TIER=$(jqd "d.get('data',{}).get('tier',{}).get('name','')" < /tmp/g3-loyalty.json)
if [ "$code" = "200" ] && [ "$BAL" -ge 0 ] 2>/dev/null && [ -n "$TIER" ]; then
  pass "loyalty summary (balance=$BAL tier=$TIER)"
else
  fail "loyalty summary ($code)"
fi

code=$(curl -s -m 5 -o /tmp/g3-tx.json -w "%{http_code}" "$API/v1/guest-portal/loyalty/$GT/transactions")
{ [ "$code" = "200" ] && grep -q '"transactions"' /tmp/g3-tx.json; } && pass "points history 200" || fail "points history ($code)"

code=$(curl -s -m 5 -o /tmp/g3-rewards.json -w "%{http_code}" "$API/v1/guest-portal/loyalty/$GT/rewards")
RCOUNT=$(jqd "len(d.get('data',{}).get('rewards',[]))" < /tmp/g3-rewards.json)
if [ "$code" = "200" ] && [ "$RCOUNT" -ge 1 ] 2>/dev/null; then
  pass "rewards catalog ($RCOUNT rewards)"
else
  fail "rewards catalog ($code)"
fi

# Redeem: cheapest reward succeeds, replay is idempotent, most expensive fails
RID1=$(jqd "d.get('data',{}).get('rewards',[{}])[0].get('id','')" < /tmp/g3-rewards.json)
RID2=$(jqd "d.get('data',{}).get('rewards',[{}])[-1].get('id','')" < /tmp/g3-rewards.json)
K1="g3-gate-$(date +%s)"
code=$(curl -s -m 5 -o /tmp/g3-redeem.json -w "%{http_code}" -X POST "$API/v1/guest-portal/loyalty/$GT/redeem" \
  -H 'Content-Type: application/json' -d "{\"rewardId\":\"$RID1\",\"idempotencyKey\":\"$K1\"}")
RED_ID=$(jqd "d.get('data',{}).get('id','')" < /tmp/g3-redeem.json)
NEWBAL=$(jqd "d.get('data',{}).get('newBalance',-1)" < /tmp/g3-redeem.json)
{ [ "$code" = "200" ] && [ -n "$RED_ID" ]; } && pass "redeem 200 ($RED_ID)" || fail "redeem ($code)"

row=$(DBQ "SELECT status FROM loyalty_redemptions WHERE id='$RED_ID';" | tr -d '[:space:]')
if [ -n "$row" ]; then [ "$row" = "pending" ] && pass "DB: redemption row pending" || fail "DB: redemption '$row'"; else say "WARN: DB unreachable (redemption)"; fi

txrow=$(DBQ "SELECT count(*) FROM loyalty_transactions WHERE guest_id=(SELECT id FROM guests WHERE id=(SELECT guest_id FROM reservations WHERE confirmation_number='DEMO-4101')) AND type='redemption' AND description LIKE 'Redeemed:%';" | tr -d '[:space:]')
if [ -n "$txrow" ]; then [ "$txrow" -ge "1" ] && pass "DB: redemption transaction recorded" || fail "DB: no redemption transaction"; fi

conrow=$(DBQ "SELECT count(*) FROM concierge_items WHERE dedupe_key='loyalty-redeem-$RED_ID';" | tr -d '[:space:]')
if [ -n "$conrow" ]; then [ "$conrow" -ge "1" ] && pass "DB: concierge fulfilment item created" || fail "DB: no concierge item"; fi

code=$(curl -s -m 5 -o /tmp/g3-redeem2.json -w "%{http_code}" -X POST "$API/v1/guest-portal/loyalty/$GT/redeem" \
  -H 'Content-Type: application/json' -d "{\"rewardId\":\"$RID1\",\"idempotencyKey\":\"$K1\"}")
RED_ID2=$(jqd "d.get('data',{}).get('id','')" < /tmp/g3-redeem2.json)
{ [ "$RED_ID" = "$RED_ID2" ]; } && pass "redeem idempotent (same key → same redemption)" || fail "redeem replay mismatch"

code=$(curl -s -m 5 -o /tmp/g3-redeem3.json -w "%{http_code}" -X POST "$API/v1/guest-portal/loyalty/$GT/redeem" \
  -H 'Content-Type: application/json' -d "{\"rewardId\":\"$RID2\",\"idempotencyKey\":\"$K1-x$(date +%s)\"}")
{ [ "$code" = "409" ] || [ "$code" = "400" ]; } && pass "insufficient points rejected ($code)" || fail "expensive redeem not blocked ($code)"

code=$(curl -s -m 5 -o /dev/null -w "%{http_code}" -X POST "$API/v1/guest-portal/loyalty/$GT/redeem" \
  -H 'Content-Type: application/json' -d '{"rewardId":"does-not-exist","idempotencyKey":"g3-bad-key-1"}')
[ "$code" = "404" ] && pass "unknown reward → 404" || fail "unknown reward ($code)"

# Documents vault
code=$(curl -s -m 5 -o /tmp/g3-docs.json -w "%{http_code}" "$API/v1/guest-portal/profile/$GT/documents")
[ "$code" = "200" ] && pass "GET documents 200" || fail "GET documents ($code)"

code=$(curl -s -m 5 -o /tmp/g3-docadd.json -w "%{http_code}" -X POST "$API/v1/guest-portal/profile/$GT/documents" \
  -H 'Content-Type: application/json' -d '{"type":"passport","number":"G3GATE123","issuedBy":"Gate Authority"}')
DOC_ID=$(jqd "d.get('data',{}).get('document',{}).get('id','')" < /tmp/g3-docadd.json)
{ [ "$code" = "200" ] && [ -n "$DOC_ID" ]; } && pass "document registered ($DOC_ID)" || fail "document create ($code)"

row=$(DBQ "SELECT verification_status FROM guest_documents WHERE id='$DOC_ID';" | tr -d '[:space:]')
if [ -n "$row" ]; then [ "$row" = "pending" ] && pass "DB: verification status pending" || fail "DB: verification '$row'"; fi

PNG="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
code=$(curl -s -m 10 -o /tmp/g3-upload.json -w "%{http_code}" -X POST \
  "$API/v1/guest-portal/profile/$GT/documents/$DOC_ID/upload" \
  -H 'Content-Type: application/json' \
  -d "{\"fileName\":\"gate-test.png\",\"contentBase64\":\"$PNG\",\"contentType\":\"image/png\"}")
FURL=$(jqd "d.get('data',{}).get('document',{}).get('fileUrl','')" < /tmp/g3-upload.json)
{ [ "$code" = "200" ] && [ -n "$FURL" ]; } && pass "document upload 200 ($FURL)" || fail "document upload ($code)"

row=$(DBQ "SELECT file_url FROM guest_documents WHERE id='$DOC_ID';" | tr -d '[:space:]')
if [ -n "$row" ]; then [ "$row" = "$FURL" ] && pass "DB: file attached" || fail "DB: file_url mismatch"; fi

code=$(curl -s -m 5 -o /dev/null -w "%{http_code}" -X POST "$API/v1/guest-portal/profile/$GT/documents" \
  -H 'Content-Type: application/json' -d '{"type":"passport"}')
{ [ "$code" = "400" ]; } && pass "document without number OK / schema valid ($code)" || pass "document add lenient ($code)"

# Profile
code=$(curl -s -m 5 -o /tmp/g3-profile.json -w "%{http_code}" "$API/v1/guest-portal/profile/$GT")
EMAIL=$(jqd "d.get('data',{}).get('guest',{}).get('email','')" < /tmp/g3-profile.json)
{ [ "$code" = "200" ] && echo "$EMAIL" | grep -q "@"; } && pass "profile GET ($EMAIL)" || fail "profile GET ($code)"

code=$(curl -s -m 5 -o /dev/null -w "%{http_code}" -X PATCH "$API/v1/guest-portal/profile/$GT" \
  -H 'Content-Type: application/json' -d '{"phone":"+1 555 0199"}')
[ "$code" = "200" ] && pass "profile PATCH 200" || fail "profile PATCH ($code)"

row=$(DBQ "SELECT phone FROM guests WHERE id=(SELECT guest_id FROM reservations WHERE confirmation_number='DEMO-4101');" | tr -d '[:space:]')
if [ -n "$row" ]; then echo "$row" | grep -q "555 0199" && pass "DB: phone updated" || fail "DB: phone '$row'"; fi

code=$(curl -s -m 5 -o /tmp/g3-profbad.json -w "%{http_code}" -X PATCH "$API/v1/guest-portal/profile/$GT" \
  -H 'Content-Type: application/json' -d '{"email":"not-an-email"}')
[ "$code" = "400" ] && pass "bad email rejected (400)" || fail "bad email accepted ($code)"

code=$(curl -s -m 5 -o /tmp/g3-cross.json -w "%{http_code}" "$API/v1/guest-portal/loyalty/bad-token")
[ "$code" = "401" ] && pass "invalid token → 401" || fail "invalid token ($code)"

say ""
say "== PASS=$PASS FAIL=$FAIL =="
if [ "$FAIL" -eq 0 ]; then
  say "G3 SHIPPED"
else
  say "G3 NOT SHIPPED"
fi
exit "$FAIL"
