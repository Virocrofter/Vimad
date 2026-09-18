/* apps/api/src/modules/guests/guests.test.ts
 * Integration tests for the guests module. Requires a reachable Postgres
 * (TEST_DATABASE_URL / DATABASE_URL) — skipped automatically otherwise.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { pushTestSchema, truncateAllTables } from '../../../tests/helpers/prisma.js';
import {
  buildTestApp,
  registerTestTenant,
  type TestTenant,
} from '../../../tests/helpers/server.js';

const app = buildTestApp();

const RUN_DB_TESTS = !!(process.env.TEST_DATABASE_URL ?? process.env.RUN_DB_TESTS);

describe.skipIf(!RUN_DB_TESTS)('Guests API', () => {
  let auth: TestTenant;

  beforeAll(() => {
    pushTestSchema();
  });

  beforeEach(async () => {
    await truncateAllTables();
    auth = await registerTestTenant(app);
  });

  const guestPayload = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    phone: '+1 555 0100',
  };

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/v1/guests');
    expect(res.status).toBe(401);
  });

  it('rejects authenticated users without permissions', async () => {
    // Register a second tenant but do NOT grant permissions — owner role
    // string alone does not confer permissions.
    const other = await request(app)
      .post('/auth/register')
      .send({
        tenantName: 'No Perms Hotel',
        tenantSlug: `no-perms-${Date.now()}`,
        ownerEmail: 'noperm@test.com',
        ownerPassword: 'password123',
      });
    expect(other.status).toBe(201);

    const res = await request(app)
      .post('/v1/guests')
      .set('Authorization', `Bearer ${other.body.data.token}`)
      .send(guestPayload);
    expect(res.status).toBe(403);
  });

  it('creates a guest', async () => {
    const res = await request(app)
      .post('/v1/guests')
      .set('Authorization', `Bearer ${auth.token}`)
      .send(guestPayload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      tenantId: auth.tenantId,
    });
    expect(res.body.data.id).toBeTypeOf('string');
  });

  it('rejects invalid guest payloads', async () => {
    const res = await request(app)
      .post('/v1/guests')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ firstName: '', lastName: 'Doe', email: 'not-an-email' });

    expect(res.status).toBe(400);
  });

  it('lists guests with pagination', async () => {
    await request(app)
      .post('/v1/guests')
      .set('Authorization', `Bearer ${auth.token}`)
      .send(guestPayload);

    const res = await request(app)
      .get('/v1/guests?page=1&pageSize=10')
      .set('Authorization', `Bearer ${auth.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toMatchObject({ page: 1, pageSize: 10, total: 1, totalPages: 1 });
  });

  it('searches guests', async () => {
    await request(app)
      .post('/v1/guests')
      .set('Authorization', `Bearer ${auth.token}`)
      .send(guestPayload);
    await request(app)
      .post('/v1/guests')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ firstName: 'John', lastName: 'Smith' });

    const res = await request(app)
      .get('/v1/guests?search=doe')
      .set('Authorization', `Bearer ${auth.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].lastName).toBe('Doe');
  });

  it('gets a guest by id', async () => {
    const created = await request(app)
      .post('/v1/guests')
      .set('Authorization', `Bearer ${auth.token}`)
      .send(guestPayload);

    const res = await request(app)
      .get(`/v1/guests/${created.body.data.id}`)
      .set('Authorization', `Bearer ${auth.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('jane.doe@example.com');
  });

  it('returns 404 for unknown guest ids', async () => {
    const res = await request(app)
      .get('/v1/guests/does-not-exist')
      .set('Authorization', `Bearer ${auth.token}`);

    expect(res.status).toBe(404);
  });

  it('updates a guest', async () => {
    const created = await request(app)
      .post('/v1/guests')
      .set('Authorization', `Bearer ${auth.token}`)
      .send(guestPayload);

    const res = await request(app)
      .patch(`/v1/guests/${created.body.data.id}`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ vipStatus: 'gold', notes: 'Repeat guest' });

    expect(res.status).toBe(200);
    expect(res.body.data.vipStatus).toBe('gold');
    expect(res.body.data.notes).toBe('Repeat guest');
  });

  it('deletes a guest', async () => {
    const created = await request(app)
      .post('/v1/guests')
      .set('Authorization', `Bearer ${auth.token}`)
      .send(guestPayload);

    const del = await request(app)
      .delete(`/v1/guests/${created.body.data.id}`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(del.status).toBe(200);

    const get = await request(app)
      .get(`/v1/guests/${created.body.data.id}`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(get.status).toBe(404);
  });
});
