import { PrismaClient } from '@prisma/client';
import { getDefinition, ReportColumn, ReportDefinition } from './reports.definitions.js';

const MAX_RANGE_DAYS = 92;
const MAX_ROWS = 5000;

export interface ReportSummaryItem {
  label: string;
  value: number;
  format: 'number' | 'currency' | 'percent';
}
export interface RunOutput {
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  summary: ReportSummaryItem[];
  truncated: boolean;
}

interface Ctx {
  prisma: PrismaClient;
  tenantId: string;
}

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const dayStr = (d: Date) => {
  // Render in server-local time — toISOString() is UTC, which shifted every
  // day label back one date for non-UTC properties (found on 0.2: a
  // 10-25→10-30 window exported rows labeled 10-24→10-29).
  const s = startOfDay(d);
  const m = String(s.getMonth() + 1).padStart(2, '0');
  const day = String(s.getDate()).padStart(2, '0');
  return `${s.getFullYear()}-${m}-${day}`;
};
const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const r2 = (n: number) => Math.round(n * 100) / 100;

// Free-form string statuses — match case-insensitively instead of guessing vocab
const isActiveStatus = (s: unknown) => {
  const x = String(s ?? '').toLowerCase();
  return x !== '' && !/cancel|canceled|no_?show|void|pending|waitlist|hold|prospect/i.test(x);
};
const isLossStatus = (s: unknown) => /no_?show|cancel/i.test(String(s ?? ''));

function eachDay(from: Date, to: Date): Date[] {
  const out: Date[] = [];
  for (let d = startOfDay(from); d <= to && out.length <= MAX_RANGE_DAYS; d = addDays(d, 1))
    out.push(d);
  return out;
}

export function normalizeParams(
  def: ReportDefinition,
  raw: Record<string, string>
): Record<string, string> {
  const p: Record<string, string> = { ...raw };
  const today = new Date();
  if (def.params.some((x) => x.key === 'dateFrom' && !p.dateFrom))
    p.dateFrom = dayStr(addDays(today, -7));
  if (def.params.some((x) => x.key === 'dateTo' && !p.dateTo)) p.dateTo = dayStr(today);
  if (!p.asOfDate && def.params.some((x) => x.key === 'asOfDate')) p.asOfDate = dayStr(today);
  for (const prm of def.params) {
    if (prm.type === 'select' && !p[prm.key] && prm.options?.length)
      p[prm.key] = prm.options[0].value;
    if (prm.required && !p[prm.key])
      throw Object.assign(new Error(`Missing required param: ${prm.key}`), {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
  }
  if (p.dateFrom && p.dateTo && p.dateFrom > p.dateTo) {
    const t = p.dateFrom;
    p.dateFrom = p.dateTo;
    p.dateTo = t;
  }
  if (p.dateFrom && p.dateTo) {
    const span =
      (startOfDay(new Date(p.dateTo)).getTime() - startOfDay(new Date(p.dateFrom)).getTime()) /
      86400000;
    if (span > MAX_RANGE_DAYS) p.dateTo = dayStr(addDays(new Date(p.dateFrom), MAX_RANGE_DAYS));
  }
  if (p.propertyId === '' || p.propertyId === 'ALL') delete p.propertyId;
  return p;
}

const resWhereBase = (ctx: Ctx, p: Record<string, string>): any => {
  const w: any = { tenantId: ctx.tenantId };
  if (p.propertyId) w.propertyId = p.propertyId;
  return w;
};

async function occupancy(ctx: Ctx, p: Record<string, string>): Promise<RunOutput> {
  const def = getDefinition('occupancy')!;
  const from = startOfDay(new Date(p.dateFrom));
  const to = endOfDay(new Date(p.dateTo));
  const roomWhere: any = { tenantId: ctx.tenantId };
  if (p.propertyId) roomWhere.propertyId = p.propertyId;
  const rooms = await ctx.prisma.room.findMany({ where: roomWhere, select: { roomTypeId: true } });
  const byTypeTotal = new Map<string, number>();
  for (const r of rooms)
    byTypeTotal.set(r.roomTypeId ?? 'none', (byTypeTotal.get(r.roomTypeId ?? 'none') ?? 0) + 1);
  const roomTypes = await ctx.prisma.roomType.findMany({
    where: { tenantId: ctx.tenantId },
    select: { id: true, name: true },
  });
  const typeName = new Map(roomTypes.map((t) => [t.id, t.name]));
  const list = (
    await ctx.prisma.reservation.findMany({
      where: { ...resWhereBase(ctx, p), arrivalDate: { lte: to }, departureDate: { gt: from } },
      select: {
        totalAmount: true,
        roomTypeId: true,
        arrivalDate: true,
        departureDate: true,
        status: true,
      },
    })
  ).filter((r) => isActiveStatus(r.status));
  // Daily room-night revenue from reservation_stays. Summing reservation
  // totalAmount for every overlapping day double-counted multi-night stays
  // on each day of their stay (1903 vs true 523 observed on 0.2).
  const stayRows = await ctx.prisma.reservationStay.findMany({
    where: { date: { gte: from, lte: to }, room: roomWhere },
    select: { date: true, rate: true, room: { select: { roomTypeId: true } } },
  });
  const revByDay = new Map<string, number>();
  const revByDayType = new Map<string, number>();
  for (const st of stayRows) {
    const k = dayStr(st.date);
    revByDay.set(k, (revByDay.get(k) ?? 0) + num(st.rate));
    const kt = `${k} · ${st.room.roomTypeId ?? 'none'}`;
    revByDayType.set(kt, (revByDayType.get(kt) ?? 0) + num(st.rate));
  }

  const groupByType = p.groupBy === 'ROOM_TYPE';
  const rows: Record<string, unknown>[] = [];

  for (const d of eachDay(from, to)) {
    const lbl = dayStr(d);
    const todays = list.filter((r) => {
      // Date-granularity comparison: timestamp comparison counted a stay on
      // its DEPARTURE date (departure is UTC-midnight, after local
      // start-of-day), inflating every departure day's occupancy.
      return dayStr(new Date(r.arrivalDate)) <= lbl && dayStr(new Date(r.departureDate)) > lbl;
    });
    if (groupByType) {
      const agg = new Map<string, { sold: number; revenue: number }>();
      for (const r of todays) {
        const k = r.roomTypeId ?? 'none';
        const a = agg.get(k) ?? { sold: 0, revenue: 0 };
        a.sold += 1;
        a.revenue = revByDayType.get(`${dayStr(d)} · ${k}`) ?? 0;
        agg.set(k, a);
      }
      for (const [k, a] of agg) {
        const avail = byTypeTotal.get(k) ?? 0;
        rows.push({
          label: `${dayStr(d)} · ${typeName.get(k) ?? 'Unknown'}`,
          available: avail,
          sold: a.sold,
          occupancyPct: avail ? a.sold / avail : 0,
          adr: a.sold ? r2(a.revenue / a.sold) : 0,
          revenue: r2(a.revenue),
        });
      }
    } else {
      const revenue = revByDay.get(dayStr(d)) ?? 0;
      const avail = rooms.length;
      const sold = todays.length;
      rows.push({
        label: dayStr(d),
        available: avail,
        sold,
        occupancyPct: avail ? sold / avail : 0,
        adr: sold ? r2(revenue / sold) : 0,
        revenue: r2(revenue),
      });
    }
  }
  const totSold = rows.reduce((s, r) => s + num(r.sold), 0);
  const totAvail = rows.reduce((s, r) => s + num(r.available), 0);
  const totRev = rows.reduce((s, r) => s + num(r.revenue), 0);
  return {
    columns: def.columns,
    rows: rows.slice(0, MAX_ROWS),
    truncated: rows.length > MAX_ROWS,
    summary: [
      { label: 'Avg occupancy', value: totAvail ? totSold / totAvail : 0, format: 'percent' },
      { label: 'Room nights sold', value: totSold, format: 'number' },
      { label: 'Revenue', value: r2(totRev), format: 'currency' },
    ],
  };
}

async function revenue(ctx: Ctx, p: Record<string, string>): Promise<RunOutput> {
  const def = getDefinition('revenue')!;
  const from = startOfDay(new Date(p.dateFrom));
  const to = endOfDay(new Date(p.dateTo));
  const folioWhere: any = { tenantId: ctx.tenantId };
  if (p.propertyId) folioWhere.reservation = { propertyId: p.propertyId };
  const items = await ctx.prisma.folioItem.findMany({
    where: { postedAt: { gte: from, lte: to }, folio: folioWhere },
    select: { amount: true, quantity: true, type: true, postedAt: true },
    take: 20000,
  });
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const it of items) {
    if (/transfer/i.test(it.type)) continue;
    const k = dayStr(new Date(it.postedAt));
    const b = buckets.get(k) ?? { sum: 0, count: 0 };
    b.sum += num(it.amount) * (num(it.quantity) || 1);
    b.count += 1;
    buckets.set(k, b);
  }
  const rows = eachDay(from, to).map((d) => {
    const b = buckets.get(dayStr(d)) ?? { sum: 0, count: 0 };
    return {
      label: dayStr(d),
      revenue: r2(b.sum),
      charges: b.count,
      average: b.count ? r2(b.sum / b.count) : 0,
    };
  });
  const total = rows.reduce((s, r) => s + num(r.revenue), 0);
  return {
    columns: def.columns,
    rows,
    truncated: items.length >= 20000,
    summary: [
      { label: 'Total revenue', value: r2(total), format: 'currency' },
      { label: 'Avg / day', value: rows.length ? r2(total / rows.length) : 0, format: 'currency' },
    ],
  };
}

async function adrRevpar(ctx: Ctx, p: Record<string, string>): Promise<RunOutput> {
  const def = getDefinition('adr_revpar')!;
  const from = startOfDay(new Date(p.dateFrom));
  const to = endOfDay(new Date(p.dateTo));
  const roomWhere: any = { tenantId: ctx.tenantId };
  if (p.propertyId) roomWhere.propertyId = p.propertyId;
  const avail = await ctx.prisma.room.count({ where: roomWhere });
  const list = (
    await ctx.prisma.reservation.findMany({
      where: { ...resWhereBase(ctx, p), arrivalDate: { lte: to }, departureDate: { gt: from } },
      select: { totalAmount: true, arrivalDate: true, departureDate: true, status: true },
    })
  ).filter((r) => isActiveStatus(r.status));
  const rows = eachDay(from, to).map((d) => {
    const lbl = dayStr(d);
    const todays = list.filter((r) => {
      // Date-granularity comparison: timestamp comparison counted a stay on
      // its DEPARTURE date (departure is UTC-midnight, after local
      // start-of-day), inflating every departure day's occupancy.
      return dayStr(new Date(r.arrivalDate)) <= lbl && dayStr(new Date(r.departureDate)) > lbl;
    });
    const rev = todays.reduce((s, r) => s + num(r.totalAmount), 0);
    return {
      label: dayStr(d),
      available: avail,
      sold: todays.length,
      adr: todays.length ? r2(rev / todays.length) : 0,
      revpar: avail ? r2(rev / avail) : 0,
    };
  });
  return {
    columns: def.columns,
    rows,
    truncated: false,
    summary: [
      {
        label: 'Avg ADR',
        value: rows.length ? r2(rows.reduce((s, r) => s + num(r.adr), 0) / rows.length) : 0,
        format: 'currency',
      },
      {
        label: 'Avg RevPAR',
        value: rows.length ? r2(rows.reduce((s, r) => s + num(r.revpar), 0) / rows.length) : 0,
        format: 'currency',
      },
    ],
  };
}

async function channelMix(ctx: Ctx, p: Record<string, string>): Promise<RunOutput> {
  const def = getDefinition('channel_mix')!;
  const list = (
    await ctx.prisma.reservation.findMany({
      where: {
        ...resWhereBase(ctx, p),
        arrivalDate: { gte: startOfDay(new Date(p.dateFrom)), lte: endOfDay(new Date(p.dateTo)) },
      },
      select: {
        source: true,
        arrivalDate: true,
        departureDate: true,
        totalAmount: true,
        status: true,
      },
    })
  ).filter((r) => isActiveStatus(r.status));
  const agg = new Map<string, { reservations: number; roomNights: number; revenue: number }>();
  for (const r of list) {
    const ch = r.source || 'DIRECT';
    const a = agg.get(ch) ?? { reservations: 0, roomNights: 0, revenue: 0 };
    a.reservations += 1;
    a.roomNights += Math.max(
      0,
      Math.round(
        (new Date(r.departureDate).getTime() - new Date(r.arrivalDate).getTime()) / 86400000
      )
    );
    a.revenue += num(r.totalAmount);
    agg.set(ch, a);
  }
  const totalRev = [...agg.values()].reduce((s, a) => s + a.revenue, 0);
  const rows = [...agg.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([ch, a]) => ({
      label: ch,
      reservations: a.reservations,
      roomNights: a.roomNights,
      revenue: r2(a.revenue),
      sharePct: totalRev ? a.revenue / totalRev : 0,
    }));
  return {
    columns: def.columns,
    rows,
    truncated: false,
    summary: [
      { label: 'Reservations', value: list.length, format: 'number' },
      { label: 'Total revenue', value: r2(totalRev), format: 'currency' },
    ],
  };
}

async function arAging(ctx: Ctx, p: Record<string, string>): Promise<RunOutput> {
  const def = getDefinition('ar_aging')!;
  const asOf = endOfDay(new Date(p.asOfDate));
  const list = await ctx.prisma.arInvoice.findMany({
    where: { tenantId: ctx.tenantId },
    include: { corporateAccount: { select: { name: true } } },
    take: 10000,
  });
  const acc = new Map<
    string,
    {
      name: string;
      invoices: number;
      b0: number;
      b30: number;
      b60: number;
      b90: number;
      b90p: number;
    }
  >();
  for (const inv of list) {
    const bal = r2(num(inv.total) - num(inv.amountPaid));
    if (bal <= 0) continue;
    if (!/sent|partially|overdue|open|unpaid/i.test(inv.status)) continue; // skip draft/paid/cancelled
    const key = inv.corporateAccountId;
    const a = acc.get(key) ?? {
      name: inv.corporateAccount?.name ?? 'Unknown',
      invoices: 0,
      b0: 0,
      b30: 0,
      b60: 0,
      b90: 0,
      b90p: 0,
    };
    a.invoices += 1;
    const age = Math.floor((asOf.getTime() - new Date(inv.dueDate).getTime()) / 86400000);
    if (age <= 0) a.b0 += bal;
    else if (age <= 30) a.b30 += bal;
    else if (age <= 60) a.b60 += bal;
    else if (age <= 90) a.b90 += bal;
    else a.b90p += bal;
    acc.set(key, a);
  }
  const rows = [...acc.entries()]
    .map(([, a]) => ({
      label: a.name,
      invoices: a.invoices,
      b0: r2(a.b0),
      b30: r2(a.b30),
      b60: r2(a.b60),
      b90: r2(a.b90),
      b90p: r2(a.b90p),
      total: r2(a.b0 + a.b30 + a.b60 + a.b90 + a.b90p),
    }))
    .sort((a, b) => num(b.total) - num(a.total))
    .slice(0, MAX_ROWS);
  const grand = rows.reduce((s, r) => s + num(r.total), 0);
  return {
    columns: def.columns,
    rows,
    truncated: acc.size > MAX_ROWS,
    summary: [
      { label: 'Total outstanding', value: r2(grand), format: 'currency' },
      { label: 'Accounts', value: rows.length, format: 'number' },
    ],
  };
}

async function housekeeping(ctx: Ctx, p: Record<string, string>): Promise<RunOutput> {
  const def = getDefinition('housekeeping')!;
  const w: any = { tenantId: ctx.tenantId };
  if (p.propertyId) w.propertyId = p.propertyId;
  const rooms = await ctx.prisma.room.findMany({
    where: w,
    select: { number: true, roomTypeId: true, housekeepingStatus: true, propertyId: true },
    orderBy: [{ propertyId: 'asc' }, { number: 'asc' }],
  });
  const typeIds = [...new Set(rooms.map((r) => r.roomTypeId).filter(Boolean))] as string[];
  const types = await ctx.prisma.roomType.findMany({
    where: { id: { in: typeIds } },
    select: { id: true, name: true },
  });
  const propIds = [...new Set(rooms.map((r) => r.propertyId).filter(Boolean))] as string[];
  const props = await ctx.prisma.property.findMany({
    where: { id: { in: propIds } },
    select: { id: true, name: true },
  });
  const tName = new Map(types.map((t) => [t.id, t.name]));
  const pName = new Map(props.map((x) => [x.id, x.name]));
  const rows = rooms.map((r) => ({
    property: pName.get(r.propertyId) ?? '-',
    room: r.number,
    roomType: tName.get(r.roomTypeId) ?? '-',
    status: r.housekeepingStatus ?? 'UNKNOWN',
  }));
  const dirty = rows.filter(
    (r) =>
      /dirty|cleaning|inspected/i.test(String(r.status)) && !/ready|clean/i.test(String(r.status))
  ).length;
  return {
    columns: def.columns,
    rows: rows.slice(0, MAX_ROWS),
    truncated: rows.length > MAX_ROWS,
    summary: [
      { label: 'Rooms', value: rows.length, format: 'number' },
      { label: 'Needs cleaning', value: dirty, format: 'number' },
    ],
  };
}

async function arrivalsDepartures(ctx: Ctx, p: Record<string, string>): Promise<RunOutput> {
  const def = getDefinition('arrivals_departures')!;
  const from = startOfDay(new Date(p.dateFrom));
  const to = endOfDay(new Date(p.dateTo));
  const base = resWhereBase(ctx, p);
  const sel = {
    id: true,
    arrivalDate: true,
    departureDate: true,
    status: true,
    source: true,
    adults: true,
    children: true,
    guestId: true,
  } as const;
  const items: { date: Date; direction: string; r: any }[] = [];
  if (p.mode !== 'DEPARTURES') {
    const arr = await ctx.prisma.reservation.findMany({
      where: { ...base, arrivalDate: { gte: from, lte: to } },
      select: sel,
      take: 5000,
    });
    for (const r of arr) items.push({ date: r.arrivalDate, direction: 'Arrival', r });
  }
  if (p.mode !== 'ARRIVALS') {
    const dep = await ctx.prisma.reservation.findMany({
      where: { ...base, departureDate: { gte: from, lte: to } },
      select: sel,
      take: 5000,
    });
    for (const r of dep) items.push({ date: r.departureDate, direction: 'Departure', r });
  }
  const resIds = [...new Set(items.map((i) => i.r.id))] as string[];
  const stays = await ctx.prisma.reservationStay.findMany({
    where: { reservationId: { in: resIds }, date: { gte: from, lte: to } },
    select: { reservationId: true, roomId: true },
    orderBy: { date: 'asc' },
    take: 10000,
  });
  const roomIdByRes = new Map<string, string>();
  for (const s of stays)
    if (!roomIdByRes.has(s.reservationId)) roomIdByRes.set(s.reservationId, s.roomId);
  const gIds = [...new Set(items.map((i) => i.r.guestId).filter(Boolean))] as string[];
  const rIds = [...new Set([...roomIdByRes.values()])];
  const guests = await ctx.prisma.guest.findMany({
    where: { id: { in: gIds } },
    select: { id: true, firstName: true, lastName: true },
  });
  const roomz = await ctx.prisma.room.findMany({
    where: { id: { in: rIds } },
    select: { id: true, number: true },
  });
  const g = new Map(guests.map((x) => [x.id, `${x.firstName} ${x.lastName}`]));
  const rm = new Map(roomz.map((x) => [x.id, x.number]));
  items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const rows = items.slice(0, MAX_ROWS).map((i) => ({
    date: dayStr(new Date(i.date)),
    direction: i.direction,
    guest: g.get(i.r.guestId) ?? '-',
    room: rm.get(roomIdByRes.get(i.r.id) ?? '') ?? 'Unassigned',
    status: i.r.status,
    pax: num(i.r.adults) + num(i.r.children),
    channel: i.r.source || 'DIRECT',
  }));
  return {
    columns: def.columns,
    rows,
    truncated: items.length > MAX_ROWS,
    summary: [{ label: 'Movements', value: items.length, format: 'number' }],
  };
}

async function noShowCancellation(ctx: Ctx, p: Record<string, string>): Promise<RunOutput> {
  const def = getDefinition('no_show_cancellation')!;
  const list = (
    await ctx.prisma.reservation.findMany({
      where: {
        ...resWhereBase(ctx, p),
        arrivalDate: { gte: startOfDay(new Date(p.dateFrom)), lte: endOfDay(new Date(p.dateTo)) },
      },
      select: {
        id: true,
        arrivalDate: true,
        status: true,
        source: true,
        totalAmount: true,
        guestId: true,
      },
      take: 10000,
    })
  ).filter((r) => isLossStatus(r.status));
  const gIds = [...new Set(list.map((r) => r.guestId).filter(Boolean))] as string[];
  const guests = await ctx.prisma.guest.findMany({
    where: { id: { in: gIds } },
    select: { id: true, firstName: true, lastName: true },
  });
  const g = new Map(guests.map((x) => [x.id, `${x.firstName} ${x.lastName}`]));
  const rows = list
    .sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime())
    .map((r) => ({
      date: dayStr(new Date(r.arrivalDate)),
      type: /no_?show/i.test(r.status) ? 'No-show' : 'Cancelled',
      guest: g.get(r.guestId) ?? '-',
      channel: r.source || 'DIRECT',
      lostRevenue: r2(num(r.totalAmount)),
    }))
    .slice(0, MAX_ROWS);
  const lost = rows.reduce((s, r) => s + num(r.lostRevenue), 0);
  return {
    columns: def.columns,
    rows,
    truncated: list.length > MAX_ROWS,
    summary: [
      { label: 'Lost revenue', value: r2(lost), format: 'currency' },
      { label: 'Events', value: list.length, format: 'number' },
    ],
  };
}

async function guestDemographics(ctx: Ctx, p: Record<string, string>): Promise<RunOutput> {
  const def = getDefinition('guest_demographics')!;
  const list = (
    await ctx.prisma.reservation.findMany({
      where: {
        ...resWhereBase(ctx, p),
        arrivalDate: { gte: startOfDay(new Date(p.dateFrom)), lte: endOfDay(new Date(p.dateTo)) },
      },
      select: { guestId: true, totalAmount: true },
      take: 20000,
    })
  ).filter((r) => r.guestId);
  const gIds = [...new Set(list.map((r) => r.guestId))] as string[];
  const guests = await ctx.prisma.guest.findMany({
    where: { id: { in: gIds } },
    select: { id: true, nationality: true, country: true },
  });
  const segOf = new Map(
    guests.map((g) => [g.id, (p.groupBy === 'COUNTRY' ? g.country : g.nationality) || 'Unknown'])
  );
  const agg = new Map<string, { guests: Set<string>; stays: number; revenue: number }>();
  for (const r of list) {
    const seg = segOf.get(r.guestId!) ?? 'Unknown';
    const a = agg.get(seg) ?? { guests: new Set<string>(), stays: 0, revenue: 0 };
    a.guests.add(r.guestId!);
    a.stays += 1;
    a.revenue += num(r.totalAmount);
    agg.set(seg, a);
  }
  const totalRev = [...agg.values()].reduce((s, a) => s + a.revenue, 0);
  const rows = [...agg.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([seg, a]) => ({
      label: seg,
      guests: a.guests.size,
      stays: a.stays,
      revenue: r2(a.revenue),
      sharePct: totalRev ? a.revenue / totalRev : 0,
    }));
  return {
    columns: def.columns,
    rows,
    truncated: false,
    summary: [
      { label: 'Guests', value: gIds.length, format: 'number' },
      { label: 'Revenue', value: r2(totalRev), format: 'currency' },
    ],
  };
}

// ─── C2' Mews reporting depth computers ───

async function pacePickup(ctx: Ctx, p: Record<string, string>): Promise<RunOutput> {
  const def = getDefinition('pace')!;
  const from = startOfDay(new Date(p.dateFrom));
  const to = endOfDay(new Date(p.dateTo));
  const days = eachDay(from, to);
  const span = Math.max(days.length - 1, 1);
  const compFrom = addDays(from, -span);
  const compTo = endOfDay(addDays(startOfDay(to), -span));
  const list = (
    await ctx.prisma.reservation.findMany({
      where: { ...resWhereBase(ctx, p), arrivalDate: { lte: to }, departureDate: { gt: from } },
      select: {
        totalAmount: true,
        arrivalDate: true,
        departureDate: true,
        status: true,
        createdAt: true,
      },
    })
  ).filter((r) => isActiveStatus(r.status));
  const sevenAgo = Date.now() - 7 * 86400000;
  // Comparison window: same overlap method as the occupancy report, shifted
  // back by the range span — so pace comp columns are directly comparable.
  const compList = (
    await ctx.prisma.reservation.findMany({
      where: {
        ...resWhereBase(ctx, p),
        arrivalDate: { lte: compTo },
        departureDate: { gt: compFrom },
      },
      select: { totalAmount: true, arrivalDate: true, departureDate: true, status: true },
    })
  ).filter((r) => isActiveStatus(r.status));
  const compByDay = new Map<string, { sold: number; revenue: number }>();
  for (const d of eachDay(compFrom, compTo)) {
    const sod = startOfDay(d).getTime();
    const eod = endOfDay(d).getTime();
    const todays = compList.filter(
      (r) => new Date(r.arrivalDate).getTime() <= eod && new Date(r.departureDate).getTime() > sod
    );
    compByDay.set(dayStr(d), {
      sold: todays.length,
      revenue: r2(todays.reduce((sum, r) => sum + num(r.totalAmount), 0)),
    });
  }
  const rows = days.map((d) => {
    const lbl = dayStr(d);
    const todays = list.filter((r) => {
      // Date-granularity comparison: timestamp comparison counted a stay on
      // its DEPARTURE date (departure is UTC-midnight, after local
      // start-of-day), inflating every departure day's occupancy.
      return dayStr(new Date(r.arrivalDate)) <= lbl && dayStr(new Date(r.departureDate)) > lbl;
    });
    const revenue = todays.reduce((sum, r) => sum + num(r.totalAmount), 0);
    const pickup = todays.filter((r) => new Date(r.createdAt).getTime() >= sevenAgo).length;
    const comp = compByDay.get(dayStr(addDays(d, -span))) ?? { sold: 0, revenue: 0 };
    return {
      label: dayStr(d),
      onBooks: todays.length,
      revenue: r2(revenue),
      pickup7d: pickup,
      compSold: comp.sold,
      compRevenue: r2(comp.revenue),
    };
  });
  const totRev = rows.reduce((sum, r) => sum + num(r.revenue), 0);
  const totPickup = rows.reduce((sum, r) => sum + num(r.pickup7d), 0);
  return {
    columns: def.columns,
    rows,
    truncated: false,
    summary: [
      { label: 'OTB revenue', value: r2(totRev), format: 'currency' },
      { label: 'Pick-up (7d rooms)', value: totPickup, format: 'number' },
      {
        label: 'Avg OTB / day',
        value: rows.length ? r2(totRev / rows.length) : 0,
        format: 'currency',
      },
    ],
  };
}

async function forecast(ctx: Ctx, p: Record<string, string>): Promise<RunOutput> {
  const def = getDefinition('forecast')!;
  const from = startOfDay(new Date(p.dateFrom));
  const to = endOfDay(new Date(p.dateTo));
  const roomWhere: any = { tenantId: ctx.tenantId };
  if (p.propertyId) roomWhere.propertyId = p.propertyId;
  const rooms = await ctx.prisma.room.findMany({
    where: roomWhere,
    select: { status: true, serviceStatus: true },
  });
  const isOoo = (r: { status: string; serviceStatus: string }) =>
    /ooo|out_?of_?order/i.test(String(r.status ?? '')) || String(r.serviceStatus) === 'ooo';
  const sellable = rooms.filter((r) => !isOoo(r)).length;
  const list = (
    await ctx.prisma.reservation.findMany({
      where: { ...resWhereBase(ctx, p), arrivalDate: { lte: to }, departureDate: { gt: from } },
      select: { totalAmount: true, arrivalDate: true, departureDate: true, status: true },
    })
  ).filter((r) => isActiveStatus(r.status));
  const rows = eachDay(from, to).map((d) => {
    const lbl = dayStr(d);
    const todays = list.filter((r) => {
      // Date-granularity comparison: timestamp comparison counted a stay on
      // its DEPARTURE date (departure is UTC-midnight, after local
      // start-of-day), inflating every departure day's occupancy.
      return dayStr(new Date(r.arrivalDate)) <= lbl && dayStr(new Date(r.departureDate)) > lbl;
    });
    const revenue = todays.reduce((sum, r) => sum + num(r.totalAmount), 0);
    const sold = todays.length;
    return {
      label: dayStr(d),
      available: sellable,
      onBooks: sold,
      remaining: Math.max(sellable - sold, 0),
      occupancyPct: sellable ? sold / sellable : 0,
      adr: sold ? r2(revenue / sold) : 0,
      revpar: sellable ? r2(revenue / sellable) : 0,
    };
  });
  const totSold = rows.reduce((sum, r) => sum + num(r.onBooks), 0);
  const totAvail = rows.reduce((sum, r) => sum + num(r.available), 0);
  return {
    columns: def.columns,
    rows,
    truncated: false,
    summary: [
      { label: 'Avg OTB occupancy', value: totAvail ? totSold / totAvail : 0, format: 'percent' },
      {
        label: 'Rooms remaining (avg/day)',
        value: rows.length
          ? r2(rows.reduce((sum, r) => sum + num(r.remaining), 0) / rows.length)
          : 0,
        format: 'number',
      },
    ],
  };
}

async function revenueBreakdown(ctx: Ctx, p: Record<string, string>): Promise<RunOutput> {
  const def = getDefinition('revenue_breakdown')!;
  const from = startOfDay(new Date(p.dateFrom));
  const to = endOfDay(new Date(p.dateTo));
  const folioWhere: any = { tenantId: ctx.tenantId };
  if (p.propertyId) folioWhere.reservation = { propertyId: p.propertyId };
  const items = await ctx.prisma.folioItem.findMany({
    where: { postedAt: { gte: from, lte: to }, folio: folioWhere },
    select: { amount: true, quantity: true, type: true },
    take: 20000,
  });
  const agg = new Map<string, { charges: number; revenue: number }>();
  for (const it of items) {
    if (/transfer/i.test(it.type)) continue;
    const a = agg.get(it.type) ?? { charges: 0, revenue: 0 };
    a.charges += 1;
    a.revenue += num(it.amount) * (num(it.quantity) || 1);
    agg.set(it.type, a);
  }
  const totalRev = [...agg.values()].reduce((sum, a) => sum + a.revenue, 0);
  const rows = [...agg.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([t, a]) => ({
      label: t,
      charges: a.charges,
      revenue: r2(a.revenue),
      sharePct: totalRev ? a.revenue / totalRev : 0,
    }));
  return {
    columns: def.columns,
    rows: rows.slice(0, MAX_ROWS),
    truncated: agg.size > MAX_ROWS,
    summary: [
      { label: 'Total revenue', value: r2(totalRev), format: 'currency' },
      { label: 'Charge types', value: rows.length, format: 'number' },
    ],
  };
}

async function marketSegments(ctx: Ctx, p: Record<string, string>): Promise<RunOutput> {
  const def = getDefinition('market_segments')!;
  const list = (
    await ctx.prisma.reservation.findMany({
      where: {
        ...resWhereBase(ctx, p),
        arrivalDate: { gte: startOfDay(new Date(p.dateFrom)), lte: endOfDay(new Date(p.dateTo)) },
      },
      select: {
        marketSegment: true,
        arrivalDate: true,
        departureDate: true,
        totalAmount: true,
        status: true,
      },
    })
  ).filter((r) => isActiveStatus(r.status));
  const agg = new Map<string, { reservations: number; roomNights: number; revenue: number }>();
  for (const r of list) {
    const seg = (r.marketSegment ?? '').trim() || 'Unspecified';
    const a = agg.get(seg) ?? { reservations: 0, roomNights: 0, revenue: 0 };
    a.reservations += 1;
    a.roomNights += Math.max(
      0,
      Math.round(
        (new Date(r.departureDate).getTime() - new Date(r.arrivalDate).getTime()) / 86400000
      )
    );
    a.revenue += num(r.totalAmount);
    agg.set(seg, a);
  }
  const totalRev = [...agg.values()].reduce((sum, a) => sum + a.revenue, 0);
  const rows = [...agg.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([seg, a]) => ({
      label: seg,
      reservations: a.reservations,
      roomNights: a.roomNights,
      revenue: r2(a.revenue),
      sharePct: totalRev ? a.revenue / totalRev : 0,
    }));
  return {
    columns: def.columns,
    rows,
    truncated: false,
    summary: [
      { label: 'Reservations', value: list.length, format: 'number' },
      { label: 'Revenue', value: r2(totalRev), format: 'currency' },
    ],
  };
}

async function spaceStatus(ctx: Ctx, p: Record<string, string>): Promise<RunOutput> {
  const def = getDefinition('space_status')!;
  const w: any = { tenantId: ctx.tenantId };
  if (p.propertyId) w.propertyId = p.propertyId;
  const rooms = await ctx.prisma.room.findMany({
    where: w,
    select: {
      number: true,
      roomTypeId: true,
      status: true,
      housekeepingStatus: true,
      serviceStatus: true,
      serviceReason: true,
      propertyId: true,
    },
    orderBy: [{ propertyId: 'asc' }, { number: 'asc' }],
  });
  const typeIds = [...new Set(rooms.map((r) => r.roomTypeId).filter(Boolean))] as string[];
  const types = await ctx.prisma.roomType.findMany({
    where: { id: { in: typeIds } },
    select: { id: true, name: true },
  });
  const propIds = [...new Set(rooms.map((r) => r.propertyId).filter(Boolean))] as string[];
  const props = await ctx.prisma.property.findMany({
    where: { id: { in: propIds } },
    select: { id: true, name: true },
  });
  const tName = new Map(types.map((t) => [t.id, t.name]));
  const pName = new Map(props.map((x) => [x.id, x.name]));
  const rows = rooms.map((r) => ({
    property: pName.get(r.propertyId) ?? '-',
    room: r.number,
    roomType: tName.get(r.roomTypeId) ?? '-',
    hkStatus: r.housekeepingStatus ?? 'UNKNOWN',
    serviceStatus: r.serviceStatus ?? 'active',
    reason: r.serviceReason ?? '',
  }));
  const ooo = rows.filter((r) => String(r.serviceStatus) === 'ooo').length;
  const oos = rows.filter((r) => String(r.serviceStatus) === 'oos').length;
  return {
    columns: def.columns,
    rows: rows.slice(0, MAX_ROWS),
    truncated: rows.length > MAX_ROWS,
    summary: [
      { label: 'Rooms', value: rows.length, format: 'number' },
      { label: 'OOO', value: ooo, format: 'number' },
      { label: 'OOS', value: oos, format: 'number' },
    ],
  };
}

async function cancellationLead(ctx: Ctx, p: Record<string, string>): Promise<RunOutput> {
  const def = getDefinition('cancellation_lead')!;
  const from = startOfDay(new Date(p.dateFrom));
  const to = endOfDay(new Date(p.dateTo));
  const list = await ctx.prisma.reservation.findMany({
    where: {
      ...resWhereBase(ctx, p),
      cancelledAt: { gte: from, lte: to },
      status: { contains: 'cancel', mode: 'insensitive' },
    },
    select: { arrivalDate: true, totalAmount: true, cancelledAt: true },
    take: 10000,
  });
  const bucketOf = (lead: number) =>
    lead < 0
      ? 'After arrival'
      : lead === 0
        ? 'Same day'
        : lead <= 7
          ? '1-7 days'
          : lead <= 30
            ? '8-30 days'
            : lead <= 90
              ? '31-90 days'
              : '90+ days';
  const agg = new Map<string, { cancellations: number; lostRevenue: number; leadSum: number }>();
  for (const r of list) {
    const lead = Math.floor(
      (new Date(r.arrivalDate).getTime() - new Date(r.cancelledAt!).getTime()) / 86400000
    );
    const b = bucketOf(lead);
    const a = agg.get(b) ?? { cancellations: 0, lostRevenue: 0, leadSum: 0 };
    a.cancellations += 1;
    a.lostRevenue += num(r.totalAmount);
    a.leadSum += lead;
    agg.set(b, a);
  }
  const order = ['After arrival', 'Same day', '1-7 days', '8-30 days', '31-90 days', '90+ days'];
  const totalLost = [...agg.values()].reduce((sum, a) => sum + a.lostRevenue, 0);
  const rows = order
    .filter((b) => agg.has(b))
    .map((b) => {
      const a = agg.get(b)!;
      return {
        label: b,
        cancellations: a.cancellations,
        lostRevenue: r2(a.lostRevenue),
        sharePct: totalLost ? a.lostRevenue / totalLost : 0,
        avgLeadDays: a.cancellations ? Math.round(a.leadSum / a.cancellations) : 0,
      };
    });
  return {
    columns: def.columns,
    rows,
    truncated: false,
    summary: [
      { label: 'Cancellations', value: list.length, format: 'number' },
      { label: 'Lost revenue', value: r2(totalLost), format: 'currency' },
    ],
  };
}

// ─── SA-3 net pricing & commission (Mews net-price reporting) ───

async function netPricing(ctx: Ctx, p: Record<string, string>): Promise<RunOutput> {
  const def = getDefinition('net_pricing')!;
  const from = startOfDay(new Date(p.dateFrom));
  const to = endOfDay(new Date(p.dateTo));
  const list = (
    await ctx.prisma.reservation.findMany({
      where: {
        ...resWhereBase(ctx, p),
        arrivalDate: { gte: from, lte: to },
      },
      select: { totalAmount: true, ratePlanId: true, status: true },
    })
  ).filter((r) => isActiveStatus(r.status));
  const planIds = [...new Set(list.map((r) => r.ratePlanId).filter(Boolean))] as string[];
  const plans = await ctx.prisma.ratePlan.findMany({
    where: { id: { in: planIds } },
    select: { id: true, code: true, commissionPct: true },
  });
  const pmap = new Map(plans.map((x) => [x.id, x]));
  const agg = new Map<
    string,
    { reservations: number; gross: number; commission: number; pct: number }
  >();
  for (const r of list) {
    const plan = r.ratePlanId ? pmap.get(r.ratePlanId) : undefined;
    const pct = plan?.commissionPct != null ? Number(plan.commissionPct) : 0;
    const gross = num(r.totalAmount);
    const key = plan ? plan.code : 'No rate plan';
    const a = agg.get(key) ?? { reservations: 0, gross: 0, commission: 0, pct };
    a.reservations += 1;
    a.gross += gross;
    // Net pricing: commission is INCLUDED in the gross → net = gross / (1 + pct)
    a.commission += gross - gross / (1 + pct / 100);
    agg.set(key, a);
  }
  const rows = [...agg.entries()]
    .sort((a, b) => b[1].gross - a[1].gross)
    .map(([label, a]) => ({
      label,
      reservations: a.reservations,
      commissionPct: a.pct / 100,
      grossRevenue: r2(a.gross),
      commission: r2(a.commission),
      netRevenue: r2(a.gross - a.commission),
    }));
  const totGross = rows.reduce((sum, r) => sum + num(r.grossRevenue), 0);
  const totComm = rows.reduce((sum, r) => sum + num(r.commission), 0);
  return {
    columns: def.columns,
    rows,
    truncated: false,
    summary: [
      { label: 'Gross revenue', value: r2(totGross), format: 'currency' },
      { label: 'Commission cost', value: r2(totComm), format: 'currency' },
      { label: 'Net revenue', value: r2(totGross - totComm), format: 'currency' },
    ],
  };
}

const COMPUTERS: Record<string, (ctx: Ctx, p: Record<string, string>) => Promise<RunOutput>> = {
  occupancy,
  revenue,
  adr_revpar: adrRevpar,
  channel_mix: channelMix,
  ar_aging: arAging,
  housekeeping,
  arrivals_departures: arrivalsDepartures,
  no_show_cancellation: noShowCancellation,
  guest_demographics: guestDemographics,
  pace: pacePickup,
  forecast,
  revenue_breakdown: revenueBreakdown,
  market_segments: marketSegments,
  space_status: spaceStatus,
  cancellation_lead: cancellationLead,
  net_pricing: netPricing,
};

export async function runReport(
  prisma: PrismaClient,
  tenantId: string,
  userId: string | undefined,
  definitionKey: string,
  rawParams: Record<string, string>
) {
  let def: any = getDefinition(definitionKey);
  let preset: any = null;

  // Custom templates (admin report builder) persist as ReportTemplate rows and
  // resolve on the fly. Until a custom query engine exists, a custom report
  // renders its stored sample rows with the template's field columns.
  if (!def && definitionKey.startsWith('custom:')) {
    const template = await prisma.reportTemplate.findFirst({
      where: { id: definitionKey.slice('custom:'.length), tenantId },
    });
    if (!template) {
      throw Object.assign(new Error(`Unknown report: ${definitionKey}`), {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }
    const fields = Array.isArray(template.fields)
      ? (template.fields as { name?: string; key?: string; label?: string }[])
      : [];
    const columns = fields.map((f) => ({
      key: f.name ?? f.key ?? 'col',
      label: f.label ?? f.name ?? f.key ?? 'Column',
    }));
    def = {
      key: definitionKey,
      name: template.name,
      description: template.description ?? '',
      category: 'custom',
      params: [],
      columns,
    };
    const sampleRows = (
      (template.config as { sampleRows?: Record<string, unknown>[] } | null) ?? {}
    ).sampleRows;
    preset = { columns, rows: sampleRows ?? [], summary: [], truncated: false };
  }

  if (!def) {
    throw Object.assign(new Error(`Unknown report: ${definitionKey}`), {
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  }
  const params = normalizeParams(def, rawParams || {});
  try {
    const output = preset ?? (await COMPUTERS[definitionKey]({ prisma, tenantId }, params));
    return await prisma.tenantReportRun.create({
      data: {
        tenantId,
        definitionKey,
        name: def.name,
        params,
        createdById: userId,
        rowCount: output.rows.length,
        status: 'COMPLETED',
        result: output as object,
      },
    });
  } catch (e: any) {
    return await prisma.tenantReportRun.create({
      data: {
        tenantId,
        definitionKey,
        name: def.name,
        params,
        createdById: userId,
        rowCount: 0,
        status: 'FAILED',
        error: String(e?.message ?? e),
      },
    });
  }
}

export function computeNextRun(
  s: {
    frequency: string;
    dayOfWeek?: number | null | undefined;
    dayOfMonth?: number | null | undefined;
    timeOfDay: string;
  },
  from: Date
): Date {
  const [hh, mm] = (s.timeOfDay || '06:00').split(':').map(Number);
  const next = new Date(from);
  next.setHours(hh, mm, 0, 0);
  if (next <= from) next.setDate(next.getDate() + 1);
  if (s.frequency === 'DAILY') return next;
  if (s.frequency === 'WEEKLY') {
    const target = s.dayOfWeek ?? 1;
    while (next.getDay() !== target) next.setDate(next.getDate() + 1);
    return next;
  }
  const dom = Math.min(s.dayOfMonth ?? 1, 28);
  while (next.getDate() !== dom) next.setDate(next.getDate() + 1);
  return next;
}

export async function executeDueSchedules(prisma: PrismaClient) {
  const due = await prisma.tenantScheduledReport.findMany({
    where: { isActive: true, nextRunAt: { lte: new Date() } },
    take: 20,
  });
  for (const s of due) {
    try {
      await runReport(
        prisma,
        s.tenantId,
        s.createdById ?? undefined,
        s.definitionKey,
        s.params as Record<string, string>
      );
      await prisma.tenantScheduledReport.update({
        where: { id: s.id },
        data: { lastRunAt: new Date(), nextRunAt: computeNextRun(s, new Date()) },
      });
    } catch {
      await prisma.tenantScheduledReport.update({
        where: { id: s.id },
        data: { nextRunAt: new Date(Date.now() + 3600000) },
      });
    }
  }
  return due.length;
}
