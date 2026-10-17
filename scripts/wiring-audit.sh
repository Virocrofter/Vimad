#!/usr/bin/env bash
# Vimad wiring audit — finds built-but-unwired surfaces.
cd "$(dirname "$0")/.." || exit 1
API=apps/api/src
WEB=apps/web/src

echo "═══ 1. ROUTE FILES vs MOUNTED IN index.ts ═══"
for f in $API/modules/*/*.routes.ts; do
  name=$(basename "$f" .routes.ts)
  # snake/kebab variants
  grep -q "import.*${name}.*from.*$(echo $f | sed "s|$API/||")" $API/index.ts \
    && grep -q "app.use(.*${name}" $API/index.ts \
    && echo "MOUNTED   $name" \
    || echo "UNMOUNTED $name  ($f)"
done

echo
echo "═══ 2. FRONTEND PAGES ON MOCK DATA (import ./data or data.js) ═══"
grep -rln "from '\./data'\|from '\.\./data'\|from '\.\./\.\./data'\|guestProfile\|Simulate API" $WEB/app --include="*.jsx" --include="*.tsx" | sort

echo
echo "═══ 3. GUEST PORTAL PAGES: real API vs mock ═══"
for d in $WEB/app/guest-portal/*/page.jsx $WEB/app/guest-portal/*/*/page.jsx; do
  [ -f "$d" ] || continue
  if grep -q "guestPortalApi\|useGuestPortalData\|useStayDetails" "$d"; then
    echo "REAL      ${d#$WEB/}"
  else
    echo "MOCK      ${d#$WEB/}"
  fi
done

echo
echo "═══ 4. WEB API CLIENTS: functions defined vs pages importing them ═══"
for f in $WEB/api/*.ts; do
  base=$(basename "$f" .ts)
  importers=$(grep -rl "from '.*api/$base'\|from \".*/api/$base\"" $WEB/app $WEB/hooks --include="*.jsx" --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
  echo "$importers importers: api/$base.ts"
done | sort -n

echo
echo "═══ 5. BACKEND SERVICES EXPORTED BUT NEVER CALLED (routes/jobs) ═══"
for svc in $API/modules/*/*.service.ts; do
  mod=$(basename "$(dirname "$svc")")
  # exported function names
  grep -oE "^export (async )?function [a-zA-Z0-9_]+" "$svc" | awk '{print $NF}' | while read -r fn; do
    callers=$(grep -rl "\b$fn\b" $API --include="*.ts" | grep -v "$svc" | wc -l | tr -d ' ')
    [ "$callers" -eq 0 ] && echo "ORPHAN  $mod/$fn"
  done
done

echo
echo "═══ 6. QUEUES / SCHEDULERS ═══"
echo "QUEUE_NAMES in queue.ts:"; grep -A12 "QUEUE_NAMES = \[" $API/common/queue.ts | grep "'" | tr -d " ,'//"
echo
echo "cron schedules found in jobs:"; grep -rn "cron.default.schedule" $API/jobs | sed 's|.*schedule(||;s|).*||'

echo
echo "═══ 7. HOOK URLS THAT MAY NOT EXIST (sampled from api clients) ═══"
grep -rhoE "'/[a-z][a-z0-9-]*(/[a-z0-9-/:]+)*'" $WEB/api/*.ts 2>/dev/null | sort -u | head -60

echo
echo "═══ 8. VITE PROXY / ENV ═══"
grep -n "proxy\|VITE_API" $WEB/vite.config.js 2>/dev/null || echo "no proxy block in vite.config.js"
grep -rn "VITE_API" $WEB/.env $WEB/.env.* 2>/dev/null || echo "no VITE_API* in web .env files"

echo
echo "═══ 9. GUEST PORTAL BACKEND ENDPOINTS ═══"
grep -nE "guestPortalRouter\.(get|post|put|patch)" $API/modules/guest-portal/guest-portal.routes.ts

echo
echo "DONE."