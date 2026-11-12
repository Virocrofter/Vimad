// P3-B — E1x rate grids: day-of-week + seasonal pricing (Wave 1, monetization)
// Verifies what exists, then asserts the E1x spec loudly where it does not.
// A red "SPEC MISSING" test is the implementation contract for the next batch.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
const prisma: any = new PrismaClient();

const runId = `${Date.now().toString(36)}${crypto.randomBytes(2).toString('hex')}`;
let app: any;
let token = '';
let tenantId = '';
let propertyId = '';
let roomTypeId = '';
let ratePlanId = '';
const routeMap: string[] = [];

function collectPaths(a: any): string[] {
  const out: string[] = [];
  const regToPrefix = (src: string) =>
    src
      .replace(/^\^/, '')
      .replace(/\$$/, '')
      .replace(/\(\?=\/\|\$\)/g, '')
      .replace(/\/\?\$$/g, '')
      .replace(/\\\//g, '/')
      .replace(/\\/g, '')
      .replace(/\/$/, '');
  const walk = (stack: any[], prefix: string) => {
    for (const l of stack ?? []) {
      if (l.route) {
        const p = l.route.path;
        for (const x of Array.isArray(p) ? p : [p]) {
          const full = (prefix + x).replace(/\/+/g, '/');
          if (!out.includes(full)) out.push(full.split('/?(?=/|$)').join(''));
        }
      } else if (l.name === 'router' && l.handle?.stack) {
        walk(l.handle.stack, prefix + (l.regexp ? regToPrefix(String(l.regexp.source)) : ''));
      }
    }
  };
  walk(a?._router?.stack ?? [], '');
  return out;
}

async function ensureOwnerAccess(userId: string) {
  const needed = [
    ['rate', 'create'],
    ['rate_plan', 'read'],
    ['rate_plan', 'update'],
  ];
  let owner = await prisma.role.findFirst({ where: { name: 'Owner', tenantId: null } });
  if (!owner) {
    owner = await prisma.role.create({
      data: { name: 'Owner', type: 'system', isLocked: true, tenantId: null },
    });
  }
  for (const [resource, action] of needed) {
    let perm = await prisma.permission.findUnique({
      where: { resource_action: { resource, action } },
    });
    if (!perm) {
      perm = await prisma.permission.create({ data: { resource, action, category: 'rates' } });
    }
    const existing = await prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId: owner.id, permissionId: perm.id } },
    });
    if (!existing) {
      await prisma.rolePermission.create({ data: { roleId: owner.id, permissionId: perm.id } });
    }
  }
  if (
    !(await prisma.roleAssignment.findFirst({
      where: { userId, roleId: owner.id, propertyId: null },
    }))
  ) {
    await prisma.roleAssignment.create({ data: { userId, roleId: owner.id, propertyId: null } });
  }
}

const auth = () => ({ Authorization: 'Bearer ' + token });

beforeAll(async () => {
  const mod: any = await import('../helpers/server.js');
  app =
    mod.buildTestApp?.() ??
    mod.app ??
    mod.server ??
    mod.default?.app ??
    mod.default ??
    mod.buildApp?.();
  if (!app) throw new Error('helpers/server export not found; keys=' + Object.keys(mod).join(','));

  const t = await prisma.tenant.create({
    data: { name: 'P3 Rates ' + runId, slug: 'p3rates-' + runId },
  });
  tenantId = t.id;
  const p = await prisma.property.create({
    data: {
      tenantId,
      name: 'P3 Property',
      code: 'P3R' + runId.slice(0, 4).toUpperCase(),
      currency: 'ZAR',
    },
  });
  propertyId = p.id;
  const rt = await prisma.roomType.create({
    data: { tenantId, propertyId, name: 'Standard', code: 'STD' },
  });
  roomTypeId = rt.id;
  const rp = await prisma.ratePlan.create({
    data: {
      tenantId,
      propertyId,
      roomTypeId,
      name: 'Rack',
      code: 'RACK',
      baseRate: 1000,
      currency: 'ZAR',
    },
  });
  ratePlanId = rp.id;

  const u = await prisma.user.create({
    data: {
      tenantId,
      email: 'p3rates-' + runId + '@test.local',
      passwordHash: await bcrypt.hash('p3password123', 10),
      firstName: 'P3',
      lastName: 'Owner',
      role: 'owner',
    },
  });
  await ensureOwnerAccess(u.id);
  let loginPath = '';
  for (const c of ['/v1/auth/login', '/api/v1/auth/login', '/auth/login', '/api/auth/login']) {
    const st = (
      await request(app)
        .post(c)
        .send({ email: u.email, password: 'wrong-password', tenantSlug: t.slug })
    ).status;
    if (st === 404) continue;
    loginPath = c;
    break;
  }
  if (loginPath === '') throw new Error('no login route found among candidates');
  const login = await request(app)
    .post(loginPath)
    .send({ email: u.email, password: 'p3password123', tenantSlug: t.slug });
  const lb: any = login.body;
  token = lb?.data?.accessToken ?? lb?.data?.token ?? lb?.accessToken ?? lb?.token;
  if (!token) throw new Error('login failed: ' + login.status);

  routeMap.push(...collectPaths(app));
  console.log('RATES ROUTES:', JSON.stringify(routeMap.filter((x) => /rate|pric/i.test(x))));
}, 60000);

afterAll(async () => {
  await prisma.pricingRule.deleteMany({ where: { tenantId } });
  await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => {});
}, 60000);

describe('P3-B E1x rate grids', () => {
  it('R0 evidence: rate-related routes are registered', () => {
    const rates = routeMap.filter((x) => /rate|pric/i.test(x));
    console.log('route inventory:', JSON.stringify(rates));
    expect(rates.length).toBeGreaterThan(0);
  });

  it('R1 SPEC: day-of-week pricing is exposed and accepts a weekday grid', async () => {
    const dowPaths = routeMap.filter((x) => /rate|pric/i.test(x) && /day|week|dow/i.test(x));
    if (dowPaths.length === 0) {
      throw new Error(
        'SPEC MISSING E1x day-of-week pricing endpoint. Registered rate routes: ' +
          JSON.stringify(routeMap.filter((x) => /rate|pric/i.test(x)))
      );
    }
    const r = await request(app)
      .post(dowPaths[0])
      .set(auth())
      .send({
        name: 'P3 Weekend Grid',
        roomTypeId,
        ratePlanId,
        daysOfWeek: [5, 6],
        adjustmentPercent: 10,
      });
    console.log('R1 POST', dowPaths[0], '->', r.status, JSON.stringify(r.body).slice(0, 300));
    expect(r.status).toBeLessThan(500);
    expect(r.status).toBeLessThan(400);
  }, 30000);

  it('R2 SPEC: seasonal rate grid with boundary dates', async () => {
    const seasonPaths = routeMap.filter((x) => /rate|pric/i.test(x) && /season/i.test(x));
    if (seasonPaths.length === 0) {
      throw new Error(
        'SPEC MISSING E1x seasonal grid endpoint. Registered rate routes: ' +
          JSON.stringify(routeMap.filter((x) => /rate|pric/i.test(x)))
      );
    }
    const r = await request(app).post(seasonPaths[0]).set(auth()).send({
      name: 'P3 High Season',
      roomTypeId,
      ratePlanId,
      startDate: '2026-12-15',
      endDate: '2027-01-10',
      rate: 1450,
    });
    console.log('R2 POST', seasonPaths[0], '->', r.status, JSON.stringify(r.body).slice(0, 300));
    expect(r.status).toBeLessThan(400);
  }, 30000);

  it('R3 existing pricing-rules engine: rule is accepted and reflected', async () => {
    const rulePaths = routeMap.filter((x) => /pricing|rule/i.test(x));
    if (rulePaths.length === 0) {
      throw new Error(
        'SPEC MISSING: no pricing-rule route at all. Route sample: ' +
          routeMap.slice(0, 40).join(', ')
      );
    }
    const candidates = [
      {
        type: 'date_range',
        conditions: { daysOfWeek: [5, 6] },
        adjustment: { type: 'date_range', value: 10 },
      },
      {
        type: 'date_range',
        conditions: { daysOfWeek: [5, 6] },
        adjustment: { kind: 'percent', value: 10 },
      },
      { type: 'date_range', conditions: { daysOfWeek: [5, 6] }, adjustment: { percent: 10 } },
    ];
    let last: any = null;
    for (const c of candidates) {
      const r = await request(app)
        .post(rulePaths[0] + '?propertyId=' + propertyId)
        .set(auth())
        .send({ name: 'P3 Rule ' + runId, propertyId, isActive: true, ...c });
      last = { status: r.status, body: r.body, path: rulePaths[0], sent: c };
      if (r.status < 400) {
        console.log('R3 rule accepted with shape:', JSON.stringify(c));
        const rows = await prisma.pricingRule.findMany({
          where: { tenantId, name: 'P3 Rule ' + runId },
        });
        expect(rows.length).toBeGreaterThan(0);
        return;
      }
    }
    console.log('R3 all rule shapes rejected. Last:', JSON.stringify(last).slice(0, 500));
    throw new Error(
      'R3: pricing-rules endpoint exists but rejected every known rule shape; see log above for the contract it expects'
    );
  }, 30000);
});
