/* apps/api/tests/e2e/folio-billing.test.ts */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { buildTestApp, registerTestTenant, type TestTenant } from '../helpers/server.js';
import { prisma } from '../../src/common/prisma.js';

describe('Folio & Billing E2E', () => {
  let app: Express;
  let tenant: TestTenant;
  let propertyId: string;
  let _roomTypeId: string;
  let _roomId: string;
  let guestId: string;
  let _reservationId: string;
  let folioId: string;

  beforeAll(async () => {
    app = buildTestApp();
    tenant = await registerTestTenant(app);

    // Create property
    const property = await prisma.property.create({
      data: {
        tenantId: tenant.tenantId,
        name: 'Test Property',
        code: 'TEST-01',
      },
    });
    propertyId = property.id;

    // Create room type
    const roomType = await prisma.roomType.create({
      data: {
        tenantId: tenant.tenantId,
        propertyId,
        name: 'Standard',
        code: 'STD',
      },
    });
    _roomTypeId = roomType.id;

    // Create room
    const room = await prisma.room.create({
      data: {
        tenantId: tenant.tenantId,
        propertyId,
        roomTypeId: roomType.id,
        number: '101',
      },
    });
    _roomId = room.id;

    // Create guest
    const guest = await prisma.guest.create({
      data: {
        tenantId: tenant.tenantId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
    });
    guestId = guest.id;

    // Create reservation (unique confirmation number per run — the dev DB
    // persists across runs and the field is unique)
    const reservation = await prisma.reservation.create({
      data: {
        tenantId: tenant.tenantId,
        propertyId,
        guestId,
        confirmationNumber: `E2E-${Date.now().toString(36).toUpperCase()}`,
        status: 'confirmed',
        arrivalDate: new Date('2026-10-01'),
        departureDate: new Date('2026-10-03'),
        nights: 2,
        adults: 2,
        totalAmount: 300,
        balance: 300,
      },
    });
    _reservationId = reservation.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /v1/folios', () => {
    it('creates a folio for a reservation', async () => {
      const response = await request(app)
        .post('/v1/folios')
        .set('Authorization', `Bearer ${tenant.token}`)
        .send({
          reservationId: _reservationId,
          type: 'guest',
        });

      expect(response.status).toBe(201);
      const data = response.body.data;
      expect(data).toMatchObject({
        reservationId: _reservationId,
        status: 'open',
      });
      // Prisma Decimal serializes as a string in JSON responses
      expect(Number(data.totalCharges)).toBe(0);
      expect(Number(data.totalPayments)).toBe(0);
      expect(Number(data.balance)).toBe(0);

      folioId = data.id;
    });

    it('rejects duplicate folio for same reservation', async () => {
      const response = await request(app)
        .post('/v1/folios')
        .set('Authorization', `Bearer ${tenant.token}`)
        .send({
          reservationId: _reservationId,
          type: 'guest',
        });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /v1/folios/:id/charges', () => {
    it('posts a charge to the folio', async () => {
      const response = await request(app)
        .post(`/v1/folios/${folioId}/charges`)
        .set('Authorization', `Bearer ${tenant.token}`)
        .send({
          type: 'room_charge',
          description: 'Room charge - Night 1',
          amount: 150,
          quantity: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('room_charge');
      expect(Number(response.body.data.amount)).toBe(150);
    });

    it('updates folio balance after charge', async () => {
      const response = await request(app)
        .get(`/v1/folios/${folioId}`)
        .set('Authorization', `Bearer ${tenant.token}`);

      expect(response.status).toBe(200);
      const data = response.body.data;
      expect(Number(data.totalCharges)).toBe(150);
      expect(Number(data.balance)).toBe(150);
    });
  });

  describe('POST /v1/folios/:id/payments', () => {
    it('posts a payment to the folio', async () => {
      const response = await request(app)
        .post(`/v1/folios/${folioId}/payments`)
        .set('Authorization', `Bearer ${tenant.token}`)
        .send({
          type: 'card',
          amount: 100,
        });

      expect(response.status).toBe(201);
    });

    it('updates folio balance after payment', async () => {
      const response = await request(app)
        .get(`/v1/folios/${folioId}`)
        .set('Authorization', `Bearer ${tenant.token}`);

      expect(response.status).toBe(200);
      const data = response.body.data;
      expect(Number(data.totalCharges)).toBe(150);
      expect(Number(data.totalPayments)).toBe(100);
      expect(Number(data.balance)).toBe(50);
    });
  });

  describe('POST /v1/folios/:id/charges/:chargeId/reverse', () => {
    it('reverses a charge', async () => {
      const folioResponse = await request(app)
        .get(`/v1/folios/${folioId}`)
        .set('Authorization', `Bearer ${tenant.token}`);

      const roomCharge = folioResponse.body.data.items.find(
        (i: { type: string }) => i.type === 'room_charge'
      );
      const chargeId = roomCharge.id;

      const response = await request(app)
        .post(`/v1/folios/${folioId}/charges/${chargeId}/reverse`)
        .set('Authorization', `Bearer ${tenant.token}`)
        .send({
          reason: 'Guest complaint',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.type).toBe('adjustment');
      expect(Number(response.body.data.amount)).toBe(-150);
    });
  });

  describe('POST /v1/folios/:id/transfer-to-city-ledger', () => {
    it('transfers folio to city ledger', async () => {
      const response = await request(app)
        .post(`/v1/folios/${folioId}/transfer-to-city-ledger`)
        .set('Authorization', `Bearer ${tenant.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('transferred');
    });
  });
});
