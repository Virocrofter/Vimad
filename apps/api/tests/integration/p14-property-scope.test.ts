/* P14 — Switcher-aware property scoping (Bulk 0.1).
 * Verifies attachPropertyScope's effectivePropertyIds = user restrictions ∩
 * x-property-id header on the opted-in list surfaces.
 * S1 reservations: no header = tenant-wide; valid header = narrowed;
 *    foreign-tenant header = ignored (tenant-wide fallback); valid property
 *    with no rows = empty, not error.
 * S2 folios + rates: narrowed via their property paths (folio has no
 *    propertyId column — filters through reservation).
 * S3 guests: tenant-level records narrowed to guests WITH STAYS at the
 *    property (a stay-less guest disappears — documented semantics);
 *    another tenant cannot narrow us.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma: any = new PrismaClient();
const runId = Date.now().toString(36);
let app: any;
let agent: any;
let outsider: any;
const ctx: Record<string, any> = {};

const rows = (res: any) => {
  const d = res.body?.data;
  const arr = Array.isArray(d) ? d : (d?.items ?? d?.data ?? []);
  return arr;
};

beforeAll(async () => {
  const mod: any = await import('../helpers/server.js');
  app = mod.buildTestApp?.() ?? mod.app;
  agent = await mod.registerTestAgent(app);
  outsider = await mod.registerTestAgent(app);
  const t = agent.tenantId;

  const mk = async (suffix: string) => {
    const prop = await prisma.property.create({
      data: {
        tenantId: t,
        name: 'P14 ' + suffix,
        code: ('P14' + suffix + runId)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(-12),
      },
    });
    const rt = await prisma.roomType.create({
      data: { tenantId: t, propertyId: prop.id, name: 'P14 RT ' + suffix, code: 'RT' + suffix },
    });
    const guest = await prisma.guest.create({
      data: {
        tenantId: t,
        firstName: 'P14',
        lastName: suffix,
        email: 'p14-' + suffix.toLowerCase() + '-' + runId + '@example.com',
      },
    });
    const res = await prisma.reservation.create({
      data: {
        tenantId: t,
        propertyId: prop.id,
        guestId: guest.id,
        confirmationNumber: 'P14-' + suffix + '-' + runId.toUpperCase(),
        status: 'confirmed',
        arrivalDate: new Date(),
        departureDate: new Date(Date.now() + 86400_000),
        nights: 1,
        totalAmount: 1000,
        balance: 1000,
      },
    });
    const folio = await prisma.folio.create({
      data: { tenantId: t, reservationId: res.id, status: 'open' },
    });
    const rate = await prisma.ratePlan.create({
      data: {
        tenantId: t,
        propertyId: prop.id,
        roomTypeId: rt.id,
        name: 'P14 Rate ' + suffix,
        code: 'RATE' + suffix,
        baseRate: 1000,
      },
    });
    return { prop, guest, res, folio, rate };
  };

  ctx.a = await mk('A');
  ctx.b = await mk('B');
  // property C: valid, but empty (no reservations) — empty-result case
  ctx.c = await prisma.property.create({
    data: {
      tenantId: t,
      name: 'P14 Empty',
      code: ('P14C' + runId)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(-12),
    },
  });
  // stay-less guest: must disappear when the switcher is set (documented)
  ctx.orphan = await prisma.guest.create({
    data: {
      tenantId: t,
      firstName: 'P14',
      lastName: 'Orphan',
      email: 'p14-orphan-' + runId + '@example.com',
    },
  });
  // outsider property in another tenant — foreign header must be ignored
  ctx.foreign = await prisma.property.create({
    data: {
      tenantId: outsider.tenantId,
      name: 'P14 Foreign',
      code: ('P14F' + runId)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(-12),
    },
  });
  console.log('P14 seeded');
}, 90000);

describe('P14 property switcher scoping', () => {
  it('S1: reservations — tenant-wide default, narrowed by header, foreign ignored, empty valid', async () => {
    const H = (pid?: string) => ({
      Authorization: 'Bearer ' + agent.token,
      ...(pid ? { 'x-property-id': pid } : {}),
    });

    const all = await request(app).get('/v1/reservations?page=1&pageSize=50').set(H());
    expect(all.status).toBe(200);
    const seen = new Set(rows(all).map((r: any) => r.propertyId));
    expect(seen.has(ctx.a.prop.id)).toBe(true);
    expect(seen.has(ctx.b.prop.id)).toBe(true);

    const aOnly = await request(app)
      .get('/v1/reservations?page=1&pageSize=50')
      .set(H(ctx.a.prop.id));
    const aRows = rows(aOnly);
    expect(aRows.length).toBeGreaterThan(0);
    expect(aRows.every((r: any) => r.propertyId === ctx.a.prop.id)).toBe(true);

    const foreign = await request(app)
      .get('/v1/reservations?page=1&pageSize=50')
      .set(H(ctx.foreign.id));
    expect(new Set(rows(foreign).map((r: any) => r.propertyId)).has(ctx.b.prop.id)).toBe(true);

    const empty = await request(app).get('/v1/reservations?page=1&pageSize=50').set(H(ctx.c.id));
    expect(empty.status).toBe(200);
    expect(rows(empty).length).toBe(0);
    console.log('P14 S1 OK');
  }, 60000);

  it('S2: folios (via reservation) + rate plans narrowed', async () => {
    const H = { Authorization: 'Bearer ' + agent.token, 'x-property-id': ctx.a.prop.id };

    const folios = await request(app).get('/v1/folios?page=1&pageSize=50').set(H);
    expect(folios.status).toBe(200);
    const fRows = rows(folios);
    expect(fRows.some((f: any) => f.id === ctx.a.folio.id)).toBe(true);
    expect(fRows.some((f: any) => f.id === ctx.b.folio.id)).toBe(false);

    const rates = await request(app).get('/v1/rates?page=1&pageSize=50').set(H);
    expect(rates.status).toBe(200);
    const rRows = rows(rates);
    expect(rRows.some((r: any) => r.id === ctx.a.rate.id)).toBe(true);
    expect(rRows.some((r: any) => r.id === ctx.b.rate.id)).toBe(false);
    console.log('P14 S2 OK');
  }, 60000);

  it('S3: guests narrowed to guests WITH STAYS at property; orphan excluded', async () => {
    const H = { Authorization: 'Bearer ' + agent.token, 'x-property-id': ctx.a.prop.id };
    const res = await request(app).get('/v1/guests?page=1&pageSize=50').set(H);
    expect(res.status).toBe(200);
    const ids = rows(res).map((g: any) => g.id);
    expect(ids).toContain(ctx.a.guest.id);
    expect(ids).not.toContain(ctx.b.guest.id);
    expect(ids).not.toContain(ctx.orphan.id); // documented: no stays at A
    console.log('P14 S3 OK');
  }, 60000);
});

afterAll(async () => {
  await prisma.$disconnect();
});
