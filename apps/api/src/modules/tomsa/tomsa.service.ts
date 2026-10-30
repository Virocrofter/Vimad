/* apps/api/src/modules/tomsa/tomsa.service.ts — SA-1 TOMSA tourism levy (1%) */
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

const r2 = (n: number) => Math.round(n * 100) / 100;
const sod = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const eod = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export async function getConfig(tenantId: string, propertyId: string) {
  const p = await prisma.property.findFirst({
    where: { id: propertyId, tenantId },
    select: { tomsaLevyEnabled: true, tomsaLevyPct: true },
  });
  if (!p) throw new AppError(404, 'Property not found', 'NOT_FOUND');
  return { enabled: p.tomsaLevyEnabled, pct: Number(p.tomsaLevyPct) };
}

export async function setConfig(
  tenantId: string,
  propertyId: string,
  enabled: boolean,
  pct: number
) {
  if (!(pct >= 0 && pct <= 10)) throw new AppError(400, 'pct must be 0-10', 'VALIDATION_ERROR');
  const property = await prisma.property.findFirst({ where: { id: propertyId, tenantId } });
  if (!property) throw new AppError(404, 'Property not found', 'NOT_FOUND');
  await prisma.property.update({
    where: { id: propertyId },
    data: { tomsaLevyEnabled: enabled, tomsaLevyPct: pct },
  });
  return { enabled, pct };
}

export async function postDay(tenantId: string, propertyId: string, dateStr: string) {
  const property = await prisma.property.findFirst({ where: { id: propertyId, tenantId } });
  if (!property) throw new AppError(404, 'Property not found', 'NOT_FOUND');
  if (!property.tomsaLevyEnabled) {
    throw new AppError(403, 'TOMSA levy is not enabled for this property', 'LEVY_DISABLED');
  }
  const pct = Number(property.tomsaLevyPct);
  const day = sod(new Date(dateStr + 'T00:00:00.000Z'));
  const dayEnd = eod(day);
  const items = await prisma.folioItem.findMany({
    where: {
      postedAt: { gte: day, lte: dayEnd },
      type: 'room_charge',
      folio: { tenantId, reservation: { propertyId } },
    },
    select: { folioId: true, amount: true, quantity: true },
  });
  const byFolio = new Map<string, number>();
  for (const it of items) {
    byFolio.set(
      it.folioId,
      (byFolio.get(it.folioId) ?? 0) + Number(it.amount) * (Number(it.quantity) || 1)
    );
  }
  let posted = 0;
  let totalLevy = 0;
  for (const [folioId, roomCharges] of byFolio) {
    const existing = await prisma.tomsaLevyPosting.findUnique({
      where: { folioId_date: { folioId, date: day } },
    });
    if (existing) continue;
    const levyAmount = r2((roomCharges * pct) / 100);
    if (levyAmount <= 0) continue;
    const item = await prisma.folioItem.create({
      data: {
        folioId,
        type: 'tomsa_levy',
        description: 'TOMSA tourism levy (' + pct + '%)',
        amount: levyAmount,
        quantity: 1,
      },
    });
    await prisma.tomsaLevyPosting.create({
      data: {
        tenantId,
        propertyId,
        folioId,
        date: day,
        roomCharges: r2(roomCharges),
        levyPct: pct,
        levyAmount,
        folioItemId: item.id,
      },
    });
    posted += 1;
    totalLevy = r2(totalLevy + levyAmount);
  }
  return { posted, totalLevy: r2(totalLevy), folios: byFolio.size };
}

export async function summary(tenantId: string, propertyId: string, from: string, to: string) {
  const rows = await prisma.tomsaLevyPosting.findMany({
    where: {
      tenantId,
      propertyId,
      date: {
        gte: sod(new Date(from + 'T00:00:00.000Z')),
        lte: eod(new Date(to + 'T00:00:00.000Z')),
      },
    },
  });
  const roomCharges = rows.reduce((s, r) => s + Number(r.roomCharges), 0);
  const levy = rows.reduce((s, r) => s + Number(r.levyAmount), 0);
  return {
    postings: rows.length,
    roomCharges: r2(roomCharges),
    levyDue: r2(levy),
    effectivePct: roomCharges ? r2((levy / roomCharges) * 100) : 0,
  };
}
