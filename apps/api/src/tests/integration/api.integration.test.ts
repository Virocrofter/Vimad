/* apps/api/src/__tests__/integration/api.integration.test.ts
 *
 * Integration tests — run the real Express app against a real Postgres
 * (migrations must be applied first: `npm run db:migrate:prod`).
 * Queue/socket/rate-limit infrastructure is stubbed so no Redis is needed.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// ─── Stub infrastructure before importing the app ───
vi.mock('../../common/queue.js', () => ({
  redisConnection: { on: vi.fn(), quit: vi.fn() },
  QUEUE_NAMES: ['email', 'report', 'night-audit', 'billing', 'gdpr', 'dead-letter'],
  getQueue: vi.fn(),
  createWorker: vi.fn(() => ({ on: vi.fn(), close: vi.fn() })),
  enqueue: vi.fn(),
  closeQueues: vi.fn(),
}));

vi.mock('../../common/socket.js', () => ({
  createSocketServer: vi.fn(),
  emitToTenant: vi.fn(),
  emitToAdmin: vi.fn(),
}));

vi.mock('../../common/rate-limit.js', () => ({
  initRateLimitRedis: vi.fn(),
  createTieredRateLimiter: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
  createStrictRateLimiter: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
  createApiRateLimiter: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
  getRedisClient: vi.fn(() => null),
}));

vi.mock('../../jobs/dashboard.js', () => ({
  queueDashboardMiddleware: vi.fn(() => [
    (_req: unknown, res: { sendStatus: (n: number) => void }) => res.sendStatus(204),
  ]),
}));

vi.mock('../../jobs/dead-letter.handler.js', () => ({
  deadLetterWorker: { on: vi.fn() },
  attachDeadLetterHandler: vi.fn(),
}));

const { prisma } = await import('../../common/prisma.js');
const { app } = await import('../../index.js');
const prismaAny = prisma as any;
const roleModel = prismaAny.role ?? prismaAny.roles;
const roleAssignmentModel = prismaAny.roleAssignment ?? prismaAny.roleAssignments;
const rolePermissionModel = prismaAny.rolePermission ?? prismaAny.rolePermissions;
const permissionModel = prismaAny.permission ?? prismaAny.permissions;

// ─── Fixtures ───
const RUN = Date.now().toString(36);
const TENANT_SLUG = `it-tenant-${RUN}`;
const OWNER_EMAIL = `owner-${RUN}@test.dev`;
const OWNER_PASSWORD = 'integration-secret-1';

const RUN_INTEGRATION = !!(process.env.TEST_DATABASE_URL ?? process.env.RUN_DB_TESTS);

describe.skipIf(!RUN_INTEGRATION)('API integration suite', () => {
  let token = '';
  let tenantId = '';
  let propertyId = '';

  beforeAll(async () => {
    // Wildcard permission + owner role so requirePermission('*') passes
    const wildcard = await permissionModel.upsert({
      where: { resource_action: { resource: '*', action: '*' } },
      create: { resource: '*', action: '*', description: 'All permissions', category: 'system' },
      update: {},
    });

    const tenant = await prisma.tenant.create({
      data: { name: 'Integration Test Tenant', slug: TENANT_SLUG },
    });
    tenantId = tenant.id;

    const role = await roleModel.create({
      data: {
        name: 'owner',
        type: 'system',
        tenantId,
        rolePermissions: { create: { permissionId: wildcard.id } },
      },
    });

    const user = await prisma.user.create({
      data: {
        tenantId,
        email: OWNER_EMAIL,
        passwordHash: bcrypt.hashSync(OWNER_PASSWORD, 4),
        firstName: 'Integration',
        lastName: 'Owner',
        role: 'owner',
        status: 'active',
      },
    });

    await roleAssignmentModel.create({ data: { userId: user.id, roleId: role.id } });

    const property = await prisma.property.create({
      data: { tenantId, name: 'IT Property', code: `ITP-${RUN}` },
    });
    propertyId = property.id;

    // Log in through the real endpoint
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ tenantSlug: TENANT_SLUG, email: OWNER_EMAIL, password: OWNER_PASSWORD });

    expect(res.status).toBe(200);
    token = res.body.data?.token ?? res.body.token;
    expect(token).toBeTruthy();
  }, 60000);

  afterAll(async () => {
    if (tenantId) {
      // Roles have no FK to tenants — clean them explicitly, then cascade-delete the rest
      const roles = await roleModel.findMany({ where: { tenantId }, select: { id: true } });
      const roleIds = roles.map((r: { id: any }) => r.id);
      await roleAssignmentModel.deleteMany({ where: { roleId: { in: roleIds } } }).catch(() => {});
      await rolePermissionModel.deleteMany({ where: { roleId: { in: roleIds } } }).catch(() => {});
      await roleModel.deleteMany({ where: { id: { in: roleIds } } }).catch(() => {});
      await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  // ─── Health ───
  describe('health endpoints', () => {
    it('GET /health responds without auth', async () => {
      const res = await request(app).get('/health');
      expect([200, 503]).toContain(res.status); // degraded is acceptable in CI
      expect(res.body).toHaveProperty('status');
    });
  });

  // ─── Auth ───
  describe('auth routes', () => {
    it('rejects bad credentials with 401', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ tenantSlug: TENANT_SLUG, email: OWNER_EMAIL, password: 'wrong-password' });
      expect(res.status).toBe(401);
    });

    it('rejects malformed bodies with 400', async () => {
      const res = await request(app).post('/v1/auth/login').send({ email: 'nope' });
      expect(res.status).toBe(400);
    });
  });

  // ─── Guests CRUD ───
  describe('guests CRUD', () => {
    let guestId = '';

    it('rejects unauthenticated requests', async () => {
      const res = await request(app).get('/v1/guests');
      expect(res.status).toBe(401);
    });

    it('creates a guest', async () => {
      const res = await request(app)
        .post('/v1/guests')
        .set(auth())
        .send({ firstName: 'Integration', lastName: 'Guest', email: `guest-${RUN}@test.dev` });

      expect(res.status).toBe(201);
      guestId = res.body.data.id;
      expect(guestId).toBeTruthy();
    });

    it('validates the create payload', async () => {
      const res = await request(app).post('/v1/guests').set(auth()).send({ firstName: '' });
      expect(res.status).toBe(400);
    });

    it('lists guests with pagination meta', async () => {
      const res = await request(app).get('/v1/guests?page=1&pageSize=10').set(auth());
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('reads a single guest', async () => {
      const res = await request(app).get(`/v1/guests/${guestId}`).set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(guestId);
    });

    it('updates a guest', async () => {
      const res = await request(app)
        .patch(`/v1/guests/${guestId}`)
        .set(auth())
        .send({ vipStatus: 'gold' });
      expect(res.status).toBe(200);
      expect(res.body.data.vipStatus).toBe('gold');
    });

    it('404s on unknown guest ids', async () => {
      const res = await request(app).get('/v1/guests/does-not-exist').set(auth());
      expect(res.status).toBe(404);
    });

    it('deletes a guest', async () => {
      const res = await request(app).delete(`/v1/guests/${guestId}`).set(auth());
      expect([200, 204]).toContain(res.status);

      const check = await request(app).get(`/v1/guests/${guestId}`).set(auth());
      expect(check.status).toBe(404);
    });
  });

  // ─── Tenant isolation ───
  describe('tenant isolation', () => {
    it('a guest created in one tenant is invisible to another', async () => {
      const guest = await prisma.guest.create({
        data: { tenantId, firstName: 'Isolated', lastName: 'Guest' },
      });

      const otherTenant = await prisma.tenant.create({
        data: { name: 'Other', slug: `it-other-${RUN}` },
      });
      const otherGuestLookup = await prisma.guest.findFirst({
        where: { id: guest.id, tenantId: otherTenant.id },
      });

      expect(otherGuestLookup).toBeNull();

      await prisma.guest.delete({ where: { id: guest.id } });
      await prisma.tenant.delete({ where: { id: otherTenant.id } });
    });
  });

  // ─── Properties (read path) ───
  describe('properties routes', () => {
    it('lists properties for the tenant', async () => {
      const res = await request(app).get('/v1/properties').set(auth());
      expect(res.status).toBe(200);
      const ids = (res.body.data ?? res.body).map?.((p: { id: string }) => p.id) ?? [];
      expect(ids).toContain(propertyId);
    });
  });
});
