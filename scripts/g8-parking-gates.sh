#!/usr/bin/env bash
set -uo pipefail
cd ~/Desktop/Vimad

pass=0; fail=0
gate() {
  local name="$1"; shift
  if "$@" >/tmp/g8.log 2>&1; then echo "PASS: $name"; pass=$((pass+1));
  else echo "FAIL: $name"; tail -5 /tmp/g8.log; fail=$((fail+1)); fi
}

echo "── G8: Parking frontend wiring ──"
gate "web: no double-wrapped params"  bash -c '! grep -rn "apiGet(.*{ params" apps/web/src/api/ | grep -v meal-plans'
gate "web: no non-v1 parking paths"   bash -c '! grep -n "apiGet(\|apiPost(\|apiPatch(\|apiDelete(" apps/web/src/api/parking.js | grep -v "/v1/"'
gate "web: build"                     npm run build --workspace=apps/web

docker compose up -d db redis >/dev/null 2>&1
sleep 3

TOKEN=$(curl -s -X POST http://localhost:3001/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@demo.com","password":"admin123","tenantSlug":"demo-hotel"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('data',{}).get('token',''))")

if [ -z "$TOKEN" ]; then
  echo "FAIL: login (no token) — route gates skipped"; fail=$((fail+1))
else
  AUTH="Authorization: Bearer $TOKEN"
  gate "api: GET /v1/parking/bays"        curl -sf "http://localhost:3001/v1/parking/bays" -H "$AUTH"
  gate "api: GET /v1/parking/board"       curl -sf "http://localhost:3001/v1/parking/board" -H "$AUTH"
  gate "api: GET /v1/parking/vehicles"    curl -sf "http://localhost:3001/v1/parking/vehicles" -H "$AUTH"
fi

echo ""
echo "G8 RESULT: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
