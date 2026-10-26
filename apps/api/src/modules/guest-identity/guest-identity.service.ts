/* apps/api/src/modules/guest-identity/guest-identity.service.ts — C3
 * Shared guest profile: an identity graph that merges guest records by
 * email / phone / ID so one person is one profile across every site. */
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

const VIP_RANK: Record<string, number> = { bronze: 1, silver: 2, gold: 3, platinum: 4 };

const normEmail = (v?: string | null) => (v ? v.trim().toLowerCase() : null);
const normPhone = (v?: string | null) => {
  if (!v) return null;
  const digits = v.replace(/\D/g, '');
  return digits.length >= 7 ? digits.slice(-9) : null;
};
const normDoc = (v?: string | null) => (v ? v.replace(/[^a-z0-9]/gi, '').toUpperCase() : null);
const guestName = (g: { firstName: string; lastName: string }) => `${g.firstName} ${g.lastName}`;
const bestVip = (values: (string | null | undefined)[]) =>
  values
    .filter((v): v is string => Boolean(v))
    .sort((a, b) => (VIP_RANK[b] ?? 0) - (VIP_RANK[a] ?? 0))[0] ?? null;

const MEMBER_GUEST_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  passportNumber: true,
  vipStatus: true,
  blacklisted: true,
  doNotDisturb: true,
  loyaltyPoints: true,
  tags: true,
  createdAt: true,
} as const;

export async function listGroups(tenantId: string) {
  const groups = await prisma.guestIdentityGroup.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' },
    include: { members: { include: { guest: { select: MEMBER_GUEST_SELECT } } } },
  });
  return groups.map((g) => ({
    id: g.id,
    label: g.label,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
    memberCount: g.members.length,
    names: g.members.map((m) => guestName(m.guest)),
    loyaltyPoints: g.members.reduce((a, m) => a + m.guest.loyaltyPoints, 0),
    blacklisted: g.members.some((m) => m.guest.blacklisted),
    vipStatus: bestVip(g.members.map((m) => m.guest.vipStatus)),
    primaryEmail: g.members.map((m) => m.guest.email).find(Boolean) ?? null,
  }));
}

export async function getGroup360(tenantId: string, groupId: string) {
  const group = await prisma.guestIdentityGroup.findFirst({
    where: { id: groupId, tenantId },
    include: { members: { include: { guest: { select: MEMBER_GUEST_SELECT } } } },
  });
  if (!group) throw new AppError(404, 'Group not found', 'NOT_FOUND');
  const ids = group.members.map((m) => m.guestId);

  const [stays, notes] = await Promise.all([
    prisma.reservation.findMany({
      where: { tenantId, guestId: { in: ids } },
      orderBy: { arrivalDate: 'desc' },
      take: 25,
      include: {
        property: { select: { name: true, code: true } },
        guest: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.guestNote.findMany({
      where: { tenantId, guestId: { in: ids } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { guest: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const stayTotal = await prisma.reservation.aggregate({
    where: { tenantId, guestId: { in: ids } },
    _count: { _all: true },
    _sum: { totalAmount: true },
  });

  return {
    id: group.id,
    label: group.label,
    createdAt: group.createdAt,
    profile: {
      displayName: group.members[0] ? guestName(group.members[0].guest) : 'Unknown guest',
      emails: [...new Set(group.members.map((m) => m.guest.email).filter(Boolean))],
      phones: [...new Set(group.members.map((m) => m.guest.phone).filter(Boolean))],
      passports: [...new Set(group.members.map((m) => m.guest.passportNumber).filter(Boolean))],
      vipStatus: bestVip(group.members.map((m) => m.guest.vipStatus)),
      blacklisted: group.members.some((m) => m.guest.blacklisted),
      doNotDisturb: group.members.some((m) => m.guest.doNotDisturb),
      loyaltyPoints: group.members.reduce((a, m) => a + m.guest.loyaltyPoints, 0),
      tags: [...new Set(group.members.flatMap((m) => m.guest.tags ?? []))],
      stayCount: stayTotal._count._all,
      lifetimeValue: Number(stayTotal._sum.totalAmount ?? 0),
      properties: [...new Set(stays.map((s) => s.property.name))],
    },
    members: group.members.map((m) => ({
      guestId: m.guestId,
      addedAt: m.addedAt,
      ...m.guest,
    })),
    stays: stays.map((s) => ({
      id: s.id,
      confirmationNumber: s.confirmationNumber,
      status: s.status,
      arrivalDate: s.arrivalDate,
      departureDate: s.departureDate,
      propertyName: s.property.name,
      propertyCode: s.property.code,
      guestName: guestName(s.guest),
      totalAmount: Number(s.totalAmount),
    })),
    notes: notes.map((n) => ({
      id: n.id,
      body: n.body,
      createdAt: n.createdAt,
      guestName: guestName(n.guest),
    })),
  };
}

export async function createGroup(
  tenantId: string,
  userId: string | undefined,
  guestIds: string[]
) {
  const guests = await prisma.guest.findMany({ where: { id: { in: guestIds }, tenantId } });
  if (guests.length !== guestIds.length) {
    throw new AppError(404, 'One or more guests not found in this tenant', 'NOT_FOUND');
  }
  const group = await prisma.guestIdentityGroup.create({
    data: {
      tenantId,
      createdById: userId ?? null,
      members: { create: guestIds.map((guestId) => ({ guestId })) },
    },
  });
  return getGroup360(tenantId, group.id);
}

export async function addMember(tenantId: string, groupId: string, guestId: string) {
  const group = await prisma.guestIdentityGroup.findFirst({ where: { id: groupId, tenantId } });
  if (!group) throw new AppError(404, 'Group not found', 'NOT_FOUND');
  const guest = await prisma.guest.findFirst({ where: { id: guestId, tenantId } });
  if (!guest) throw new AppError(404, 'Guest not found', 'NOT_FOUND');
  const existing = await prisma.guestIdentityMember.findUnique({
    where: { groupId_guestId: { groupId, guestId } },
  });
  if (existing)
    throw new AppError(409, 'Guest is already a member of this group', 'ALREADY_MEMBER');
  await prisma.guestIdentityMember.create({ data: { groupId, guestId } });
  return getGroup360(tenantId, groupId);
}

export async function removeMember(tenantId: string, groupId: string, guestId: string) {
  const group = await prisma.guestIdentityGroup.findFirst({ where: { id: groupId, tenantId } });
  if (!group) throw new AppError(404, 'Group not found', 'NOT_FOUND');
  const member = await prisma.guestIdentityMember.findUnique({
    where: { groupId_guestId: { groupId, guestId } },
  });
  if (!member) throw new AppError(404, 'Guest is not a member of this group', 'NOT_FOUND');
  await prisma.guestIdentityMember.delete({ where: { id: member.id } });
  const remaining = await prisma.guestIdentityMember.count({ where: { groupId } });
  let groupDeleted = false;
  if (remaining === 0) {
    await prisma.guestIdentityGroup.delete({ where: { id: groupId } });
    groupDeleted = true;
  }
  return { removed: true, groupDeleted };
}

export async function dedupeReport(tenantId: string) {
  const guests = await prisma.guest.findMany({
    where: { tenantId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      passportNumber: true,
      createdAt: true,
      identityMemberships: { select: { groupId: true } },
    },
  });
  type G = (typeof guests)[number];

  const clusters: {
    matchKey: 'email' | 'phone' | 'passport';
    matchValue: string;
    sharedGroupId: string | null;
    guests: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
      passportNumber: string | null;
      createdAt: Date;
      groupIds: string[];
    }[];
  }[] = [];

  const collect = (key: 'email' | 'phone' | 'passport', norm: (g: G) => string | null) => {
    const map = new Map<string, G[]>();
    for (const g of guests) {
      const v = norm(g);
      if (!v) continue;
      if (!map.has(v)) map.set(v, []);
      map.get(v)!.push(g);
    }
    for (const [matchValue, list] of map) {
      if (list.length < 2) continue;
      const mapped = list.map((g) => ({
        id: g.id,
        firstName: g.firstName,
        lastName: g.lastName,
        email: g.email,
        phone: g.phone,
        passportNumber: g.passportNumber,
        createdAt: g.createdAt,
        groupIds: g.identityMemberships.map((m) => m.groupId),
      }));
      const sets = mapped.map((g) => new Set(g.groupIds));
      const shared = mapped[0].groupIds.filter((id) => sets.every((s) => s.has(id)));
      clusters.push({
        matchKey: key,
        matchValue,
        sharedGroupId: shared[0] ?? null,
        guests: mapped,
      });
    }
  };

  collect('email', (g) => normEmail(g.email));
  collect('phone', (g) => normPhone(g.phone));
  collect('passport', (g) => normDoc(g.passportNumber));

  clusters.sort((a, b) => b.guests.length - a.guests.length);
  return {
    generatedAt: new Date().toISOString(),
    guestCount: guests.length,
    clusterCount: clusters.length,
    clusters,
  };
}
