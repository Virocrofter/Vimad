#!/usr/bin/env bash
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
API="http://localhost:3001"
cd ~/Desktop/Vimad || exit 1
TOKEN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"tenantSlug":"demo-hotel","email":"admin@demo.com","password":"admin123"}' | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("token") or (d.get("data") or {}).get("token") or "")')
[ -n "$TOKEN" ] && ok "staff login" || { bad "login"; exit 1; }
TOKOUT=$(cd apps/api && npx tsx ../../scripts/portal-token.ts 2>/dev/null | tail -1)
GCONF=$(printf '%s' "$TOKOUT" | cut -d' ' -f1)
GTOKEN=$(printf '%s' "$TOKOUT" | cut -d' ' -f2-)
[ -n "$GTOKEN" ] && ok "guest portal token minted ($GCONF)" || { bad "token mint"; exit 1; }
AUTH="Authorization: Bearer $GTOKEN"
B64='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
ST=$(curl -s -X POST "$API/v1/guest-portal/checkin/start" -H "$AUTH" -H 'Content-Type: application/json' -d "{\"confirmationNumber\":\"$GCONF\"}")
SID=$(printf '%s' "$ST" | python3 -c 'import sys,json;print((json.load(sys.stdin).get("data") or {}).get("id",""))')
[ -n "$SID" ] && ok "S1: check-in session started (arrival today, confirmed)" || { bad "start: $(printf '%s' "$ST" | head -c 250)"; exit 1; }
UP1=$(curl -s -X POST "$API/v1/guest-portal/checkin/sessions/$SID/upload" -H "$AUTH" -H 'Content-Type: application/json' -d "{\"kind\":\"id\",\"dataBase64\":\"$B64\"}")
UP1K=$(printf '%s' "$UP1" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or {};print(d.get("key",""))')
UP2=$(curl -s -X POST "$API/v1/guest-portal/checkin/sessions/$SID/upload" -H "$AUTH" -H 'Content-Type: application/json' -d "{\"kind\":\"selfie\",\"dataBase64\":\"$B64\"}")
UP2K=$(printf '%s' "$UP2" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or {};print(d.get("key",""))')
{ [ -n "$UP1K" ] && [ -n "$UP2K" ]; } && ok "S1: ID + selfie uploaded to storage ($UP1K)" || bad "uploads: $UP1 / $UP2"
DOCS=$(curl -s -X POST "$API/v1/guest-portal/checkin/sessions/$SID/documents" -H "$AUTH" -H 'Content-Type: application/json' -d '{"idDocType":"passport","idDocNumber":"P1234567"}')
printf '%s' "$DOCS" | grep -q '"status":"documents_uploaded"' && ok "S1: documents verified" || bad "docs: $(printf '%s' "$DOCS" | head -c 200)"
SIG=$(curl -s -X POST "$API/v1/guest-portal/checkin/sessions/$SID/signature" -H "$AUTH" -H 'Content-Type: application/json' -d "{\"dataBase64\":\"$B64\"}")
printf '%s' "$SIG" | grep -q '"status":"signed"' && ok "S2: signature captured" || bad "sig: $(printf '%s' "$SIG" | head -c 200)"
CARD=$(curl -s "$API/v1/guest-portal/checkin/sessions/$SID/registration-card" -H "$AUTH")
CARDURL=$(printf '%s' "$CARD" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or {};print(d.get("url",""))')
printf '%s' "$CARDURL" | grep -q 'registration-card.pdf' && ok "S2: registration card PDF generated + signed URL" || bad "card: $CARDURL"
DEP=$(curl -s -X POST "$API/v1/guest-portal/checkin/sessions/$SID/deposit" -H "$AUTH" -H 'Content-Type: application/json' -d '{"amount":500}')
DEPREF=$(printf '%s' "$DEP" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or {};print(d.get("reference",""))')
printf '%s' "$DEP" | grep -q 'paystack.com/pay/' && ok "S3: deposit hosted link created ($DEPREF)" || bad "deposit: $(printf '%s' "$DEP" | head -c 200)"
CON=$(curl -s -X POST "$API/v1/guest-portal/checkin/deposit/confirm" -H "$AUTH" -H 'Content-Type: application/json' -d "{\"reference\":\"$DEPREF\"}")
printf '%s' "$CON" | grep -q '"confirmed":true' && ok "S3: deposit confirm settles session (webhook-shaped)" || bad "confirm: $(printf '%s' "$CON" | head -c 200)"
CON2=$(curl -s -X POST "$API/v1/guest-portal/checkin/deposit/confirm" -H "$AUTH" -H 'Content-Type: application/json' -d "{\"reference\":\"$DEPREF\"}")
printf '%s' "$CON2" | grep -q '"already":true' && ok "S3: confirm idempotent" || bad "confirm2: $(printf '%s' "$CON2" | head -c 200)"
CMP=$(curl -s -X POST "$API/v1/guest-portal/checkin/sessions/$SID/complete" -H "$AUTH")
printf '%s' "$CMP" | grep -q '"status":"completed"' && ok "S5: session completed (docs+sig+deposit settled)" || bad "complete: $(printf '%s' "$CMP" | head -c 200)"
TL=$(curl -s "$API/v1/guest-portal/checkin/timeline" -H "$AUTH")
TLN=$(printf '%s' "$TL" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or [];print(len(d) if isinstance(d,list) else 0)')
[ "$TLN" -ge 1 ] && ok "S4: guest timeline events ($TLN) — stays/loyalty/tickets merged" || bad "timeline: $(printf '%s' "$TL" | head -c 200)"
RL=$(curl -s "$API/v1/checkin-review/sessions?status=completed" -H "Authorization: Bearer $TOKEN")
RLHIT=$(printf '%s' "$RL" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or [];print("yes" if any(x.get("id")=="'$SID'" for x in d) else "no")')
[ "$RLHIT" = "yes" ] && ok "S5: session in staff review queue" || bad "review list: $(printf '%s' "$RL" | head -c 200)"
KEY0=$(curl -s "$API/v1/guest-portal/checkin/sessions/$SID/key-status" -H "$AUTH")
printf '%s' "$KEY0" | grep -q '"eligible":false' && ok "S5: key not eligible before approval" || bad "key0: $(printf '%s' "$KEY0" | head -c 200)"
AP=$(curl -s -X POST "$API/v1/checkin-review/sessions/$SID/approve" -H "Authorization: Bearer $TOKEN")
printf '%s' "$AP" | grep -q '"status":"approved"' && ok "S5: staff approval recorded (audited)" || bad "approve: $(printf '%s' "$AP" | head -c 200)"
KEY1=$(curl -s "$API/v1/guest-portal/checkin/sessions/$SID/key-status" -H "$AUTH")
KEYOK=$(printf '%s' "$KEY1" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("data") or {};print("yes" if d.get("eligible") and str(d.get("key","")).startswith("PORTAL-") else "no")')
[ "$KEYOK" = "yes" ] && ok "S5: digital key eligible after approval" || bad "key1: $(printf '%s' "$KEY1" | head -c 200)"
echo "== C4'b gates: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "C4'B CHECK-IN DEPTH SHIPPED" || echo "C4'B NOT SHIPPED"
