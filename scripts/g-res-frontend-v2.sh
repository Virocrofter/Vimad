#!/usr/bin/env bash
cd "$(dirname "$0")/.." || exit 1
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS: $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL: $1"; }

if (cd apps/web && npm run build) >/dev/null 2>&1; then ok "web build"; else bad "web build"; fi

D=apps/web/src/app/app/reservations/detail/page.jsx
for h in useNoShow useTraces useCompanions useUpdateStayRate useResendConfirmation useResolveTrace useAddCompanion; do
  if grep -q "$h" "$D"; then ok "detail wires $h"; else bad "detail missing $h"; fi
done

grep -q "noShowReservation" apps/web/src/api/api-reservations.ts && ok "api has noShowReservation" || bad "api noShowReservation"
grep -q "updateStayRate" apps/web/src/api/api-reservations.ts && ok "api has updateStayRate" || bad "api updateStayRate"
grep -q "resendConfirmation" apps/web/src/hooks/useReservations.ts && ok "hooks has resendConfirmation" || bad "hooks resendConfirmation"

echo "== $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] && echo "SHIPPED" || exit 1
