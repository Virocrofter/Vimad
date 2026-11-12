/* apps/api/src/modules/minibar/minibar.service.ts — T2
 * Minibar logging with photo proof. Confirming a check auto-posts a folio
 * charge on the in-house reservation for that room. Idempotent: the folio
 * post is guarded by folioItemId + a status flip inside a transaction.
 */
import { Prisma } from '@prisma/client';
import { resolveAuditPropertyId } from '../audit/audit-property.js';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { putFile, getSignedDownloadUrl } from '../../common/storage.js';

export interface MinibarItemInput {
  name: string;
  quantity: number;
  priceMinor: number;
}

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function decodeDataUrl(dataUrl: string): { buffer: Buffer; ext: string } {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!m) {
    throw new AppError(400, 'Photos must be JPEG, PNG or WebP data URLs', 'VALIDATION_ERROR');
  }
  const buffer = Buffer.from(m[2], 'base64');
  if (buffer.length === 0 || buffer.length > MAX_PHOTO_BYTES) {
    throw new AppError(
      400,
      `Photo exceeds ${MAX_PHOTO_BYTES / 1024 / 1024}MB limit`,
      'VALIDATION_ERROR'
    );
  }
  return { buffer, ext: MIME_EXT[m[1]] };
}

function describeItems(items: MinibarItemInput[]): string {
  return items.map((i) => `${i.quantity}× ${i.name}`).join(', ');
}

// ─── Find the in-house reservation occupying a room today ───

async function findInHouseReservation(tenantId: string, roomId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.reservation.findFirst({
    where: {
      tenantId,
      status: 'checked_in',
      stays: { some: { roomId, date: { gte: today, lt: tomorrow } } },
    },
    include: { folio: true, guest: true },
  });
}

// ─── Log consumption + photos, then auto-post the folio charge ───

export async function logMinibarConsumption(
  tenantId: string,
  loggedById: string,
  input: { roomId: string; items: MinibarItemInput[]; photos: string[]; note?: string }
) {
  const room = await prisma.room.findFirst({
    where: { id: input.roomId, tenantId },
    include: { property: { select: { id: true } } },
  });
  if (!room) throw new AppError(404, 'Room not found', 'NOT_FOUND');

  const totalMinor = input.items.reduce((sum, i) => sum + i.quantity * i.priceMinor, 0);
  if (totalMinor <= 0)
    throw new AppError(400, 'Total must be greater than zero', 'VALIDATION_ERROR');

  // 1. Store photos to storage (keys only in the DB)
  const photoKeys: string[] = [];
  const checkId = crypto.randomUUID();
  for (let i = 0; i < input.photos.length; i++) {
    const { buffer, ext } = decodeDataUrl(input.photos[i]);
    const key = `minibar/${tenantId}/${checkId}/${i}.${ext}`;
    await putFile(key, buffer, `image/${ext === 'jpg' ? 'jpeg' : ext}`);
    photoKeys.push(key);
  }

  // 2. Find who is in the room right now
  const reservation = await findInHouseReservation(tenantId, room.id);

  // 3. Create the check (status logged until the charge lands)
  const check = await prisma.minibarCheck.create({
    data: {
      id: checkId,
      tenantId,
      propertyId: room.propertyId,
      roomId: room.id,
      reservationId: reservation?.id ?? null,
      status: 'logged',
      items: input.items as unknown as Prisma.InputJsonValue,
      totalMinor,
      photos: photoKeys,
      note: input.note ?? null,
      loggedById,
    },
  });

  // 4. Auto-post the folio charge — transactional + idempotent
  let posted = false;
  if (reservation?.folio) {
    posted = await postChargeToFolio(
      check.id,
      reservation.folio.id,
      reservation.id,
      input.items,
      totalMinor,
      tenantId
    );
  }

  const final = await prisma.minibarCheck.findUnique({ where: { id: check.id } });
  logger.info(
    { checkId: check.id, roomId: room.id, reservationId: reservation?.id, totalMinor, posted },
    'minibar check logged'
  );
  return { check: final, posted, reservation };
}

// ─── Folio posting chokepoint — safe to call repeatedly ───

async function postChargeToFolio(
  checkId: string,
  folioId: string,
  reservationId: string,
  items: MinibarItemInput[],
  totalMinor: number,
  tenantId: string
): Promise<boolean> {
  const amount = totalMinor / 100;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.minibarCheck.findUnique({ where: { id: checkId } });
    if (!existing || existing.status === 'posted' || existing.folioItemId) return false;

    const folio = await tx.folio.findUnique({ where: { id: folioId } });
    if (!folio) return false;

    const item = await tx.folioItem.create({
      data: {
        folioId,
        type: 'minibar',
        description: `Minibar — ${describeItems(items)}`,
        amount,
        quantity: 1,
      },
    });

    const newCharges = Number(folio.totalCharges) + amount;
    const newBalance = newCharges - Number(folio.totalPayments);
    await tx.folio.update({
      where: { id: folioId },
      data: { totalCharges: newCharges, balance: newBalance },
    });

    const reservation = await tx.reservation.findUnique({ where: { id: reservationId } });
    if (reservation) {
      await tx.reservation.update({
        where: { id: reservationId },
        data: { balance: Number(reservation.balance) + amount },
      });
    }

    await tx.minibarCheck.update({
      where: { id: checkId },
      data: { status: 'posted', folioItemId: item.id, postedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        action: 'minibar.charge_posted',
        entity: 'minibar_check',
        entityId: checkId,
        propertyId: await resolveAuditPropertyId(tenantId, 'minibar_check', checkId),
        metadata: {
          folioId,
          folioItemId: item.id,
          amount,
          items: items.map((i) => ({ ...i })),
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return true;
  });
}

// ─── Waive / dispute (reverses the charge if it was posted) ───

export async function settleMinibarCheck(
  tenantId: string,
  checkId: string,
  action: 'waived' | 'disputed',
  reason: string,
  userId: string
) {
  const check = await prisma.minibarCheck.findFirst({ where: { id: checkId, tenantId } });
  if (!check) throw new AppError(404, 'Minibar check not found', 'NOT_FOUND');
  if (check.status !== 'posted' && check.status !== 'logged') {
    throw new AppError(409, `Check already ${check.status}`, 'CONFLICT');
  }

  await prisma.$transaction(async (tx) => {
    // Reverse the folio charge on waive (never on dispute — dispute holds it)
    if (action === 'waived' && check.status === 'posted' && check.folioItemId) {
      const folio = check.reservationId
        ? await tx.folio.findUnique({ where: { reservationId: check.reservationId } })
        : null;
      if (folio) {
        const amount = check.totalMinor / 100;
        await tx.folioItem.create({
          data: {
            folioId: folio.id,
            type: 'minibar_adjustment',
            description: `Minibar waived — ${reason}`,
            amount: -amount,
            quantity: 1,
          },
        });
        const newCharges = Number(folio.totalCharges) - amount;
        await tx.folio.update({
          where: { id: folio.id },
          data: { totalCharges: newCharges, balance: newCharges - Number(folio.totalPayments) },
        });
      }
    }

    await tx.minibarCheck.update({
      where: { id: checkId },
      data: { status: action, note: reason },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: `minibar.${action}`,
        entity: 'minibar_check',
        entityId: checkId,
        propertyId: await resolveAuditPropertyId(tenantId, 'minibar_check', checkId),
        metadata: { reason, folioItemId: check.folioItemId } as unknown as Prisma.InputJsonValue,
      },
    });
  });

  return prisma.minibarCheck.findUnique({ where: { id: checkId } });
}

// ─── Reads ───

export async function listMinibarChecks(
  tenantId: string,
  filters: { roomId?: string; status?: string; page: number; pageSize: number }
) {
  const where = {
    tenantId,
    ...(filters.roomId ? { roomId: filters.roomId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };
  const [total, data] = await Promise.all([
    prisma.minibarCheck.count({ where }),
    prisma.minibarCheck.findMany({
      where,
      include: {
        room: { select: { number: true } },
        reservation: { select: { confirmationNumber: true } },
        loggedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  // Sign photo keys so the frontend can render them immediately
  const withUrls = await Promise.all(
    data.map(async (c) => ({
      ...c,
      photoUrls: await Promise.all(
        c.photos.map((k) => getSignedDownloadUrl(k, { ttlSeconds: 3600 }))
      ),
    }))
  );

  return {
    data: withUrls,
    meta: { ...filters, total, totalPages: Math.ceil(total / filters.pageSize) },
  };
}
