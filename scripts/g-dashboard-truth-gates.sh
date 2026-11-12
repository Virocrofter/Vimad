#!/usr/bin/env bash
# g-dashboard-truth-gates.sh - Stage 1 truth/safety exit gate (plan v3.0 section 13.3)
# Non-zero exit on any FAIL. Runtime gates skip loudly when the stack is down.
# Runtime login: export LOGIN_BODY='{"email":"...","password":"..."}' (else runtime auth gates SKIP)
set -u
cd "$(dirname "$0")/.." || exit 1
ROOT="$(pwd)"
API="$ROOT/apps/api"
WEB="$ROOT/apps/web"
PASS=0; FAIL=0; SKIP=0

gate() {
  local name="$1" result="$2" detail="${3:-}"
  case "$result" in
    PASS) PASS=$((PASS+1)); printf 'PASS  %-28s %s\n' "$name" "$detail" ;;
    FAIL) FAIL=$((FAIL+1)); printf 'FAIL  %-28s %s\n' "$name" "$detail" ;;
    SKIP) SKIP=$((SKIP+1)); printf 'SKIP  %-28s %s\n' "$name" "$detail" ;;
  esac
}

note() { printf '%s\n' "$*"; }

note '--- static: routing ---'
grep -q "app.use('/v1', dashboardRouter);" "$API/src/index.ts" \
  && gate S1-broad-mount FAIL 'broad /v1 dashboard mount still present' \
  || gate S1-broad-mount PASS 'broad mount removed'
grep -q "app.use('/v1/dashboard', dashboardRouter);" "$API/src/index.ts" \
  && gate S1-specific-mount PASS 'specific mount present' \
  || gate S1-specific-mount FAIL 'specific mount missing'

note '--- static: RBAC (requirePermission on 6 routers) ---'
for f in dashboard/dashboard.today.routes.ts housekeeping/room-board.routes.ts exceptions/exceptions.routes.ts minibar/minibar.routes.ts invoices/invoices.routes.ts reports/reports.routes.ts; do
  grep -q 'requirePermission(' "$API/src/modules/$f" \
    && gate "S2-rbac:${f##*/}" PASS '' \
    || gate "S2-rbac:${f##*/}" FAIL 'no requirePermission'
done

note '--- static: actor/tenant source ---'
grep -q '(req as any).user ?? {}' "$API/src/modules/exceptions/exceptions.routes.ts" \
  && gate S3-actor FAIL 'actorOf still reads req.user' \
  || gate S3-actor PASS 'actorOf reads req.auth'

note '--- static: seed permissions ---'
MISSING=$(python3 - <<'PY'
import re
s = open('apps/api/prisma/seed.ts').read()
miss = []
for perm in ['dashboard:read','exception:read','exception:manage','minibar:log','invoice:read','invoice:issue']:
    res, act = perm.split(':')
    if not re.search(r"resource:\s*'%s'[^}]*?action:\s*'%s'" % (res, act), s):
        miss.append(perm)
print(' '.join(miss))
PY
)
[ -z "$MISSING" ] && gate S4-seed PASS 'all 6 present' || gate S4-seed FAIL "missing: $MISSING"

note '--- static: SLA + links ---'
grep -q 't.slaBreached || (t.dueAt' "$API/src/modules/dashboard/ops-today.service.ts" \
  && gate S5-sla PASS 'live SLA recompute' \
  || gate S5-sla FAIL 'stored boolean only'
grep -q "link: '/app/reservations/'" "$API/src/modules/dashboard/dashboard.today.routes.ts" \
  && gate S6-links PASS '/app deep links' \
  || gate S6-links FAIL 'links missing /app prefix'

note '--- static: migration chain (forward references) ---'
SCAN=$(python3 - <<'PY'
import re, os, glob
created=set(); v=0
for d in sorted(glob.glob('apps/api/prisma/migrations/*/')):
    sql=open(os.path.join(d,'migration.sql')).read().upper()
    body=re.sub(r'--[^\n]*','',sql)
    creates=set(re.findall(r'CREATE TABLE(?: IF NOT EXISTS)?\s+"?([A-Z0-9_]+)"?',body))
    alters=set(re.findall(r'ALTER TABLE\s+(?:IF EXISTS\s+)?"?([A-Z0-9_]+)"?',body))
    inserts=set(re.findall(r'INSERT INTO\s+"?([A-Z0-9_]+)"?',body))
    refs=set(re.findall(r'REFERENCES\s+"?([A-Z0-9_]+)"?\s*\(',body))
    missing=sorted(t for t in ((alters|inserts|refs)-creates) if t not in created)
    v+=len(missing); created|=creates
print(v)
PY
)
[ "$SCAN" = "0" ] && gate S7-chain PASS 'no forward references' || gate S7-chain FAIL "violations=$SCAN"

note '--- static: typecheck ---'
( cd "$API" && npx tsc --noEmit >/dev/null 2>&1 ) \
  && gate S8-api-tsc PASS '' || gate S8-api-tsc FAIL 'api tsc'
( cd "$WEB" && npx tsc --noEmit >/dev/null 2>&1 ) \
  && gate S9-web-tsc PASS '' || gate S9-web-tsc FAIL 'web tsc'

note '--- runtime: stack + auth ---'
BASE="${API_BASE_URL:-http://localhost:3001}"
if ! curl -sf "$BASE/v1/public/status" >/dev/null 2>&1; then
  gate R1-stack SKIP "API not reachable at $BASE - start it, then re-run"
else
  gate R1-stack PASS "API at $BASE"
  LOGIN=$(curl -sf -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d "${LOGIN_BODY:-}" 2>/dev/null || true)
  TOKEN=$(printf '%s' "$LOGIN" | python3 -c 'import sys,json
d=json.load(sys.stdin); t=d.get("data") or d
print(t.get("token") or t.get("accessToken") or "")' 2>/dev/null || true)
  if [ -z "$TOKEN" ]; then
    gate R2-login SKIP 'no credentials - export LOGIN_BODY={...} to enable runtime gates'
  else
    gate R2-login PASS 'token acquired'
    PROP=$(curl -sf "$BASE/v1/properties" -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json
d=json.load(sys.stdin); a=d.get("data") or d
a=a[0] if isinstance(a,list) and a else (a.get("items") or [{}])[0]
print(a.get("id","") or "")' 2>/dev/null || true)
    if [ -z "$PROP" ]; then
      gate R3-property SKIP 'no property resolvable'
    else
      CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/v1/dashboard/today?propertyId=$PROP" -H "Authorization: Bearer $TOKEN")
      [ "$CODE" = "200" ] && gate R3-today PASS "today 200 ($PROP)" || gate R3-today FAIL "today HTTP $CODE"
      CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/v1/exceptions?propertyId=$PROP" -H "Authorization: Bearer $TOKEN")
      [ "$CODE" = "200" ] && gate R4-exceptions PASS 'exceptions 200' || gate R4-exceptions FAIL "exceptions HTTP $CODE"
      CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/v1/dashboard/today?propertyId=$PROP")
      if [ "$CODE" = "401" ] || [ "$CODE" = "403" ]; then gate R5-noauth PASS "unauth=$CODE"; else gate R5-noauth FAIL "unauth=$CODE"; fi
      RLOGIN=$(curl -sf -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{"tenantSlug":"demo-hotel","email":"restricted-r6@test.com","password":"Vimad-r6test!"}' 2>/dev/null || true)
      RTOK=$(printf '%s' "$RLOGIN" | python3 -c 'import sys,json
d=json.load(sys.stdin); t=d.get("data") or d
print(t.get("token") or "")' 2>/dev/null || true)
      if [ -z "$RTOK" ]; then
        gate R6-spoof SKIP 'restricted fixture login failed'
      else
        CA=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/v1/dashboard/today?propertyId=cmvpvm9hw0006afx4p3w74xr9" -H "Authorization: Bearer $RTOK")
        CB=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/v1/dashboard/today?propertyId=cmvpvsti200ouma8elowk1k0v" -H "Authorization: Bearer $RTOK")
        CE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/v1/exceptions?propertyId=cmvpvsti200ouma8elowk1k0v" -H "Authorization: Bearer $RTOK")
        if [ "$CA" = "200" ] && [ "$CB" = "403" ] && [ "$CE" = "403" ]; then gate R6-spoof PASS "restricted: A=200 B=403 E=403"; else gate R6-spoof FAIL "A=$CA B=$CB E=$CE"; fi
      fi
    fi
  fi
fi

note ''
note "RESULTS: $PASS passed, $FAIL failed, $SKIP skipped"
[ "$FAIL" -eq 0 ]
