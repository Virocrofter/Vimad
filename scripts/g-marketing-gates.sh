#!/usr/bin/env bash
# g-marketing-gates.sh — Marketing module end-to-end gates.
# Usage: cd ~/Desktop/Vimad && bash scripts/g-marketing-gates.sh
set -u

LOGIN_EMAIL="admin@demo.com"
LOGIN_PASSWORD="admin123"
TENANT_SLUG="demo-hotel"

API="http://localhost:3001"
PASS=0; FAIL=0
API_PID=""

ok()   { PASS=$((PASS+1)); printf 'PASS: %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf 'FAIL: %s\n' "$1"; }
check(){ if eval "$2" >/dev/null 2>&1; then ok "$1"; else bad "$1"; fi; }

echo "== g-marketing-gates =="

check "marketing service exists"        "[ -f apps/api/src/modules/marketing/marketing.service.ts ]"
check "marketing routes exist"          "[ -f apps/api/src/modules/marketing/marketing.routes.ts ]"
check "marketing controller exists"     "[ -f apps/api/src/modules/marketing/marketing.controller.ts ]"
check "marketing validation exists"     "[ -f apps/api/src/modules/marketing/marketing.validation.ts ]"
check "seed script exists"              "[ -f apps/api/scripts/seed-marketing.ts ]"
check "web api client exists"           "[ -f apps/web/src/api/marketing.ts ]"
check "analytics page exists"           "[ -f apps/web/src/app/app/marketing/analytics.tsx ]"
check "automation-list page exists"     "[ -f apps/web/src/app/app/marketing/automation-list.tsx ]"
check "templates page exists"           "[ -f apps/web/src/app/app/marketing/templates.tsx ]"

check "schema has MarketingCampaign"    "grep -q 'model MarketingCampaign' apps/api/prisma/schema.prisma"
check "schema has MarketingWorkflow"    "grep -q 'model MarketingWorkflow' apps/api/prisma/schema.prisma"
check "schema has MarketingTemplate"    "grep -q 'model MarketingTemplate' apps/api/prisma/schema.prisma"
check "schema has MarketingSegment"     "grep -q 'model MarketingSegment' apps/api/prisma/schema.prisma"
check "schema has MarketingEvent"       "grep -q 'model MarketingEvent' apps/api/prisma/schema.prisma"
check "index.ts mounts /v1/marketing"   "grep -q '/v1/marketing' apps/api/src/index.ts"

for f in apps/web/src/app/app/marketing/analytics.tsx apps/web/src/app/app/marketing/automation-list.tsx apps/web/src/app/app/marketing/templates.tsx; do
  check "$f: no SAMPLE_ fixtures"   "! grep -q 'SAMPLE_WORKFLOWS\|SAMPLE_TEMPLATES' $f"
  check "$f: uses real api client"  "grep -q 'api/marketing' $f"
done
check "router: no hardcoded workflows={[]} prop" "! grep -rn 'AutomationListPage workflows' apps/web/src"

( cd apps/api && npx prisma validate ) >/tmp/mk-validate.log 2>&1
check "prisma validate" "[ $? -eq 0 ]"
( cd apps/api && npx prisma db push --skip-generate ) >/tmp/mk-migrate.log 2>&1
check "prisma db push" "[ $? -eq 0 ]"
( cd apps/api && npx tsx scripts/seed-marketing.ts ) >/tmp/mk-seed.log 2>&1
check "marketing seed runs" "[ $? -eq 0 ]"
( cd apps/api && npx tsc --noEmit ) >/tmp/mk-tsc.log 2>&1
check "api typecheck (tsc --noEmit)" "[ $? -eq 0 ]"

if ! curl -s -m 2 "$API/health" >/dev/null 2>&1; then
  echo "api not up — starting dev server…"
  ( cd apps/api && npm run dev ) >/tmp/vimad-api-marketing.log 2>&1 &
  API_PID=$!
  for i in $(seq 1 40); do
    curl -s -m 2 "$API/health" >/dev/null 2>&1 && break
    sleep 1
  done
fi

TOKEN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$LOGIN_EMAIL\",\"password\":\"$LOGIN_PASSWORD\",\"tenantSlug\":\"$TENANT_SLUG\"}" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);console.log((j.data&&j.data.token)||j.token||j.accessToken||'')}catch{console.log('')}})")

if [ -z "$TOKEN" ]; then
  bad "login (check LOGIN_EMAIL/PASSWORD/TENANT_SLUG at top of script)"
else
  ok "login"
  AUTH="Authorization: Bearer $TOKEN"
  CT="Content-Type: application/json"

  check "GET analytics/overview returns kpis" \
    "curl -s -H \"$AUTH\" \"$API/v1/marketing/analytics/overview\" | grep -q '\"kpis\"'"
  check "GET segments returns list" \
    "curl -s -H \"$AUTH\" \"$API/v1/marketing/segments\" | grep -q '\"guestCount\"'"

  CID=$(curl -s -X POST -H "$AUTH" -H "$CT" "$API/v1/marketing/campaigns" \
    -d '{"name":"Gate smoke campaign","channel":"email","budget":100}' \
    | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).id||'')}catch{console.log('')}})")
  [ -n "$CID" ] && ok "POST campaign creates" || bad "POST campaign creates"

  check "PATCH campaign activates" \
    "curl -s -X PATCH -H \"$AUTH\" -H \"$CT\" \"$API/v1/marketing/campaigns/$CID\" -d '{\"status\":\"active\"}' | grep -q '\"status\":\"active\"'"
  check "GET campaign stats returns series" \
    "curl -s -H \"$AUTH\" \"$API/v1/marketing/campaigns/$CID/stats\" | grep -q '\"series\"'"
  check "DELETE campaign" \
    "curl -s -X DELETE -H \"$AUTH\" \"$API/v1/marketing/campaigns/$CID\" | grep -q '\"deleted\":true'"

  WID=$(curl -s -X POST -H "$AUTH" -H "$CT" "$API/v1/marketing/workflows" \
    -d '{"name":"Gate workflow","trigger":"manual","actions":[{"type":"delay","minutes":5}]}' \
    | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).id||'')}catch{console.log('')}})")
  [ -n "$WID" ] && ok "POST workflow creates" || bad "POST workflow creates"

  check "POST workflow toggle" \
    "curl -s -X POST -H \"$AUTH\" \"$API/v1/marketing/workflows/$WID/toggle\" | grep -q '\"active\"'"
  check "POST workflow run logged" \
    "curl -s -X POST -H \"$AUTH\" \"$API/v1/marketing/workflows/$WID/run\" | grep -q 'dispatched'"
  check "DELETE workflow" \
    "curl -s -X DELETE -H \"$AUTH\" \"$API/v1/marketing/workflows/$WID\" | grep -q '\"deleted\":true'"

  TID=$(curl -s -X POST -H "$AUTH" -H "$CT" "$API/v1/marketing/templates" \
    -d '{"name":"Gate template","category":"sms","body":"Hello {{guestName}}"}' \
    | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).id||'')}catch{console.log('')}})")
  [ -n "$TID" ] && ok "POST template creates" || bad "POST template creates"

  check "POST template apply creates draft campaign" \
    "curl -s -X POST -H \"$AUTH\" \"$API/v1/marketing/templates/$TID/apply\" | grep -q '\"status\":\"draft\"'"
  check "POST template duplicate" \
    "curl -s -X POST -H \"$AUTH\" \"$API/v1/marketing/templates/$TID/duplicate\" | grep -q '(copy)'"
  check "DELETE template" \
    "curl -s -X DELETE -H \"$AUTH\" \"$API/v1/marketing/templates/$TID\" | grep -q '\"deleted\":true'"

  SID=$(curl -s -X POST -H "$AUTH" -H "$CT" "$API/v1/marketing/segments" \
    -d '{"name":"Gate segment","criteria":{"hasEmail":true}}' \
    | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).id||'')}catch{console.log('')}})")
  [ -n "$SID" ] && ok "POST segment creates" || bad "POST segment creates"

  check "POST segment refresh" \
    "curl -s -X POST -H \"$AUTH\" \"$API/v1/marketing/segments/$SID/refresh\" | grep -q '\"guestCount\"'"
  check "DELETE segment" \
    "curl -s -X DELETE -H \"$AUTH\" \"$API/v1/marketing/segments/$SID\" | grep -q '\"deleted\":true'"

  check "validation: bad payload -> VALIDATION_ERROR" \
    "curl -s -X POST -H \"$AUTH\" -H \"$CT\" \"$API/v1/marketing/campaigns\" -d '{}' | grep -q 'VALIDATION_ERROR'"
fi

( cd apps/web && npx tsc --noEmit ) >/tmp/mk-web-tsc.log 2>&1
check "web typecheck (tsc --noEmit)" "[ $? -eq 0 ]"
( cd apps/web && npm run build ) >/tmp/mk-web-build.log 2>&1
check "web build (vite build)" "[ $? -eq 0 ]"

if [ -n "$API_PID" ]; then kill "$API_PID" 2>/dev/null; fi

echo "== g-marketing-gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ]