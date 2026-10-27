#!/usr/bin/env bash
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
API="http://localhost:3001"
cd ~/Desktop/Vimad || exit 1
LOGIN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"tenantSlug":"demo-hotel","email":"admin@demo.com","password":"admin123"}')
TOKEN=$(printf '%s' "$LOGIN" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("token") or d.get("accessToken") or (d.get("data") or {}).get("token") or "")')
if [ -z "$TOKEN" ]; then bad "login failed: $(printf '%s' "$LOGIN" | head -c 300)"; echo "== 0.2 gates: $PASS passed, $FAIL failed =="; exit 1; fi
ok "login token acquired"
DEFS=$(curl -s "$API/v1/reports/definitions" -H "Authorization: Bearer $TOKEN")
KEYS=$(printf '%s' "$DEFS" | python3 -c 'import sys,json;d=json.load(sys.stdin);items=d if isinstance(d,list) else (d.get("definitions") or d.get("data") or []);print("\n".join(x.get("key") or x.get("definitionKey") or "" for x in items))')
N=$(printf '%s' "$KEYS" | grep -c .)
[ "$N" -ge 9 ] && ok "$N report definitions (>=9)" || bad "only $N definitions"
grep -Eq "format=|as=json" apps/web/src/api/reports.ts && ok "web client carries format in URL" || bad "web client not using URL format flag"
for K in $KEYS; do
  [ -z "$K" ] && continue
  RUN=$(curl -s -X POST "$API/v1/reports/run" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"definitionKey\":\"$K\"}")
  RID=$(printf '%s' "$RUN" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("id") or (d.get("run") or {}).get("id") or (d.get("data") or {}).get("id") or "")')
  if [ -z "$RID" ]; then bad "$K run failed: $(printf '%s' "$RUN" | head -c 200)"; continue; fi
  ok "$K run created ($RID)"
  for FMT in csv xlsx; do
    CODE=$(curl -s -o "/tmp/vimad-$K.$FMT" -D "/tmp/vimad-$K.hdr" -w "%{http_code}" "$API/v1/reports/runs/$RID/export?format=$FMT" -H "Authorization: Bearer $TOKEN")
    ATT=$(grep -ci "content-disposition: attachment" "/tmp/vimad-$K.hdr" 2>/dev/null || echo 0)
    if [ "$CODE" = "200" ] && [ "$ATT" -ge 1 ]; then ok "$K export $FMT 200 + attachment"; else bad "$K export $FMT code=$CODE attachment=$ATT"; fi
  done
done
echo "== 0.2 gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "0.2 SHIPPED" || echo "0.2 NOT SHIPPED"
