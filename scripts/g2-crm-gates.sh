#!/usr/bin/env bash
# g2-crm-gates.sh — full CRM module regression: schema, types, build, auth,
# guest 360, notes, follow-ups, segments (+email blast), corporate, sc-clients
set -u
cd "$(dirname "$0")/.."

API_URL="${API_URL:-http://localhost:3001}"
TENANT_SLUG="${TENANT_SLUG:-demo-hotel}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "PASS: $1"; }
bad() { FAIL=$((FAIL+1)); echo "FAIL: $1"; }

BODY=/tmp/crm_g2_body.json
CODE=""

req() {
  local method="$1" path="$2" payload="${3:-}"
  local url="$path"
  case "$url" in http*) ;; *) url="$API_URL$url" ;; esac
  local args=(-s -o "$BODY" -w "%{http_code}" -X "$method" "$url" -H "Content-Type: application/json")
  [ -n "${TOKEN:-}" ] && args+=(-H "Authorization: Bearer $TOKEN")
  [ -n "$payload" ] && args+=(-d "$payload")
  CODE=$(curl -m 10 "${args[@]}")
}

jget() { node -e "try{const d=JSON.parse(require('fs').readFileSync('$BODY','utf8'));console.log($1)}catch(e){process.exit(1)}"; }

echo "== Gate 1: prisma validate =="
(cd apps/api && npx prisma validate >/dev/null 2>&1) && ok "prisma validate" || bad "prisma validate"

echo "== Gate 2: api typecheck =="
(cd apps/api && npx tsc --noEmit >/dev/null 2>&1) && ok "tsc --noEmit" || bad "tsc --noEmit"

echo "== Gate 3: web build =="
(cd apps/web && npx vite build >/dev/null 2>&1) && ok "web build" || bad "web build"

echo "== Gate 4: health =="
req GET /health
[ "$CODE" = "200" ] && ok "health" || bad "health (HTTP $CODE)"

echo "== Gate 5: login =="
if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
  bad "login (set ADMIN_EMAIL / ADMIN_PASSWORD)"
else
  req POST /auth/login "{\"tenantSlug\":\"$TENANT_SLUG\",\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"
  if [ "$CODE" = "200" ]; then
    TOKEN=$(jget "(d.data&&d.data.token)||d.token||d.accessToken||''")
    [ -n "$TOKEN" ] && ok "login" || bad "login (no token field)"
  else
    bad "login (HTTP $CODE)"
  fi
fi

if [ -z "${TOKEN:-}" ]; then echo "-- no token, API gates skipped"; echo "== RESULT: $PASS passed, $FAIL failed =="; exit 1; fi

AUTH="Authorization: Bearer $TOKEN"
B="$API_URL/v1/crm"

echo "== Gate 6: overview =="
req GET "$B/overview" "" || true
req GET "$B/overview"
{ [ "$CODE" = "200" ] && jget "d.totals?'':'x'" >/dev/null 2>&1; } && ok "overview" || bad "overview (HTTP $CODE)"
GID=$(jget "(d.topGuests&&d.topGuests[0]&&d.topGuests[0].id)||''" 2>/dev/null)

echo "== Gate 7: assignees =="
req GET "$B/assignees"
[ "$CODE" = "200" ] && ok "assignees" || bad "assignees (HTTP $CODE)"

if [ -n "$GID" ]; then
  echo "== Gate 8: guest 360 =="
  req GET "$B/guests/$GID/360"
  { [ "$CODE" = "200" ] && jget "d.rfm?'':'x'" >/dev/null 2>&1; } && ok "guest 360" || bad "guest 360 (HTTP $CODE)"

  echo "== Gate 9: timeline =="
  req GET "$B/guests/$GID/timeline"
  [ "$CODE" = "200" ] && ok "timeline" || bad "timeline (HTTP $CODE)"

  echo "== Gate 10: note lifecycle =="
  req POST "$B/guests/$GID/notes" '{"body":"g2 note","pinned":true}'
  if [ "$CODE" = "201" ]; then
    ok "note create"
    NID=$(jget "d.id||''" 2>/dev/null)
    req PATCH "$B/notes/$NID" '{"pinned":false}'
    [ "$CODE" = "200" ] && ok "note patch" || bad "note patch ($CODE)"
    req DELETE "$B/notes/$NID"
    [ "$CODE" = "200" ] && ok "note delete" || bad "note delete ($CODE)"
  else bad "note create (HTTP $CODE)"; fi

  echo "== Gate 11: tags/vip patch =="
  req PATCH "$B/guests/$GID" '{"tags":["g2-test"]}'
  [ "$CODE" = "200" ] && ok "crm patch" || bad "crm patch (HTTP $CODE)"
  req PATCH "$B/guests/$GID" '{"tags":[]}' >/dev/null 2>&1

  echo "== Gate 12: follow-up lifecycle =="
  ASSIGNEE=$(curl -s "$B/assignees" -H "$AUTH" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log((j[0]&&j[0].id)||'')})")
  req POST "$B/follow-ups" "{\"guestId\":\"$GID\",\"assigneeId\":\"$ASSIGNEE\",\"title\":\"g2 follow-up\"}"
  if [ "$CODE" = "201" ]; then
    ok "follow-up create"
    FID=$(jget "d.id||''" 2>/dev/null)
    req PATCH "$B/follow-ups/$FID" '{"done":true}'
    [ "$CODE" = "200" ] && ok "follow-up done" || bad "follow-up done ($CODE)"
  else bad "follow-up create (HTTP $CODE)"; fi
else
  echo "-- no guest with stays; gates 8-12 skipped"
fi

echo "== Gate 13: segment lifecycle + email blast =="
req POST "$B/segments" '{"name":"G2 Gate","rule":{"minStays":0}}'
if [ "$CODE" = "201" ]; then
  ok "segment create"
  SID=$(jget "d.id||''" 2>/dev/null)
  req POST "$B/segments/$SID/evaluate"
  { [ "$CODE" = "200" ] && jget "typeof d.memberCount==='number'" >/dev/null 2>&1; } && ok "segment evaluate" || bad "segment evaluate ($CODE)"
  req GET "$B/segments/$SID/members"
  [ "$CODE" = "200" ] && ok "segment members" || bad "segment members ($CODE)"
  req POST "$B/segments/$SID/email" '{"subject":"G2 gate","body":"Branded template test."}'
  if [ "$CODE" = "200" ] && jget "d.queued>0?'':'x'" >/dev/null 2>&1; then
    ok "segment email (queued $(jget 'd.queued'))"
  else bad "segment email (HTTP $CODE)"; fi
  req DELETE "$B/segments/$SID"
  [ "$CODE" = "200" ] && ok "segment delete" || bad "segment delete ($CODE)"
else bad "segment create (HTTP $CODE)"; fi

echo "== Gate 14: corporate lifecycle =="
req POST "$B/corporate-accounts" "{\"name\":\"G2 Corp $RANDOM\",\"email\":\"g2@example.com\"}"
if [ "$CODE" = "201" ]; then
  ok "corporate create"
  AID=$(jget "d.id||''" 2>/dev/null)
  req GET "$B/corporate-accounts/$AID"
  [ "$CODE" = "200" ] && ok "corporate get" || bad "corporate get ($CODE)"
  req PATCH "$B/corporate-accounts/$AID" '{"isActive":false}'
  [ "$CODE" = "200" ] && ok "corporate deactivate (test cleanup)" || bad "corporate deactivate ($CODE)"
else bad "corporate create (HTTP $CODE)"; fi

echo "== Gate 15: sc-clients =="
req GET "$B/sc-clients"
[ "$CODE" = "200" ] && ok "sc-clients" || bad "sc-clients (HTTP $CODE)"

echo "== Gate 16: auth enforced =="
TOKEN=""
req GET "$B/overview"
[ "$CODE" = "401" ] && ok "auth enforced" || bad "auth enforced (expected 401, got $CODE)"

echo ""
echo "== RESULT: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ]
