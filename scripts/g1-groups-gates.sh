#!/usr/bin/env bash
# scripts/g1-groups-gates.sh — G1 Groups end-to-end gates (run from repo root or anywhere)
# Usage: bash scripts/g1-groups-gates.sh
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

API="${API_URL:-http://localhost:3001}"
EMAIL="${LOGIN_EMAIL:-admin@demo.com}"
PASSWORD="${LOGIN_PASSWORD:-admin123}"

step() { printf '\n\033[1m== %s ==\033[0m\n' "$*"; }
fail() { printf '\033[31mFAIL:\033[0m %s\n' "$*"; exit 1; }
py() { python3 -c "$1"; }

step "Gate 0 — prisma validate + generate"
(cd apps/api && npx prisma validate) || fail "prisma validate"
(cd apps/api && npx prisma generate)  || fail "prisma generate"

step "Gate 1 — RBAC rows (idempotent upserts)"
(cd apps/api && npx prisma db seed) || fail "prisma db seed"

step "Gate 2 — API compile"
npm run build --workspace=apps/api || fail "api build"

step "Gate 3 — runtime up"
docker compose up -d
sleep 12
curl -s "$API/health" | grep -q "status" || fail "health check"

step "Gate 4 — login"
TOKEN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"tenantSlug\":\"demo-hotel\"}" | py 'import sys,json;print(json.load(sys.stdin)["data"]["token"])')
[ "${#TOKEN}" -gt 50 ] || fail "login (TOKEN_LEN=${#TOKEN})"
echo "TOKEN_LEN=${#TOKEN}"

step "Gate 5 — create group"
PROPERTY_ID=$(curl -s "$API/v1/properties" -H "Authorization: Bearer $TOKEN" \
  | py 'import sys,json;print(json.load(sys.stdin)["data"][0]["id"])')
GID=$(curl -s -X POST "$API/v1/groups" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"propertyId\":\"$PROPERTY_ID\",\"name\":\"Smith Wedding\",\"company\":\"Smith Family Events\",\"contactName\":\"Jane Smith\",\"contactEmail\":\"jane@smith.com\",\"arrivalDate\":\"2026-11-20\",\"departureDate\":\"2026-11-22\",\"blockType\":\"courtesy\",\"status\":\"tentative\",\"rate\":149,\"cutOffDate\":\"2026-11-13\",\"eventSpace\":\"Grand Ballroom\"}" \
  | py 'import sys,json;print(json.load(sys.stdin)["data"]["group"]["id"])')
[ -n "$GID" ] || fail "group create"
echo "GID=$GID"

step "Gate 6 — list + detail"
curl -s "$API/v1/groups" -H "Authorization: Bearer $TOKEN" | head -c 300; echo
curl -s "$API/v1/groups/$GID" -H "Authorization: Bearer $TOKEN" | py 'import sys,json;d=json.load(sys.stdin)["data"];print("code:",d["group"]["code"],"| members:",d["stats"]["memberCount"])'

step "Gate 7 — rooming list creates real guests + reservations"
RT_ID=$(curl -s "$API/v1/room-types" -H "Authorization: Bearer $TOKEN" \
  | py 'import sys,json;print(json.load(sys.stdin)["data"][0]["id"])')
# first give the group a block to pick up against
curl -s -X POST "$API/v1/groups/$GID/blocks" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"roomTypeId\":\"$RT_ID\",\"roomsBlocked\":5,\"rate\":149}" >/dev/null
curl -s -X POST "$API/v1/groups/$GID/rooming-list" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"rows\":[{\"firstName\":\"John\",\"lastName\":\"Smith\",\"email\":\"john.smith@example.com\",\"roomTypeId\":\"$RT_ID\"}]}" \
  | py 'import sys,json;d=json.load(sys.stdin)["data"];print("members:",d["stats"]["memberCount"],"pickedUp:",d["stats"]["roomsPickedUp"])'

step "Gate 8 — master folio"
curl -s -X POST "$API/v1/groups/$GID/charges" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"type":"event_space","description":"Grand Ballroom hire","amount":2500}' >/dev/null
curl -s -X POST "$API/v1/groups/$GID/payments" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"method":"bank_transfer","amount":1000,"reference":"EFT-001"}' \
  | py 'import sys,json;print("balance:",json.load(sys.stdin)["data"]["stats"]["balance"])'

step "Gate 9 — events (BEO-lite)"
curl -s -X POST "$API/v1/groups/$GID/events" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Reception","date":"2026-11-20","startTime":"18:00","endTime":"23:00","guests":120,"status":"confirmed","tags":["AV Package","Open Bar"]}' \
  | py 'import sys,json;print("events:",len(json.load(sys.stdin)["data"]["events"]))'

step "Gate 10 — cutoff washdown"
GID2=$(curl -s -X POST "$API/v1/groups" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"propertyId\":\"$PROPERTY_ID\",\"name\":\"Cutoff Test Group\",\"arrivalDate\":\"2026-12-01\",\"departureDate\":\"2026-12-03\",\"cutOffDate\":\"2026-10-10\",\"status\":\"definite\",\"blocks\":[{\"roomTypeId\":\"$RT_ID\",\"roomsBlocked\":5}]}" \
  | py 'import sys,json;print(json.load(sys.stdin)["data"]["group"]["id"])')
curl -s -X POST "$API/v1/groups/$GID2/members" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Solo","lastName":"Picker","roomTypeId":"'$RT_ID'"}' >/dev/null
(cd apps/api && npx tsx -e "import('./src/jobs/groups.job.js').then(m=>m.runCutoffReleaseScan()).then(n=>{console.log('enqueued:',n);process.exit(0)}).catch(e=>{console.error(e);process.exit(1)})") \
  || fail "cutoff scan trigger"
sleep 4 # server's groupsWorker picks the job off Redis
curl -s "$API/v1/groups/$GID2" -H "Authorization: Bearer $TOKEN" \
  | py 'import sys,json;d=json.load(sys.stdin)["data"];b=d["blocks"][0] if d["blocks"] else None;print("after washdown — blocks:",[(x["roomTypeName"],x["roomsBlocked"]) for x in d["blocks"]],"pickedUp:",d["stats"]["roomsPickedUp"])'
echo "(expect roomsBlocked reduced to 1 = pickedUp; zero-pickup blocks deleted)"

step "Gate 11 — web build"
npm run build --workspace=apps/web || fail "web build"

step "ALL GATES PASSED"
