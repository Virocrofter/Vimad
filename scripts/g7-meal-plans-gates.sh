#!/usr/bin/env bash
set -uo pipefail
cd ~/Desktop/Vimad

pass=0; fail=0
gate() {
  local name="$1"; shift
  if "$@" >/tmp/g7.log 2>&1; then echo "PASS: $name"; pass=$((pass+1));
  else echo "FAIL: $name"; tail -5 /tmp/g7.log; fail=$((fail+1)); fi
}

echo "── G7: Meal plans ──"
gate "api: prisma validate"        npx --prefix apps/api prisma validate --schema apps/api/prisma/schema.prisma
gate "api: prisma migrate dev"     bash -c 'cd apps/api && npx prisma migrate dev --name add_meal_plans'
gate "api: prisma db seed"         bash -c 'cd apps/api && npx prisma db seed'
gate "api: typecheck"              bash -c 'cd apps/api && npx tsc --noEmit'
gate "api: build"                  npm run build --workspace=apps/api
gate "web: build"                  npm run build --workspace=apps/web

docker compose up -d db redis >/dev/null 2>&1
sleep 3

TOKEN=$(curl -s -X POST http://localhost:3001/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@demo.com","password":"admin123","tenantSlug":"demo-hotel"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('data',{}).get('token',''))")

if [ -z "$TOKEN" ]; then
  echo "FAIL: login (no token) — API routes not tested"; fail=$((fail+1))
else
  AUTH="Authorization: Bearer $TOKEN"
  gate "api: GET /v1/meal-plans"              curl -sf http://localhost:3001/v1/meal-plans -H "$AUTH"
  gate "api: GET /v1/meal-plans/summary"      curl -sf http://localhost:3001/v1/meal-plans/summary -H "$AUTH"
  gate "api: GET /v1/meal-plans/restaurants"  curl -sf http://localhost:3001/v1/meal-plans/restaurants -H "$AUTH"
  gate "api: GET /v1/meal-plans/postings"     curl -sf http://localhost:3001/v1/meal-plans/postings -H "$AUTH"
  gate "api: POST /v1/meal-plans/post-now"    curl -sf -X POST http://localhost:3001/v1/meal-plans/post-now -H "$AUTH"
fi

echo ""
echo "G7 RESULT: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
