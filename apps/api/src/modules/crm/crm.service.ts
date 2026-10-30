import type { PrismaClient } from '@prisma/client';
import { AppError } from '../../common/errors.js';
import { sendEmail } from '../../jobs/email.queue.js';
import type { SegmentRule } from './crm.schemas.js';
import { aggregateGuestStats, matchRule, rfmScore } from './crm.scoring.js';

/* Stay = checked_in or checked_out reservation. Revenue = totalAmount (ZAR). */
const GUEST_PUBLIC_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  vipStatus: true,
  tags: true,
} as const;

function displayName(g: { firstName?: string | null; lastName?: string | null }): string {
  return [g.firstName, g.lastName].filter(Boolean).join(' ') || 'Guest';
}

async function assertGuest(prisma: PrismaClient, tenantId: string, guestId: string) {
  const guest = await prisma.guest.findFirst({ where: { id: guestId, tenantId } });
  if (!guest) throw new AppError(404, 'Guest not found', 'NOT_FOUND');
  return guest;
}

// ── Guest 360 ───────────────────────────────────────────────────
export async function updateGuestCrm(
  prisma: PrismaClient,
  tenantId: string,
  guestId: string,
  data: { tags?: string[]; vipStatus?: string }
) {
  await assertGuest(prisma, tenantId, guestId);
  return prisma.guest.update({ where: { id: guestId }, data });
}

export async function getGuest360(prisma: PrismaClient, tenantId: string, guestId: string) {
  const guest = await prisma.guest.findFirst({
    where: { id: guestId, tenantId },
    include: { corporateAccount: { select: { id: true, name: true } } },
  });
  if (!guest) throw new AppError(404, 'Guest not found', 'NOT_FOUND');

  const stats = (await aggregateGuestStats(prisma, tenantId)).find(
    (s) => s.guestId === guestId
  ) ?? {
    guestId,
    stays: 0,
    spend: 0,
    lastStayAt: null,
    tags: guest.tags ?? [],
    vipStatus: guest.vipStatus,
  };

  const [memberships, openFollowUps, recentNotes] = await Promise.all([
    prisma.guestSegmentMembership.findMany({
      where: { tenantId, guestId },
      include: { segment: { select: { id: true, name: true, isActive: true } } },
    }),
    prisma.guestFollowUp.findMany({
      where: { tenantId, guestId, doneAt: null },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.guestNote.findMany({
      where: { guestId },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    }),
  ]);

  const reviews = await prisma.review.findMany({
    where: { tenantId, guestId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return {
    id: guest.id,
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email,
    phone: guest.phone,
    vipStatus: guest.vipStatus,
    tags: guest.tags ?? [],
    loyaltyPoints: guest.loyaltyPoints,
    blacklisted: guest.blacklisted,
    doNotDisturb: guest.doNotDisturb,
    corporateAccount: guest.corporateAccount,
    rfm: rfmScore(stats),
    stats: { stays: stats.stays, spend: stats.spend, lastStayAt: stats.lastStayAt },
    segments: memberships.map((m) => m.segment),
    openFollowUps,
    recentNotes,
    reviews,
  };
}

export interface TimelineEvent {
  at: string;
  kind: 'reservation' | 'payment' | 'note' | 'follow_up' | 'email';
  title: string;
  detail: string;
  refId: string | null;
}

export async function getTimeline(
  prisma: PrismaClient,
  tenantId: string,
  guestId: string,
  limit = 50
) {
  const guest = await assertGuest(prisma, tenantId, guestId);

  const [reservations, payments, notes, followUps, emailLogs] = await Promise.all([
    prisma.reservation.findMany({
      where: { tenantId, guestId },
      select: {
        id: true,
        status: true,
        confirmationNumber: true,
        arrivalDate: true,
        departureDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.payment.findMany({
      where: { tenantId, guestId },
      select: {
        id: true,
        reference: true,
        amountMinor: true,
        currency: true,
        status: true,
        type: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.guestNote.findMany({
      where: { guestId },
      select: { id: true, body: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.guestFollowUp.findMany({
      where: { tenantId, guestId },
      select: { id: true, title: true, doneAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    guest.email
      ? prisma.emailLog.findMany({
          where: { tenantId, to: guest.email },
          select: { id: true, subject: true, template: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
      : Promise.resolve([] as any[]),
  ]);

  const events: TimelineEvent[] = [
    ...reservations.map((r) => ({
      at: (r.arrivalDate ?? r.createdAt).toISOString(),
      kind: 'reservation' as const,
      title: `Reservation ${r.status}`,
      detail: `${r.confirmationNumber} · ${r.arrivalDate.toISOString().slice(0, 10)} → ${r.departureDate.toISOString().slice(0, 10)}`,
      refId: r.id,
    })),
    ...payments.map((p) => ({
      at: p.createdAt.toISOString(),
      kind: 'payment' as const,
      title: `Payment ${p.status}`,
      detail: `${p.currency} ${(p.amountMinor / 100).toFixed(2)} · ${p.type} · ${p.reference}`,
      refId: p.id,
    })),
    ...notes.map((n) => ({
      at: n.createdAt.toISOString(),
      kind: 'note' as const,
      title: 'Note',
      detail: n.body.slice(0, 140),
      refId: n.id,
    })),
    ...followUps.map((f) => ({
      at: f.createdAt.toISOString(),
      kind: 'follow_up' as const,
      title: f.doneAt ? 'Follow-up (done)' : 'Follow-up (open)',
      detail: f.title,
      refId: f.id,
    })),
    ...emailLogs.map((e) => ({
      at: e.createdAt.toISOString(),
      kind: 'email' as const,
      title: `Email ${e.status}`,
      detail: `${e.subject} (${e.template})`,
      refId: e.id,
    })),
  ];

  return events.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, limit);
}

// ── Notes (unified guest_notes table) ───────────────────────────
export async function createNote(
  prisma: PrismaClient,
  tenantId: string,
  userId: string,
  guestId: string,
  data: { body: string; pinned?: boolean }
) {
  await assertGuest(prisma, tenantId, guestId);
  return prisma.guestNote.create({
    data: { guestId, authorId: userId, body: data.body, pinned: data.pinned ?? false, tenantId },
  });
}

export async function updateNote(
  prisma: PrismaClient,
  tenantId: string,
  noteId: string,
  data: { body?: string; pinned?: boolean }
) {
  const note = await prisma.guestNote.findFirst({ where: { id: noteId, tenantId } });
  if (!note) throw new AppError(404, 'Note not found', 'NOT_FOUND');
  return prisma.guestNote.update({ where: { id: noteId }, data });
}

export async function deleteNote(prisma: PrismaClient, tenantId: string, noteId: string) {
  const note = await prisma.guestNote.findFirst({ where: { id: noteId, tenantId } });
  if (!note) throw new AppError(404, 'Note not found', 'NOT_FOUND');
  await prisma.guestNote.delete({ where: { id: noteId } });
  return { deleted: true };
}

// ── Segments ────────────────────────────────────────────────────
export async function listSegments(prisma: PrismaClient, tenantId: string) {
  return prisma.guestSegment.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
}

export async function createSegment(
  prisma: PrismaClient,
  tenantId: string,
  data: { name: string; description?: string; rule: SegmentRule }
) {
  return prisma.guestSegment.create({ data: { ...data, tenantId } });
}

export async function updateSegment(
  prisma: PrismaClient,
  tenantId: string,
  segmentId: string,
  data: Partial<{ name: string; description: string; rule: SegmentRule; isActive: boolean }>
) {
  const seg = await prisma.guestSegment.findFirst({ where: { id: segmentId, tenantId } });
  if (!seg) throw new AppError(404, 'Segment not found', 'NOT_FOUND');
  return prisma.guestSegment.update({ where: { id: segmentId }, data });
}

export async function deleteSegment(prisma: PrismaClient, tenantId: string, segmentId: string) {
  const seg = await prisma.guestSegment.findFirst({ where: { id: segmentId, tenantId } });
  if (!seg) throw new AppError(404, 'Segment not found', 'NOT_FOUND');
  await prisma.guestSegment.delete({ where: { id: segmentId } });
  return { deleted: true };
}

export async function evaluateSegment(prisma: PrismaClient, tenantId: string, segmentId: string) {
  const seg = await prisma.guestSegment.findFirst({ where: { id: segmentId, tenantId } });
  if (!seg) throw new AppError(404, 'Segment not found', 'NOT_FOUND');

  const rule = seg.rule as unknown as SegmentRule;
  const stats = await aggregateGuestStats(prisma, tenantId);
  const matched = stats.filter((s) => matchRule(s, rule)).map((s) => s.guestId);

  await prisma.$transaction([
    prisma.guestSegmentMembership.deleteMany({ where: { segmentId: seg.id } }),
    prisma.guestSegmentMembership.createMany({
      data: matched.map((guestId) => ({ tenantId, segmentId: seg.id, guestId })),
    }),
    prisma.guestSegment.update({
      where: { id: seg.id },
      data: { memberCount: matched.length, lastRunAt: new Date() },
    }),
  ]);
  return { segmentId: seg.id, memberCount: matched.length };
}

export async function listSegmentMembers(
  prisma: PrismaClient,
  tenantId: string,
  segmentId: string,
  skip = 0,
  take = 50
) {
  const seg = await prisma.guestSegment.findFirst({ where: { id: segmentId, tenantId } });
  if (!seg) throw new AppError(404, 'Segment not found', 'NOT_FOUND');

  const [total, memberships, guests, stats] = await Promise.all([
    prisma.guestSegmentMembership.count({ where: { segmentId } }),
    prisma.guestSegmentMembership.findMany({
      where: { segmentId },
      orderBy: { addedAt: 'desc' },
      skip,
      take,
    }),
    prisma.guest.findMany({ where: { tenantId }, select: GUEST_PUBLIC_SELECT }),
    aggregateGuestStats(prisma, tenantId),
  ]);

  const guestMap = new Map(guests.map((g) => [g.id, g]));
  const statsMap = new Map(stats.map((s) => [s.guestId, s]));
  const members = memberships
    .map((m) => {
      const g = guestMap.get(m.guestId);
      if (!g) return null;
      const s = statsMap.get(m.guestId);
      return {
        ...g,
        name: displayName(g),
        stays: s?.stays ?? 0,
        spend: s?.spend ?? 0,
        lastStayAt: s?.lastStayAt ?? null,
        addedAt: m.addedAt,
      };
    })
    .filter(Boolean);

  return { segment: { id: seg.id, name: seg.name, memberCount: total }, members, total };
}

// ── Segment email blast (A3 transactional email center) ─────────
const SEGMENT_EMAIL_CAP = 500;

export async function emailSegment(
  prisma: PrismaClient,
  tenantId: string,
  segmentId: string,
  data: { subject: string; body: string }
) {
  const seg = await prisma.guestSegment.findFirst({ where: { id: segmentId, tenantId } });
  if (!seg) throw new AppError(404, 'Segment not found', 'NOT_FOUND');

  const memberships = await prisma.guestSegmentMembership.findMany({
    where: { segmentId: seg.id },
    include: { guest: { select: { email: true, firstName: true, lastName: true } } },
    take: 2000,
  });

  const seen = new Set<string>();
  const recipients: { email: string; name: string }[] = [];
  let skippedNoEmail = 0;
  for (const m of memberships) {
    const email = m.guest.email?.trim();
    if (!email) {
      skippedNoEmail++;
      continue;
    }
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipients.push({ email, name: displayName(m.guest) });
  }

  const capped = recipients.slice(0, SEGMENT_EMAIL_CAP);
  for (const r of capped) {
    await sendEmail({
      to: r.email,
      subject: data.subject,
      template: 'generic',
      payload: { message: data.body, guestName: r.name },
      tenantId,
      relatedType: 'segment',
      relatedId: seg.id,
    });
  }

  return {
    segmentId: seg.id,
    queued: capped.length,
    skippedNoEmail,
    capped: recipients.length > capped.length,
  };
}

// ── Follow-ups ──────────────────────────────────────────────────
export async function listFollowUps(
  prisma: PrismaClient,
  tenantId: string,
  q: { done?: boolean; assigneeId?: string; guestId?: string; skip: number; take: number }
) {
  const where = {
    tenantId,
    ...(q.done !== undefined ? { doneAt: q.done ? { not: null } : null } : {}),
    ...(q.assigneeId ? { assigneeId: q.assigneeId } : {}),
    ...(q.guestId ? { guestId: q.guestId } : {}),
  };
  const [total, items] = await Promise.all([
    prisma.guestFollowUp.count({ where }),
    prisma.guestFollowUp.findMany({
      where,
      orderBy: [{ doneAt: 'asc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
      skip: q.skip,
      take: q.take,
    }),
  ]);
  return { total, items };
}

export async function createFollowUp(
  prisma: PrismaClient,
  tenantId: string,
  userId: string,
  data: { guestId: string; assigneeId: string; title: string; dueAt?: Date }
) {
  await assertGuest(prisma, tenantId, data.guestId);
  const assignee = await prisma.user.findFirst({ where: { id: data.assigneeId, tenantId } });
  if (!assignee) throw new AppError(404, 'Assignee not found', 'NOT_FOUND');
  return prisma.guestFollowUp.create({
    data: {
      tenantId,
      guestId: data.guestId,
      assigneeId: data.assigneeId,
      createdById: userId,
      title: data.title,
      dueAt: data.dueAt ?? null,
    },
  });
}

export async function updateFollowUp(
  prisma: PrismaClient,
  tenantId: string,
  followUpId: string,
  data: { title?: string; assigneeId?: string; dueAt?: Date | null; done?: boolean }
) {
  const fu = await prisma.guestFollowUp.findFirst({ where: { id: followUpId, tenantId } });
  if (!fu) throw new AppError(404, 'Follow-up not found', 'NOT_FOUND');
  if (data.assigneeId) {
    const assignee = await prisma.user.findFirst({ where: { id: data.assigneeId, tenantId } });
    if (!assignee) throw new AppError(404, 'Assignee not found', 'NOT_FOUND');
  }
  return prisma.guestFollowUp.update({
    where: { id: followUpId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.assigneeId !== undefined ? { assigneeId: data.assigneeId } : {}),
      ...(data.dueAt !== undefined ? { dueAt: data.dueAt } : {}),
      ...(data.done !== undefined ? { doneAt: data.done ? new Date() : null } : {}),
    },
  });
}

// ── Corporate accounts (linked to S&C clients) ──────────────────
async function assertScClient(prisma: PrismaClient, tenantId: string, scClientId: string) {
  const c = await prisma.scClient.findFirst({ where: { id: scClientId, tenantId } });
  if (!c) throw new AppError(404, 'S&C client not found', 'NOT_FOUND');
}

export async function listCorporateAccounts(prisma: PrismaClient, tenantId: string) {
  const accounts = await prisma.corporateAccount.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { guests: true } },
      scClient: { select: { id: true, name: true } },
    },
  });
  return accounts.map(({ _count, ...a }) => ({ ...a, guestCount: _count.guests }));
}

export async function getCorporateAccount(
  prisma: PrismaClient,
  tenantId: string,
  accountId: string
) {
  const account = await prisma.corporateAccount.findFirst({
    where: { id: accountId, tenantId },
    include: {
      guests: { select: GUEST_PUBLIC_SELECT },
      scClient: { select: { id: true, name: true } },
    },
  });
  if (!account) throw new AppError(404, 'Corporate account not found', 'NOT_FOUND');

  const stats = await aggregateGuestStats(prisma, tenantId);
  const statsMap = new Map(stats.map((s) => [s.guestId, s]));
  const guests = account.guests.map((g) => ({
    ...g,
    name: displayName(g),
    stays: statsMap.get(g.id)?.stays ?? 0,
    spend: statsMap.get(g.id)?.spend ?? 0,
  }));
  const totals = guests.reduce(
    (acc, g) => ({
      stays: acc.stays + g.stays,
      spend: Math.round((acc.spend + g.spend) * 100) / 100,
    }),
    { stays: 0, spend: 0 }
  );
  return { ...account, guests, totals };
}

export async function createCorporateAccount(
  prisma: PrismaClient,
  tenantId: string,
  data: {
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    negotiatedRate?: number;
    notes?: string;
    scClientId?: string;
  }
) {
  if (data.scClientId) await assertScClient(prisma, tenantId, data.scClientId);
  return prisma.corporateAccount.create({ data: { ...data, tenantId } });
}

export async function updateCorporateAccount(
  prisma: PrismaClient,
  tenantId: string,
  accountId: string,
  data: Partial<{
    name: string;
    contactName: string;
    email: string;
    phone: string;
    negotiatedRate: number;
    notes: string;
    isActive: boolean;
    scClientId: string | null;
  }>
) {
  const account = await prisma.corporateAccount.findFirst({ where: { id: accountId, tenantId } });
  if (!account) throw new AppError(404, 'Corporate account not found', 'NOT_FOUND');
  if (data.scClientId) await assertScClient(prisma, tenantId, data.scClientId);
  return prisma.corporateAccount.update({ where: { id: accountId }, data });
}

// ── S&C client picker (for linking corporate accounts) ──────────
export async function listScClients(prisma: PrismaClient, tenantId: string) {
  return prisma.scClient.findMany({
    where: { tenantId },
    select: { id: true, name: true, type: true },
    orderBy: { name: 'asc' },
    take: 500,
  });
}

// ── Assignee picker ─────────────────────────────────────────────
export async function listAssignees(prisma: PrismaClient, tenantId: string) {
  const users = await prisma.user.findMany({
    where: { tenantId, status: 'active' },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: { firstName: 'asc' },
    take: 200,
  });
  return users.map((u) => ({ id: u.id, name: displayName(u), email: u.email }));
}

// ── Overview (feeds the live ops widget too) ────────────────────
export async function getOverview(prisma: PrismaClient, tenantId: string) {
  const stats = await aggregateGuestStats(prisma, tenantId);

  const top = stats
    .filter((s) => s.stays > 0)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);
  const topGuestsRaw = await prisma.guest.findMany({
    where: { id: { in: top.map((t) => t.guestId) } },
    select: GUEST_PUBLIC_SELECT,
  });
  const guestMap = new Map(topGuestsRaw.map((g) => [g.id, g]));
  const topGuests = top
    .map((s) => {
      const g = guestMap.get(s.guestId);
      if (!g) return null;
      return { ...g, name: displayName(g), rfm: rfmScore(s) };
    })
    .filter(Boolean);

  const followUpsDue = await prisma.guestFollowUp.findMany({
    where: {
      tenantId,
      doneAt: null,
      OR: [{ dueAt: null }, { dueAt: { lte: new Date(Date.now() + 7 * 86400_000) } }],
    },
    orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
    take: 20,
  });

  const segments = await prisma.guestSegment.findMany({
    where: { tenantId },
    select: { id: true, name: true, memberCount: true, isActive: true, lastRunAt: true },
  });

  const vipBreakdown: Record<string, number> = {};
  for (const s of stats) {
    const k = s.vipStatus || 'none';
    vipBreakdown[k] = (vipBreakdown[k] ?? 0) + 1;
  }

  return {
    totals: {
      guests: stats.length,
      guestsWithStays: stats.filter((s) => s.stays > 0).length,
      totalSpend: Math.round(stats.reduce((a, s) => a + s.spend, 0) * 100) / 100,
    },
    topGuests,
    followUpsDue,
    segments,
    vipBreakdown,
  };
}
