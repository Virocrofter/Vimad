/* apps/api/src/modules/guest-portal/guest-commerce.routes.ts
 * [G4] In-stay commerce — portal-token auth, reservation-bound, checked-in guests only.
 * Reuse: postCharge/reverseCharge (folios), sellProduct (upsells), myTimeline (C4′b).
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { resolveToken } from './guest-portal.service.js';
import { postCharge, reverseCharge } from '../folios/folios.service.js';
import { sellProduct } from '../upsell/upsell.service.js';
import { myTimeline } from '../checkin/checkin.service.js';

export const guestCommerceRouter = Router();

const ok = (res: Response, data: unknown) => res.json({ data });

const asyncRoute =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res)).catch(next);

const r2 = (n: number) => Math.round(n * 100) / 100;

function hhmm(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(date);
}

async function propertyTimezone(propertyId: string): Promise<string> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { timezone: true },
  });
  return property?.timezone ?? 'UTC';
}

function withinWindow(now: string, from: string, to: string): boolean {
  if (from <= to) return now >= from && now <= to;
  return now >= from || now <= to;
}

// ─── GET /:token/menu — time-blocked catalog ───

guestCommerceRouter.get(
  '/:token/menu',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));
    const timezone = await propertyTimezone(reservation.propertyId);
    const now = hhmm(new Date(), timezone);

    const items = await prisma.menuItem.findMany({
      where: {
        tenantId: reservation.tenantId,
        propertyId: reservation.propertyId,
        status: 'active',
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        availableFrom: true,
        availableTo: true,
      },
    });

    const menu = items.map((m) => ({
      ...m,
      price: Number(m.price),
      availableNow: withinWindow(now, m.availableFrom, m.availableTo),
    }));

    return ok(res, { token: String(req.params.token), now, timezone, menu });
  })
);

// ─── POST /:token/order ───

const orderItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
});

const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1).max(20),
  note: z.string().max(300).optional(),
  idempotencyKey: z.string().min(8).max(128),
});

guestCommerceRouter.post(
  '/:token/order',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));
    if (reservation.status !== 'checked_in') {
      throw new AppError(409, 'Room service opens at check-in', 'NOT_CHECKED_IN');
    }
    const input = orderSchema.parse(req.body ?? {});

    const existing = await prisma.guestOrder.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      if (existing.reservationId !== reservation.id) {
        throw new AppError(403, 'Idempotency key belongs to another reservation', 'FORBIDDEN');
      }
      const items = await prisma.guestOrderItem.findMany({ where: { orderId: existing.id } });
      return ok(res, {
        order: {
          ...existing,
          total: Number(existing.total),
          items: items.map((i) => ({ ...i, unitPrice: Number(i.unitPrice) })),
        },
        idempotentReplay: true,
      });
    }

    const timezone = await propertyTimezone(reservation.propertyId);
    const now = hhmm(new Date(), timezone);

    const ids = input.items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: ids },
        tenantId: reservation.tenantId,
        propertyId: reservation.propertyId,
        status: 'active',
      },
    });
    const byId = new Map(menuItems.map((m) => [m.id, m]));

    const lines = input.items.map((line) => {
      const item = byId.get(line.menuItemId);
      if (!item) throw new AppError(404, 'A menu item is no longer available', 'MENU_ITEM_GONE');
      if (!withinWindow(now, item.availableFrom, item.availableTo)) {
        throw new AppError(
          409,
          `"${item.name}" is outside kitchen hours (${item.availableFrom}\u2013${item.availableTo})`,
          'OUTSIDE_KITCHEN_HOURS'
        );
      }
      return { item, quantity: line.quantity };
    });

    const total = r2(lines.reduce((sum, l) => sum + Number(l.item.price) * l.quantity, 0));
    const folio = await prisma.folio.findFirst({ where: { reservationId: reservation.id } });
    if (!folio) throw new AppError(409, 'No open folio for this stay', 'NO_FOLIO');

    const order = await prisma.guestOrder.create({
      data: {
        tenantId: reservation.tenantId,
        propertyId: reservation.propertyId,
        reservationId: reservation.id,
        guestId: reservation.guestId,
        folioId: folio.id,
        status: 'received',
        total,
        note: input.note ?? null,
        idempotencyKey: input.idempotencyKey,
        items: {
          create: lines.map((l) => ({
            menuItemId: l.item.id,
            name: l.item.name,
            unitPrice: Number(l.item.price),
            quantity: l.quantity,
          })),
        },
      },
    });

    const summary = lines.map((l) => `${l.quantity}x ${l.item.name}`).join(', ');
    const folioItem = await postCharge(reservation.tenantId, folio.id, {
      type: 'service',
      description: `Room service - ${summary}`,
      amount: total,
      quantity: 1,
    });

    await prisma.guestOrder.update({
      where: { id: order.id },
      data: { folioItemId: folioItem.id },
    });

    await prisma.task
      .create({
        data: {
          tenantId: reservation.tenantId,
          propertyId: reservation.propertyId,
          department: 'kitchen',
          title: `Room service order - ${summary} (${total.toFixed(2)} ZAR)`,
          description: [
            `Guest: ${reservation.guest.firstName} ${reservation.guest.lastName} (${reservation.confirmationNumber}).`,
            input.note ? `Note: ${input.note}` : null,
            `Order ${order.id} - move to preparing, then ready; the guest tracks status live.`,
          ]
            .filter(Boolean)
            .join('\n'),
          status: 'open',
          priority: 'normal',
          reservationId: reservation.id,
          dedupeKey: `order-${order.id}`,
          source: 'guest_portal',
        },
      })
      .catch(() => {});

    logger.info({ orderId: order.id, total }, 'guest room-service order');

    const items = await prisma.guestOrderItem.findMany({ where: { orderId: order.id } });
    return ok(res, {
      order: {
        ...order,
        folioItemId: folioItem.id,
        total,
        items: items.map((i) => ({ ...i, unitPrice: Number(i.unitPrice) })),
      },
      idempotentReplay: false,
    });
  })
);

// ─── GET /:token/orders ───

guestCommerceRouter.get(
  '/:token/orders',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));

    const orders = await prisma.guestOrder.findMany({
      where: { tenantId: reservation.tenantId, reservationId: reservation.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const withItems = await Promise.all(
      orders.map(async (o) => ({
        ...o,
        total: Number(o.total),
        items: (await prisma.guestOrderItem.findMany({ where: { orderId: o.id } })).map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
        })),
      }))
    );

    return ok(res, { token: String(req.params.token), orders: withItems });
  })
);

// ─── POST /:token/orders/:orderId/cancel ───

guestCommerceRouter.post(
  '/:token/orders/:orderId/cancel',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));

    const order = await prisma.guestOrder.findFirst({
      where: {
        id: String(req.params.orderId),
        tenantId: reservation.tenantId,
        reservationId: reservation.id,
      },
    });
    if (!order) throw new AppError(404, 'Order not found', 'NOT_FOUND');
    if (order.status !== 'received') {
      throw new AppError(
        409,
        `Order is already ${order.status} - contact the front desk`,
        'ORDER_LOCKED'
      );
    }

    if (order.folioId && order.folioItemId) {
      await reverseCharge(
        reservation.tenantId,
        order.folioId,
        order.folioItemId,
        `Guest cancelled order ${order.id.slice(0, 8)}`
      );
    }

    const updated = await prisma.guestOrder.update({
      where: { id: order.id },
      data: { status: 'cancelled' },
    });

    return ok(res, { id: updated.id, status: updated.status });
  })
);

// ─── GET /:token/upsells ───

guestCommerceRouter.get(
  '/:token/upsells',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));

    const products = await prisma.upsellProduct.findMany({
      where: {
        tenantId: reservation.tenantId,
        propertyId: reservation.propertyId,
        status: 'active',
      },
      orderBy: { price: 'asc' },
      select: { id: true, name: true, category: true, price: true, taxInclusive: true },
    });

    return ok(res, {
      token: String(req.params.token),
      products: products.map((p) => ({ ...p, price: Number(p.price) })),
    });
  })
);

// ─── POST /:token/upsells/:productId/purchase ───

guestCommerceRouter.post(
  '/:token/upsells/:productId/purchase',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));
    if (reservation.status !== 'checked_in') {
      throw new AppError(409, 'Upsells are available from check-in', 'NOT_CHECKED_IN');
    }
    const quantity = Math.max(
      1,
      Math.min(20, Number((req.body as { quantity?: number } | undefined)?.quantity ?? 1))
    );

    const result = await sellProduct(reservation.tenantId, reservation.guestId, {
      productId: String(req.params.productId),
      quantity,
      reservationId: reservation.id,
    });

    logger.info({ saleId: result.saleId }, 'guest upsell purchase');

    return ok(res, { id: result.saleId, folioItemId: result.folioItemId, total: result.total });
  })
);

// ─── GET /:token/timeline — C4′b reuse ───

guestCommerceRouter.get(
  '/:token/timeline',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));

    const timeline = await myTimeline(reservation.tenantId, reservation.guestId);
    const events = Array.isArray(timeline)
      ? timeline
      : ((timeline as { events?: unknown[] } | null)?.events ?? []);

    return ok(res, { token: String(req.params.token), events });
  })
);

// ─── Errors ───

guestCommerceRouter.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  const e = err as { statusCode?: number; status?: number; code?: string; message?: string };
  if (err instanceof AppError || e.statusCode || e.status) {
    return res
      .status(e.statusCode ?? e.status ?? 500)
      .json({ error: { code: e.code ?? 'ERROR', message: e.message ?? 'Request failed' } });
  }
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.issues[0]?.message ?? 'Invalid input' },
    });
  }
  logger.warn({ err }, 'guest-commerce unexpected error');
  return res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
});
