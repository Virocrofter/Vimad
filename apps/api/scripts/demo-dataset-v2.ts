/* apps/api/scripts/demo-dataset-v2.ts
 * Demo dataset v2 — coherent 2-property scenario for pilot onboarding.
 * Tenant slug: demo-v2 (login: owner@demov2.test / DemoV2!2026 — role: Owner)
 * Properties: URB-01 urban 4* (12 rooms) + LGE-01 boutique lodge (6 rooms)
 * Lifecycle spread: arriving today x5 · in-house w/ folios · checked-out
 * settled · early checkout · no-show · cancelled · 30-day future pace ·
 * group block w/ master folio · housekeeping + ops tasks · traceable KPIs.
 * Idempotent: wipes the demo-v2 tenant (children first) and rebuilds.
 * Run: DATABASE_URL=... npx tsx scripts/demo-dataset-v2.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DAY = 86400_000;
const day = (n: number) =>
  new Date(
    Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + n)
  );
const iso = (d: Date) => d.toISOString().slice(0, 10);
const d2 = (d: Date, h: number, m = 0) => new Date(d.getTime() + h * 3600_000 + m * 60_000);

async function main() {
  const existing = await prisma.tenant.findUnique({ where: { slug: 'demo-v2' } });
  if (existing) {
    const t = existing.id;
    const resIds = (
      await prisma.reservation.findMany({ where: { tenantId: t }, select: { id: true } })
    ).map((r) => r.id);
    const folIds = (
      await prisma.folio.findMany({ where: { tenantId: t }, select: { id: true } })
    ).map((f) => f.id);
    const roomIds = (
      await prisma.room.findMany({ where: { tenantId: t }, select: { id: true } })
    ).map((r) => r.id);
    await prisma.payment.deleteMany({ where: { tenantId: t } });
    await prisma.folioItem.deleteMany({ where: { folioId: { in: folIds } } });
    await prisma.folio.deleteMany({ where: { tenantId: t } });
    await prisma.reservationStay.deleteMany({ where: { reservationId: { in: resIds } } });
    await prisma.reservation.deleteMany({ where: { tenantId: t } });
    await prisma.group.deleteMany({ where: { tenantId: t } });
    await prisma.task.deleteMany({ where: { tenantId: t } });
    await prisma.housekeepingTask.deleteMany({ where: { tenantId: t } });
    await prisma.room.deleteMany({ where: { tenantId: t } });
    await prisma.ratePlan.deleteMany({ where: { tenantId: t } });
    await prisma.roomType.deleteMany({ where: { tenantId: t } });
    await prisma.guest.deleteMany({ where: { tenantId: t } });
    await prisma.property.deleteMany({ where: { tenantId: t } });
    await prisma.roleAssignment.deleteMany({ where: { user: { tenantId: t } } });
    await prisma.user.deleteMany({ where: { tenantId: t } });
    await prisma.tenant.delete({ where: { id: t } });
    console.log('wipe: previous demo-v2 removed');
  }

  const tenant = await prisma.tenant.create({
    data: {
      id: 'd2v2tenant',
      name: 'Demo V2 Hotels',
      slug: 'demo-v2',
      plan: 'pro',
      status: 'active',
    },
  });
  const t = tenant.id;

  const owner = await prisma.user.create({
    data: {
      id: 'd2v2owner',
      tenantId: t,
      email: 'owner@demov2.test',
      passwordHash: await bcrypt.hash('DemoV2!2026', 10),
      firstName: 'Demo',
      lastName: 'Owner',
      role: 'owner',
      status: 'active',
    },
  });
  const ownerRole = await prisma.role.findFirst({ where: { name: 'Owner', tenantId: null } });
  if (ownerRole)
    await prisma.roleAssignment.create({ data: { userId: owner.id, roleId: ownerRole.id } });

  const mkProperty = (id: string, name: string, code: string, currency = 'ZAR') =>
    prisma.property.create({
      data: {
        id,
        tenantId: t,
        name,
        code,
        city: 'Cape Town',
        country: 'South Africa',
        timezone: 'Africa/Johannesburg',
        currency,
        currentBusinessDate: day(0),
        vatNumber: '4120283183',
      },
    });
  const urb = await mkProperty('d2v2urb', 'Demo V2 Downtown', 'URB-01');
  const lge = await mkProperty('d2v2lge', 'Demo V2 Ridge Lodge', 'LGE-01');

  const mkRt = (
    id: string,
    propertyId: string,
    name: string,
    code: string,
    base: number,
    max: number
  ) =>
    prisma.roomType.create({
      data: {
        id,
        tenantId: t,
        propertyId,
        name,
        code,
        baseOccupancy: Math.min(2, max),
        maxOccupancy: max,
      },
    });
  const rtStd = await mkRt('d2v2rt-std', urb.id, 'Standard Queen', 'STD', 2, 2);
  const rtDlx = await mkRt('d2v2rt-dlx', urb.id, 'Deluxe King', 'DLX', 2, 3);
  const rtSte = await mkRt('d2v2rt-ste', urb.id, 'Junior Suite', 'STE', 2, 3);
  const rtCha = await mkRt('d2v2rt-cha', lge.id, 'Fynbos Chalet', 'CHALET', 2, 3);
  const rtTnt = await mkRt('d2v2rt-tnt', lge.id, 'Safari Tent', 'TENT', 2, 2);

  const mkRooms = async (
    propertyId: string,
    rtId: string,
    prefix: string,
    numbers: string[],
    status = 'clean'
  ) => {
    const out: string[] = [];
    for (const n of numbers) {
      const r = await prisma.room.create({
        data: {
          tenantId: t,
          propertyId,
          roomTypeId: rtId,
          number: prefix + n,
          status,
          housekeepingStatus: status === 'clean' ? 'ready' : 'dirty',
        },
      });
      out.push(r.id);
    }
    return out;
  };
  const std = await mkRooms(urb.id, rtStd.id, '1', ['01', '02', '03', '04', '05', '06']);
  const dlx = await mkRooms(urb.id, rtDlx.id, '2', ['01', '02', '03', '04'], 'clean');
  const ste = await mkRooms(urb.id, rtSte.id, '3', ['01', '02']);
  const cha = await mkRooms(lge.id, rtCha.id, 'C', ['1', '2', '3', '4']);
  const tnt = await mkRooms(lge.id, rtTnt.id, 'T', ['1', '2']);
  await prisma.room.update({
    where: { id: dlx[1] },
    data: { status: 'dirty', housekeepingStatus: 'dirty' },
  });
  await prisma.room.update({
    where: { id: std[3] },
    data: { status: 'inspected', housekeepingStatus: 'inspected' },
  });

  const mkPlan = (
    id: string,
    propertyId: string,
    roomTypeId: string,
    name: string,
    code: string,
    baseRate: number
  ) =>
    prisma.ratePlan.create({
      data: {
        id,
        tenantId: t,
        propertyId,
        roomTypeId,
        name,
        code,
        baseRate,
        currency: 'ZAR',
        calculationMethod: 'fixed',
        status: 'active',
      },
    });
  const pStd = await mkPlan('d2v2p-std', urb.id, rtStd.id, 'BAR Standard', 'BAR-STD', 1250);
  const pDlx = await mkPlan('d2v2p-dlx', urb.id, rtDlx.id, 'BAR Deluxe', 'BAR-DLX', 1850);
  const pSte = await mkPlan('d2v2p-ste', urb.id, rtSte.id, 'BAR Suite', 'BAR-STE', 2650);
  const pCha = await mkPlan('d2v2p-cha', lge.id, rtCha.id, 'Rack Chalet', 'RACK-CH', 3450);
  const pTnt = await mkPlan('d2v2p-tnt', lge.id, rtTnt.id, 'Rack Tent', 'RACK-TN', 2250);

  const guestDefs: [string, string, string, string, number, string?][] = [
    ['d2v2g-01', 'Amara', 'Naidoo', 'amara.naidoo@example.com', 8200, 'platinum'],
    ['d2v2g-02', 'Pieter', 'van der Merwe', 'pieter.vdm@example.com', 3400, 'gold'],
    ['d2v2g-03', 'Lerato', 'Mokoena', 'lerato.m@example.com', 900, undefined],
    ['d2v2g-04', 'James', 'Whitfield', 'j.whitfield@example.com', 0, undefined],
    ['d2v2g-05', 'Naledi', 'Khumalo', 'naledi.k@example.com', 1500, 'silver'],
    ['d2v2g-06', 'Tom', 'Becker', 'tom.becker@example.com', 0, undefined],
    ['d2v2g-07', 'Fatima', 'Patel', 'fatima.p@example.com', 4100, undefined],
    ['d2v2g-08', 'Chris', ' du Preez', 'chris.dup@example.com', 0, undefined],
    ['d2v2g-09', 'Sarah', 'OConnor', 'sarah.oc@example.com', 0, undefined],
    ['d2v2g-10', 'Kabelo', 'Dlamini', 'kabelo.d@example.com', 0, undefined],
  ];
  const guests: Record<string, string> = {};
  for (const [id, firstName, lastName, email, pts, vip] of guestDefs) {
    const g = await prisma.guest.create({
      data: {
        id,
        tenantId: t,
        firstName,
        lastName: lastName.trim(),
        email,
        phone:
          '+27 82 555 0' +
          String(guestDefs.indexOf([id, firstName, lastName, email, pts, vip])).padStart(2, '0'),
        nationality: 'ZA',
        city: 'Johannesburg',
        country: 'South Africa',
        loyaltyPoints: pts,
        vipStatus: vip,
      },
    });
    guests[id] = g.id;
  }

  const folioFor = async (reservationId: string, propertyId: string) => {
    const f = await prisma.folio.create({ data: { tenantId: t, reservationId, status: 'open' } });
    return f;
  };
  const post = (
    folioId: string,
    type: string,
    description: string,
    amount: number,
    at: Date,
    qty = 1
  ) =>
    prisma.folioItem.create({
      data: { folioId, type, description, amount, quantity: qty, postedAt: at },
    });
  const pay = (
    id: string,
    propertyId: string,
    reservationId: string,
    guestId: string,
    folioId: string | null,
    reference: string,
    type: string,
    status: string,
    minor: number,
    at: Date,
    posted: boolean
  ) =>
    prisma.payment.create({
      data: {
        id,
        tenantId: t,
        propertyId,
        reservationId,
        guestId,
        folioId,
        reference,
        type,
        status,
        amountMinor: minor,
        currency: 'ZAR',
        channel: 'card',
        cardLast4: '4242',
        cardBrand: 'visa',
        postedToFolio: posted,
        postedAt: posted ? at : null,
        createdAt: at,
      },
    });
  const closeFolio = async (folioId: string, charges: number, payments: number) => {
    await prisma.folio.update({
      where: { id: folioId },
      data: {
        totalCharges: charges,
        totalPayments: payments,
        balance: charges - payments,
        status: 'closed',
        closedAt: d2(day(-1), 11),
        closedBy: 'd2v2owner',
      },
    });
  };

  const mkRes = (
    id: string,
    propertyId: string,
    guestId: string,
    cn: string,
    status: string,
    arrN: number,
    depN: number,
    roomTypeId: string,
    ratePlanId: string,
    rate: number,
    extra: Partial<any> = {}
  ) =>
    prisma.reservation.create({
      data: {
        id,
        tenantId: t,
        propertyId,
        guestId,
        confirmationNumber: cn,
        status,
        source: extra.source ?? 'direct',
        arrivalDate: day(arrN),
        departureDate: day(depN),
        nights: depN - arrN,
        adults: 2,
        children: extra.children ?? 0,
        totalAmount: rate * (depN - arrN),
        balance: rate * (depN - arrN) - (extra.depositPaid ?? 0),
        roomTypeId,
        ratePlanId,
        depositDue: extra.depositDue ?? 0,
        depositPaid: extra.depositPaid ?? 0,
        marketSegment: extra.segment ?? 'transient',
        eta: extra.eta,
        specialRequests: extra.requests,
        guaranteed: extra.guaranteed ?? false,
        checkedInAt: extra.checkedInAt,
        checkedInBy: extra.checkedInAt ? 'd2v2owner' : null,
        checkedOutAt: extra.checkedOutAt,
        checkedOutBy: extra.checkedOutAt ? 'd2v2owner' : null,
        cancelledAt: extra.cancelledAt,
        cancelledBy: extra.cancelledAt ? 'd2v2owner' : null,
        cancelReason: extra.cancelReason,
        noShowAt: extra.noShowAt,
        createdAt: extra.createdAt ?? day(arrN - 7),
      },
    });
  const mkStays = (
    reservationId: string,
    roomId: string,
    fromN: number,
    toN: number,
    rate: number
  ) =>
    Promise.all(
      Array.from({ length: toN - fromN }, (_, i) =>
        prisma.reservationStay.create({
          data: { reservationId, roomId, date: day(fromN + i), rate },
        })
      )
    );

  // ── URB-01 · in-house (3) ──
  const inh1 = await mkRes(
    'd2v2r-inh1',
    urb.id,
    guests['d2v2g-01'],
    'D2-INH-01',
    'checked_in',
    -1,
    2,
    rtDlx.id,
    pDlx.id,
    1850,
    {
      checkedInAt: d2(day(-1), 14),
      segment: 'corporate',
      depositPaid: 100000,
      depositDue: 100000,
      guaranteed: true,
    }
  );
  const f1 = await folioFor(inh1.id, urb.id);
  await post(f1.id, 'room', 'Deluxe King — nightly rate', 1850, d2(day(-1), 6));
  await post(f1.id, 'room', 'Deluxe King — nightly rate', 1850, d2(day(0), 6));
  await post(f1.id, 'restaurant', 'Dinner — Grill Room', 62050, d2(day(0), 21));
  await post(f1.id, 'minibar', 'Minibar restock', 18000, d2(day(0), 10));
  await pay(
    'd2v2pay-1',
    urb.id,
    inh1.id,
    guests['d2v2g-01'],
    f1.id,
    'D2-PSK-001',
    'deposit',
    'success',
    100000,
    d2(day(-7), 9),
    true
  );
  await prisma.reservation.update({ where: { id: inh1.id }, data: { balance: 423100 } });
  await prisma.folio.update({
    where: { id: f1.id },
    data: { totalCharges: 389610, totalPayments: 100000, balance: 289610 },
  });
  await mkStays(inh1.id, dlx[0], -1, 2, 1850);

  const inh2 = await mkRes(
    'd2v2r-inh2',
    urb.id,
    guests['d2v2g-02'],
    'D2-INH-02',
    'checked_in',
    -1,
    1,
    rtStd.id,
    pStd.id,
    1250,
    { checkedInAt: d2(day(-1), 15), source: 'booking_engine', segment: 'transient' }
  );
  const f2 = await folioFor(inh2.id, urb.id);
  await post(f2.id, 'room', 'Standard Queen — nightly rate', 1250, d2(day(-1), 7));
  await post(f2.id, 'room', 'Standard Queen — nightly rate', 1250, d2(day(0), 7));
  await prisma.folio.update({
    where: { id: f2.id },
    data: { totalCharges: 2500, totalPayments: 0, balance: 2500 },
  });
  await mkStays(inh2.id, std[0], -1, 1, 1250);

  const inh3 = await mkRes(
    'd2v2r-inh3',
    urb.id,
    guests['d2v2g-05'],
    'D2-INH-03',
    'checked_in',
    0,
    2,
    rtSte.id,
    pSte.id,
    2650,
    {
      checkedInAt: d2(day(0), 8),
      source: 'direct',
      segment: 'vip',
      requests: 'High floor, feather-free pillows',
      vip: undefined,
    }
  );
  const f3 = await folioFor(inh3.id, urb.id);
  await post(f3.id, 'room', 'Junior Suite — nightly rate', 2650, d2(day(0), 8));
  await prisma.folio.update({
    where: { id: f3.id },
    data: { totalCharges: 2650, totalPayments: 0, balance: 2650 },
  });
  await mkStays(inh3.id, ste[0], 0, 2, 2650);

  // ── URB-01 · arriving today (4) ──
  await mkRes(
    'd2v2r-arr1',
    urb.id,
    guests['d2v2g-03'],
    'D2-ARR-01',
    'confirmed',
    0,
    2,
    rtStd.id,
    pStd.id,
    1250,
    { eta: '14:00', segment: 'transient', createdAt: day(-12) }
  );
  await mkRes(
    'd2v2r-arr2',
    urb.id,
    guests['d2v2g-04'],
    'D2-ARR-02',
    'confirmed',
    0,
    3,
    rtDlx.id,
    pDlx.id,
    1850,
    {
      eta: '18:30',
      segment: 'corporate',
      depositDue: 555000,
      depositPaid: 185000,
      guaranteed: true,
      createdAt: day(-20),
      source: 'channel',
    }
  );
  await mkRes(
    'd2v2r-arr3',
    urb.id,
    guests['d2v2g-07'],
    'D2-ARR-03',
    'confirmed',
    0,
    1,
    rtSte.id,
    pSte.id,
    2650,
    { eta: '21:15', segment: 'vip', source: 'direct', createdAt: day(-3) }
  );
  const arr4 = await mkRes(
    'd2v2r-arr4',
    urb.id,
    guests['d2v2g-08'],
    'D2-ARR-04',
    'confirmed',
    0,
    4,
    rtStd.id,
    pStd.id,
    1250,
    { eta: '16:00', segment: 'group', children: 1, createdAt: day(-15), source: 'direct' }
  );
  const fa4 = await folioFor(arr4.id, urb.id);
  await pay(
    'd2v2pay-2',
    urb.id,
    arr4.id,
    guests['d2v2g-08'],
    null,
    'D2-PSK-002',
    'deposit',
    'pending',
    125000,
    d2(day(0), 9),
    false
  );
  await prisma.reservation.update({ where: { id: arr4.id }, data: { balance: 487500 } });
  await prisma.folio.update({
    where: { id: fa4.id },
    data: { totalCharges: 612500, totalPayments: 125000, balance: 487500 },
  });

  // ── URB-01 · checked out (2 + early) ──
  const co1 = await mkRes(
    'd2v2r-co1',
    urb.id,
    guests['d2v2g-06'],
    'D2-CO-01',
    'checked_out',
    -3,
    -1,
    rtStd.id,
    pStd.id,
    1250,
    {
      checkedInAt: d2(day(-3), 13),
      checkedOutAt: d2(day(-1), 10),
      source: 'booking_engine',
      createdAt: day(-18),
    }
  );
  const fc1 = await folioFor(co1.id, urb.id);
  await post(fc1.id, 'room', 'Standard Queen ×2 nights', 2500, d2(day(-3), 6));
  await post(fc1.id, 'laundry', 'Laundry service', 15000, d2(day(-2), 12));
  await pay(
    'd2v2pay-3',
    urb.id,
    co1.id,
    guests['d2v2g-06'],
    fc1.id,
    'D2-PSK-003',
    'balance_charge',
    'success',
    265000,
    d2(day(-1), 10),
    true
  );
  await closeFolio(fc1.id, 265000, 265000);
  await mkStays(co1.id, std[1], -3, -1, 1250);

  const co2 = await mkRes(
    'd2v2r-co2',
    urb.id,
    guests['d2v2g-09'],
    'D2-CO-02',
    'checked_out',
    -2,
    1,
    rtDlx.id,
    pDlx.id,
    1850,
    {
      checkedInAt: d2(day(-2), 12),
      checkedOutAt: d2(day(0), 9),
      source: 'direct',
      createdAt: day(-9),
      requests: 'Early/mid-stay departure: original departure D+1, actual D0 09:12',
    }
  );
  const fc2 = await folioFor(co2.id, urb.id);
  await post(fc2.id, 'room', 'Deluxe King ×2 nights', 3700, d2(day(-2), 6));
  await post(fc2.id, 'restaurant', 'Breakfast ×2', 49000, d2(day(-1), 9));
  await pay(
    'd2v2pay-4',
    urb.id,
    co2.id,
    guests['d2v2g-09'],
    fc2.id,
    'D2-PSK-004',
    'balance_charge',
    'success',
    419000,
    d2(day(0), 9),
    true
  );
  await prisma.folio.update({
    where: { id: fc2.id },
    data: { totalCharges: 419000, totalPayments: 419000, balance: 0, status: 'open' },
  });
  await mkStays(co2.id, dlx[2], -2, 0, 1850);

  // ── URB-01 · no-show + cancelled ──
  await mkRes(
    'd2v2r-ns1',
    urb.id,
    guests['d2v2g-10'],
    'D2-NS-01',
    'no_show',
    -1,
    1,
    rtStd.id,
    pStd.id,
    1250,
    { noShowAt: d2(day(-1), 16), guaranteed: true, segment: 'transient', createdAt: day(-8) }
  );
  await mkRes(
    'd2v2r-cxl1',
    urb.id,
    guests['d2v2g-04'],
    'D2-CXL-01',
    'cancelled',
    3,
    5,
    rtDlx.id,
    pDlx.id,
    1850,
    { cancelledAt: d2(day(-2), 11), cancelReason: 'Guest illness — waived', createdAt: day(-16) }
  );

  // ── URB-01 · group block (3 rooms, master folio) ──
  const grp = await prisma.group.create({
    data: {
      id: 'd2v2grp1',
      tenantId: t,
      propertyId: urb.id,
      code: 'D2-GRP-01',
      name: 'CapeTech Summit',
      blockType: 'guaranteed',
      status: 'definite',
      arrivalDate: day(7),
      departureDate: day(10),
      cutOffDate: day(2),
      rate: 1750,
      eventSpace: 'Rooftop Foyer',
      createdById: owner.id,
    },
  });
  for (let i = 0; i < 3; i++) {
    const r = await mkRes(
      'd2v2r-grp' + (i + 1),
      urb.id,
      guests['d2v2g-0' + (i + 1)],
      'D2-GRP-0' + (i + 1),
      'confirmed',
      7,
      10,
      i === 2 ? rtSte.id : rtDlx.id,
      i === 2 ? pSte.id : pDlx.id,
      i === 2 ? 2650 : 1750,
      { segment: 'group', source: 'direct', groupId: grp.id, createdAt: day(-25) }
    );
    void r;
  }
  const gcharges = 3 * 1750 * 3 + 2650 * 0;
  const mf = await prisma.folio.create({
    data: { tenantId: t, groupId: grp.id, isMaster: true, status: 'open' },
  });
  await post(mf.id, 'banquet', 'Summit venue hire — Rooftop Foyer', 1500000, day(-1));
  await post(mf.id, 'catering', 'Coffee breaks ×3 days', 240000, day(-1));
  await pay(
    'd2v2pay-5',
    urb.id,
    null,
    null,
    mf.id,
    'D2-PSK-005',
    'deposit',
    'success',
    500000,
    day(-4),
    true
  );
  await prisma.folio.update({
    where: { id: mf.id },
    data: { totalCharges: 1740000 + 0, totalPayments: 500000, balance: 1240000 },
  });
  void gcharges;

  // ── URB-01 · future pace (3 more) ──
  await mkRes(
    'd2v2r-fut1',
    urb.id,
    guests['d2v2g-03'],
    'D2-FUT-01',
    'confirmed',
    5,
    8,
    rtStd.id,
    pStd.id,
    1250,
    { segment: 'transient', source: 'booking_engine', createdAt: day(-5) }
  );
  await mkRes(
    'd2v2r-fut2',
    urb.id,
    guests['d2v2g-06'],
    'D2-FUT-02',
    'confirmed',
    12,
    14,
    rtDlx.id,
    pDlx.id,
    1850,
    { segment: 'corporate', createdAt: day(-2) }
  );
  await mkRes(
    'd2v2r-fut3',
    urb.id,
    guests['d2v2g-07'],
    'D2-FUT-03',
    'confirmed',
    21,
    28,
    rtSte.id,
    pSte.id,
    2650,
    { segment: 'vip', source: 'direct', createdAt: day(-1) }
  );

  // ── LGE-01 · lodge spread ──
  const lInh = await mkRes(
    'd2v2r-linh',
    lge.id,
    guests['d2v2g-02'],
    'D2-LGE-INH',
    'checked_in',
    0,
    3,
    rtCha.id,
    pCha.id,
    3450,
    { checkedInAt: d2(day(0), 11), source: 'direct', segment: 'transient' }
  );
  const fl1 = await folioFor(lInh.id, lge.id);
  await post(fl1.id, 'room', 'Fynbos Chalet — nightly', 3450, d2(day(0), 11));
  await post(fl1.id, 'activity', 'Guided fynbos walk ×2', 90000, d2(day(0), 12));
  await pay(
    'd2v2pay-6',
    lge.id,
    lInh.id,
    guests['d2v2g-02'],
    fl1.id,
    'D2-PSK-006',
    'deposit',
    'success',
    200000,
    d2(day(-6), 10),
    true
  );
  await prisma.folio.update({
    where: { id: fl1.id },
    data: { totalCharges: 699000, totalPayments: 200000, balance: 499000 },
  });
  await prisma.reservation.update({ where: { id: lInh.id }, data: { balance: 499000 } });
  await mkStays(lInh.id, cha[0], 0, 3, 3450);
  await mkRes(
    'd2v2r-larr',
    lge.id,
    guests['d2v2g-09'],
    'D2-LGE-ARR',
    'confirmed',
    1,
    4,
    rtTnt.id,
    pTnt.id,
    2250,
    { eta: '15:00', createdAt: day(-4) }
  );
  const lCo = await mkRes(
    'd2v2r-lco',
    lge.id,
    guests['d2v2g-10'],
    'D2-LGE-CO',
    'checked_out',
    -4,
    -2,
    rtCha.id,
    pCha.id,
    3450,
    { checkedInAt: d2(day(-4), 14), checkedOutAt: d2(day(-2), 10), createdAt: day(-22) }
  );
  const fl2 = await folioFor(lCo.id, lge.id);
  await post(fl2.id, 'room', 'Fynbos Chalet ×2 nights', 6900, d2(day(-4), 6));
  await post(fl2.id, 'restaurant', 'Dinner — Lapa', 85000, d2(day(-3), 20));
  await pay(
    'd2v2pay-7',
    lge.id,
    lCo.id,
    guests['d2v2g-10'],
    fl2.id,
    'D2-PSK-007',
    'balance_charge',
    'success',
    775000,
    d2(day(-2), 10),
    true
  );
  await prisma.folio.update({
    where: { id: fl2.id },
    data: {
      totalCharges: 775000,
      totalPayments: 775000,
      balance: 0,
      status: 'closed',
      closedAt: d2(day(-2), 11),
    },
  });
  await mkStays(lCo.id, cha[1], -4, -2, 3450);
  await mkRes(
    'd2v2r-lfut',
    lge.id,
    guests['d2v2g-04'],
    'D2-LGE-FUT',
    'confirmed',
    10,
    13,
    rtCha.id,
    pCha.id,
    3450,
    { createdAt: day(-9), source: 'booking_engine' }
  );

  // ── Housekeeping + ops tasks ──
  const hk = [
    ['d2v2hk-1', urb.id, dlx[1], 'cleaning', 'high', 'pending', 0, 9],
    ['d2v2hk-2', urb.id, std[4], 'cleaning', 'normal', 'in_progress', 0, 8],
    ['d2v2hk-3', urb.id, std[2], 'inspection', 'normal', 'completed', -1, 10],
    ['d2v2hk-4', urb.id, ste[1], 'turndown', 'low', 'pending', 0, 18],
    ['d2v2hk-5', lge.id, tnt[0], 'cleaning', 'normal', 'pending', 1, 9],
  ] as const;
  for (const [id, propertyId, roomId, type, priority, status, schedN, h] of hk) {
    await prisma.housekeepingTask.create({
      data: {
        id,
        tenantId: t,
        propertyId,
        roomId,
        type,
        priority,
        status,
        scheduledAt: d2(day(schedN), h),
        assigneeId: owner.id,
        completedAt: status === 'completed' ? d2(day(-1), 11) : null,
        verifiedAt: status === 'completed' ? d2(day(-1), 11, 30) : null,
      },
    });
  }
  const tk = [
    [
      'd2v2task-1',
      urb.id,
      'maintenance',
      'AC fault — Room 204 (DLX)',
      'high',
      'open',
      0,
      12,
      -2,
      true,
    ],
    [
      'd2v2task-2',
      urb.id,
      'front_office',
      'Trace D2-ARR-02 deposit (pending payment)',
      'normal',
      'open',
      0,
      16,
      0,
      false,
    ],
    [
      'd2v2task-3',
      urb.id,
      'concierge',
      'Airport transfer 14:00 — Naidoo',
      'normal',
      'completed',
      0,
      14,
      -1,
      false,
    ],
    ['d2v2task-4', lge.id, 'f_and_b', 'Stock lapa bar for weekend', 'low', 'open', 2, 10, 0, false],
  ] as const;
  for (const [
    id,
    propertyId,
    department,
    title,
    priority,
    status,
    dueN,
    h,
    createdN,
    breached,
  ] of tk) {
    await prisma.task.create({
      data: {
        id,
        tenantId: t,
        propertyId,
        department,
        title,
        priority,
        status,
        dueAt: d2(day(dueN), h),
        createdAt: d2(day(createdN), 8),
        slaMinutes: 240,
        slaBreached: breached,
        completedAt: status === 'completed' ? d2(day(-1), 13, 30) : null,
        completedBy: status === 'completed' ? owner.id : null,
        source: 'manual',
      },
    });
  }

  // ── Traceable KPI summary ──
  const byStatus = await prisma.reservation.groupBy({
    by: ['status', 'propertyId'],
    where: { tenantId: t },
    _count: { id: true },
  });
  const folioSums = await prisma.folio.aggregate({
    where: { tenantId: t },
    _sum: { totalCharges: true, totalPayments: true, balance: true },
  });
  const openTasks = await prisma.task.count({
    where: { tenantId: t, status: { in: ['open', 'in_progress'] } },
  });
  const hkOpen = await prisma.housekeepingTask.count({
    where: { tenantId: t, status: { in: ['pending', 'in_progress'] } },
  });
  console.log('reservations by status/property:', JSON.stringify(byStatus));
  console.log('folio totals (minor):', JSON.stringify(folioSums._sum));
  console.log('open ops tasks:', openTasks, '| open hk tasks:', hkOpen);
  console.log('login: owner@demov2.test / DemoV2!2026 | properties: URB-01, LGE-01');
  console.log('DEMO-V2 CLEAN');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
