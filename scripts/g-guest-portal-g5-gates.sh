#!/usr/bin/env bash
# g-guest-portal-g5-gates.sh — Guest Portal Phase 5: chat round-trip, announcements, reviews

cd "$(dirname "$0")/.." || exit 1
API="http://localhost:3001"
PASS=0
FAIL=0
say()  { printf '%s\n' "$*"; }
pass() { PASS=$((PASS+1)); say "PASS: $1"; }
fail() { FAIL=$((FAIL+1)); say "FAIL: $1"; }

jqd() { python3 -c "import sys,json;d=json.load(sys.stdin);print($1)" 2>/dev/null; }
now_ms() { python3 -c 'import time;print(int(time.time()*1000))'; }

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

say "── G5 gates: files ──"
[ -f apps/api/src/modules/guest-portal/guest-comms.routes.ts ] && pass "guest-comms.routes.ts exists" || fail "guest comms missing"
[ -f apps/api/src/modules/guest-portal/comms.routes.ts ] && pass "comms.routes.ts exists" || fail "staff comms missing"
[ -f apps/api/prisma/migrations/20261028090000_guest_portal_g5_comms/migration.sql ] && pass "migration present" || fail "migration missing"
grep -q "chatThreads        ChatThread\[\]" apps/api/prisma/schema.prisma && pass "schema: Reservation comms relations" || fail "schema: relations missing"
grep -q "model Review {" apps/api/prisma/schema.prisma && pass "schema: Review model" || fail "schema: Review missing"
grep -q "guestCommsRouter" apps/api/src/index.ts && pass "guest comms mounted" || fail "guest comms not mounted"
grep -q "commsRouter" apps/api/src/index.ts && pass "staff comms mounted" || fail "staff comms not mounted"
grep -c "'no_show', 'checked_out'" apps/api/src/modules/guest-portal/guest-portal.service.ts | grep -q "^0$" && pass "checked_out gets portal access" || fail "verify still blocks checked_out"
grep -q "from '.*data.js'" apps/web/src/app/guest-portal/messages/page.jsx && fail "messages page imports fixtures" || pass "messages page fixture-free"
grep -q "from '.*data.js'" apps/web/src/app/guest-portal/reviews/page.jsx && fail "reviews page imports fixtures" || pass "reviews page fixture-free"
grep -q "from '.*data.js'" apps/web/src/app/guest-portal/status/announcements/page.jsx && fail "announcements page imports fixtures" || pass "announcements page fixture-free"

say "── G5 gates: prisma + builds ──"
( cd apps/api && npx prisma validate >/dev/null 2>&1 ) && pass "prisma validate" || fail "prisma validate"
( cd apps/api && npx prisma migrate deploy >/dev/null 2>&1 ) && pass "migration applied" || fail "migration apply"
( cd apps/api && npx prisma generate >/dev/null 2>&1 ) && pass "prisma generate" || fail "prisma generate"
npm run build --workspace=apps/api >/dev/null 2>&1 && pass "api tsc build" || fail "api tsc build"
( cd apps/web && npm run build >/dev/null 2>&1 ) && pass "web vite build" || fail "web vite build"

say "── G5 gates: live API ──"
up=""
for i in $(seq 1 60); do
  code=$(curl -s -m 2 -o /dev/null -w "%{http_code}" "$API/health/live" 2>/dev/null)
  [ "$code" = "200" ] && { up="1"; break; }
  sleep 1
done
if [ -n "$up" ]; then pass "api health"; else fail "api not up on :3001"; exit 1; fi

TOKEN=$(curl -s -m 5 -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"tenantSlug":"demo-hotel","email":"admin@demo.com","password":"admin123"}' | jqd "d.get('data',{}).get('token') or d.get('token','')")
if [ -n "$TOKEN" ]; then pass "staff login"; else fail "staff login"; say "aborting — staff token required"; exit 1; fi

GT=$(mint_token DEMO-4101 Smith)
[ -n "$GT" ] && pass "portal token issued" || fail "portal verify"

code=$(curl -s -m 5 -o /tmp/g5-thread.json -w "%{http_code}" "$API/v1/guest-portal/comms/chat/$GT/thread")
THREAD_ID=$(jqd "d.get('data',{}).get('thread',{}).get('id','')" < /tmp/g5-thread.json)
{ [ "$code" = "200" ] && [ -n "$THREAD_ID" ]; } && pass "thread auto-created ($THREAD_ID)" || fail "thread ($code)"

C1="g5-client-$(date +%s)"
T0=$(now_ms)
code=$(curl -s -m 5 -o /tmp/g5-msg.json -w "%{http_code}" -X POST "$API/v1/guest-portal/comms/chat/$GT/messages" \
  -H 'Content-Type: application/json' -d "{\"body\":\"Gate: front desk here?\",\"clientId\":\"$C1\"}")
MSG_ID=$(jqd "d.get('data',{}).get('message',{}).get('id','')" < /tmp/g5-msg.json)
{ [ "$code" = "200" ] && [ -n "$MSG_ID" ]; } && pass "guest message sent" || fail "guest message ($code)"

found=""
for i in $(seq 1 8); do
  sleep 0.25
  inv=$(curl -s -m 5 -H "Authorization: Bearer $TOKEN" "$API/v1/comms/chat/inbox")
  if echo "$inv" | grep -q "Gate: front desk here"; then found="1"; break; fi
done
T1=$(now_ms)
if [ -n "$found" ]; then
  d=$((T1 - T0))
  if [ "$d" -lt 2000 ]; then pass "guest→staff visible in ${d}ms (<2s)"; else fail "guest→staff ${d}ms"; fi
else
  fail "guest message never reached staff inbox"
fi

code=$(curl -s -m 5 -o /tmp/g5-msg2.json -w "%{http_code}" -X POST "$API/v1/guest-portal/comms/chat/$GT/messages" \
  -H 'Content-Type: application/json' -d "{\"body\":\"Gate: front desk here?\",\"clientId\":\"$C1\"}")
MSG_ID2=$(jqd "d.get('data',{}).get('message',{}).get('id','')" < /tmp/g5-msg2.json)
{ [ -n "$MSG_ID" ] && [ "$MSG_ID" = "$MSG_ID2" ]; } && pass "chat send idempotent (clientId dedupe)" || fail "chat dedupe mismatch"

T2=$(now_ms)
code=$(curl -s -m 5 -o /tmp/g5-reply.json -w "%{http_code}" -X POST \
  "$API/v1/comms/chat/threads/$THREAD_ID/messages" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"body":"Yes — how can we help?"}')
REPLY_ID=$(jqd "d.get('message',{}).get('id','')" < /tmp/g5-reply.json)
{ [ "$code" = "200" ] && [ -n "$REPLY_ID" ]; } && pass "staff reply sent" || fail "staff reply ($code)"

found2=""
for i in $(seq 1 8); do
  sleep 0.25
  th=$(curl -s -m 5 "$API/v1/guest-portal/comms/chat/$GT/thread")
  if [ -n "$REPLY_ID" ] && echo "$th" | grep -q "$REPLY_ID"; then found2="1"; break; fi
done
T3=$(now_ms)
if [ -n "$found2" ]; then
  d=$((T3 - T2))
  if [ "$d" -lt 2000 ]; then pass "staff→guest visible in ${d}ms (<2s)"; else fail "staff→guest ${d}ms"; fi
else
  fail "staff reply never reached guest thread"
fi

row=$(DBQ "SELECT count(*) FROM chat_messages WHERE \"threadId\"='$THREAD_ID';" | tr -d '[:space:]')
if [ -n "$row" ]; then [ "$row" -ge "2" ] && pass "DB: messages persisted ($row)" || fail "DB: messages $row"; fi

code=$(curl -s -m 5 -o /tmp/g5-ann.json -w "%{http_code}" "$API/v1/guest-portal/comms/announcements/$GT")
ACOUNT=$(jqd "len(d.get('data',{}).get('announcements',[]))" < /tmp/g5-ann.json)
if [ "$code" = "200" ] && [ "${ACOUNT:-0}" -ge 1 ]; then
  pass "announcement visible in portal ($ACOUNT)"
else
  fail "announcements ($code)"
fi

GT3=$(mint_token DEMO-4301 Smith)
[ -n "$GT3" ] && pass "post-stay token issued (checked_out)" || fail "post-stay verify"

code=$(curl -s -m 5 -o /dev/null -w "%{http_code}" -X POST "$API/v1/guest-portal/comms/reviews/$GT" \
  -H 'Content-Type: application/json' -d '{"rating":5,"title":"x","body":"too early for this review"}')
[ "$code" = "409" ] && pass "in-stay review blocked (409)" || fail "in-stay review ($code)"

DBQ "DELETE FROM reviews WHERE \"reservationId\"=(SELECT id FROM reservations WHERE \"confirmationNumber\"='DEMO-4301');" >/dev/null 2>&1
code=$(curl -s -m 5 -o /tmp/g5-rev.json -w "%{http_code}" -X POST "$API/v1/guest-portal/comms/reviews/$GT3" \
  -H 'Content-Type: application/json' -d '{"rating":5,"title":"Gate stay","body":"A wonderful gate-test stay, highly recommended for everyone."}')
REV_ID=$(jqd "d.get('data',{}).get('review',{}).get('id','')" < /tmp/g5-rev.json)
{ [ "$code" = "200" ] && [ -n "$REV_ID" ]; } && pass "review submitted ($REV_ID)" || fail "review submit ($code)"

code=$(curl -s -m 5 -o /tmp/g5-rev2.json -w "%{http_code}" -X POST "$API/v1/guest-portal/comms/reviews/$GT3" \
  -H 'Content-Type: application/json' -d '{"rating":4,"body":"A duplicate that should replay the first one entirely."}')
REV_ID2=$(jqd "d.get('data',{}).get('review',{}).get('id','')" < /tmp/g5-rev2.json)
{ [ -n "$REV_ID" ] && [ "$REV_ID" = "$REV_ID2" ]; } && pass "review one-per-stay (idempotent)" || fail "review dup mismatch"

row=$(DBQ "SELECT status FROM reviews WHERE id='$REV_ID';" | tr -d '[:space:]')
if [ -n "$row" ]; then [ "$row" = "pending" ] && pass "DB: review pending moderation" || fail "DB: review '$row'"; fi

code=$(curl -s -m 5 -o /tmp/g5-queue.json -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API/v1/comms/reviews?status=pending")
{ [ -n "$REV_ID" ] && grep -q "$REV_ID" /tmp/g5-queue.json; } && pass "moderation queue lists it" || fail "moderation queue"

code=$(curl -s -m 5 -o /dev/null -w "%{http_code}" -X PATCH "$API/v1/comms/reviews/$REV_ID" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"status":"approved"}')
[ "$code" = "200" ] && pass "review approved" || fail "approve ($code)"

row=$(DBQ "SELECT status FROM reviews WHERE id='$REV_ID';" | tr -d '[:space:]')
if [ -n "$row" ]; then [ "$row" = "approved" ] && pass "DB: status approved" || fail "DB: '$row'"; fi

code=$(curl -s -m 5 -o /tmp/g5-composer.json -w "%{http_code}" -X POST "$API/v1/comms/announcements" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Gate announcement","body":"Composed by the G5 gate.","status":"published"}')
[ "$code" = "200" ] && pass "staff announcement composer 200" || fail "composer ($code)"

say ""
say "== PASS=$PASS FAIL=$FAIL =="
if [ "$FAIL" -eq 0 ]; then
  say "G5 SHIPPED"
else
  say "G5 NOT SHIPPED"
fi
exit "$FAIL"
