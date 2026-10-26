/* apps/api/src/modules/chain-dashboard/chain-dashboard.service.ts — C2
 * Chain-wide views: tape chart, rollup, exception feed. All queries are
 * tenant-scoped and chain-validated before touching data. */
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

const DAY_MS = 86_400_000;
const OOO_STATUSES = new Set(['ooo', 'out_of_order', 'maintenance', 'do_not_sell']);

const dayStart = (s: string) => new Date(`${s}T00:00:00.000Z`);
const dayEnd = (s: string) => new Date(`${s}T23:59:59.999Z`);
const dayKeyOf = (d: Date) => d.toISOString().slice(0, 10);
const r2 = (n: number) => Math.round(n * 100) / 100;

function enumerateDays(from: string, to: string, cap: number): string[] {
  const out: string[] = [];
  let cur = dayStart(from).getTime();
  const end = dayStart(to).getTime();
  while (cur <= end && out.length < cap) {
    out.push(new Date(cur).toISOString().slice(0, 10));
    cur += DAY_MS;
  }
  return out;
}

function assertRange(from: string, to: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    throw new AppError(400, 'from/to must be YYYY-MM-DD', 'VALIDATION_ERROR');
  }
  if (dayStart(from) > dayEnd(to)) {
    throw new AppError(400, 'from must be on or before to', 'VALIDATION_ERROR');
  }
}

async function getChainOr404(tenantId: string, chainId: string) {
  const chain = await prisma.chain.findFirst({ where: { id: chainId, tenantId } });
  if (!chain) throw new AppError(404, 'Chain not found', 'NOT_FOUND');
  return chain;
}

export async function getChainTapeChart(
  tenantId: string,
  chainId: string,
  from: string,
  to: string
) {
  const chain = await getChainOr404(tenantId, chainId);
  assertRange(from, to);
  const days = enumerateDays(from, to, 62);
  const lastDay = days[days.length - 1];

  const properties = await prisma.property.findMany({
    where: { tenantId, chainId: chain.id, status: 'active' },
    orderBy: { code: 'asc' },
    include: {
      rooms: {
        orderBy: [{ floor: 'asc' }, { number: 'asc' }],
        include: { roomType: { select: { name: true } } },
      },
    },
  });
  const propertyIds = properties.map((p) => p.id);
  const chainInfo = { id: chain.id, name: chain.name, slug: chain.slug };
  if (propertyIds.length === 0) {
    return { chain: chainInfo, from, to: lastDay, days, properties: [] };
  }

  const stays = await prisma.reservationStay.findMany({
    where: {
      date: { gte: dayStart(days[0]), lte: dayEnd(lastDay) },
      reservation: {
        tenantId,
        propertyId: { in: propertyIds },
        status: { in: ['confirmed', 'checked_in'] },
      },
    },
    include: {
      reservation: {
        include: { guest: { select: { firstName: true, lastName: true, vipStatus: true } } },
      },
    },
  });

  const staysByPropertyRoom = new Map<string, Map<string, typeof stays>>();
  for (const s of stays) {
    const pid = s.reservation.propertyId;
    if (!staysByPropertyRoom.has(pid)) staysByPropertyRoom.set(pid, new Map());
    const roomMap = staysByPropertyRoom.get(pid)!;
    if (!roomMap.has(s.roomId)) roomMap.set(s.roomId, []);
    roomMap.get(s.roomId)!.push(s);
  }

  const result = properties.map((property) => {
    const oooRooms = property.rooms.filter((rm) => OOO_STATUSES.has(rm.status));
    void oooRooms;
    const cells: Record<string, Record<string, unknown>> = {};
    const occupancy: Record<string, { occupied: number; available: number; pct: number }> = {};
    for (const day of days) occupancy[day] = { occupied: 0, available: 0, pct: 0 };
    const roomMap = staysByPropertyRoom.get(property.id) ?? new Map<string, typeof stays>();

    const rooms = property.rooms.map((room) => {
      const row: Record<string, unknown> = {};
      const roomStays = (roomMap.get(room.id) ?? [])
        .slice()
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      const ooo = OOO_STATUSES.has(room.status);
      let si = 0;
      for (const day of days) {
        const dStart = dayStart(day).getTime();
        const dEnd = dStart + DAY_MS;
        while (si < roomStays.length && roomStays[si].date.getTime() < dStart) si++;
        let state: string = ooo ? 'ooo' : 'vacant';
        let meta: Record<string, unknown> = {};
        if (si < roomStays.length && roomStays[si].date.getTime() < dEnd) {
          const stay = roomStays[si];
          const res = stay.reservation;
          const arrKey = dayKeyOf(res.arrivalDate);
          const depKey = dayKeyOf(new Date(res.departureDate.getTime() - DAY_MS));
          const isArr = day === arrKey;
          const isDep = day === depKey;
          state = isArr && isDep ? 'turn' : isArr ? 'arrival' : isDep ? 'departure' : 'occupied';
          meta = {
            reservationId: res.id,
            confirmationNumber: res.confirmationNumber,
            guestName: res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : 'Guest',
            vipStatus: res.guest?.vipStatus ?? null,
            status: res.status,
          };
        }
        row[day] = { state, ...meta };
        if (!ooo) {
          occupancy[day].available += 1;
          if (state !== 'vacant') occupancy[day].occupied += 1;
        }
      }
      cells[room.id] = row;
      return {
        id: room.id,
        number: room.number,
        floor: room.floor,
        roomTypeName: room.roomType?.name ?? null,
        status: room.status,
        housekeepingStatus: room.housekeepingStatus,
        ooo,
      };
    });

    for (const day of days) {
      const o = occupancy[day];
      o.pct = o.available > 0 ? r2((o.occupied / o.available) * 100) : 0;
    }

    return {
      id: property.id,
      name: property.name,
      code: property.code,
      city: property.city,
      timezone: property.timezone,
      businessDate: dayKeyOf(property.currentBusinessDate),
      roomCount: rooms.length,
      rooms,
      cells,
      occupancy,
    };
  });

  return { chain: chainInfo, from, to: lastDay, days, properties: result };
}

export async function getChainRollup(tenantId: string, chainId: string, from: string, to: string) {
  const chain = await getChainOr404(tenantId, chainId);
  assertRange(from, to);
  const days = enumerateDays(from, to, 92);
  const lastDay = days[days.length - 1];
  const daySet = new Set(days);

  const properties = await prisma.property.findMany({
    where: { tenantId, chainId: chain.id, status: 'active' },
    orderBy: { code: 'asc' },
    include: { rooms: { select: { id: true, status: true } } },
  });
  const propertyIds = properties.map((p) => p.id);
  const chainInfo = { id: chain.id, name: chain.name, slug: chain.slug };
  if (propertyIds.length === 0) {
    return {
      chain: chainInfo,
      from,
      to: lastDay,
      days,
      currency: 'ZAR',
      properties: [],
      consolidated: null,
    };
  }

  const [stays, folioItems] = await Promise.all([
    prisma.reservationStay.findMany({
      where: {
        date: { gte: dayStart(days[0]), lte: dayEnd(lastDay) },
        reservation: {
          tenantId,
          propertyId: { in: propertyIds },
          status: { in: ['confirmed', 'checked_in'] },
        },
      },
      select: {
        date: true,
        rate: true,
        reservation: { select: { propertyId: true } },
      },
    }),
    prisma.folioItem.findMany({
      where: {
        postedAt: { gte: dayStart(days[0]), lte: dayEnd(lastDay) },
        folio: { tenantId, reservation: { propertyId: { in: propertyIds } } },
      },
      select: {
        amount: true,
        folio: { select: { reservation: { select: { propertyId: true } } } },
      },
    }),
  ]);

  const stayAgg = new Map<string, Map<string, { occupied: number; roomRevenue: number }>>();
  for (const s of stays) {
    const pid = s.reservation.propertyId;
    const dk = dayKeyOf(s.date);
    if (!daySet.has(dk)) continue;
    if (!stayAgg.has(pid)) stayAgg.set(pid, new Map());
    const dayMap = stayAgg.get(pid)!;
    const rec = dayMap.get(dk) ?? { occupied: 0, roomRevenue: 0 };
    rec.occupied += 1;
    rec.roomRevenue += Number(s.rate);
    dayMap.set(dk, rec);
  }

  const folioRev = new Map<string, number>();
  for (const item of folioItems) {
    const pid = item.folio.reservation.propertyId;
    folioRev.set(pid, r2((folioRev.get(pid) ?? 0) + Number(item.amount)));
  }

  const propertyRows = properties.map((property) => {
    const totalRooms = property.rooms.length;
    const availableRooms = property.rooms.filter((rm) => !OOO_STATUSES.has(rm.status)).length;
    const dayMap =
      stayAgg.get(property.id) ?? new Map<string, { occupied: number; roomRevenue: number }>();

    let occupiedNights = 0;
    let roomRevenue = 0;
    const daily = days.map((day) => {
      const rec = dayMap.get(day) ?? { occupied: 0, roomRevenue: 0 };
      occupiedNights += rec.occupied;
      roomRevenue += rec.roomRevenue;
      const available = availableRooms;
      return {
        date: day,
        occupied: rec.occupied,
        available,
        occupancyPct: available > 0 ? r2((rec.occupied / available) * 100) : 0,
        roomRevenue: r2(rec.roomRevenue),
        adr: rec.occupied > 0 ? r2(rec.roomRevenue / rec.occupied) : 0,
        revpar: available > 0 ? r2(rec.roomRevenue / available) : 0,
      };
    });

    const availableNights = availableRooms * days.length;
    roomRevenue = r2(roomRevenue);
    return {
      id: property.id,
      name: property.name,
      code: property.code,
      city: property.city,
      currency: property.currency,
      totalRooms,
      availableRooms,
      totals: {
        occupiedNights,
        availableNights,
        occupancyPct: availableNights > 0 ? r2((occupiedNights / availableNights) * 100) : 0,
        roomRevenue,
        folioRevenue: folioRev.get(property.id) ?? 0,
        adr: occupiedNights > 0 ? r2(roomRevenue / occupiedNights) : 0,
        revpar: availableNights > 0 ? r2(roomRevenue / availableNights) : 0,
      },
      daily,
    };
  });

  const sum = (f: (p: (typeof propertyRows)[number]) => number) =>
    r2(propertyRows.reduce((a, p) => a + f(p), 0));
  const consolidatedTotals = {
    occupiedNights: sum((p) => p.totals.occupiedNights),
    availableNights: sum((p) => p.totals.availableNights),
    occupancyPct: 0,
    roomRevenue: sum((p) => p.totals.roomRevenue),
    folioRevenue: sum((p) => p.totals.folioRevenue),
    adr: 0,
    revpar: 0,
  };
  consolidatedTotals.occupancyPct =
    consolidatedTotals.availableNights > 0
      ? r2((consolidatedTotals.occupiedNights / consolidatedTotals.availableNights) * 100)
      : 0;
  consolidatedTotals.adr =
    consolidatedTotals.occupiedNights > 0
      ? r2(consolidatedTotals.roomRevenue / consolidatedTotals.occupiedNights)
      : 0;
  consolidatedTotals.revpar =
    consolidatedTotals.availableNights > 0
      ? r2(consolidatedTotals.roomRevenue / consolidatedTotals.availableNights)
      : 0;

  const consolidatedDaily = days.map((day, i) => {
    let occupied = 0;
    let available = 0;
    let roomRevenue = 0;
    for (const p of propertyRows) {
      occupied += p.daily[i].occupied;
      available += p.daily[i].available;
      roomRevenue += p.daily[i].roomRevenue;
    }
    roomRevenue = r2(roomRevenue);
    return {
      date: day,
      occupied,
      available,
      occupancyPct: available > 0 ? r2((occupied / available) * 100) : 0,
      roomRevenue,
      adr: occupied > 0 ? r2(roomRevenue / occupied) : 0,
      revpar: available > 0 ? r2(roomRevenue / available) : 0,
    };
  });

  return {
    chain: chainInfo,
    from,
    to: lastDay,
    days,
    currency: properties[0]?.currency ?? 'ZAR',
    properties: propertyRows,
    consolidated: { totals: consolidatedTotals, daily: consolidatedDaily },
  };
}

export async function getChainExceptions(tenantId: string, chainId: string, windowDays: number) {
  const chain = await getChainOr404(tenantId, chainId);
  const days = Math.min(Math.max(windowDays || 7, 1), 30);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayKey = dayKeyOf(today);
  const horizonEnd = new Date(today.getTime() + (days - 1) * DAY_MS);

  const properties = await prisma.property.findMany({
    where: { tenantId, chainId: chain.id },
    orderBy: { code: 'asc' },
    include: { _count: { select: { rooms: true } } },
  });

  const exceptions: Record<string, unknown>[] = [];
  const push = (
    severity: string,
    type: string,
    property: { id: string; name: string },
    title: string,
    detail: string,
    extra: Record<string, unknown> = {}
  ) =>
    exceptions.push({
      id: `${type}:${property.id}${extra.date ? `:${extra.date}` : ''}`,
      type,
      severity,
      propertyId: property.id,
      propertyName: property.name,
      title,
      detail,
      ...extra,
    });

  for (const property of properties) {
    if (property._count.rooms === 0) {
      push(
        'warning',
        'no_rooms',
        property,
        'No rooms configured',
        'This property has no room inventory — availability and occupancy cannot be tracked.'
      );
    }

    const businessKey = dayKeyOf(property.currentBusinessDate);
    const lastAudit = await prisma.nightAudit.findFirst({
      where: { tenantId, propertyId: property.id, status: 'completed' },
      orderBy: { auditDate: 'desc' },
      select: { auditDate: true },
    });
    if (!lastAudit || dayKeyOf(lastAudit.auditDate) < businessKey) {
      push(
        'critical',
        'night_audit_not_rolled',
        property,
        'Business date not rolled',
        `Current business date is ${businessKey} but the last completed night audit is ${lastAudit ? dayKeyOf(lastAudit.auditDate) : 'never'}.`,
        { date: businessKey }
      );
    }

    if (property._count.rooms > 0) {
      const grouped = await prisma.reservationStay.groupBy({
        by: ['date'],
        where: {
          date: { gte: today, lte: horizonEnd },
          reservation: {
            tenantId,
            propertyId: property.id,
            status: { in: ['confirmed', 'checked_in'] },
          },
        },
        _count: { _all: true },
      });
      const over = grouped
        .filter((g) => g._count._all > property._count.rooms)
        .map((g) => dayKeyOf(g.date))
        .sort();
      if (over.length > 0) {
        push(
          'critical',
          'overbooked_dates',
          property,
          'Overbooked dates in window',
          `${over.length} date(s) have more reserved room-nights than rooms: ${over.slice(0, 5).join(', ')}${over.length > 5 ? '…' : ''}`,
          { count: over.length, dates: over }
        );
      }
    }

    const pastDueWhere = {
      tenantId,
      propertyId: property.id,
      status: 'checked_in',
      departureDate: { lt: today },
    };
    const pastDueCount = await prisma.reservation.count({ where: pastDueWhere });
    if (pastDueCount > 0) {
      const samples = await prisma.reservation.findMany({
        where: pastDueWhere,
        take: 3,
        select: {
          confirmationNumber: true,
          guest: { select: { firstName: true, lastName: true } },
        },
      });
      push(
        'warning',
        'guests_past_departure',
        property,
        'In-house guests past departure',
        `${pastDueCount} checked-in reservation(s) are past their departure date: ${samples.map((r) => `${r.confirmationNumber} (${r.guest.firstName} ${r.guest.lastName})`).join(', ')}${pastDueCount > samples.length ? '…' : ''}`,
        { count: pastDueCount }
      );
    }

    const folios = await prisma.folio.findMany({
      where: { tenantId, reservation: { propertyId: property.id } },
      select: { id: true, balance: true, totalCharges: true, totalPayments: true },
    });
    const imbalanced = folios.filter(
      (f) =>
        Math.abs(Number(f.balance) - (Number(f.totalCharges) - Number(f.totalPayments))) > 0.005
    );
    if (imbalanced.length > 0) {
      push(
        'warning',
        'folio_imbalance',
        property,
        'Folio balance mismatches',
        `${imbalanced.length} folio(s) have balance ≠ charges − payments (ledger integrity).`,
        { count: imbalanced.length }
      );
    }
  }

  const rank: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  exceptions.sort(
    (a, b) =>
      (rank[a.severity as string] ?? 3) - (rank[b.severity as string] ?? 3) ||
      String(a.propertyName).localeCompare(String(b.propertyName)) ||
      String(a.type).localeCompare(String(b.type))
  );
  const summary = { critical: 0, warning: 0, info: 0 };
  for (const e of exceptions) {
    const sev = e.severity as keyof typeof summary;
    summary[sev] = (summary[sev] ?? 0) + 1;
  }

  return {
    chain: { id: chain.id, name: chain.name, slug: chain.slug },
    generatedAt: new Date().toISOString(),
    windowDays: days,
    today: todayKey,
    summary,
    exceptions,
  };
}
