#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/.."

API_URL="${API_URL:-http://localhost:3001}"
TENANT_SLUG="${TENANT_SLUG:-demo-hotel}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "PASS: $1"; }
bad() { FAIL=$((FAIL+1)); echo "FAIL: $1"; }

BODY=/tmp/crm_gate_body.json
CODE=""

req() {
  local method="$1" path="$2" payload="${3:-}"
  local args=(-s -o "$BODY" -w "%{http_code}" -X "$method" "$API_URL$path" -H "Content-Type: application/json")
  [ -n "${TOKEN:-}" ] && args+=(-H "Authorization: Bearer $TOKEN")
  [ -n "$payload" ] && args+=(-d "$payload")
  CODE=$(curl -m 10 "${args[@]}")
}

jget() { node -e "try{const d=JSON.parse(require('fs').readFileSync('$BODY','utf8'));console.log($1)}catch(e){process.exit(1)}"; }

echo "== Gate 1: prisma validate =="
if (cd apps/api && npx prisma validate >/dev/null 2>&1); then ok "prisma validate"; else bad "prisma validate"; fi

echo "== Gate 2: api typecheck =="
if (cd apps/api && npx tsc --noEmit >/dev/null 2>&1); then ok "tsc --noEmit"; else bad "tsc --noEmit (run: cd apps/api && npx tsc --noEmit)"; fi

echo "== Gate 3: web build =="
if (cd apps/web && npx vite build >/dev/null 2>&1); then ok "web build"; else bad "web build (run: cd apps/web && npx vite build)"; fi

echo "== Gate 4: api health =="
req GET /health
if [ "$CODE" != "200" ]; then req GET /api/health; fi
if [ "$CODE" = "200" ]; then ok "health"; else bad "health (HTTP $CODE — API down?)"; fi

echo "== Gate 5: login =="
if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
  bad "login (set ADMIN_EMAIL / ADMIN_PASSWORD env)"
else
  req POST /auth/login "{\"tenantSlug\":\"$TENANT_SLUG\",\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"
  if [ "$CODE" = "200" ]; then
    TOKEN=$(jget "d.token||d.accessToken||(d.data&&d.data.token)||''")
    [ -n "$TOKEN" ] && ok "login" || bad "login (200 but no token field)"
  else
    bad "login (HTTP $CODE — tenant slug is '$TENANT_SLUG')"
  fi
fi

if [ -n "${TOKEN:-}" ]; then
  echo "== Gate 6: GET /v1/crm/overview =="
  req GET /v1/crm/overview
  { [ "$CODE" = "200" ] && jget "d.totals?'':'x'" >/dev/null 2>&1; } && ok "overview" || bad "overview (HTTP $CODE)"

  echo "== Gate 7: assignees =="
  req GET /v1/crm/assignees
  [ "$CODE" = "200" ] && ok "assignees" || bad "assignees (HTTP $CODE)"

  GUEST_ID=$(jget "(d.topGuests&&d.topGuests[0]&&d.topGuests[0].id)||''" 2>/dev/null)

  if [ -n "$GUEST_ID" ]; then
    echo "== Gate 8: guest 360 =="
    req GET "/v1/crm/guests/$GUEST_ID/360"
    [ "$CODE" = "200" ] && jget "d.rfm?'':'x'" >/dev/null 2>&1 && ok "guest 360" || bad "guest 360 (HTTP $CODE)"

    echo "== Gate 9: timeline =="
    req GET "/v1/crm/guests/$GUEST_ID/timeline"
    [ "$CODE" = "200" ] && ok "timeline" || bad "timeline (HTTP $CODE)"

    echo "== Gate 10: tags/vip patch =="
    req PATCH "/v1/crm/guests/$GUEST_ID" '{"tags":["gate-test"],"vipStatus":"silver"}'
    [ "$CODE" = "200" ] && ok "crm patch" || bad "crm patch (HTTP $CODE)"

    echo "== Gate 11: note lifecycle =="
    req POST "/v1/crm/guests/$GUEST_ID/notes" '{"body":"gate test note","pinned":true}'
    if [ "$CODE" = "201" ] || [ "$CODE" = "200" ]; then
      ok "note create"
      NOTE_ID=$(jget "d.id||''" 2>/dev/null)
      [ -n "$NOTE_ID" ] && req PATCH "/v1/crm/notes/$NOTE_ID" '{"pinned":false}' && [ "$CODE" = "200" ] && ok "note patch" || bad "note patch (HTTP $CODE)"
      [ -n "$NOTE_ID" ] && req DELETE "/v1/crm/notes/$NOTE_ID" && [ "$CODE" = "200" ] && ok "note delete" || bad "note delete (HTTP $CODE)"
    else
      bad "note create (HTTP $CODE)"
    fi

    echo "== Gate 12: follow-up lifecycle =="
    req GET /v1/crm/assignees >/dev/null 2>&1
    ASSIGNEE=$(jget "(Array.isArray(d)&&d[0]&&d[0].id)||''" 2>/dev/null)
    if [ -n "$ASSIGNEE" ]; then
      req POST /v1/crm/follow-ups "{\"guestId\":\"$GUEST_ID\",\"assigneeId\":\"$ASSIGNEE\",\"title\":\"gate test follow-up\"}"
      if [ "$CODE" = "201" ] || [ "$CODE" = "200" ]; then
        ok "follow-up create"
        FU_ID=$(jget "d.id||''" 2>/dev/null)
        [ -n "$FU_ID" ] && req PATCH "/v1/crm/follow-ups/$FU_ID" '{"done":true}' && [ "$CODE" = "200" ] && ok "follow-up done" || bad "follow-up done (HTTP $CODE)"
      else
        bad "follow-up create (HTTP $CODE)"
      fi
    else
      bad "follow-up (no assignee found)"
    fi
  else
    echo "-- no guest with stays yet; gates 8-12 skipped"
  fi

  echo "== Gate 13: segment lifecycle =="
  req POST /v1/crm/segments '{"name":"Gate Test Segment","rule":{"minStays":0}}'
  if [ "$CODE" = "201" ] || [ "$CODE" = "200" ]; then
    ok "segment create"
    SEG_ID=$(jget "d.id||''" 2>/dev/null)
    if [ -n "$SEG_ID" ]; then
      req POST "/v1/crm/segments/$SEG_ID/evaluate"
      { [ "$CODE" = "200" ] && jget "typeof d.memberCount==='number'" >/dev/null 2>&1; } && ok "segment evaluate" || bad "segment evaluate (HTTP $CODE)"
      req GET "/v1/crm/segments/$SEG_ID/members"
      [ "$CODE" = "200" ] && ok "segment members" || bad "segment members (HTTP $CODE)"
      req DELETE "/v1/crm/segments/$SEG_ID"
      [ "$CODE" = "200" ] && ok "segment delete" || bad "segment delete (HTTP $CODE)"
    fi
  else
    bad "segment create (HTTP $CODE)"
  fi

  echo "== Gate 14: corporate account =="
  req POST /v1/crm/corporate-accounts '{"name":"Gate Test Corp","contactName":"Test","email":"t@example.com"}'
  if [ "$CODE" = "201" ] || [ "$CODE" = "200" ]; then
    ok "corporate create"
    ACCT_ID=$(jget "d.id||''" 2>/dev/null)
    [ -n "$ACCT_ID" ] && req GET "/v1/crm/corporate-accounts/$ACCT_ID" && [ "$CODE" = "200" ] && ok "corporate get" || bad "corporate get (HTTP $CODE)"
  else
    bad "corporate create (HTTP $CODE)"
  fi

  echo "== Gate 15: unauthorized without token =="
  TOKEN=""
  req GET /v1/crm/overview
  [ "$CODE" = "401" ] && ok "auth enforced" || bad "auth enforced (expected 401, got $CODE)"
else
  echo "-- skipping API gates (no token)"
fi

echo ""
echo "== RESULT: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ]
