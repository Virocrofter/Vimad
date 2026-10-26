#!/usr/bin/env bash
set -u
cd ~/Desktop/Vimad || exit 1
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }
API="http://localhost:3001"
echo "== C3 shared guest profile gates =="

for f in apps/api/prisma/migrations/20261027010000_guest_identity/migration.sql apps/api/src/modules/guest-identity/guest-identity.routes.ts apps/api/src/modules/guest-identity/guest-identity.service.ts apps/web/src/api/guestIdentity.ts apps/web/src/app/app/guest-identity/page.jsx; do
  [ -f "$f" ] && ok "file exists: $f" || bad "file exists: $f"
done

grep -q "GuestIdentityGroup" apps/api/prisma/schema.prisma && ok "schema models present" || bad "schema models present"
grep -q "guest-identity" apps/api/src/index.ts && ok "api router mounted in index.ts" || bad "api router mounted in index.ts"
grep -q "guest-identity" apps/web/src/router.tsx && ok "web route registered in router.tsx" || bad "web route registered in router.tsx"
grep -q "Shared Guests" apps/web/src/components/layout/Sidebar.tsx && ok "sidebar entry present" || bad "sidebar entry present"

if (cd apps/api && npx prisma validate) >/tmp/c3-validate.log 2>&1; then
  ok "prisma validate"
else
  bad "prisma validate (see /tmp/c3-validate.log)"
fi

if (cd apps/api && npx prisma migrate deploy) >/tmp/c3-migrate.log 2>&1; then
  ok "prisma migrate deploy (guest_identity tables)"
else
  bad "prisma migrate deploy (see /tmp/c3-migrate.log)"
fi

if (cd apps/api && npx prisma generate) >/tmp/c3-generate.log 2>&1; then
  ok "prisma generate"
else
  bad "prisma generate (see /tmp/c3-generate.log)"
fi

if (cd apps/api && npx tsc --noEmit) >/tmp/c3-tsc.log 2>&1; then
  ok "api typecheck (tsc --noEmit)"
else
  bad "api typecheck (see /tmp/c3-tsc.log)"
fi

if npm run build --workspace=apps/web >/tmp/c3-webbuild.log 2>&1; then
  ok "web build (vite build)"
else
  bad "web build (see /tmp/c3-webbuild.log)"
fi

if ! curl -sf -m 2 "$API/health/live" >/dev/null 2>&1; then
  echo "api not up — starting dev server (log: /tmp/c3-dev.log)..."
  (npm run dev >/tmp/c3-dev.log 2>&1 &)
  for i in $(seq 1 60); do
    curl -sf -m 2 "$API/health/live" >/dev/null 2>&1 && break
    sleep 2
  done
fi
curl -sf -m 2 "$API/health/live" >/dev/null 2>&1 && ok "api health" || bad "api health"

do_login(){
  curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
    -d '{"email":"admin@demo.com","password":"admin123","tenantSlug":"demo-hotel"}'
}
LOGIN=$(do_login)
TOKEN=$(printf '%s' "$LOGIN" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.data&&j.data.token)||"")}catch(e){}})')
if [ -z "$TOKEN" ]; then
  echo "login failed once — re-seeding and retrying..."
  (cd apps/api && npx prisma db seed) >/tmp/c3-seed.log 2>&1
  LOGIN=$(do_login)
  TOKEN=$(printf '%s' "$LOGIN" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.data&&j.data.token)||"")}catch(e){}})')
fi
[ -n "$TOKEN" ] && ok "login (admin@demo.com)" || bad "login (admin@demo.com)"

CODE=$(curl -s -o /dev/null -w '%{http_code}' "$API/v1/guest-identity/groups")
[ "$CODE" = "401" ] && ok "unauthenticated request rejected (401)" || bad "unauthenticated request rejected (401) ($CODE)"

G1=""; G2=""; G3=""
if [ -n "$TOKEN" ]; then
  GUESTS=$(curl -s "$API/v1/guests?pageSize=3" -H "Authorization: Bearer $TOKEN")
  IDS=$(printf '%s' "$GUESTS" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const arr=Array.isArray(j.data)?j.data:((j.data&&j.data.data)||[]);process.stdout.write(arr.slice(0,3).map(g=>g.id).join(" "))}catch(e){}})')
  G1=$(echo "$IDS" | cut -d' ' -f1)
  G2=$(echo "$IDS" | cut -d' ' -f2)
  G3=$(echo "$IDS" | cut -d' ' -f3)
fi
[ -n "$G1" ] && [ -n "$G2" ] && ok "guest pool resolved for merge test" || bad "guest pool resolved"

if [ -n "$G1" ] && [ -n "$G2" ]; then
  DED=$(curl -s -w '\n%{http_code}' "$API/v1/guest-identity/dedupe" -H "Authorization: Bearer $TOKEN")
  CODE=${DED##*$'\n'}
  [ "$CODE" = "200" ] && ok "dedupe HTTP 200" || bad "dedupe HTTP 200 ($CODE)"
  if printf '%s' "${DED%$'\n'*}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const d=j.data;if(!d||!Array.isArray(d.clusters)||typeof d.guestCount!=="number")process.exit(1);for(const c of d.clusters){if(!c.matchKey||!c.matchValue||!Array.isArray(c.guests)||c.guests.length<2)process.exit(1)}process.exit(0)}catch(e){process.exit(1)}})'; then
    ok "dedupe shape (clusters with match key + 2+ guests)"
  else
    bad "dedupe shape"
  fi

  CRE=$(curl -s -w '\n%{http_code}' -X POST "$API/v1/guest-identity/groups" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"guestIds\":[\"$G1\",\"$G2\"]}")
  CODE=${CRE##*$'\n'}
  { [ "$CODE" = "200" ] || [ "$CODE" = "201" ]; } && ok "create group HTTP $CODE" || bad "create group HTTP ($CODE)"
  GROUP_ID=$(printf '%s' "${CRE%$'\n'*}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.data&&j.data.id)||"")}catch(e){}})')
  [ -n "$GROUP_ID" ] && ok "group created ($GROUP_ID)" || bad "group created"

  if [ -n "$GROUP_ID" ]; then
    printf '%s' "${CRE%$'\n'*}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const d=j.data;if(!d||d.members.length!==2||!d.profile||typeof d.profile.stayCount!=="number"||typeof d.profile.loyaltyPoints!=="number"||!Array.isArray(d.stays)||!Array.isArray(d.notes))process.exit(1);process.exit(0)}catch(e){process.exit(1)}})' \
      && ok "merged 360: 2 members, profile, stays, notes" || bad "merged 360 payload"

    if [ -n "$G3" ]; then
      ADD=$(curl -s -X POST "$API/v1/guest-identity/groups/$GROUP_ID/members" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"guestId\":\"$G3\"}")
      printf '%s' "$ADD" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.exit(j.data&&j.data.members&&j.data.members.length===3?0:1)}catch(e){process.exit(1)}})' \
        && ok "add 3rd member -> 3 members" || bad "add 3rd member"
      CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/v1/guest-identity/groups/$GROUP_ID/members" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"guestId\":\"$G3\"}")
      [ "$CODE" = "409" ] && ok "duplicate member rejected (409)" || bad "duplicate member rejected (409) ($CODE)"
      REM=$(curl -s -X DELETE "$API/v1/guest-identity/groups/$GROUP_ID/members/$G3" -H "Authorization: Bearer $TOKEN")
      printf '%s' "$REM" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.exit(j.data&&j.data.removed===true?0:1)}catch(e){process.exit(1)}})' \
        && ok "remove member" || bad "remove member"
    fi

    CODE=$(curl -s -o /dev/null -w '%{http_code}' "$API/v1/guest-identity/groups/$GROUP_ID" -H "Authorization: Bearer $TOKEN")
    [ "$CODE" = "200" ] && ok "get group 360 HTTP 200" || bad "get group 360 HTTP 200 ($CODE)"
  fi

  CODE=$(curl -s -o /dev/null -w '%{http_code}' "$API/v1/guest-identity/groups/does-not-exist" -H "Authorization: Bearer $TOKEN")
  [ "$CODE" = "404" ] && ok "unknown group returns 404" || bad "unknown group returns 404 ($CODE)"
else
  bad "smoke gates skipped (no guest pool)"
fi

echo "== $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "C3 SHIPPED" || echo "C3 NOT SHIPPED"
exit "$FAIL"
