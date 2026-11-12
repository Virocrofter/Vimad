// P3-C — B1 channel adapter observability: health, last success, failures,
// push log visibility, idempotent replay, DLQ surfacing.
// Where an endpoint does not exist the test fails with "SPEC MISSING" plus the
// registered route map — that failure IS the B1 implementation contract.
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
let connectionId = '';
let failedLogId = '';
let jobId = 'job-' + runId;
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
    ['channel', 'read'],
    ['channel', 'update'],
    ['channel', 'create'],
    ['inventory', 'view'],
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
      perm = await prisma.permission.create({ data: { resource, action, category: 'channel' } });
    }
    if (
      !(await prisma.rolePermission.findUnique({
        where: { roleId_permissionId: { roleId: owner.id, permissionId: perm.id } },
      }))
    ) {
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

async function getFirstOk(paths: string[]): Promise<{ path: string; res: any } | null> {
  for (const p of paths) {
    const res = await request(app).get(p).set(auth());
    if (res.status === 200) return { path: p, res };
  }
  return null;
}

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
    data: { name: 'P3 Channel ' + runId, slug: 'p3chan-' + runId },
  });
  tenantId = t.id;
  const p = await prisma.property.create({
    data: { tenantId, name: 'P3 Property', code: 'P3C' + runId.slice(0, 4).toUpperCase() },
  });
  const conn = await prisma.channelConnection.create({
    data: {
      tenantId,
      propertyId: p.id,
      provider: 'channex',
      hotelId: 'HTL-' + runId,
      apiKey: 'key-' + runId,
      status: 'connected',
      lastSyncStatus: 'ok',
      lastSyncAt: new Date(),
      connectedAt: new Date(),
    },
  });
  connectionId = conn.id;
  for (const [i, status] of ['ok', 'ok', 'failed'].entries()) {
    const log = await prisma.channelPushLog.create({
      data: {
        tenantId,
        connectionId,
        payload: { event: 'availability.push', batch: i },
        latencyMs: 120 + i,
        status,
      },
    });
    if (status === 'failed') failedLogId = log.id;
  }
  await prisma.failedJob.create({
    data: {
      queue: 'channel',
      jobId,
      jobName: 'channel.push',
      failReason: 'HTTP timeout from provider',
      attemptCount: 3,
      status: 'pending',
    },
  });

  const u = await prisma.user.create({
    data: {
      tenantId,
      email: 'p3chan-' + runId + '@test.local',
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
  console.log(
    'CHANNEL ROUTES:',
    JSON.stringify(routeMap.filter((x) => /channel|sync|push|dead|fail/i.test(x)))
  );
}, 60000);

afterAll(async () => {
  await prisma.channelPushLog.deleteMany({ where: { tenantId } });
  await prisma.failedJob.deleteMany({ where: { jobId } });
  await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => {});
}, 60000);

describe('P3-C B1 channel observability', () => {
  it('C1 health view: connection list exposes status and last-sync fields', async () => {
    const listPaths = routeMap.filter(
      (x) =>
        /channel/i.test(x) && !/webhook|push|replay|sync-error|status|connect|disconnect/i.test(x)
    );
    const hit = await getFirstOk(listPaths);
    if (!hit) {
      throw new Error(
        'SPEC MISSING B1: no readable channel connection endpoint. Channel routes: ' +
          JSON.stringify(routeMap.filter((x) => /channel/i.test(x)))
      );
    }
    const body = JSON.stringify(hit.res.body);
    console.log('C1 GET', hit.path, '->', hit.res.status, body.slice(0, 400));
    expect(body).toContain(connectionId);
    expect(/lastSync|lastSyncStatus|lastSyncAt/i.test(body)).toBe(true);
  }, 30000);

  it('C2 failure visibility: a broken sync surfaces on the health view', async () => {
    await prisma.channelConnection.update({
      where: { id: connectionId },
      data: { lastSyncStatus: 'error', lastSyncAt: new Date(Date.now() - 3600_000) },
    });
    const listPaths = routeMap.filter(
      (x) =>
        /channel/i.test(x) && !/webhook|push|replay|sync-error|status|connect|disconnect/i.test(x)
    );
    const hit = await getFirstOk(listPaths);
    if (!hit) throw new Error('SPEC MISSING B1 health view (see C1)');
    const items: any[] =
      hit.res.body?.data?.items ?? hit.res.body?.items ?? hit.res.body?.data ?? [];
    const arr = Array.isArray(items) ? items : [items];
    const mine = arr.find(
      (x: any) => x && (x.id === connectionId || x.connectionId === connectionId)
    );
    console.log('C2 connection payload:', JSON.stringify(mine).slice(0, 400));
    expect(mine).toBeTruthy();
    expect(/error/i.test(JSON.stringify(mine))).toBe(true);
  }, 30000);

  it('C3 SPEC: sync-error dashboard exposes the failed push log', async () => {
    const dashPaths = routeMap.filter((x) => /channel/i.test(x) && /sync|error|log|push/i.test(x));
    const hit = await getFirstOk(dashPaths);
    if (!hit) {
      throw new Error(
        'SPEC MISSING B1 sync-error dashboard endpoint. Channel routes: ' +
          JSON.stringify(routeMap.filter((x) => /channel/i.test(x)))
      );
    }
    const body = JSON.stringify(hit.res.body);
    console.log('C3 GET', hit.path, '->', body.slice(0, 400));
    expect(body.toLowerCase()).toContain('failed');
  }, 30000);

  it('C4 SPEC: replay is idempotent (double replay creates no duplicates)', async () => {
    const replayPaths = routeMap.filter((x) => /channel/i.test(x) && /replay|retry/i.test(x));
    if (replayPaths.length === 0) {
      throw new Error(
        'SPEC MISSING B1 replay endpoint. Channel routes: ' +
          JSON.stringify(routeMap.filter((x) => /channel/i.test(x)))
      );
    }
    const before = await prisma.channelPushLog.count({ where: { connectionId } });
    for (let i = 0; i < 2; i++) {
      const r = await request(app)
        .post(replayPaths[0])
        .set(auth())
        .send({ id: failedLogId, connectionId });
      console.log('C4 replay attempt', i + 1, '->', r.status, JSON.stringify(r.body).slice(0, 300));
      expect(r.status).toBeLessThan(500);
      await new Promise((r2) => setTimeout(r2, 400));
    }
    const after = await prisma.channelPushLog.count({ where: { connectionId } });
    expect(after).toBeLessThanOrEqual(before);
  }, 30000);

  it.skip('[S0] C5 SPEC: dead-letter jobs are visible to operators (removed with legacy admin module; rebuilt by S10 platform operations)', async () => { // LEGACY-ADMIN-JOBS-SURFACE-REMOVED-IN-S0-REBUILDS-IN-S10
    // B0: a designated operator exists in this env, so tenant access is a
    // deterministic 403 (fail-closed 503 only applies when the env is unset).
    process.env.PLATFORM_ADMIN_EMAILS =
      process.env.PLATFORM_ADMIN_EMAILS || 'platform-admin@example.com';
    const dlqPaths = routeMap.filter((x) => /dead|failed|dlq/i.test(x));
    let hit = await getFirstOk(dlqPaths);
    if (!hit && dlqPaths.length > 0) {
      const r0 = await request(app).get(dlqPaths[0]).set(auth());
      console.log('C5 DLQ route exists; tenant access status:', r0.status);
      hit = { path: dlqPaths[0], res: r0 };
    }
    if (!hit) {
      throw new Error(
        'SPEC MISSING B1 DLQ endpoint. Candidate routes checked: ' + JSON.stringify(dlqPaths)
      );
    }
    const body = JSON.stringify(hit.res.body);
    console.log('C5 GET', hit.path, '->', body.slice(0, 400));
    if (hit.res.status === 200) {
      expect(body).toContain(jobId);
    } else {
      expect(hit.res.status).toBe(403);
    }
  }, 30000);
});
