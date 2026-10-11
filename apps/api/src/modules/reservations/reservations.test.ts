/* apps/api/src/modules/reservations/reservations.test.ts
 * Integration tests for the reservations module. Requires a reachable
 * Postgres (TEST_DATABASE_URL / DATABASE_URL) — skipped automatically otherwise.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { prisma } from '../../common/prisma.js';
import { pushTestSchema, truncateAllTables } from '../../../tests/helpers/prisma.js';
import {
  buildTestApp,
  registerTestTenant,
  type TestTenant,
} from '../../../tests/helpers/server.js';

const app = buildTestApp();

const RUN_DB_TESTS = !!(process.env.TEST_DATABASE_URL ?? process.env.RUN_DB_TESTS);

describe.skipIf(!RUN_DB_TESTS)('Reservations API', () => {
  let auth: TestTenant;
  let propertyId: string;
  let guestId: string;

  beforeAll(() => {
    pushTestSchema();
  });

  beforeEach(async () => {
    await truncateAllTables();
    auth = await registerTestTenant(app);

    const property = await prisma.property.create({
      data: { tenantId: auth.tenantId, name: 'Test Property', code: 'TP1' },
    });
    propertyId = property.id;

    const guest = await request(app)
      .post('/v1/guests')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' });
    guestId = guest.body.data.id;
  });

  const reservationPayload = {
    propertyId: '',
    guestId: '',
    arrivalDate: '2030-06-01',
    departureDate: '2030-06-05',
    nights: 4,
    rate: 150,
    adults: 2,
    source: 'direct',
  };

  const createReservation = () =>
    request(app)
      .post('/v1/reservations')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ ...reservationPayload, propertyId, guestId });

  it('creates a reservation', async () => {
    const res = await createReservation();

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      propertyId,
      guestId,
      nights: 4,
      status: 'confirmed',
      tenantId: auth.tenantId,
    });
    expect(res.body.data.confirmationNumber).toBeTypeOf('string');
  });

  it('rejects invalid reservation payloads', async () => {
    const res = await request(app)
      .post('/v1/reservations')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ ...reservationPayload, propertyId, guestId, nights: 0, rate: -5 });

    expect(res.status).toBe(400);
  });

  it('rejects reservations for another tenant’s guest', async () => {
    const other = await registerTestTenant(app);
    const otherGuest = await request(app)
      .post('/v1/guests')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ firstName: 'Eve', lastName: 'Other' });

    const res = await request(app)
      .post('/v1/reservations')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ ...reservationPayload, propertyId, guestId: otherGuest.body.data.id });

    expect(res.status).not.toBe(201);
  });

  it('lists reservations with pagination', async () => {
    await createReservation();
    await createReservation();

    const res = await request(app)
      .get('/v1/reservations?page=1&pageSize=10')
      .set('Authorization', `Bearer ${auth.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.total).toBe(2);
  });

  it('gets a reservation by id', async () => {
    const created = await createReservation();

    const res = await request(app)
      .get(`/v1/reservations/${created.body.data.id}`)
      .set('Authorization', `Bearer ${auth.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(created.body.data.id);
  });

  it('updates reservation notes and party size', async () => {
    const created = await createReservation();

    const res = await request(app)
      .patch(`/v1/reservations/${created.body.data.id}`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ notes: 'Late arrival', adults: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe('Late arrival');
    expect(res.body.data.adults).toBe(3);
  });

  it('rejects invalid update payloads', async () => {
    const created = await createReservation();

    const res = await request(app)
      .patch(`/v1/reservations/${created.body.data.id}`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ rate: -10 });

    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown reservation ids', async () => {
    const res = await request(app)
      .get('/v1/reservations/does-not-exist')
      .set('Authorization', `Bearer ${auth.token}`);

    expect(res.status).toBe(404);
  });

  it('deletes a reservation', async () => {
    const created = await createReservation();

    const del = await request(app)
      .delete(`/v1/reservations/${created.body.data.id}`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(del.status).toBe(200);

    const get = await request(app)
      .get(`/v1/reservations/${created.body.data.id}`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(get.status).toBe(404);
  });
});
