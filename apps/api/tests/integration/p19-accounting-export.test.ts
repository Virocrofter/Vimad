/* P19 — C6-prime remainder gates: config, Xero/Pastel export, VAT201 prep.
 * S1: PUT/GET config round-trip; re-PUT updates one row.
 * S2: Xero export — mapped account code applied, header correct, debit/credit
 *     legs formatted; unmapped account passes through raw.
 * S3: Pastel export — VatIndicator Y on REV: rows, N on RCV:.
 * S4: VAT201 boxes — 15% invoice, zero-rated invoice, credit note (negative)
 *     net into boxes 1A/4/2; box 14 null (accountant-side input tax).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma: any = new PrismaClient();
const runId = Date.now().toString(36);
let app: any;
let agent: any;
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
  const mod: any = await import('../helpers/server.js');
  app = mod.buildTestApp?.() ?? mod.app;
  agent = await mod.registerTestAgent(app);
  const t = agent.tenantId;

  const prop = await prisma.property.create({
    data: {
      tenantId: t,
      name: 'P19',
      code: ('P19' + runId)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(-12),
    },
  });
  const rt = await prisma.roomType.create({
    data: {
      tenantId: t,
      propertyId: prop.id,
      name: 'P19 RT',
      code: 'P19RT' + runId.toUpperCase().slice(-4),
    },
  });
  const room = await prisma.room.create({
    data: { tenantId: t, propertyId: prop.id, roomTypeId: rt.id, number: 'P19-1' },
  });
  const guest = await prisma.guest.create({
    data: {
      tenantId: t,
      firstName: 'P19',
      lastName: 'Acct',
      email: 'p19-' + runId + '@example.com',
    },
  });
  const res = await prisma.reservation.create({
    data: {
      tenantId: t,
      propertyId: prop.id,
      guestId: guest.id,
      confirmationNumber: 'P19-' + runId.toUpperCase(),
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
  await prisma.payment.create({
    data: {
      tenantId: t,
      propertyId: prop.id,
      reservationId: res.id,
      guestId: guest.id,
      folioId: folio.id,
      reference: 'P19PAY-' + runId,
      amountMinor: 40000,
      currency: 'ZAR',
      type: 'deposit',
      status: 'success',
      postedToFolio: true,
      channel: 'card',
      createdAt: new Date(),
    },
  });

  const invA = await prisma.taxInvoice.create({
    data: {
      tenantId: t,
      propertyId: prop.id,
      number: 'P19A-' + runId,
      type: 'tax_invoice',
      status: 'open',
      currency: 'ZAR',
      subtotalExVat: 1000,
      vatRate: 15,
      vatAmount: 150,
      totalInclVat: 1150,
      propertyName: 'P19',
      guestName: 'P19 Acct',
    },
  });
  await prisma.taxInvoice.create({
    data: {
      tenantId: t,
      propertyId: prop.id,
      number: 'P19B-' + runId,
      type: 'tax_invoice',
      status: 'open',
      currency: 'ZAR',
      subtotalExVat: 500,
      vatRate: 0,
      vatAmount: 0,
      totalInclVat: 500,
      propertyName: 'P19',
      guestName: 'P19 Acct',
    },
  });
  await prisma.taxInvoice.create({
    data: {
      tenantId: t,
      propertyId: prop.id,
      number: 'P19C-' + runId,
      type: 'credit_note',
      status: 'open',
      currency: 'ZAR',
      subtotalExVat: 200,
      vatRate: 15,
      vatAmount: 30,
      totalInclVat: 230,
      originalId: invA.id,
      propertyName: 'P19',
      guestName: 'P19 Acct',
    },
  });

  ctx.t = t;
  ctx.prop = prop;
  ctx.folio = folio;
  ctx.res = res;
  console.log('P19 seeded');
}, 90000);

describe('P19 accounting export gates', () => {
  const H = () => ({ Authorization: 'Bearer ' + agent.token });

  it('S1: config round-trip + single-row upsert', async () => {
    const put = await request(app)
      .put('/v1/accounting/config')
      .set(H())
      .send({ propertyId: ctx.prop.id, mappings: { 'REV:room': '4000' } });
    expect(put.status).toBe(200);

    const get = await request(app)
      .get('/v1/accounting/config?propertyId=' + ctx.prop.id)
      .set(H());
    expect(get.status).toBe(200);
    expect((get.body.data.mappings as any)['REV:room']).toBe('4000');

    await request(app)
      .put('/v1/accounting/config')
      .set(H())
      .send({ propertyId: ctx.prop.id, mappings: { 'REV:room': '4100' } });
    const rows = await prisma.accountingConfig.findMany({ where: { propertyId: ctx.prop.id } });
    expect(rows.length).toBe(1);
    expect((rows[0].mappings as any)['REV:room']).toBe('4100');
    console.log('P19 S1 OK');
  }, 60000);

  it('S2: Xero export — mapping applied, header + legs correct', async () => {
    const res = await request(app)
      .post('/v1/accounting/export')
      .set(H())
      .send({ propertyId: ctx.prop.id, format: 'xero', dateFrom: day(-2), dateTo: day(0) });
    expect(res.status).toBe(200);
    const csv: string = res.body.data.csv;
    expect(csv.split('\n')[0]).toBe(
      'JournalDate,JournalNumber,Reference,AccountCode,Description,Debits,Credits'
    );
    expect(csv).toContain('4100');
    expect(csv).toContain('RCV:card');
    expect(csv).toContain('1000.00');
    expect(csv).toContain('400.00');
    console.log('P19 S2 OK');
  }, 60000);

  it('S3: Pastel export — VatIndicator Y on REV:, N on RCV:', async () => {
    const res = await request(app)
      .post('/v1/accounting/export')
      .set(H())
      .send({ propertyId: ctx.prop.id, format: 'pastel', dateFrom: day(-2), dateTo: day(0) });
    expect(res.status).toBe(200);
    const csv: string = res.body.data.csv;
    expect(csv.split('\n')[0]).toBe('Date,Account,Reference,Description,Debit,Credit,VatIndicator');
    const lines = csv.split('\n').slice(1);
    const rev = lines.find((l) => l.includes('4100'));
    const rcv = lines.find((l) => l.includes('RCV:card'));
    expect(rev).toBeTruthy();
    expect(rev!.endsWith(',Y')).toBe(true);
    expect(rcv).toBeTruthy();
    expect(rcv!.endsWith(',N')).toBe(true);
    console.log('P19 S3 OK');
  }, 60000);

  it('S4: VAT201 boxes net credit notes; box 14 null', async () => {
    const svc: any = await import('../../src/modules/reports/reports.service.js');
    const run = await svc.runReport(prisma, ctx.t, undefined, 'vat201_prep', {
      dateFrom: day(-2),
      dateTo: day(0),
    });
    expect(run.status).toBe('COMPLETED');
    const rows = (run.result as any).rows ?? [];
    const box = (b: string) => rows.find((r: any) => r.box === b);

    expect(Number(box('1A').amount)).toBe(800); // 1000 - 200 credit
    expect(Number(box('4').amount)).toBe(120); // 150 - 30
    expect(Number(box('2').amount)).toBe(500); // zero-rated
    expect(box('14').amount).toBeNull();
    console.log('P19 S4 OK');
  }, 60000);
});

afterAll(async () => {
  await prisma.$disconnect();
});
