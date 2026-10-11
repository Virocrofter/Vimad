/* apps/api/tests/e2e/reservation-lifecycle.test.ts
 * End-to-end test covering the complete guest journey:
 *   1. Register tenant + login
 *   2. Create property, room type, room, guest
 *   3. Create reservation
 *   4. Check in guest
 *   5. Post folio charges
 *   6. Post payment
 *   7. Check out guest
 *   8. Verify folio is balanced
 *
 * Requires: TEST_DATABASE_URL or RUN_DB_TESTS env var
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { pushTestSchema, truncateAllTables } from '../helpers/prisma.js';
import { buildTestApp, registerTestTenant, type TestTenant } from '../helpers/server.js';

const app = buildTestApp();

const RUN_DB_TESTS = !!(process.env.TEST_DATABASE_URL ?? process.env.RUN_DB_TESTS);

describe.skipIf(!RUN_DB_TESTS)('Reservation Lifecycle E2E', () => {
  let auth: TestTenant;
  let propertyId: string;
  let roomTypeId: string;
  let _roomId: string;
  let guestId: string;
  let reservationId: string;
  let _confirmationNumber: string;
  let folioId: string;

  beforeAll(() => {
    pushTestSchema();
  });

  beforeEach(async () => {
    await truncateAllTables();
    auth = await registerTestTenant(app);

    // ─── Step 1: Create property ───
    const propRes = await request(app)
      .post('/v1/properties')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        name: 'E2E Test Hotel',
        code: 'E2E-01',
        timezone: 'America/New_York',
        currency: 'ZAR',
      });
    expect(propRes.status).toBe(201);
    propertyId = propRes.body.data.id;

    // ─── Step 2: Create room type ───
    const rtRes = await request(app)
      .post('/v1/room-types')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        propertyId,
        name: 'Deluxe King',
        code: 'DLX-K',
        baseOccupancy: 2,
        maxOccupancy: 3,
      });
    expect(rtRes.status).toBe(201);
    roomTypeId = rtRes.body.data.id;

    // ─── Step 3: Create room ───
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
    _roomId = roomRes.body.data.id;

    // ─── Step 4: Create guest ───
    const guestRes = await request(app)
      .post('/v1/guests')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        firstName: 'Alice',
        lastName: 'E2E-Test',
        email: 'alice.e2e@test.com',
        phone: '+1 555-0199',
      });
    expect(guestRes.status).toBe(201);
    guestId = guestRes.body.data.id;
  });

  it('full lifecycle: create reservation → check in → post charges → pay → check out', async () => {
    // ═══════════════════════════════════════════════════════════════
    // PHASE 1: Create Reservation
    // ═══════════════════════════════════════════════════════════════
    const arrival = new Date();
    arrival.setDate(arrival.getDate() + 1); // tomorrow
    const departure = new Date(arrival);
    departure.setDate(departure.getDate() + 2); // 2 nights

    const createRes = await request(app)
      .post('/v1/reservations')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        propertyId,
        guestId,
        arrivalDate: arrival.toISOString(),
        departureDate: departure.toISOString(),
        nights: 2,
        adults: 2,
        children: 0,
        roomTypeId,
        source: 'direct',
        notes: 'E2E test reservation',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data).toMatchObject({
      propertyId,
      guestId,
      status: 'confirmed',
      source: 'direct',
    });
    expect(createRes.body.data.confirmationNumber).toMatch(/^VMD-/);
    reservationId = createRes.body.data.id;
    _confirmationNumber = createRes.body.data.confirmationNumber;

    // Verify folio was auto-created
    const getRes = await request(app)
      .get(`/v1/reservations/${reservationId}`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.folio).toBeDefined();
    folioId = getRes.body.data.folio.id;

    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: Check In
    // ═══════════════════════════════════════════════════════════════
    const checkInRes = await request(app)
      .post(`/v1/reservations/${reservationId}/check-in`)
      .set('Authorization', `Bearer ${auth.token}`);

    expect(checkInRes.status).toBe(200);
    expect(checkInRes.body.data.status).toBe('checked_in');

    // Verify reservation status updated
    const getAfterCheckIn = await request(app)
      .get(`/v1/reservations/${reservationId}`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(getAfterCheckIn.body.data.status).toBe('checked_in');

    // ═══════════════════════════════════════════════════════════════
    // PHASE 3: Post Folio Charges (room charges)
    // ═══════════════════════════════════════════════════════════════
    const chargeRes = await request(app)
      .post(`/v1/folios/${folioId}/charges`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        type: 'room_charge',
        description: 'Room charge - Night 1',
        amount: 150.0,
        quantity: 1,
      });
    expect(chargeRes.status).toBe(201);
    expect(chargeRes.body.data.amount).toBe(150);

    const charge2Res = await request(app)
      .post(`/v1/folios/${folioId}/charges`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        type: 'room_charge',
        description: 'Room charge - Night 2',
        amount: 150.0,
        quantity: 1,
      });
    expect(charge2Res.status).toBe(201);

    // Add incidental charge
    const incidentalRes = await request(app)
      .post(`/v1/folios/${folioId}/charges`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        type: 'service',
        description: 'Minibar',
        amount: 25.5,
        quantity: 1,
      });
    expect(incidentalRes.status).toBe(201);

    // Verify folio balance
    const folioRes = await request(app)
      .get(`/v1/folios/${folioId}`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(folioRes.status).toBe(200);
    expect(folioRes.body.data.totalCharges).toBe(325.5); // 150 + 150 + 25.5
    expect(folioRes.body.data.balance).toBe(325.5);
    expect(folioRes.body.data.items).toHaveLength(3);

    // ═══════════════════════════════════════════════════════════════
    // PHASE 4: Post Payment
    // ═══════════════════════════════════════════════════════════════
    const paymentRes = await request(app)
      .post(`/v1/folios/${folioId}/payments`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        type: 'card',
        description: 'Full settlement',
        amount: 325.5,
      });
    expect(paymentRes.status).toBe(201);

    // Verify folio is now balanced
    const folioAfterPayment = await request(app)
      .get(`/v1/folios/${folioId}`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(folioAfterPayment.status).toBe(200);
    expect(folioAfterPayment.body.data.totalPayments).toBe(325.5);
    expect(folioAfterPayment.body.data.balance).toBe(0);

    // ═══════════════════════════════════════════════════════════════
    // PHASE 5: Check Out
    // ═══════════════════════════════════════════════════════════════
    const checkOutRes = await request(app)
      .post(`/v1/reservations/${reservationId}/check-out`)
      .set('Authorization', `Bearer ${auth.token}`);

    expect(checkOutRes.status).toBe(200);
    expect(checkOutRes.body.data.status).toBe('checked_out');

    // Final verification
    const finalRes = await request(app)
      .get(`/v1/reservations/${reservationId}`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(finalRes.status).toBe(200);
    expect(finalRes.body.data.status).toBe('checked_out');
    expect(finalRes.body.data.folio.balance).toBe(0);
  });

  it('prevents check-in of already checked-in reservation', async () => {
    const arrival = new Date();
    arrival.setDate(arrival.getDate() + 1);
    const departure = new Date(arrival);
    departure.setDate(departure.getDate() + 1);

    const createRes = await request(app)
      .post('/v1/reservations')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        propertyId,
        guestId,
        arrivalDate: arrival.toISOString(),
        departureDate: departure.toISOString(),
        nights: 1,
        adults: 1,
      });
    reservationId = createRes.body.data.id;

    // First check-in succeeds
    const checkIn1 = await request(app)
      .post(`/v1/reservations/${reservationId}/check-in`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(checkIn1.status).toBe(200);

    // Second check-in fails
    const checkIn2 = await request(app)
      .post(`/v1/reservations/${reservationId}/check-in`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(checkIn2.status).toBe(409);
    expect(checkIn2.body.error.code).toBe('CONFLICT');
  });

  it('prevents check-out of un-checked-in reservation', async () => {
    const arrival = new Date();
    arrival.setDate(arrival.getDate() + 1);
    const departure = new Date(arrival);
    departure.setDate(departure.getDate() + 1);

    const createRes = await request(app)
      .post('/v1/reservations')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        propertyId,
        guestId,
        arrivalDate: arrival.toISOString(),
        departureDate: departure.toISOString(),
        nights: 1,
        adults: 1,
      });
    reservationId = createRes.body.data.id;

    // Try to check out without checking in first
    const checkOut = await request(app)
      .post(`/v1/reservations/${reservationId}/check-out`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(checkOut.status).toBe(409);
    expect(checkOut.body.error.code).toBe('CONFLICT');
  });

  it('supports cancellation before check-in', async () => {
    const arrival = new Date();
    arrival.setDate(arrival.getDate() + 1);
    const departure = new Date(arrival);
    departure.setDate(departure.getDate() + 2);

    const createRes = await request(app)
      .post('/v1/reservations')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        propertyId,
        guestId,
        arrivalDate: arrival.toISOString(),
        departureDate: departure.toISOString(),
        nights: 2,
        adults: 2,
      });
    reservationId = createRes.body.data.id;

    // Cancel the reservation
    const cancelRes = await request(app)
      .post(`/v1/reservations/${reservationId}/cancel`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('cancelled');

    // Cannot check in cancelled reservation
    const checkIn = await request(app)
      .post(`/v1/reservations/${reservationId}/check-in`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(checkIn.status).toBe(409);
  });
});
