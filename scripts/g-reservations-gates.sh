#!/usr/bin/env bash
cd "$(dirname "$0")/.." || exit 1
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
BASE="http://localhost:3001/v1"
AUTH="http://localhost:3001/auth"
J(){ node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);const r=$1;console.log(r==null?'':r)}catch{console.log('')}})"; }

echo "== G1 prisma validate =="
if npx prisma validate --schema apps/api/prisma/schema.prisma >/dev/null 2>&1; then ok "prisma schema valid"; else bad "prisma validate"; fi

echo "== G2 api typecheck =="
if (cd apps/api && npx tsc --noEmit) >/dev/null 2>&1; then ok "api typecheck"; else bad "api typecheck"; fi

echo "== G3 web build =="
if (cd apps/web && npm run build) >/dev/null 2>&1; then ok "web build"; else bad "web build"; fi

if ! curl -s -m 2 "$BASE/health/live" >/dev/null 2>&1; then
  echo "api not up - start it and re-run"
  bad "api reachable"
  echo "== $PASS passed, $FAIL failed =="
  exit 1
fi
ok "api reachable"

echo "== G4 auth =="
TOKEN=$(curl -s -X POST "$AUTH/login" -H 'content-type: application/json' -d '{"email":"admin@demo.com","password":"admin123","tenantSlug":"demo-hotel"}' | J "j.token||j.accessToken||(j.data&&(j.data.token||j.data.accessToken))||''")
if [ -n "$TOKEN" ]; then ok "login"; else
  bad "login"
  curl -s -X POST "$AUTH/login" -H 'content-type: application/json' -d '{"email":"admin@demo.com","password":"admin123","tenantSlug":"demo-hotel"}'
  echo
  echo "== $PASS passed, $FAIL failed =="
  exit 1
fi

echo "== G5 list + filters =="
[ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reservations" -H "Authorization: Bearer $TOKEN")" = "200" ] && ok "list 200" || bad "list"
[ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reservations?status=confirmed" -H "Authorization: Bearer $TOKEN")" = "200" ] && ok "status filter" || bad "status filter"
[ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reservations?search=DEMO" -H "Authorization: Bearer $TOKEN")" = "200" ] && ok "search filter" || bad "search filter"
[ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reservations?from=2026-01-01&to=2027-01-01" -H "Authorization: Bearer $TOKEN")" = "200" ] && ok "overlap filter" || bad "overlap filter"

echo "== G6 lifecycle =="
PID=$(curl -s "$BASE/properties" -H "Authorization: Bearer $TOKEN" | J "(j.data&&j.data[0]&&j.data[0].id)||(j[0]&&j[0].id)||''")
GID=$(curl -s "$BASE/guests" -H "Authorization: Bearer $TOKEN" | J "(j.data&&j.data[0]&&j.data[0].id)||(j[0]&&j[0].id)||''")
ARR=$(date -v+30d -u +%Y-%m-%d)
DEP=$(date -v+32d -u +%Y-%m-%d)
if [ -z "$PID" ] || [ -z "$GID" ]; then
  bad "seed data lookup"
  echo "PID=$PID GID=$GID"
  echo "== $PASS passed, $FAIL failed =="
  exit 1
fi
ok "seed data"
RID=$(curl -s -X POST "$BASE/reservations" -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' -d "{\"propertyId\":\"$PID\",\"guestId\":\"$GID\",\"arrivalDate\":\"$ARR\",\"departureDate\":\"$DEP\",\"nights\":2,\"source\":\"walkin\"}" | J "(j.data&&j.data.id)||j.id||''")
[ -n "$RID" ] && ok "create 201" || bad "create"
RID2=$(curl -s -X POST "$BASE/reservations" -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' -d "{\"propertyId\":\"$PID\",\"guestId\":\"$GID\",\"arrivalDate\":\"$ARR\",\"departureDate\":\"$DEP\",\"nights\":2}" | J "(j.data&&j.data.id)||j.id||''")

echo "== G7 guards =="
[ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reservations")" = "401" ] && ok "401 unauthenticated" || bad "401 guard"
[ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reservations/nonexistent-id" -H "Authorization: Bearer $TOKEN")" = "404" ] && ok "404 unknown id" || bad "404 guard"

echo "== G8 admin can cancel (bug B1) =="
if [ -n "$RID2" ] && [ "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/reservations/$RID2/cancel" -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"reason":"gate test"}')" = "200" ]; then ok "admin can cancel"; else bad "admin cancel B1"; fi

echo "== G9 no dollar-sign currency literals =="
if grep -rn '`$${' apps/web/src/app/app/reservations/ 2>/dev/null; then bad "dollar currency literal"; else ok "no dollar currency literal"; fi
if grep -rnE "(^|[^a-zA-Z])R?\\\$[0-9]" apps/web/src/app/app/reservations/ 2>/dev/null; then bad "dollar amount literal"; else ok "no dollar amount literal"; fi

echo "== G10 pages use central formatCurrency =="
for f in apps/web/src/app/app/reservations/page.tsx apps/web/src/app/app/reservations/new/page.jsx apps/web/src/app/app/reservations/front-desk/page.tsx apps/web/src/app/app/reservations/detail/page.jsx; do
  if grep -q 'formatCurrency' "$f"; then ok "$(basename $f) uses formatCurrency"; else bad "$(basename $f) missing formatCurrency"; fi
done

echo "== $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "SHIPPED" || exit 1
