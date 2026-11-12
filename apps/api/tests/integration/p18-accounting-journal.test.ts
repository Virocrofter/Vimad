/* P18 — Bulk 4 gate: accounting_journal definition + runner (C2'/C6').
 * S1: definition registered (Finance category, date range + property params).
 * S2: runReport end-to-end — in-window charge and payment appear with
 *     correct debit/credit legs; out-window postings excluded; totals
 *     reconcile; run persisted as COMPLETED TenantReportRun (audit trail).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma: any = new PrismaClient();
const runId = Date.now().toString(36);
let svc: any;
const ctx: Record<string, any> = {};

const day = (n: number) => {
  const d = new Date(Date.now() + n * 86400_000);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
};

beforeAll(async () => {
  await import('../helpers/server.js');
  svc = await import('../../src/modules/reports/reports.service.js');
  const defs = await import('../../src/modules/reports/reports.definitions.js');

  const mod: any = await import('../helpers/server.js');
  const app = mod.buildTestApp?.() ?? mod.app;
  const agent = await mod.registerTestAgent(app);
  const t = agent.tenantId;

  const prop = await prisma.property.create({
    data: {
      tenantId: t,
      name: 'P18',
      code: ('P18' + runId)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(-12),
    },
  });
  const rt = await prisma.roomType.create({
    data: {
      tenantId: t,
      propertyId: prop.id,
      name: 'P18 RT',
      code: 'P18RT' + runId.toUpperCase().slice(-4),
    },
  });
  const guest = await prisma.guest.create({
    data: {
      tenantId: t,
      firstName: 'P18',
      lastName: 'Journal',
      email: 'p18-' + runId + '@example.com',
    },
  });
  const res = await prisma.reservation.create({
    data: {
      tenantId: t,
      propertyId: prop.id,
      guestId: guest.id,
      confirmationNumber: 'P18-' + runId.toUpperCase(),
      status: 'checked_in',
      arrivalDate: new Date(),
      departureDate: new Date(Date.now() + 86400_000),
      nights: 1,
      totalAmount: 1000,
      balance: 500,
    },
  });
  const folio = await prisma.folio.create({
    data: { tenantId: t, reservationId: res.id, status: 'open' },
  });

  await prisma.folioItem.create({
    data: {
      folioId: folio.id,
      type: 'room',
      description: 'Room charge',
      amount: 1000,
      postedAt: new Date(),
    },
  });
  await prisma.folioItem.create({
    data: {
      folioId: folio.id,
      type: 'room',
      description: 'Old charge',
      amount: 500,
      postedAt: new Date(Date.now() - 30 * 86400_000),
    },
  });
  await prisma.payment.create({
    data: {
      tenantId: t,
      propertyId: prop.id,
      reservationId: res.id,
      guestId: guest.id,
      folioId: folio.id,
      reference: 'P18PAY-' + runId,
      amountMinor: 40000,
      currency: 'ZAR',
      type: 'deposit',
      status: 'success',
      postedToFolio: true,
      channel: 'card',
      createdAt: new Date(),
    },
  });
  await prisma.payment.create({
    data: {
      tenantId: t,
      propertyId: prop.id,
      reference: 'P18OLD-' + runId,
      amountMinor: 9900,
      currency: 'ZAR',
      type: 'deposit',
      status: 'success',
      channel: 'card',
      createdAt: new Date(Date.now() - 30 * 86400_000),
    },
  });

  ctx.t = t;
  ctx.prop = prop;
  ctx.folio = folio;
  ctx.res = res;
  expect(defs.getDefinition('accounting_journal')).toBeTruthy();
  console.log('P18 seeded');
}, 90000);

describe('P18 accounting journal (C2-prime/C6-prime)', () => {
  it('S1: definition registered with Finance category', async () => {
    const defs = await import('../../src/modules/reports/reports.definitions.js');
    const def = defs.getDefinition('accounting_journal');
    expect(def).toBeTruthy();
    expect(def.category).toBe('Finance');
    console.log('P18 S1 OK');
  });

  it('S2: runReport — in-window postings only, correct legs, reconciled totals, persisted run', async () => {
    const run = await svc.runReport(prisma, ctx.t, undefined, 'accounting_journal', {
      dateFrom: day(-2),
      dateTo: day(0),
    });
    expect(run.status).toBe('COMPLETED');
    const rows = (run.result as any).rows ?? [];
    expect(rows.length).toBeGreaterThanOrEqual(2);

    const descs = rows.map((r: any) => String(r.description));
    expect(descs).toContain('Room charge');
    expect(descs).not.toContain('Old charge');

    const charge = rows.find((r: any) => r.description === 'Room charge');
    expect(Number(charge.debit)).toBe(1000);
    expect(Number(charge.credit)).toBe(0);
    expect(String(charge.reference)).toBe(ctx.res.id);

    const pay = rows.find((r: any) => String(r.reference).startsWith('P18PAY-'));
    expect(pay).toBeTruthy();
    expect(Number(pay.credit)).toBe(400);
    expect(rows.some((r: any) => String(r.reference).startsWith('P18OLD-'))).toBe(false);

    const totalDebit = rows.reduce((s: number, r: any) => s + Number(r.debit), 0);
    const totalCredit = rows.reduce((s: number, r: any) => s + Number(r.credit), 0);
    expect(totalDebit).toBe(1000);
    expect(totalCredit).toBe(400);

    expect(run.rowCount).toBe(rows.length);
    expect(run.definitionKey).toBe('accounting_journal');
    console.log('P18 S2 OK');
  }, 60000);
});

afterAll(async () => {
  await prisma.$disconnect();
});
