#!/usr/bin/env bash
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
API="http://localhost:3001"
cd ~/Desktop/Vimad || exit 1
TOKEN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"tenantSlug":"demo-hotel","email":"admin@demo.com","password":"admin123"}' | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("token") or d.get("accessToken") or (d.get("data") or {}).get("token") or "")')
[ -n "$TOKEN" ] && ok "staff login" || { bad "staff login failed"; exit 1; }
RESLIST=$(curl -s "$API/v1/reservations?status=checked_in&pageSize=5" -H "Authorization: Bearer $TOKEN")
CONF=$(printf '%s' "$RESLIST" | python3 -c 'import sys,json
d=json.load(sys.stdin)
items=d if isinstance(d,list) else (d.get("data") or d.get("reservations") or d.get("items") or [])
print(items[0].get("confirmationNumber","") if items else "")')
[ -n "$CONF" ] && ok "in-house reservation found ($CONF)" || { bad "no in-house reservation: $(printf '%s' "$RESLIST" | head -c 300)"; exit 1; }
GPTOKEN=$(cd apps/api && npx tsx ../../scripts/mint-portal-token.ts "$CONF" 2>/dev/null)
[ -n "$GPTOKEN" ] && ok "portal token minted" || bad "token mint failed"
RESP=$(curl -s "$API/v1/guest-portal/my-stays/$GPTOKEN")
printf '%s' "$RESP" | python3 -c 'import sys,json
d=json.load(sys.stdin)
data=d.get("data") or {}
g=data.get("guest") or {}
checks=[
  ("guest name", bool(g.get("firstName") and g.get("lastName"))),
  ("stay history array", isinstance(data.get("stays"),list)),
  ("stats block", isinstance(data.get("stats"),dict) and "totalSpend" in data.get("stats",{})),
  ("loyalty block", isinstance(data.get("loyalty"),dict) and "points" in data.get("loyalty",{})),
  ("upcoming array", isinstance(data.get("upcoming"),list)),
]
fails=[n for n,okv in checks if not okv]
print("FAILS:"+",".join(fails) if fails else "ALL-OK")' > /tmp/my-stays-check.txt
CHECKS=$(cat /tmp/my-stays-check.txt)
[ "$CHECKS" = "ALL-OK" ] && ok "my-stays payload complete (guest/stays/stats/loyalty/upcoming)" || bad "payload gaps: $CHECKS"
TOTAL=$(printf '%s' "$RESP" | python3 -c 'import sys,json;d=(json.load(sys.stdin).get("data") or {});print(len(d.get("stays") or [])+len(d.get("upcoming") or []))')
[ "$TOTAL" -ge 1 ] && ok "guest sees own stays ($TOTAL rows incl. current)" || bad "guest sees zero stays"
BAD=$(curl -s -o /dev/null -w "%{http_code}" "$API/v1/guest-portal/my-stays/not-a-real-token")
[ "$BAD" = "401" ] && ok "invalid portal token rejected (401)" || bad "bad token returned $BAD"
[ -s apps/web/src/app/guest-portal/my-stays/page.jsx ] && ok "portal page on disk" || bad "portal page missing"
grep -q "pointsHistory\|guestProfile" apps/web/src/app/guest-portal/my-stays/page.jsx && bad "page uses fixtures" || ok "page is fixture-free"
echo "== 0.5 gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "0.5 SHIPPED" || echo "0.5 NOT SHIPPED"
