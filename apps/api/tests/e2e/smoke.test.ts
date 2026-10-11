/* apps/api/tests/e2e/smoke.test.ts
 * End-to-end smoke test: Register → Login → Create Property → Create Room
 * → Create Reservation → Check Folio
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { pushTestSchema, truncateAllTables } from '../helpers/prisma.js';
import { buildTestApp, type TestTenant } from '../helpers/server.js';

const app = buildTestApp();

const RUN_DB_TESTS = !!(process.env.TEST_DATABASE_URL ?? process.env.RUN_DB_TESTS);

describe.skipIf(!RUN_DB_TESTS)('E2E Smoke Test: Full Guest Journey', () => {
  let auth: TestTenant;

  beforeAll(() => {
    pushTestSchema();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  it('completes the full guest journey', async () => {
    // ─── Step 1: Register ───
    const registerRes = await request(app)
      .post('/auth/register')
      .send({
        tenantName: 'Smoke Test Hotel',
        tenantSlug: `smoke-${Date.now()}`,
        ownerEmail: 'smoke@test.com',
        ownerPassword: 'password123',
        ownerFirstName: 'Smoke',
        ownerLastName: 'Tester',
      });

    expect(registerRes.status).toBe(201);
    auth = {
      token: registerRes.body.data.token,
      refreshToken: registerRes.body.data.refreshToken,
      tenantId: registerRes.body.data.tenant.id,
      userId: registerRes.body.data.user.id,
      email: registerRes.body.data.user.email,
    };

    // ─── Step 2: Login (verify token works) ───
    const loginRes = await request(app).post('/auth/login').send({
      tenantSlug: registerRes.body.data.tenant.slug,
      email: 'smoke@test.com',
      password: 'password123',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.email).toBe('smoke@test.com');

    // ─── Step 3: Create Property ───
    const propertyRes = await request(app)
      .post('/v1/properties')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        name: 'Smoke Property',
        code: 'SMOKE-01',
        timezone: 'UTC',
        currency: 'ZAR',
      });

    expect(propertyRes.status).toBe(201);
    const propertyId = propertyRes.body.data.id;

    // ─── Step 4: Create Room Type ───
    const roomTypeRes = await request(app)
      .post('/v1/room-types')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        propertyId,
        name: 'Standard',
        code: 'STD',
        baseOccupancy: 2,
        maxOccupancy: 4,
      });

    expect(roomTypeRes.status).toBe(201);
    const roomTypeId = roomTypeRes.body.data.id;

    // ─── Step 5: Create Room ───
    const roomRes = await request(app)
      .post('/v1/rooms')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        propertyId,
        roomTypeId,
        number: '101',
        floor: '1',
      });

    expect(roomRes.status).toBe(201);
    const roomId = roomRes.body.data.id;

    // ─── Step 6: Create Guest ───
    const guestRes = await request(app)
      .post('/v1/guests')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1 555-0100',
      });

    expect(guestRes.status).toBe(201);
    const guestId = guestRes.body.data.id;

    // ─── Step 7: Create Reservation ───
    const reservationRes = await request(app)
      .post('/v1/reservations')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        propertyId,
        guestId,
        confirmationNumber: `SMOKE-${Date.now()}`,
        arrivalDate: '2026-09-10',
        departureDate: '2026-09-13',
        nights: 3,
        adults: 2,
        children: 0,
        totalAmount: 450,
        balance: 450,
        roomAssignments: [{ roomId, dateFrom: '2026-09-10', dateTo: '2026-09-13', rate: 150 }],
      });

    expect(reservationRes.status).toBe(201);
    const reservationId = reservationRes.body.data.id;
    expect(reservationRes.body.data.status).toBe('confirmed');

    // ─── Step 8: Create Folio ───
    const folioRes = await request(app)
      .post('/v1/folios')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        reservationId,
        type: 'guest',
      });

    expect(folioRes.status).toBe(201);
    const folioId = folioRes.body.data.id;
    expect(folioRes.body.data.status).toBe('open');
    expect(folioRes.body.data.balance).toBe(0);

    // ─── Step 9: Post Room Charge ───
    const chargeRes = await request(app)
      .post(`/v1/folios/${folioId}/charges`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        type: 'room_charge',
        description: 'Room charge - Night 1',
        amount: 150,
        quantity: 1,
      });

    expect(chargeRes.status).toBe(201);
    expect(chargeRes.body.data.amount).toBe(150);

    // ─── Step 10: Verify Folio Balance ───
    const folioCheckRes = await request(app)
      .get(`/v1/folios/${folioId}`)
      .set('Authorization', `Bearer ${auth.token}`);

    expect(folioCheckRes.status).toBe(200);
    expect(folioCheckRes.body.data.balance).toBe(150);
    expect(folioCheckRes.body.data.totalCharges).toBe(150);

    // ─── Step 11: Post Payment ───
    const paymentRes = await request(app)
      .post(`/v1/folios/${folioId}/payments`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        type: 'card',
        amount: 100,
      });

    expect(paymentRes.status).toBe(201);

    // ─── Step 12: Verify Updated Balance ───
    const finalFolioRes = await request(app)
      .get(`/v1/folios/${folioId}`)
      .set('Authorization', `Bearer ${auth.token}`);

    expect(finalFolioRes.status).toBe(200);
    expect(finalFolioRes.body.data.balance).toBe(50);
    expect(finalFolioRes.body.data.totalCharges).toBe(150);
    expect(finalFolioRes.body.data.totalPayments).toBe(100);

    console.log('✅ Smoke test passed: Full guest journey completed');
  });
});
