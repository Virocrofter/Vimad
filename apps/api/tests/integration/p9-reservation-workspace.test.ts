/* P9 — Reservation workspace read-model (addendum 5.3, slice #2).
 * S1 shape: header, validActions derived from the P5 matrix (confirmed ->
 *    check-in/cancel/no-show; NEVER check-out), sections present.
 * S2 sections populated: companions, folio items, payments, tasks, traces,
 *    timeline, messages; balance/settlement indicator.
 * S3 change-preview: per-night availability of the room type with conflict
 *    flags when another stay occupies the last room; pricing basis present.
 * S4 terminal state: checked_out -> validActions is empty.
 * S5 tenant isolation.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma: any = new PrismaClient();
const runId = Date.now().toString(36);
const propCode =
  'P9' +
  runId
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(-6);

let app: any;
let agent: any;
const ctx: Record<string, any> = {};

async function seedReservation(tag: string, status: string, extra: any = {}) {
  const g = await prisma.guest.create({
    data: {
      tenantId: agent.tenantId,
      firstName: 'P9',
      lastName: tag,
      email: 'p9-' + tag + '-' + runId + '@example.com',
    },
  });
  const d = new Date();
  d.setDate(d.getDate() + 2);
  const res = await prisma.reservation.create({
    data: {
      tenantId: agent.tenantId,
      propertyId: ctx.propertyId,
      guestId: g.id,
      confirmationNumber: 'P9-' + tag + '-' + runId.toUpperCase(),
      status,
      arrivalDate: new Date(),
      departureDate: d,
      nights: 2,
      totalAmount: 2000,
      balance: 300,
      ...extra,
    },
  });
  return { reservation: res, guest: g };
}

beforeAll(async () => {
  const mod: any = await import('../helpers/server.js');
  app = mod.buildTestApp?.() ?? mod.app;
  agent = await mod.registerTestAgent(app);
  const t = await prisma.tenant.findUnique({ where: { id: agent.tenantId } });
  const prop = await prisma.property.create({
    data: { tenantId: t.id, name: 'P9 Workspace Hotel', code: propCode },
  });
  ctx.propertyId = prop.id;
  const rt = await prisma.roomType.create({
    data: { tenantId: t.id, propertyId: prop.id, name: 'P9 Type', code: 'P9RT' },
  });
  ctx.roomTypeId = rt.id;
  ctx.rooms = [];
  for (const num of ['P9-1', 'P9-2']) {
    ctx.rooms.push(
      await prisma.room.create({
        data: { tenantId: t.id, propertyId: prop.id, roomTypeId: rt.id, number: num },
      })
    );
  }
  const rp = await prisma.ratePlan.create({
    data: {
      tenantId: t.id,
      propertyId: prop.id,
      roomTypeId: rt.id,
      name: 'P9 Rate',
      code: 'P9RATE',
      baseRate: 1000,
    },
  });
  ctx.ratePlanId = rp.id;
  console.log('P9 seeded', propCode);
}, 90000);

describe('P9 reservation workspace', () => {
  it('S1+S2+S3: aggregate shape, matrix-derived actions, populated sections, preview', async () => {
    const { reservation, guest } = await seedReservation('main', 'confirmed', {
      roomTypeId: ctx.roomTypeId,
      ratePlanId: ctx.ratePlanId,
      eta: '15:00',
    });
    ctx.mainId = reservation.id;
    await prisma.folio.create({
      data: {
        tenantId: agent.tenantId,
        reservationId: reservation.id,
        balance: 300,
        totalCharges: 2000,
      },
    });
    await prisma.folioItem
      .create({
        data: {
          folio: { connect: { reservationId: reservation.id } },
          type: 'room_charge',
          description: 'Room',
          amount: 1000,
        },
      })
      .catch(async () => {
        const folio = await prisma.folio.findUnique({ where: { reservationId: reservation.id } });
        await prisma.folioItem.create({
          data: { folioId: folio.id, type: 'room_charge', description: 'Room', amount: 1000 },
        });
      });
    await prisma.payment.create({
      data: {
        tenantId: agent.tenantId,
        propertyId: ctx.propertyId,
        reservationId: reservation.id,
        reference: 'P9-PAY-' + runId,
        amountMinor: 170000,
        type: 'card',
        status: 'success',
      },
    });
    await prisma.task.create({
      data: {
        tenantId: agent.tenantId,
        propertyId: ctx.propertyId,
        reservationId: reservation.id,
        department: 'housekeeping',
        title: 'High floor',
        status: 'open',
      },
    });
    await prisma.reservationTrace.create({
      data: { tenantId: agent.tenantId, reservationId: reservation.id, body: 'VIP arrival' },
    });
    await prisma.reservationCompanion.create({
      data: {
        tenantId: agent.tenantId,
        reservationId: reservation.id,
        firstName: 'P9',
        lastName: 'Companion',
        sharesFolio: true,
      },
    });
    await prisma.auditLog.create({
      data: {
        tenantId: agent.tenantId,
        userId: agent.userId,
        action: 'reservation.update',
        entity: 'reservation',
        entityId: reservation.id,
      },
    });
    // Occupying stay on night 1 in the OTHER room -> one preview night conflicts
    const other = await seedReservation('other', 'checked_in');
    await prisma.reservationStay.create({
      data: {
        reservationId: other.reservation.id,
        roomId: ctx.rooms[1].id,
        date: new Date(),
        rate: 1000,
      },
    });
    // Occupy the second room as well so night 0 is genuinely sold out
    const other2 = await seedReservation('other2', 'checked_in');
    await prisma.reservationStay.create({
      data: {
        reservationId: other2.reservation.id,
        roomId: ctx.rooms[0].id,
        date: new Date(),
        rate: 1000,
      },
    });

    const res = await request(app)
      .get('/v1/reservation-workspace/' + reservation.id)
      .set('Authorization', 'Bearer ' + agent.token);
    expect(res.status).toBe(200);
    const d = res.body.data;

    // S1
    expect(d.header.confirmationNumber).toContain('P9-main');
    expect(d.header.guest.id).toBe(guest.id);
    expect(d.header.roomType.id).toBe(ctx.roomTypeId);
    expect(d.header.eta).toBe('15:00');
    expect(d.header.balance).toBe(300);
    const actions = d.validActions.map((a: any) => a.action);
    expect(actions).toContain('check-in');
    expect(actions).toContain('cancel');
    expect(actions).toContain('no-show');
    expect(actions).not.toContain('check-out');

    // S2
    expect(d.companions.length).toBe(1);
    expect(d.payments.some((p: any) => p.status === 'success')).toBe(true);
    expect(d.tasks.length).toBe(1);
    expect(d.traces[0].body).toBe('VIP arrival');
    expect(d.timeline.some((t: any) => t.action === 'reservation.update')).toBe(true);
    expect(Array.isArray(d.messages)).toBe(true);
    expect(d.header.settledMinor).toBe(170000);

    // S3
    expect(d.preview.nights.length).toBe(2);
    expect(d.preview.nightlyRate).toBe(1000);
    expect(d.preview.nights[0].conflict).toBe(true); // other stay took the last free room
    expect(d.preview.nights[1].conflict).toBe(false);
    console.log('P9 workspace OK for', d.header.confirmationNumber);
  }, 60000);

  it('S4: terminal states expose no actions', async () => {
    const { reservation } = await seedReservation('gone', 'checked_out', {
      checkedInAt: new Date(),
      checkedOutAt: new Date(),
    });
    const res = await request(app)
      .get('/v1/reservation-workspace/' + reservation.id)
      .set('Authorization', 'Bearer ' + agent.token);
    expect(res.status).toBe(200);
    expect(res.body.data.validActions).toEqual([]);
  }, 60000);

  it('S5: another tenant cannot read the workspace', async () => {
    const mod: any = await import('../helpers/server.js');
    const outsider = await mod.registerTestAgent(app);
    const res = await request(app)
      .get('/v1/reservation-workspace/' + ctx.mainId)
      .set('Authorization', 'Bearer ' + outsider.token);
    expect(res.status).toBe(404);
  }, 60000);
});

afterAll(async () => {
  await prisma.$disconnect();
});
