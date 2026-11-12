#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/.."
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  PASS  $1"; }
bad() { FAIL=$((FAIL+1)); echo "  FAIL  $1"; }
echo "═══ DEMO ACCESS GATES ═══"
for f in apps/api/src/modules/admin/admin.demo-access.service.ts apps/api/src/modules/admin/admin.demo-access.routes.ts \
         apps/api/src/common/demo-guard.ts apps/web/src/app/admin/demo-access/page.jsx \
         apps/web/src/app/admin/demo-access/components.jsx apps/web/src/app/demo-access/enter/page.jsx; do
  [ -f "$f" ] && ok "exists: $f" || bad "missing: $f"
done
[ ! -f apps/web/src/app/admin/demo-access/data.js ] && ok "mock data.js removed" || bad "mock data.js still present"
grep -q 'isDemo' apps/api/prisma/schema.prisma && ok "prisma: tenants.isDemo" || bad "prisma: isDemo missing"
[ "$(grep -c 'model DemoInvite ' apps/api/prisma/schema.prisma)" = "1" ] && ok "prisma: exactly one DemoInvite model" || bad "DemoInvite count != 1"
[ "$(grep -c 'model DemoActivity ' apps/api/prisma/schema.prisma)" = "1" ] && ok "prisma: exactly one DemoActivity model" || bad "DemoActivity count != 1"
grep -q 'demoAccessAdminRouter' apps/api/src/index.ts && ok "index.ts: admin router mounted" || bad "admin router not mounted"
grep -q 'demoAccessPublicRouter' apps/api/src/index.ts && ok "index.ts: public router mounted" || bad "public router not mounted"
grep -q 'requireAdminRole' apps/api/src/modules/admin/admin.demo-access.routes.ts && ok "routes guarded" || bad "routes unguarded"
grep -rq 'captureEmailIfDemo' apps/api/src/jobs apps/api/src/common 2>/dev/null && ok "email sandbox capture wired" || bad "email capture not wired"
grep -q 'demoPaystackStub' apps/api/src/common/paystack.ts && ok "paystack demo stub wired" || bad "paystack stub missing"
grep -q 'demo-access/enter' apps/web/src/router.tsx && ok "router: magic-link route" || bad "enter route missing"
grep -q 'requestDemo' apps/web/src/app/marketing/demo/page.jsx && ok "marketing /demo form live" || bad "marketing form not wired"
grep -q 'demo-access' apps/web/src/lib/navGroups.js apps/web/src/app/admin/components/AdminSidebar.jsx 2>/dev/null && ok "admin nav entry" || echo "  WARN  nav entry not found (page reachable at /admin/demo-access)"
( cd apps/api && npx tsc --noEmit ) >/tmp/da-tsc.log 2>&1 && ok "api tsc clean" || { bad "api tsc"; tail -6 /tmp/da-tsc.log; }
( cd apps/web && npm run build ) >/tmp/da-web.log 2>&1 && ok "web build green" || { bad "web build"; tail -8 /tmp/da-web.log; }
npx tsx -e "
import * as svc from './apps/api/src/modules/admin/admin.demo-access.service';
import { prisma } from './apps/api/src/common/prisma';
(async () => {
  const s = await svc.requestDemo({ email: 'gates-' + Date.now() + '@vimad.check', company: 'Gate Check' });
  const ap = await svc.approveSession(s.session.id, { days: 1, grantedBy: 'gates' });
  const inv = await svc.inviteSession(s.session.id, 'gates');
  const ent = await svc.enterDemo(inv.token);
  if (!ent.password) throw new Error('enter returned no credentials');
  try { await svc.enterDemo(inv.token); throw new Error('token reuse allowed!'); } catch (e: any) { if (!/already used/.test(e.message)) throw e; }
  await svc.extendSession(s.session.id, { days: 3, by: 'gates' });
  const rst = await svc.resetSession(s.session.id, 'gates');
  if (!rst.credentials?.password) throw new Error('reset returned no credentials');
  await svc.convertSession(s.session.id, 'gates');
  const fresh = await prisma.demoSession.findUnique({ where: { id: s.session.id } });
  const t = await prisma.tenant.findUnique({ where: { id: fresh!.tenantId! } });
  if (t?.isDemo !== false || t?.plan !== 'trial') throw new Error('convert did not promote tenant');
  await svc.revokeSession(s.session.id, { reason: 'gate cleanup', by: 'gates' });
  const after = await prisma.demoSession.findUnique({ where: { id: s.session.id } });
  if (after?.tenantId) await prisma.tenant.delete({ where: { id: after.tenantId } }).catch(() => {});
  await prisma.demoSession.delete({ where: { id: s.session.id } }).catch(() => {});
  console.log('LIFECYCLE OK'); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
" >/tmp/da-svc.log 2>&1 && ok "lifecycle: request→approve→invite→enter(single-use)→extend→reset→convert→revoke" || { bad "lifecycle"; cat /tmp/da-svc.log; }
if curl -sf http://localhost:3001/health/live >/dev/null 2>&1; then
  RBODY=$(curl -s -X POST http://localhost:3001/v1/public/demo-access/request -H 'Content-Type: application/json' -d '{"email":"gates-smoke@vimad.check","company":"Smoke"}'); echo "$RBODY" | grep -q 'data' && ok "HTTP POST /v1/public/demo-access/request" || { bad "HTTP public request"; echo "        BODY: $RBODY"; }
  curl -s -X POST http://localhost:3001/v1/public/demo-access/enter -H 'Content-Type: application/json' -d '{"token":"bogus"}' | grep -q 'Invalid or expired link' && ok "HTTP enter rejects bad token" || bad "HTTP enter bad-token"
  curl -s http://localhost:3001/admin/demo-access/stats | grep -qi 'unauthorized\|error' && ok "admin routes reject anonymous" || bad "admin route not protected"
else
  echo "  SKIP  API not on :3001 — restart it, then re-run: bash scripts/g-demo-access-gates.sh"
fi
grep -q 'PAYMENTS_DEMO_BLOCKED' apps/api/src/modules/payments/payments.service.ts && ok "payments demo gate wired" || bad "payments demo gate missing"
grep -q "demoAccessPublicRouter.get('/tour'" apps/api/src/modules/admin/admin.demo-access.routes.ts && ok "tour route exists" || bad "tour route missing"
grep -q 'mailinator' apps/api/src/modules/admin/admin.demo-access.service.ts && ok "abuse controls present (disposable blocklist)" || bad "abuse controls missing"
grep -q 'DemoTourBanner' apps/web/src/app/layout.tsx && ok "tour banner mounted in app layout" || bad "tour banner not mounted"
echo "═══ $PASS passed, $FAIL failed ═══"
[ "$FAIL" -eq 0 ]
