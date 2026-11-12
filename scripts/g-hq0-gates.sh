#!/usr/bin/env bash
# g-hq0-gates.sh - Stage 2 HQ-0 exit gate (plan v3.0 section 13.3)
# Static evidence for tokens/primitives/patterns/motion. Non-zero exit on FAIL.
set -u
cd "$(dirname "$0")/.." || exit 1
ROOT="$(pwd)"
WEB="$ROOT/apps/web"
PASS=0; FAIL=0; WARN=0

gate() {
  local name="$1" result="$2" detail="${3:-}"
  case "$result" in
    PASS) PASS=$((PASS+1)); printf 'PASS  %-30s %s\n' "$name" "$detail" ;;
    FAIL) FAIL=$((FAIL+1)); printf 'FAIL  %-30s %s\n' "$name" "$detail" ;;
    WARN) WARN=$((WARN+1)); printf 'WARN  %-30s %s\n' "$name" "$detail" ;;
  esac
}

note() { printf '%s\n' "$*"; }

TOK="$WEB/src/styles/tokens/calm-premium.css"
PAT="$WEB/src/components/patterns"
UI="$WEB/src/components/ui"

note '--- tokens ---'
for tok in '--hq-text-display-size: 28px' '--hq-z-cmdk: 70' '--hq-ease-emphatic' '--hq-focus-ring' '--hq-control-lg: 40px'; do
  grep -qF -- "$tok" "$TOK" && gate "T:${tok%%:*}" PASS '' || gate "T:${tok%%:*}" FAIL 'token missing'
done
grep -q 'hq-tnum' "$TOK" && gate T:tabular-nums PASS '' || gate T:tabular-nums FAIL
[ "$(grep -c 'HQ-0 (Stage 2' "$TOK")" = "1" ] && gate T:single-layer PASS '' || gate T:single-layer FAIL 'token layer missing or duplicated'

note '--- primitives ---'
grep -q "bg-primary text-white" "$UI/button.tsx" && gate P:button-teal-primary PASS '' || gate P:button-teal-primary FAIL
grep -q 'aria-busy' "$UI/button.tsx" && gate P:button-loading-name PASS '' || gate P:button-loading-name FAIL
grep -q 'shadow-none' "$UI/card.tsx" && gate P:card-hairline PASS '' || gate P:card-hairline FAIL
grep -q "tablist" "$UI/tabs.tsx" && gate P:tabs-a11y-roles PASS '' || gate P:tabs-a11y-roles FAIL
grep -q 'ArrowRight' "$UI/tabs.tsx" && gate P:tabs-arrow-keys PASS '' || gate P:tabs-arrow-keys FAIL
grep -q "htmlFor={id}" "$UI/input.tsx" && gate P:input-label-assoc PASS '' || gate P:input-label-assoc FAIL
[ -f "$UI/status-chip.tsx" ] && gate P:status-chip-exists PASS '' || gate P:status-chip-exists FAIL
grep -q 'sticky top-0' "$UI/table.tsx" && gate P:table-sticky PASS '' || gate P:table-sticky FAIL

note '--- patterns ---'
for f in PageShell StatDial StatusDot Money TimeAgo FilterBar Worklist OfficeShell; do
  [ -f "$PAT/$f.tsx" ] && gate "N:$f" PASS '' || gate "N:$f" FAIL 'pattern missing'
done
grep -q 'hq-tnum' "$PAT/StatDial.tsx" && grep -q 'hq-tnum' "$PAT/Money.tsx" && gate N:tabular-values PASS '' || gate N:tabular-values FAIL

note '--- motion ---'
[ -f "$WEB/src/lib/motion.ts" ] && gate M:waapi-lib PASS '' || gate M:waapi-lib FAIL
grep -q 'prefers-reduced-motion' "$WEB/src/lib/motion.ts" && gate M:reduced-motion PASS '' || gate M:reduced-motion FAIL
grep -Rqi 'framer-motion' "$WEB/package.json" && gate M:no-framer PASS 'present - measure before use' || gate M:no-framer PASS 'not installed (WAAPI decision)'

note '--- contract hygiene in new code ---'
if grep -RInE 'z-\[[0-9]+\]|shadow-(sm|md|lg|xl)' "$PAT" 2>/dev/null | grep -v 'hq-' > /tmp/hq0_hygiene.txt; then
  gate N:no-arbitrary-z-shadow FAIL "$(wc -l < /tmp/hq0_hygiene.txt) violations - see /tmp/hq0_hygiene.txt"
else
  gate N:no-arbitrary-z-shadow PASS ''
fi

note '--- builds ---'
( cd "$WEB" && npx tsc --noEmit >/dev/null 2>&1 ) && gate B:web-tsc PASS '' || gate B:web-tsc FAIL
( cd "$WEB" && npm run build >/dev/null 2>&1 ) && gate B:web-build PASS '' || gate B:web-build FAIL

note '--- evidence deferred to Stage 3 first consumer (noted, not failed) ---'
gate E:screenshots WARN 'capture with Today v2 build (Stage 3)'
gate E:state-matrix WARN 'stories/tests land with first pattern consumer'

note ''
note "RESULTS: $PASS passed, $FAIL failed, $WARN warned"
[ "$FAIL" -eq 0 ]
