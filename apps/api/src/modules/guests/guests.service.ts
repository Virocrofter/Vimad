import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginate, paginationSchema, skipTake } from '../../common/pagination.js';

export const guestCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  passportNumber: z.string().optional(),
  vipStatus: z.string().optional(),
  doNotDisturb: z.boolean().optional(),
  blacklisted: z.boolean().optional(),
  blacklistReason: z.string().optional(),
  notes: z.string().optional(),
});

export const guestUpdateSchema = guestCreateSchema.partial();

export const guestNoteCreateSchema = z.object({
  body: z.string().min(1).max(2000),
});

export const guestPreferenceSchema = z.object({
  category: z.string().min(1).max(50),
  key: z.string().min(1).max(100),
  value: z.string().min(1).max(500),
});

export const guestDocumentSchema = z.object({
  type: z.string().min(1).max(50),
  number: z.string().max(100).optional(),
  issuedBy: z.string().max(100).optional(),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  fileUrl: z.string().max(500).optional(),
});

export const guestMergeSchema = z.object({
  targetGuestId: z.string().min(1),
});

export type GuestCreateInput = z.infer<typeof guestCreateSchema>;
export type GuestUpdateInput = z.infer<typeof guestUpdateSchema>;
export type GuestNoteCreateInput = z.infer<typeof guestNoteCreateSchema>;
export type GuestPreferenceInput = z.infer<typeof guestPreferenceSchema>;
export type GuestDocumentInput = z.infer<typeof guestDocumentSchema>;
export type GuestMergeInput = z.infer<typeof guestMergeSchema>;

const SORTABLE_FIELDS = ['firstName', 'lastName', 'email', 'vipStatus', 'createdAt'] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];

export interface GuestListQuery {
  page: number;
  pageSize: number;
  search?: string;
  vipStatus?: string;
  blacklisted?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export async function listGuests(tenantId: string, query: GuestListQuery, propertyIds?: string[]) {
  const pagination = paginationSchema.parse(query);
  const where: Record<string, unknown> = { tenantId };

  if (propertyIds?.length) where.reservations = { some: { propertyId: { in: propertyIds } } };

  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search, mode: 'insensitive' } },
      { passportNumber: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.vipStatus) {
    if (query.vipStatus === 'vip') {
      // non-empty, non-null (SQL NOT IN excludes NULL rows automatically)
      where.vipStatus = { notIn: [''] };
    } else if (query.vipStatus === 'none') {
      where.OR = [...((where.OR as object[]) ?? []), { vipStatus: null }, { vipStatus: '' }];
    } else {
      where.vipStatus = query.vipStatus;
    }
  }

  if (query.blacklisted === 'true') {
    where.blacklisted = true;
  } else if (query.blacklisted === 'false') {
    where.blacklisted = false;
  }

  const sortBy: SortableField = SORTABLE_FIELDS.includes(query.sortBy as SortableField)
    ? (query.sortBy as SortableField)
    : 'createdAt';
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';

  const [total, items] = await Promise.all([
    prisma.guest.count({ where }),
    prisma.guest.findMany({
      where,
      include: {
        _count: { select: { reservations: true } },
        reservations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            confirmationNumber: true,
            status: true,
            arrivalDate: true,
            departureDate: true,
          },
        },
      },
      orderBy: { [sortBy]: sortDir },
      ...skipTake(pagination),
    }),
  ]);

  return paginate(items, total, pagination);
}

export async function getGuestStats(tenantId: string) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [total, vip, newThisMonth, inHouse, blacklisted] = await Promise.all([
    prisma.guest.count({ where: { tenantId } }),
    prisma.guest.count({ where: { tenantId, vipStatus: { notIn: [''] } } }),
    prisma.guest.count({ where: { tenantId, createdAt: { gte: monthStart } } }),
    prisma.reservation.findMany({
      where: { tenantId, status: 'checked_in' },
      select: { guestId: true },
      distinct: ['guestId'],
    }),
    prisma.guest.count({ where: { tenantId, blacklisted: true } }),
  ]);

  return {
    total,
    vip,
    newThisMonth,
    inHouse: inHouse.length,
    blacklisted,
  };
}

export async function getGuest(tenantId: string, id: string) {
  const guest = await prisma.guest.findFirst({
    where: { id, tenantId },
    include: {
      preferences: { orderBy: { category: 'asc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      // Prisma relation is named guestNotes, not notes — the wrong name
      // was the cause of the 500 on GET /v1/guests/:id
      guestNotes: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
      },
      reservations: {
        orderBy: { arrivalDate: 'desc' },
        include: {
          property: { select: { id: true, name: true } },
          stays: { include: { room: { select: { id: true, number: true } } } },
        },
      },
    },
  });

  if (!guest) {
    throw new AppError(404, 'Guest not found', 'NOT_FOUND');
  }

  const stats = await prisma.reservation.aggregate({
    where: {
      guestId: id,
      status: { notIn: ['cancelled', 'no_show'] },
    },
    _count: { id: true },
    _sum: { nights: true, totalAmount: true },
  });

  const { guestNotes, ...rest } = guest;

  return {
    ...rest,
    notes: guestNotes,
    totalStays: stats._count.id,
    totalNights: stats._sum.nights ?? 0,
    totalRevenue: Number(stats._sum.totalAmount ?? 0),
  };
}

export async function createGuest(tenantId: string, input: GuestCreateInput) {
  return prisma.guest.create({
    data: {
      tenantId,
      ...input,
    },
  });
}

export async function updateGuest(tenantId: string, id: string, input: GuestUpdateInput) {
  const existing = await prisma.guest.findFirst({ where: { id, tenantId } });
  if (!existing) {
    throw new AppError(404, 'Guest not found', 'NOT_FOUND');
  }

  const data: Prisma.GuestUpdateInput = { ...input };
  // Clearing a blacklist also clears its reason
  if (input.blacklisted === false) data.blacklistReason = null;

  return prisma.guest.update({ where: { id }, data });
}

export async function deleteGuest(tenantId: string, id: string) {
  const existing = await prisma.guest.findFirst({ where: { id, tenantId } });
  if (!existing) {
    throw new AppError(404, 'Guest not found', 'NOT_FOUND');
  }

  const reservationCount = await prisma.reservation.count({ where: { guestId: id } });
  if (reservationCount > 0) {
    throw new AppError(
      409,
      'This guest has reservation history and cannot be deleted. Consider blacklisting instead.',
      'GUEST_HAS_HISTORY'
    );
  }

  return prisma.guest.delete({ where: { id } });
}

// ─── Notes ───

export async function listGuestNotes(tenantId: string, guestId: string) {
  const guest = await prisma.guest.findFirst({ where: { id: guestId, tenantId } });
  if (!guest) throw new AppError(404, 'Guest not found', 'NOT_FOUND');

  return prisma.guestNote.findMany({
    where: { guestId },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, firstName: true, lastName: true } } },
  });
}

export async function createGuestNote(
  tenantId: string,
  guestId: string,
  authorId: string | undefined,
  input: GuestNoteCreateInput
) {
  const guest = await prisma.guest.findFirst({ where: { id: guestId, tenantId } });
  if (!guest) throw new AppError(404, 'Guest not found', 'NOT_FOUND');

  return prisma.guestNote.create({
    data: { guestId, authorId, body: input.body, tenantId },
    include: { author: { select: { id: true, firstName: true, lastName: true } } },
  });
}

export async function deleteGuestNote(tenantId: string, guestId: string, noteId: string) {
  const note = await prisma.guestNote.findFirst({
    where: { id: noteId, guestId, guest: { tenantId } },
  });
  if (!note) throw new AppError(404, 'Note not found', 'NOT_FOUND');

  return prisma.guestNote.delete({ where: { id: noteId } });
}

// ─── Preferences ───

export async function createGuestPreference(
  tenantId: string,
  guestId: string,
  input: GuestPreferenceInput
) {
  const guest = await prisma.guest.findFirst({ where: { id: guestId, tenantId } });
  if (!guest) throw new AppError(404, 'Guest not found', 'NOT_FOUND');

  return prisma.guestPreference.create({
    data: { guestId, ...input },
  });
}

export async function deleteGuestPreference(
  tenantId: string,
  guestId: string,
  preferenceId: string
) {
  const pref = await prisma.guestPreference.findFirst({
    where: { id: preferenceId, guestId, guest: { tenantId } },
  });
  if (!pref) throw new AppError(404, 'Preference not found', 'NOT_FOUND');

  return prisma.guestPreference.delete({ where: { id: preferenceId } });
}

// ─── Documents ───

export async function createGuestDocument(
  tenantId: string,
  guestId: string,
  input: GuestDocumentInput
) {
  const guest = await prisma.guest.findFirst({ where: { id: guestId, tenantId } });
  if (!guest) throw new AppError(404, 'Guest not found', 'NOT_FOUND');

  return prisma.guestDocument.create({
    data: { guestId, ...input },
  });
}

export async function deleteGuestDocument(tenantId: string, guestId: string, documentId: string) {
  const doc = await prisma.guestDocument.findFirst({
    where: { id: documentId, guestId, guest: { tenantId } },
  });
  if (!doc) throw new AppError(404, 'Document not found', 'NOT_FOUND');

  return prisma.guestDocument.delete({ where: { id: documentId } });
}

// ─── Merge ───
// Re-points all related records from the source guest to the target guest,
// combines loyalty points, deletes the source profile, and leaves a full
// audit note on the target so the merge is traceable in the notes tab.

export async function mergeGuests(
  tenantId: string,
  sourceId: string,
  input: GuestMergeInput,
  authorId?: string
) {
  const { targetGuestId } = input;

  if (sourceId === targetGuestId) {
    throw new AppError(400, 'Cannot merge a guest into itself', 'MERGE_SAME_GUEST');
  }

  const [source, target] = await Promise.all([
    prisma.guest.findFirst({ where: { id: sourceId, tenantId } }),
    prisma.guest.findFirst({ where: { id: targetGuestId, tenantId } }),
  ]);

  if (!source) throw new AppError(404, 'Source guest not found', 'NOT_FOUND');
  if (!target) throw new AppError(404, 'Target guest not found', 'NOT_FOUND');

  const moved = await prisma.$transaction(async (tx) => {
    const [reservations, notes, preferences, documents, loyaltyTransactions] = await Promise.all([
      tx.reservation.updateMany({ where: { guestId: sourceId }, data: { guestId: targetGuestId } }),
      tx.guestNote.updateMany({ where: { guestId: sourceId }, data: { guestId: targetGuestId } }),
      tx.guestPreference.updateMany({
        where: { guestId: sourceId },
        data: { guestId: targetGuestId },
      }),
      tx.guestDocument.updateMany({
        where: { guestId: sourceId },
        data: { guestId: targetGuestId },
      }),
      tx.loyaltyTransaction.updateMany({
        where: { guestId: sourceId },
        data: { guestId: targetGuestId },
      }),
    ]);

    const combinedPoints = source.loyaltyPoints + target.loyaltyPoints;

    const updatedTarget = await tx.guest.update({
      where: { id: targetGuestId },
      data: {
        loyaltyPoints: combinedPoints,
        blacklisted: target.blacklisted || source.blacklisted,
        doNotDisturb: target.doNotDisturb || source.doNotDisturb,
        vipStatus: target.vipStatus ?? source.vipStatus,
        email: target.email ?? source.email,
        phone: target.phone ?? source.phone,
        passportNumber: target.passportNumber ?? source.passportNumber,
        nationality: target.nationality ?? source.nationality,
        address: target.address ?? source.address,
        city: target.city ?? source.city,
        country: target.country ?? source.country,
        dateOfBirth: target.dateOfBirth ?? source.dateOfBirth,
      },
    });

    await tx.guestNote.create({
      data: {
        guestId: targetGuestId,
        tenantId,
        authorId,
        body: `Merged duplicate profile "${source.firstName} ${source.lastName}" (ID: ${source.id.slice(-8)}) into this profile. Moved ${reservations.count} reservation(s), ${notes.count} note(s), ${preferences.count} preference(s), ${documents.count} document(s), ${loyaltyTransactions.count} loyalty transaction(s). Loyalty points combined to ${combinedPoints}.`,
      },
    });

    await tx.guest.delete({ where: { id: sourceId } });

    return {
      target: updatedTarget,
      movedReservations: reservations.count,
      movedNotes: notes.count,
      movedPreferences: preferences.count,
      movedDocuments: documents.count,
      movedLoyaltyTransactions: loyaltyTransactions.count,
    };
  });

  return moved;
}
