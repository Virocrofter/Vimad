/* apps/api/src/modules/upsell/upsell.service.ts — C7' upsell */
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

const r2 = (n: number) => Math.round(n * 100) / 100;

async function recomputeFolio(folioId: string) {
  const items = await prisma.folioItem.findMany({ where: { folioId } });
  const charges = items.reduce((s, i) => s + Number(i.amount) * (Number(i.quantity) || 1), 0);
  await prisma.folio.update({
    where: { id: folioId },
    data: { totalCharges: charges, balance: charges },
  });
}

export async function listProducts(tenantId: string, propertyId?: string) {
  return prisma.upsellProduct.findMany({
    where: { tenantId, ...(propertyId ? { propertyId } : {}) },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createProduct(
  tenantId: string,
  propertyId: string,
  input: Record<string, unknown>
) {
  const name = String(input.name ?? '').trim();
  const price = Number(input.price);
  if (name.length < 2 || !(price > 0)) {
    throw new AppError(400, 'name and positive price required', 'VALIDATION_ERROR');
  }
  const property = await prisma.property.findFirst({ where: { id: propertyId, tenantId } });
  if (!property) throw new AppError(404, 'Property not found', 'NOT_FOUND');
  return prisma.upsellProduct.create({
    data: {
      tenantId,
      propertyId,
      name,
      category: String(input.category ?? 'extra'),
      price,
      taxInclusive: input.taxInclusive !== false,
    },
  });
}

export async function sellProduct(
  tenantId: string,
  actorId: string,
  input: Record<string, unknown>
) {
  const product = await prisma.upsellProduct.findFirst({
    where: { id: String(input.productId), tenantId },
  });
  if (!product || product.status !== 'active') {
    throw new AppError(404, 'Product not found', 'NOT_FOUND');
  }
  const quantity = Math.max(1, Math.min(20, Number(input.quantity ?? 1)));
  const reservation = await prisma.reservation.findFirst({
    where: { id: String(input.reservationId), tenantId, propertyId: product.propertyId },
    include: { folio: true },
  });
  if (!reservation) throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  if (!reservation.folio) throw new AppError(400, 'Reservation has no folio', 'VALIDATION_ERROR');
  const unitPrice = Number(product.price);
  const total = r2(unitPrice * quantity);
  const item = await prisma.folioItem.create({
    data: {
      folioId: reservation.folio.id,
      type: 'upsell',
      description: 'Upsell: ' + product.name,
      amount: total,
      quantity,
    },
  });
  const sale = await prisma.upsellSale.create({
    data: {
      tenantId,
      propertyId: product.propertyId,
      productId: product.id,
      reservationId: reservation.id,
      folioItemId: item.id,
      quantity,
      unitPrice,
      total,
      soldById: actorId,
    },
  });
  await recomputeFolio(reservation.folio.id);
  return { saleId: sale.id, folioItemId: item.id, total };
}

export async function salesReport(tenantId: string, propertyId: string, from: string, to: string) {
  const fromD = new Date(from + 'T00:00:00.000Z');
  const toD = new Date(to + 'T23:59:59.999Z');
  const sales = await prisma.upsellSale.findMany({
    where: { tenantId, propertyId, createdAt: { gte: fromD, lte: toD } },
    include: { product: { select: { name: true, category: true } } },
  });
  const agg = new Map<string, { units: number; revenue: number }>();
  for (const s of sales) {
    const k = s.product?.name ?? 'Unknown';
    const a = agg.get(k) ?? { units: 0, revenue: 0 };
    a.units += s.quantity;
    a.revenue += Number(s.total);
    agg.set(k, a);
  }
  return {
    totalRevenue: r2(sales.reduce((sum, s) => sum + Number(s.total), 0)),
    salesCount: sales.length,
    byProduct: [...agg.entries()].map(([name, a]) => ({
      name,
      units: a.units,
      revenue: r2(a.revenue),
    })),
  };
}
