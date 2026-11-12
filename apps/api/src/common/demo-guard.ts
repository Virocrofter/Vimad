// Demo sandbox guard — the safety layer for demo tenants.
// One root flag (tenants.isDemo) drives: email/SMS capture, Paystack stubbing,
// analytics exclusion. In-process Set is authoritative for this process; DB
// fallback covers webhooks/workers.
import { prisma } from './prisma.js';
import { logger } from './logger.js';

const demoTenantIds = new Set<string>();
let dbCache = new Map<string, boolean>();
let cacheAt = 0;

export function markDemoTenant(tenantId: string) {
  demoTenantIds.add(tenantId);
  dbCache.set(tenantId, true);
}
export function unmarkDemoTenant(tenantId: string) {
  demoTenantIds.delete(tenantId);
  dbCache.set(tenantId, false);
}

export async function isDemoTenantId(tenantId?: string | null): Promise<boolean> {
  if (!tenantId) return false;
  if (demoTenantIds.has(tenantId)) return true;
  const now = Date.now();
  if (now - cacheAt > 60_000) {
    dbCache = new Map();
    cacheAt = now;
  }
  const hit = dbCache.get(tenantId);
  if (hit !== undefined) return hit;
  const row = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { isDemo: true } });
  const demo = row?.isDemo === true;
  dbCache.set(tenantId, demo);
  return demo;
}

// Returns true when the outbound email was CAPTURED (i.e. must NOT be sent).
export async function captureEmailIfDemo(
  tenantId: string | null | undefined,
  what: string
): Promise<boolean> {
  if (!(await isDemoTenantId(tenantId))) return false;
  logger.info({ tenantId, what }, '[sandbox] outbound email captured, not sent');
  return true;
}

// Minimal Paystack-success stub for demo tenants (charge/verify shapes).
export function demoPaystackStub(path: string, init?: RequestInit): unknown {
  logger.info({ path }, '[sandbox] paystack call stubbed for demo tenant');
  const ref = `DEMO-${Date.now()}`;
  return {
    status: true,
    demo: true,
    data: {
      reference: ref,
      status: 'success',
      amount: JSON.parse(String(init?.body ?? '{}'))?.amount ?? 0,
      authorization: {
        authorization_code: `DEMO_auth_${Date.now()}`,
        card_type: 'visa',
        last4: '4242',
        reusable: false,
        channel: 'card',
      },
      customer: { customer_code: `DEMO_cus_${Date.now()}`, email: 'demo.visitor@vimad.demo' },
      transaction_date: new Date().toISOString(),
    },
  };
}
