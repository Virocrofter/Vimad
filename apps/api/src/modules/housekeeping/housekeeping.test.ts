/* apps/api/src/modules/housekeeping/housekeeping.test.ts
 * Integration tests for the housekeeping module.
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

describe.skipIf(!RUN_DB_TESTS)('Housekeeping API', () => {
  let auth: TestTenant;
  let propertyId: string;
  let roomId: string;

  beforeAll(() => {
    pushTestSchema();
  });

  beforeEach(async () => {
    await truncateAllTables();
    auth = await registerTestTenant(app);

    const prop = await request(app)
      .post('/v1/properties')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ name: 'Test Hotel', code: 'TH-01', timezone: 'UTC', currency: 'USD' });
    propertyId = prop.body.data.id;

    const rt = await request(app)
      .post('/v1/room-types')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ propertyId, name: 'Standard', code: 'STD', baseOccupancy: 2, maxOccupancy: 4 });
    const roomTypeId = rt.body.data.id;

    const room = await request(app)
      .post('/v1/rooms')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ propertyId, roomTypeId, number: '101', floor: '1' });
    roomId = room.body.data.id;
  });

  const taskPayload = () => ({
    propertyId,
    roomId,
    type: 'cleaning',
    priority: 'normal',
    scheduledAt: new Date().toISOString(),
    estimatedDuration: 30,
    checklist: ['Make bed', 'Restock towels', 'Vacuum'],
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/v1/housekeeping');
    expect(res.status).toBe(401);
  });

  it('creates a housekeeping task', async () => {
    const res = await request(app)
      .post('/v1/housekeeping')
      .set('Authorization', `Bearer ${auth.token}`)
      .send(taskPayload());

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      propertyId,
      roomId,
      type: 'cleaning',
      status: 'pending',
      tenantId: auth.tenantId,
    });
  });

  it('lists tasks with pagination', async () => {
    await request(app)
      .post('/v1/housekeeping')
      .set('Authorization', `Bearer ${auth.token}`)
      .send(taskPayload());

    const res = await request(app)
      .get('/v1/housekeeping?page=1&pageSize=10')
      .set('Authorization', `Bearer ${auth.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('filters tasks by status', async () => {
    await request(app)
      .post('/v1/housekeeping')
      .set('Authorization', `Bearer ${auth.token}`)
      .send(taskPayload());

    const res = await request(app)
      .get('/v1/housekeeping?status=pending')
      .set('Authorization', `Bearer ${auth.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('assigns a task to a user', async () => {
    const task = await request(app)
      .post('/v1/housekeeping')
      .set('Authorization', `Bearer ${auth.token}`)
      .send(taskPayload());

    const res = await request(app)
      .post(`/v1/housekeeping/${task.body.data.id}/assign`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ assigneeId: auth.userId });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in_progress');
    expect(res.body.data.assigneeId).toBe(auth.userId);
  });

  it('completes a task', async () => {
    const task = await request(app)
      .post('/v1/housekeeping')
      .set('Authorization', `Bearer ${auth.token}`)
      .send(taskPayload());

    await request(app)
      .post(`/v1/housekeeping/${task.body.data.id}/assign`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ assigneeId: auth.userId });

    const res = await request(app)
      .post(`/v1/housekeeping/${task.body.data.id}/complete`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ notes: 'Room cleaned thoroughly' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
  });

  it('inspects a completed task', async () => {
    const task = await request(app)
      .post('/v1/housekeeping')
      .set('Authorization', `Bearer ${auth.token}`)
      .send(taskPayload());

    await request(app)
      .post(`/v1/housekeeping/${task.body.data.id}/assign`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ assigneeId: auth.userId });

    await request(app)
      .post(`/v1/housekeeping/${task.body.data.id}/complete`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({});

    const res = await request(app)
      .post(`/v1/housekeeping/${task.body.data.id}/inspect`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ passed: true });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('verified');
  });

  it('fails inspection and resets to pending', async () => {
    const task = await request(app)
      .post('/v1/housekeeping')
      .set('Authorization', `Bearer ${auth.token}`)
      .send(taskPayload());

    await request(app)
      .post(`/v1/housekeeping/${task.body.data.id}/assign`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ assigneeId: auth.userId });

    await request(app)
      .post(`/v1/housekeeping/${task.body.data.id}/complete`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({});

    const res = await request(app)
      .post(`/v1/housekeeping/${task.body.data.id}/inspect`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ passed: false });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('pending');
  });

  it('deletes a task', async () => {
    const task = await request(app)
      .post('/v1/housekeeping')
      .set('Authorization', `Bearer ${auth.token}`)
      .send(taskPayload());

    const del = await request(app)
      .delete(`/v1/housekeeping/${task.body.data.id}`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(del.status).toBe(204);

    const get = await request(app)
      .get(`/v1/housekeeping/${task.body.data.id}`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(get.status).toBe(404);
  });
});
