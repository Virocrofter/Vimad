import type { PrismaClient } from '@prisma/client';
import type { SegmentRule } from './crm.schemas.js';

/* Stay = checked_in or checked_out reservation. Revenue = totalAmount (ZAR). */
export const COUNTED_STATUSES = ['checked_in', 'checked_out'] as const;

export interface GuestStats {
  guestId: string;
  stays: number;
  spend: number;
  lastStayAt: Date | null;
  tags: string[];
  vipStatus: string | null;
}

export async function aggregateGuestStats(
  prisma: PrismaClient,
  tenantId: string
): Promise<GuestStats[]> {
  const guests = await prisma.guest.findMany({
    where: { tenantId },
    select: { id: true, tags: true, vipStatus: true },
  });
  if (guests.length === 0) return [];

  const reservations = await prisma.reservation.findMany({
    where: {
      tenantId,
      guestId: { in: guests.map((g) => g.id) },
      status: { in: [...COUNTED_STATUSES] },
    },
    select: { guestId: true, arrivalDate: true, departureDate: true, totalAmount: true },
  });

  const acc = new Map<string, { stays: number; spend: number; last: Date | null }>();
  for (const r of reservations) {
    const cur = acc.get(r.guestId) ?? { stays: 0, spend: 0, last: null };
    cur.stays += 1;
    cur.spend += Number(r.totalAmount ?? 0);
    const now = Date.now();
    const raw = r.departureDate ?? r.arrivalDate;
    const d = raw && raw.getTime() > now ? r.arrivalDate : raw;
    if (d && (!cur.last || d > cur.last)) cur.last = d;
    acc.set(r.guestId, cur);
  }

  return guests.map((g) => {
    const a = acc.get(g.id);
    return {
      guestId: g.id,
      stays: a?.stays ?? 0,
      spend: Math.round((a?.spend ?? 0) * 100) / 100,
      lastStayAt: a?.last ?? null,
      tags: g.tags ?? [],
      vipStatus: g.vipStatus ?? null,
    };
  });
}

export function matchRule(s: GuestStats, rule: SegmentRule, now = new Date()): boolean {
  if (rule.minStays !== undefined && s.stays < rule.minStays) return false;
  if (rule.minSpend !== undefined && s.spend < rule.minSpend) return false;
  if (rule.maxRecencyDays !== undefined) {
    if (!s.lastStayAt) return false;
    if (now.getTime() - s.lastStayAt.getTime() > rule.maxRecencyDays * 86400_000) return false;
  }
  if (rule.vipOnly && !s.vipStatus) return false;
  if (rule.tagAny?.length && !rule.tagAny.some((t) => s.tags.includes(t))) return false;
  if (rule.tagAll?.length && !rule.tagAll.every((t) => s.tags.includes(t))) return false;
  return true;
}

export interface Rfm {
  recencyDays: number | null;
  stays: number;
  spend: number;
  score: 0 | 1 | 2 | 3 | 4 | 5;
}

export function rfmScore(s: GuestStats, now = new Date()): Rfm {
  const recencyDays = s.lastStayAt
    ? Math.floor((now.getTime() - s.lastStayAt.getTime()) / 86400_000)
    : null;
  let score: Rfm['score'] = 0;
  if (s.stays === 0) score = 0;
  else if (recencyDays !== null && recencyDays <= 90) score = 5;
  else if (recencyDays !== null && recencyDays <= 180) score = 4;
  else if (recencyDays !== null && recencyDays <= 365) score = 3;
  else if (recencyDays !== null && recencyDays <= 730) score = 2;
  else score = 1;
  return { recencyDays, stays: s.stays, spend: s.spend, score };
}
