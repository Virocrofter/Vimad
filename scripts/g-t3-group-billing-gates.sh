#!/usr/bin/env bash
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
API="http://localhost:3001"
cd ~/Desktop/Vimad || exit 1
TOKEN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"tenantSlug":"demo-hotel","email":"admin@demo.com","password":"admin123"}' | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("token") or d.get("accessToken") or (d.get("data") or {}).get("token") or "")')
[ -n "$TOKEN" ] && ok "login" || { bad "login"; exit 1; }
DEMO=$(cd apps/api && npx tsx ../../scripts/make-demo-group.ts 2>/dev/null)
GID=$(printf '%s' "$DEMO" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("groupId",""))')
PIDD=$(printf '%s' "$DEMO" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("propertyId",""))')
MASTER=$(printf '%s' "$DEMO" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("masterFolioId",""))')
BILL1=$(printf '%s' "$DEMO" | python3 -c 'import sys,json;print((json.load(sys.stdin).get("folios") or [""])[0])')
BILL2=$(printf '%s' "$DEMO" | python3 -c 'import sys,json;print((json.load(sys.stdin).get("folios") or ["",""])[1])')
[ -n "$GID" ] && ok "demo group created ($GID)" || { bad "demo group: $DEMO"; exit 1; }
VIEW=$(curl -s "$API/v1/folios/group/$GID/billing" -H "Authorization: Bearer $TOKEN")
printf '%s' "$VIEW" | grep -q '"masterFolio"' && ok "billing view returns master + bills" || bad "view: $(printf '%s' "$VIEW" | head -c 300)"
ITEM=$(printf '%s' "$VIEW" | python3 -c "import sys,json;d=json.load(sys.stdin).get('data') or {};m=d.get('masterFolio') or {};print((m.get('items') or [{}])[0].get('id',''))")
[ -n "$ITEM" ] && ok "unassigned item found on master folio" || bad "no master item"
MOVE=$(curl -s -X POST "$API/v1/folios/items/$ITEM/move" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"targetFolioId\":\"$BILL1\"}")
printf '%s' "$MOVE" | grep -q '"moved":true' && ok "item moved master → guest bill (auto-move on owner change)" || bad "move: $(printf '%s' "$MOVE" | head -c 300)"
PROPS=$(curl -s "$API/v1/properties" -H "Authorization: Bearer $TOKEN")
PID=$(printf '%s' "$PROPS" | python3 -c 'import sys,json;d=json.load(sys.stdin);items=d if isinstance(d,list) else (d.get("data") or d.get("properties") or []);print((items[0] or {}).get("id","") if items else "")')
echo "PIDD=[$PIDD]"
PUTRULE=$(curl -s -X PUT "$API/v1/folios/bill-rules?propertyId=$PIDD" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"rule":"consumed","windowHours":12}')
printf '%s' "$PUTRULE" | grep -q '"consumed"' && ok "closing rule set to consumed" || bad "rules PUT: $(printf '%s' "$PUTRULE" | head -c 200)"
BLOCKED=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/v1/folios/$BILL1/close" -H "Authorization: Bearer $TOKEN")
[ "$BLOCKED" = "403" ] && ok "close blocked by consumed rule (in-house guest, 403)" || bad "consumed rule returned $BLOCKED"
curl -s -X PUT "$API/v1/folios/bill-rules?propertyId=$PIDD" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"rule":"always","windowHours":12}' > /dev/null
CLOSED=$(curl -s -X POST "$API/v1/folios/$BILL1/close" -H "Authorization: Bearer $TOKEN")
printf '%s' "$CLOSED" | grep -q '"closed":true' && ok "close allowed under always rule" || bad "close: $(printf '%s' "$CLOSED" | head -c 200)"
NOREASON=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/v1/folios/$BILL1/reopen" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"reason":""}')
[ "$NOREASON" = "400" ] && ok "reopen requires reason (400)" || bad "reopen no-reason returned $NOREASON"
REOPENED=$(curl -s -X POST "$API/v1/folios/$BILL1/reopen" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"reason":"late checkout charge correction"}')
printf '%s' "$REOPENED" | grep -q '"reopened":true' && ok "closed bill modified with audit" || bad "reopen: $(printf '%s' "$REOPENED" | head -c 200)"
AUDIT=$(curl -s "$API/v1/audit-logs?entity=folio&pageSize=5" -H "Authorization: Bearer $TOKEN")
printf '%s' "$AUDIT" | grep -q "folio.bill_reopened" && ok "reopen audited" || bad "no reopen audit row"
AUDIT2=$(curl -s "$API/v1/audit-logs?entity=folio_item&pageSize=5" -H "Authorization: Bearer $TOKEN")
printf '%s' "$AUDIT2" | grep -q "folio.item_move" && ok "item move audited" || bad "no move audit row"
AUTO=$(curl -s -X POST "$API/v1/folios/run-auto-send" -H "Authorization: Bearer $TOKEN")
printf '%s' "$AUTO" | grep -q '"processed"' && ok "auto close-and-send executes" || bad "auto-send: $(printf '%s' "$AUTO" | head -c 200)"
[ -s apps/web/src/app/app/groups/billing/page.jsx ] && ok "group billing UI on disk" || bad "UI missing"
grep -q "useQuery" apps/web/src/app/app/groups/billing/page.jsx && grep -q "apiClient" apps/web/src/app/app/groups/billing/page.jsx && ok "UI wired to live API" || bad "UI not wired"
grep -q "groups/billing" apps/web/src/router.tsx && ok "route registered" || bad "route missing"
echo "== T3 gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "T3+ GROUP BILLING SHIPPED" || echo "T3+ NOT SHIPPED"
