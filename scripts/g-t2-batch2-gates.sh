#!/usr/bin/env bash
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
API="http://localhost:3001"
cd ~/Desktop/Vimad || exit 1
TOKEN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"tenantSlug":"demo-hotel","email":"admin@demo.com","password":"admin123"}' | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("token") or d.get("accessToken") or (d.get("data") or {}).get("token") or "")')
[ -n "$TOKEN" ] && ok "login" || { bad "login"; exit 1; }
RULES=$(curl -s "$API/v1/housekeeping/rules" -H "Authorization: Bearer $TOKEN")
N=$(printf '%s' "$RULES" | python3 -c 'import sys,json;d=json.load(sys.stdin);items=d.get("data") or [];print(len(items) if isinstance(items,list) else 0)')
[ "$N" -ge 2 ] && ok "$N HK rules listed" || bad "rules: $(printf '%s' "$RULES" | head -c 200)"
PATCH=$(curl -s -X PATCH "$API/v1/housekeeping/rules/hk-stagnant-vacant" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"conditions":{"vacantGteDays":9}}')
printf '%s' "$PATCH" | grep -q '"vacantGteDays":9' && ok "rule row editable (vacantGteDays 7→9)" || bad "patch: $(printf '%s' "$PATCH" | head -c 300)"
curl -s -X PATCH "$API/v1/housekeeping/rules/hk-stagnant-vacant" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"conditions":{"vacantGteDays":7}}' > /dev/null
ACT=$(curl -s "$API/v1/housekeeping/activity?weeks=2" -H "Authorization: Bearer $TOKEN")
printf '%s' "$ACT" | python3 -c 'import sys,json;d=(json.load(sys.stdin).get("data") or {});okv=all(k in d for k in ("days","checkins","checkouts","cleanings"));print("yes" if okv else "no")' > /tmp/act.txt
[ "$(cat /tmp/act.txt)" = "yes" ] && ok "activity heatmap payload (checkins/checkouts/cleanings)" || bad "activity: $(printf '%s' "$ACT" | head -c 300)"
for f in apps/web/src/app/app/housekeeping/rules/page.jsx apps/web/src/app/app/housekeeping/activity/page.jsx; do
  [ -s "$f" ] && ok "$f on disk" || bad "$f missing"
  grep -qE "fixture|mockData" "$f" && bad "$f has fixtures" || true
done
grep -q "housekeeping/rules" apps/web/src/router.tsx && grep -q "housekeeping/activity" apps/web/src/router.tsx && ok "routes registered" || bad "routes missing"
grep -q "HK Rules" apps/web/src/components/layout/Sidebar.tsx && ok "sidebar entries present" || bad "sidebar missing"
echo "== T2 batch2 gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "T2 BATCH2 SHIPPED" || echo "T2 BATCH2 NOT SHIPPED"
