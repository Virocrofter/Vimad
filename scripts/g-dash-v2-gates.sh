#!/usr/bin/env bash
# g-dash-v2-gates.sh - Stage 3 Today v2 exit gate (plan v3.0 section 12.3)
# Non-zero exit on FAIL. Skips loudly without creds/stack.
set -u
cd "$(dirname "$0")/.." || exit 1
ROOT="$(pwd)"; API="$ROOT/apps/api"; WEB="$ROOT/apps/web"
PASS=0; FAIL=0; SKIP=0
gate() { local n="$1" r="$2" d="${3:-}"; case "$r" in
  PASS) PASS=$((PASS+1)); printf 'PASS  %-26s %s\n' "$n" "$d";;
  FAIL) FAIL=$((FAIL+1)); printf 'FAIL  %-26s %s\n' "$n" "$d";;
  SKIP) SKIP=$((SKIP+1)); printf 'SKIP  %-26s %s\n' "$n" "$d";; esac; }
note() { printf '%s\n' "$*"; }

note '--- static: files + flag gate ---'
[ -f "$API/src/modules/dashboard/today-v2.service.ts" ] && gate D1-backend PASS '' || gate D1-backend FAIL 'today-v2.service.ts missing'
[ -f "$WEB/src/app/app/dashboard/page.v2.jsx" ] && gate D2-frontend PASS '' || gate D2-frontend FAIL 'page.v2.jsx missing'
grep -q "dash.v2" "$WEB/src/app/app/dashboard/page.jsx" && gate D3-flagkey PASS 'dash.v2 gated in page.jsx' || gate D3-flagkey FAIL 'no dash.v2 gate'
grep -q "useLiveFlag" "$WEB/src/app/app/dashboard/page.jsx" && gate D4-liveflag PASS 'live flag, not build-time' || gate D4-liveflag FAIL 'not useLiveFlag'

note '--- static: builds ---'
( cd "$API" && npx tsc --noEmit >/dev/null 2>&1 ) && gate D5-api-tsc PASS '' || gate D5-api-tsc FAIL 'api tsc'
( cd "$WEB" && npx tsc --noEmit >/dev/null 2>&1 ) && gate D6-web-tsc PASS '' || gate D6-web-tsc FAIL 'web tsc'

note '--- runtime: contract ---'
BASE="${API_BASE_URL:-http://localhost:3001}"
curl -sf "$BASE/v1/public/status" >/dev/null 2>&1 || { gate R1-stack SKIP "API down at $BASE"; note ''; note "RESULTS: $PASS passed, $FAIL failed, $SKIP skipped"; exit $([ $FAIL -eq 0 ] && echo 0 || echo 1); }
gate R1-stack PASS "API at $BASE"
LOGIN=$(curl -sf -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d "${LOGIN_BODY:-}" 2>/dev/null || true)
TOKEN=$(printf '%s' "$LOGIN" | python3 -c 'import sys,json
d=json.load(sys.stdin); t=d.get("data") or d
print(t.get("token") or "")' 2>/dev/null || true)
[ -z "$TOKEN" ] && { gate R2-login SKIP 'export LOGIN_BODY={...} to enable runtime gates'
  note ''; note "RESULTS: $PASS passed, $FAIL failed, $SKIP skipped"; exit $([ $FAIL -eq 0 ] && echo 0 || echo 1); }
gate R2-login PASS 'token acquired'
PROP=$(curl -sf "$BASE/v1/properties" -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json
d=json.load(sys.stdin); a=d.get("data") or d
a=a[0] if isinstance(a,list) and a else (a.get("items") or [{}])[0]
print(a.get("id","") or "")' 2>/dev/null || true)
[ -z "$PROP" ] && { gate R3-property SKIP 'no property resolvable'
  note ''; note "RESULTS: $PASS passed, $FAIL failed, $SKIP skipped"; exit $([ $FAIL -eq 0 ] && echo 0 || echo 1); }

BODY=$(curl -sf "$BASE/v1/dashboard/today/v2?propertyId=$PROP" -H "Authorization: Bearer $TOKEN" 2>/dev/null || true)
[ -z "$BODY" ] && gate R4-contract FAIL 'today/v2 empty or non-200' || gate R4-contract PASS 'today/v2 200'
BD=$(printf '%s' "$BODY" | python3 -c 'import sys,json
d=json.load(sys.stdin); print((d.get("data") or d).get("context",{}).get("businessDate",""))' 2>/dev/null || true)
if [ -n "$BD" ]; then
  AGE=$(( ($(date +%s) - $(date -j -f "%Y-%m-%d" "$BD" +%s 2>/dev/null || echo 0)) / 86400 ))
  [ "$AGE" -le 2 ] && gate R5-bizdate PASS "businessDate=$BD" || gate R5-bizdate FAIL "businessDate=$BD stale (${AGE}d old) - advance demo business date"
else gate R5-bizdate FAIL 'no businessDate in context'; fi
SECS=$(printf '%s' "$BODY" | python3 -c 'import sys,json
d=json.load(sys.stdin); d=d.get("data") or d
print(",".join(sorted(d.get("sections",{}).keys())))' 2>/dev/null || true)
[ -n "$SECS" ] && gate R6-sections PASS "$SECS" || gate R6-sections FAIL 'no sections'
printf '%s' "$BODY" | python3 -c 'import sys,json
d=json.load(sys.stdin); d=d.get("data") or d
ok=all(v.get("status") in ("ready","error") for v in d.get("sections",{}).values())
sys.exit(0 if ok and d.get("sections") else 1)' 2>/dev/null && gate R7-statusmodel PASS 'per-section status model' || gate R7-statusmodel FAIL 'section status contract broken'
CA=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/v1/dashboard/today/v2?propertyId=$PROP")
{ [ "$CA" = "401" ] || [ "$CA" = "403" ]; } && gate R8-noauth PASS "unauth=$CA" || gate R8-noauth FAIL "unauth=$CA"
RTOK=$(curl -sf -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{"tenantSlug":"demo-hotel","email":"restricted-r6@test.com","password":"Vimad-r6test!"}' 2>/dev/null | python3 -c 'import sys,json
d=json.load(sys.stdin); t=d.get("data") or d
print(t.get("token") or "")' 2>/dev/null || true)
if [ -n "$RTOK" ]; then
  CB=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/v1/dashboard/today/v2?propertyId=cmvpvsti200ouma8elowk1k0v" -H "Authorization: Bearer $RTOK")
  [ "$CB" = "403" ] && gate R9-isolation PASS 'foreign property 403' || gate R9-isolation FAIL "foreign property HTTP $CB"
else gate R9-isolation SKIP 'restricted fixture login failed'; fi

note ''
note "RESULTS: $PASS passed, $FAIL failed, $SKIP skipped"
[ "$FAIL" -eq 0 ]
