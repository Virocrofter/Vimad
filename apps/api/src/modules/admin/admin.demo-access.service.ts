// Demo Access — production-grade service.
// request (public) → approve → provision living hotel → invite (magic link)
// → enter (public, single-use 24h token) → engagement analytics from audit_logs
// → extend / convert-to-trial / revoke / reset → cron sweep: expire → purge.
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import cron from 'node-cron';
import { prisma } from '../../common/prisma.js';
import { logger } from '../../common/logger.js';
import { markDemoTenant, unmarkDemoTenant } from '../../common/demo-guard.js';

const DAY = 86_400_000;
const INVITE_TTL_MS = 24 * 60 * 60 * 1000;
const PURGE_GRACE_DAYS = 14;

const day = (offset: number) => {
  const d = new Date(Date.now() + offset * DAY);
  d.setHours(12, 0, 0, 0);
  return d;
};
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);
const sha = (t: string) => crypto.createHash('sha256').update(t).digest('hex');
const genPassword = () => `Demo-${crypto.randomBytes(4).toString('hex')}`;
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24) || 'demo';

async function recordEvent(
  sessionId: string,
  tenantId: string | null,
  actor: string | null,
  action: string,
  detail?: string,
  meta?: unknown
) {
  await prisma.demoActivity.create({
    data: { sessionId, tenantId, actor, action, detail, meta: meta as object | undefined },
  });
  await prisma.demoSession.update({
    where: { id: sessionId },
    data: { lastActivityAt: new Date(), activityCount: { increment: 1 } },
  });
}

async function engagementFor(tenantId: string | null, firstLoginAt: Date | null) {
  if (!tenantId)
    return {
      temp: 'none' as const,
      lastActivityAt: null as Date | null,
      activityCount: 0,
      firstLoginAt,
    };
  const logs = await prisma.auditLog.aggregate({
    where: { tenantId },
    _count: true,
    _max: { createdAt: true },
  });
  const last = logs._max.createdAt;
  const count = logs._count;
  let temp: 'hot' | 'warm' | 'cold' | 'none' = 'none';
  if (last) {
    const age = Date.now() - last.getTime();
    temp = age < DAY ? 'hot' : age < 7 * DAY ? 'warm' : 'cold';
  }
  return { temp, lastActivityAt: last, activityCount: count, firstLoginAt };
}

function presentStatus(s: { status: string; expiresAt: Date | null }) {
  if (s.status === 'active' && s.expiresAt && s.expiresAt.getTime() < Date.now()) return 'expired';
  return s.status;
}

export async function getStats() {
  const now = Date.now();
  const in7 = new Date(now + 7 * DAY);
  const sessions = await prisma.demoSession.findMany({
    select: { status: true, expiresAt: true, firstLoginAt: true, activatedAt: true },
  });
  let pending = 0,
    active = 0,
    expiring = 0,
    neverActivated = 0,
    expired = 0,
    revoked = 0;
  for (const s of sessions) {
    const st = presentStatus(s);
    if (st === 'pending') pending++;
    else if (st === 'active') {
      active++;
      if (s.expiresAt && s.expiresAt <= in7) expiring++;
      if (!s.firstLoginAt) neverActivated++;
    } else if (st === 'expired') expired++;
    else if (st === 'revoked') revoked++;
  }
  return { pending, active, expiring, neverActivated, expired, revoked, total: sessions.length };
}

export async function listSessions(q: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, q.page ?? 1);
  const pageSize = Math.min(100, q.pageSize ?? 20);
  const where = q.search
    ? {
        OR: [
          { requesterEmail: { contains: q.search, mode: 'insensitive' as const } },
          { company: { contains: q.search, mode: 'insensitive' as const } },
          { hotelName: { contains: q.search, mode: 'insensitive' as const } },
        ],
      }
    : {};
  const [rows, total] = await Promise.all([
    prisma.demoSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.demoSession.count({ where }),
  ]);
  const tenantIds = rows.map((r) => r.tenantId).filter((x): x is string => !!x);
  const tenants = tenantIds.length
    ? await prisma.tenant.findMany({
        where: { id: { in: tenantIds } },
        select: { id: true, name: true, slug: true, status: true },
      })
    : [];
  const tmap = new Map(tenants.map((t) => [t.id, t]));
  const enriched = await Promise.all(
    rows.map(async (r) => {
      const eng = await engagementFor(r.tenantId, r.firstLoginAt);
      const followUpDue =
        r.status === 'active' &&
        (eng.temp === 'cold' || !eng.firstLoginAt) &&
        !!r.activatedAt &&
        Date.now() - r.activatedAt.getTime() > 3 * DAY;
      return {
        ...r,
        computedStatus: presentStatus(r),
        tenant: r.tenantId ? (tmap.get(r.tenantId) ?? null) : null,
        ...eng,
        followUpDue,
      };
    })
  );
  const filtered =
    q.status && q.status !== 'all'
      ? enriched.filter((e) => e.computedStatus === q.status)
      : enriched;
  return { data: filtered, total, page, pageSize };
}

export async function getSession(id: string) {
  const s = await prisma.demoSession.findUnique({ where: { id } });
  if (!s) throw Object.assign(new Error('Session not found'), { status: 404 });
  const eng = await engagementFor(s.tenantId, s.firstLoginAt);
  const tenant = s.tenantId ? await prisma.tenant.findUnique({ where: { id: s.tenantId } }) : null;
  const events = await prisma.demoActivity.findMany({
    where: { sessionId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const auditTrail = s.tenantId
    ? await prisma.auditLog.findMany({
        where: { tenantId: s.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 25,
        select: { action: true, entity: true, createdAt: true, userId: true },
      })
    : [];
  const invites = await prisma.demoInvite.findMany({
    where: { sessionId: id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { tokenPrefix: true, expiresAt: true, usedAt: true, createdAt: true },
  });
  return { ...s, computedStatus: presentStatus(s), tenant, ...eng, events, auditTrail, invites };
}

export async function requestDemo(input: {
  email: string;
  name?: string;
  company?: string;
  hotelName?: string;
  phone?: string;
  roomCount?: number | null;
  currentPms?: string;
  preferredSlot?: string;
  notes?: string;
}) {
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    throw Object.assign(new Error('Valid email required'), { status: 400 });
  const domain = email.split('@')[1] ?? '';
  const DISPOSABLE = [
    'mailinator.com',
    'tempmail.com',
    'temp-mail.org',
    '10minutemail.com',
    'guerrillamail.com',
    'yopmail.com',
    'throwaway.email',
    'fakeinbox.com',
    'maildrop.cc',
    'sharklasers.com',
    'getnada.com',
    'dispostable.com',
    'mohmal.com',
    'emailondeck.com',
    'trashmail.com',
  ];
  if (DISPOSABLE.includes(domain))
    throw Object.assign(new Error('Please use a work email address'), { status: 400 });
  const maxPerDomain = Number(process.env.DEMO_MAX_PER_DOMAIN ?? 3);
  const domainActive = await prisma.demoSession.count({
    where: { requesterEmail: { endsWith: `@${domain}` }, status: 'active' },
  });
  if (domainActive >= maxPerDomain)
    throw Object.assign(
      new Error(`Demo limit reached for this domain (max ${maxPerDomain} active)`),
      { status: 409 }
    );
  const existing = await prisma.demoSession.findFirst({
    where: { requesterEmail: email, status: { in: ['pending', 'active'] } },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) return { session: existing, deduped: true };
  const session = await prisma.demoSession.create({
    data: {
      requesterEmail: email,
      company: input.company ?? input.hotelName ?? null,
      hotelName: input.hotelName ?? null,
      notes:
        [
          input.name && `Contact: ${input.name}`,
          input.phone && `Phone: ${input.phone}`,
          input.notes,
        ]
          .filter(Boolean)
          .join(' · ') || null,
      roomCount: input.roomCount ?? null,
      currentPms: input.currentPms ?? null,
      preferredSlot: input.preferredSlot ?? null,
      status: 'pending',
    },
  });
  await recordEvent(
    session.id,
    null,
    email,
    'requested',
    input.company ?? input.hotelName ?? undefined
  );
  return { session, deduped: false };
}

export async function provisionTenant(
  sessionId: string,
  opts: { company?: string; slug?: string } = {}
) {
  const session = await prisma.demoSession.findUnique({ where: { id: sessionId } });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  const slug = `${slugify(opts.slug ?? opts.company ?? session.company ?? session.hotelName ?? 'hotel')}-${crypto.randomBytes(3).toString('hex')}`;
  const password = genPassword();
  const emailLocal = `viewer.${crypto.randomBytes(3).toString('hex')}`;
  const tenant = await prisma.tenant.create({
    data: {
      name: session.hotelName
        ? `${session.hotelName} (Demo)`
        : `Demo — ${session.company ?? session.requesterEmail}`,
      slug,
      plan: 'demo',
      isDemo: true,
      status: 'active',
    },
  });
  markDemoTenant(tenant.id);

  const property = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      name: session.hotelName ?? 'Demo Grande Hotel',
      code: 'DEMO-01',
      city: 'Cape Town',
      country: 'South Africa',
      timezone: 'Africa/Johannesburg',
      currency: 'ZAR',
    },
  });
  const rt: string[] = [];
  for (const [name, code, max] of [
    ['Standard Queen', 'STD', 2],
    ['Deluxe King', 'DLX', 2],
    ['Family Suite', 'FAM', 4],
  ] as const) {
    const r = await prisma.roomType.create({
      data: {
        tenantId: tenant.id,
        propertyId: property.id,
        name,
        code,
        baseOccupancy: 2,
        maxOccupancy: max,
      },
    });
    rt.push(r.id);
  }
  let roomNo = 101;
  for (const roomTypeId of rt) {
    for (let i = 0; i < 3; i++) {
      await prisma.room.create({
        data: {
          tenantId: tenant.id,
          propertyId: property.id,
          roomTypeId,
          number: String(roomNo++),
          floor: String(Math.floor(roomNo / 100)),
          status: 'clean',
          housekeepingStatus: 'ready',
        },
      });
    }
  }
  const rooms = await prisma.room.findMany({ where: { tenantId: tenant.id } });
  const rateDefs: [string, number][] = [
    ['RACK', 1450],
    ['BAR', 1650],
    ['NR1', 1250],
  ];
  for (const [code, price] of rateDefs) {
    await prisma.ratePlan.create({
      data: {
        tenantId: tenant.id,
        propertyId: property.id,
        roomTypeId: rt[0],
        name: `Rate ${code}`,
        code,
        baseRate: price,
        currency: 'ZAR',
      },
    });
  }
  const guestDefs: [string, string][] = [
    ['Thandi', 'Nxumalo'],
    ['Pieter', 'van der Merwe'],
    ['Aisha', 'Patel'],
    ['John', 'Mokoena'],
    ['Lerato', 'Dlamini'],
  ];
  const guests: Array<{ id: string }> = [];
  for (const [fn, ln] of guestDefs) {
    guests.push(
      await prisma.guest.create({
        data: {
          tenantId: tenant.id,
          firstName: fn,
          lastName: ln,
          email: `${fn}.${ln}@example.com`.toLowerCase().replace(/[^a-z0-9.@]/g, ''),
          nationality: 'ZA',
          loyaltyPoints: 500 * (guests.length + 1),
        },
      })
    );
  }
  const mkStay = async (
    guestIdx: number,
    roomIdx: number,
    arrivalOff: number,
    nights: number,
    status: string,
    extras: object = {}
  ) => {
    const g = guests[guestIdx];
    const room = rooms[roomIdx % rooms.length];
    const rate = 1450;
    const res = await prisma.reservation.create({
      data: {
        tenantId: tenant.id,
        propertyId: property.id,
        guestId: g.id,
        roomTypeId: room.roomTypeId,
        confirmationNumber: `VIM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        status,
        source: 'direct',
        arrivalDate: day(arrivalOff),
        departureDate: day(arrivalOff + nights),
        nights,
        adults: 2,
        totalAmount: rate * nights,
        balance: status === 'checked_in' ? rate * nights - 1450 : rate * nights,
        checkedInAt: status === 'checked_in' ? hoursAgo(30) : null,
        eta: '14:00',
        ...extras,
      },
    });
    for (let n = 0; n < nights; n++) {
      await prisma.reservationStay.create({
        data: { reservationId: res.id, roomId: room.id, date: day(arrivalOff + n), rate },
      });
    }
    const folio = await prisma.folio.create({
      data: {
        reservationId: res.id,
        tenantId: tenant.id,
        totalCharges: rate * nights,
        balance: res.balance as unknown as number,
        totalPayments: status === 'checked_in' ? 1450 : 0,
      },
    });
    await prisma.folioItem.create({
      data: {
        folioId: folio.id,
        type: 'room',
        description: `Room ${room.number} — night`,
        amount: rate,
        quantity: nights,
      },
    });
    if (status === 'checked_in') {
      await prisma.folioItem.create({
        data: {
          folioId: folio.id,
          type: 'restaurant',
          description: 'Dinner — Grill Room',
          amount: 385,
        },
      });
      await prisma.folioItem.create({
        data: { folioId: folio.id, type: 'payment', description: 'Card deposit', amount: -1450 },
      });
    }
    return res;
  };
  await mkStay(0, 0, 0, 3, 'checked_in');
  await mkStay(1, 1, 0, 2, 'confirmed', {
    eta: '14:30',
    specialRequests: 'High floor, away from lift',
  });
  await mkStay(2, 2, 0, 1, 'confirmed');
  await mkStay(3, 3, -2, 4, 'checked_in');
  await mkStay(4, 4, -1, 1, 'checked_in');
  await prisma.menuItem.createMany({
    data: [
      {
        tenantId: tenant.id,
        propertyId: property.id,
        name: 'Full Breakfast',
        category: 'breakfast',
        price: 145,
        availableFrom: '06:30',
        availableTo: '10:30',
      },
      {
        tenantId: tenant.id,
        propertyId: property.id,
        name: 'Club Sandwich',
        category: 'mains',
        price: 95,
        availableFrom: '11:00',
        availableTo: '22:00',
      },
      {
        tenantId: tenant.id,
        propertyId: property.id,
        name: 'Filter Coffee',
        category: 'drinks',
        price: 25,
        availableFrom: '06:00',
        availableTo: '22:00',
      },
    ],
  });
  await prisma.loyaltyReward.createMany({
    data: [
      {
        tenantId: tenant.id,
        name: 'Late Checkout (2 PM)',
        description: 'Subject to availability',
        pointsCost: 1500,
      },
      {
        tenantId: tenant.id,
        name: 'Welcome Drink Voucher',
        description: 'Lobby bar',
        pointsCost: 500,
      },
    ],
  });
  const ownerRole = await prisma.role.findFirst({ where: { name: 'Owner', tenantId: null } });
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: `${emailLocal}@vimad.demo`,
      passwordHash: await bcrypt.hash(password, 10),
      firstName: 'Demo',
      lastName: 'Visitor',
      role: 'demo',
    },
  });
  if (ownerRole)
    await prisma.roleAssignment.create({ data: { userId: user.id, roleId: ownerRole.id } });
  await prisma.ticket.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      number: 'T-1001',
      source: 'guest_portal',
      subject: 'Airport shuttle for arrival',
      description: 'Guest requests a 2 PM pickup',
      category: 'concierge',
      priority: 'medium',
      status: 'open',
    },
  });
  await prisma.task.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      department: 'housekeeping',
      title: 'VIP amenity — Room 203',
      priority: 'high',
      status: 'open',
      dueAt: day(0),
    },
  });
  return { tenant, property, user: { email: user.email, password }, slug: tenant.slug };
}

export async function approveSession(
  id: string,
  body: { days?: number; grantedBy?: string; note?: string }
) {
  const session = await prisma.demoSession.findUnique({ where: { id } });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  if (session.status !== 'pending')
    throw Object.assign(new Error(`Cannot approve a ${session.status} session`), { status: 409 });
  const days = Math.min(90, Math.max(1, body.days ?? 14));
  const { tenant, user, slug } = await provisionTenant(id, {
    company: session.company ?? undefined,
  });
  const updated = await prisma.demoSession.update({
    where: { id },
    data: {
      tenantId: tenant.id,
      status: 'active',
      grantedBy: body.grantedBy ?? null,
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + days * DAY),
    },
  });
  await recordEvent(id, tenant.id, body.grantedBy ?? 'system', 'approved', `${days}-day demo`, {
    slug,
    days,
  });
  return { session: updated, credentials: user, tenantSlug: slug };
}

export async function inviteSession(id: string, createdBy: string) {
  const session = await prisma.demoSession.findUnique({ where: { id } });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  if (session.status !== 'active')
    throw Object.assign(new Error(`Session is ${session.status}`), { status: 409 });
  const token = crypto.randomBytes(32).toString('base64url');
  await prisma.demoInvite.create({
    data: {
      sessionId: id,
      tokenHash: sha(token),
      tokenPrefix: token.slice(0, 8),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      createdBy,
    },
  });
  await recordEvent(id, session.tenantId, createdBy, 'invited', `token ${token.slice(0, 8)}…`);
  return {
    token,
    url: `/demo-access/enter?token=${token}`,
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  };
}

export async function enterDemo(token: string) {
  const invite = await prisma.demoInvite.findFirst({
    where: { tokenHash: sha(token) },
    include: { session: true },
  });
  if (!invite) throw Object.assign(new Error('Invalid or expired link'), { status: 404 });
  if (invite.usedAt)
    throw Object.assign(new Error('Link already used — request a fresh invite'), { status: 409 });
  if (invite.expiresAt.getTime() < Date.now())
    throw Object.assign(new Error('Link expired — request a fresh invite'), { status: 410 });
  if (invite.session.status !== 'active')
    throw Object.assign(new Error('This demo has ended'), { status: 410 });
  await prisma.$transaction([
    prisma.demoInvite.update({ where: { id: invite.id }, data: { usedAt: new Date() } }),
    prisma.demoSession.update({
      where: { id: invite.sessionId },
      data: { firstLoginAt: invite.session.firstLoginAt ?? new Date() },
    }),
  ]);
  await recordEvent(
    invite.sessionId,
    invite.session.tenantId,
    invite.session.requesterEmail,
    'entered',
    'magic link redeemed'
  );
  const tenant = invite.session.tenantId
    ? await prisma.tenant.findUnique({ where: { id: invite.session.tenantId } })
    : null;
  const viewer = tenant
    ? await prisma.user.findFirst({
        where: { tenantId: tenant.id, email: { endsWith: '@vimad.demo' } },
      })
    : null;
  if (!tenant || !viewer)
    throw Object.assign(new Error('Demo tenant missing — reset this demo'), { status: 500 });
  return {
    tenantSlug: tenant.slug,
    email: viewer.email,
    password: viewer.passwordHash,
    hotelName: tenant.name,
    expiresAt: invite.session.expiresAt,
  };
}

export async function extendSession(
  id: string,
  body: { days?: number; reason?: string; by?: string }
) {
  const session = await prisma.demoSession.findUnique({ where: { id } });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  if (!['active', 'expired'].includes(session.status))
    throw Object.assign(new Error(`Cannot extend a ${session.status} session`), { status: 409 });
  const days = Math.min(30, Math.max(1, body.days ?? 7));
  const baseTs =
    session.expiresAt && session.expiresAt.getTime() > Date.now()
      ? session.expiresAt.getTime()
      : Date.now();
  const updated = await prisma.demoSession.update({
    where: { id },
    data: {
      status: 'active',
      expiresAt: new Date(baseTs + days * DAY),
      extendedCount: { increment: 1 },
    },
  });
  if (session.tenantId)
    await prisma.tenant
      .update({ where: { id: session.tenantId }, data: { status: 'active' } })
      .catch(() => null);
  await recordEvent(
    id,
    session.tenantId,
    body.by ?? 'system',
    'extended',
    `${days}d${body.reason ? ` — ${body.reason}` : ''}`
  );
  return updated;
}

export async function revokeSession(id: string, body: { reason?: string; by?: string }) {
  const session = await prisma.demoSession.findUnique({ where: { id } });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  if (session.tenantId) {
    await prisma.tenant
      .update({ where: { id: session.tenantId }, data: { status: 'suspended' } })
      .catch(() => null);
  }
  const updated = await prisma.demoSession.update({
    where: { id },
    data: { status: 'revoked', revokedAt: new Date(), revokeReason: body.reason ?? null },
  });
  await recordEvent(id, session.tenantId, body.by ?? 'system', 'revoked', body.reason);
  return updated;
}

export async function convertSession(id: string, by?: string) {
  const session = await prisma.demoSession.findUnique({ where: { id } });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  if (session.status !== 'active' || !session.tenantId)
    throw Object.assign(new Error('Only an active demo can convert'), { status: 409 });
  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { isDemo: false, plan: 'trial', status: 'active' },
  });
  unmarkDemoTenant(session.tenantId);
  const updated = await prisma.demoSession.update({
    where: { id },
    data: { status: 'converted', convertedAt: new Date() },
  });
  await recordEvent(id, session.tenantId, by ?? 'system', 'converted', 'promoted to trial');
  return {
    session: updated,
    contractUrl: `/admin/billing/contracts/new?tenantId=${session.tenantId}`,
  };
}

export async function resetSession(id: string, by?: string) {
  const session = await prisma.demoSession.findUnique({ where: { id } });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  if (!session.tenantId) throw Object.assign(new Error('Nothing to reset'), { status: 409 });
  const oldTenantId = session.tenantId;
  await prisma.tenant.delete({ where: { id: oldTenantId } });
  unmarkDemoTenant(oldTenantId);
  const { tenant, user, slug } = await provisionTenant(id, {
    company: session.company ?? undefined,
    slug: session.hotelName ?? undefined,
  });
  await prisma.demoInvite.deleteMany({ where: { sessionId: id } });
  const updated = await prisma.demoSession.update({
    where: { id },
    data: { tenantId: tenant.id, firstLoginAt: null, activatedAt: new Date(), status: 'active' },
  });
  await recordEvent(id, tenant.id, by ?? 'system', 'reset', `reprovisioned as ${slug}`);
  return { session: updated, credentials: user, tenantSlug: slug };
}

export async function rejectSession(id: string, by?: string, reason?: string) {
  const session = await prisma.demoSession.findUnique({ where: { id } });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  const updated = await prisma.demoSession.update({ where: { id }, data: { status: 'rejected' } });
  await recordEvent(id, null, by ?? 'system', 'rejected', reason);
  return updated;
}

export async function sweepExpired() {
  const now = new Date();
  const expiring = await prisma.demoSession.findMany({
    where: { status: 'active', expiresAt: { lt: now } },
  });
  for (const s of expiring) {
    if (s.tenantId)
      await prisma.tenant
        .update({ where: { id: s.tenantId }, data: { status: 'suspended' } })
        .catch(() => null);
    await prisma.demoSession.update({ where: { id: s.id }, data: { status: 'expired' } });
    await recordEvent(s.id, s.tenantId, 'system', 'expired', 'sweep');
  }
  // abuse shield: >600 tenant actions in 1h = scraper/scripting -> auto-revoke
  const live = await prisma.demoSession.findMany({
    where: { status: 'active', tenantId: { not: null } },
  });
  for (const s2 of live) {
    const recent = await prisma.auditLog.count({
      where: { tenantId: s2.tenantId!, createdAt: { gt: new Date(Date.now() - 3_600_000) } },
    });
    if (recent > 600) {
      if (s2.tenantId)
        await prisma.tenant
          .update({ where: { id: s2.tenantId }, data: { status: 'suspended' } })
          .catch(() => null);
      await prisma.demoSession.update({
        where: { id: s2.id },
        data: {
          status: 'revoked',
          revokedAt: new Date(),
          revokeReason: `abuse shield: ${recent} actions in 1h`,
        },
      });
      await recordEvent(
        s2.id,
        s2.tenantId,
        'system',
        'revoked',
        `abuse shield: ${recent} actions in 1h`
      );
      logger.warn({ sessionId: s2.id, recent }, 'demo auto-revoked by abuse shield');
    }
  }
  const purgeBefore = new Date(Date.now() - PURGE_GRACE_DAYS * DAY);
  const purgeable = await prisma.demoSession.findMany({
    where: { status: 'expired', expiresAt: { lt: purgeBefore } },
  });
  for (const s of purgeable) {
    if (s.tenantId) {
      await prisma.tenant.delete({ where: { id: s.tenantId } }).catch(() => null);
      unmarkDemoTenant(s.tenantId);
    }
    await prisma.demoSession.update({ where: { id: s.id }, data: { status: 'purged' } });
    logger.info({ sessionId: s.id }, 'demo purged after grace period');
  }
  return { expired: expiring.length, purged: purgeable.length };
}

const TOUR_STEPS = [
  {
    id: 'checkin',
    title: 'Check in today\u2019s arrival',
    desc: 'A guest is arriving this afternoon \u2014 open the reservation and check them in.',
    link: '/app/reservations',
  },
  {
    id: 'folio',
    title: 'Post a charge to a guest folio',
    desc: 'Open an in-house folio and add a restaurant charge.',
    link: '/app/billing',
  },
  {
    id: 'roomplan',
    title: 'View the room plan',
    desc: 'Today\u2019s grid \u2014 dirty, clean, occupied at a glance.',
    link: '/app/room-plan',
  },
  {
    id: 'ticket',
    title: 'Answer the open ticket',
    desc: 'A guest asked about an airport shuttle \u2014 reply in support.',
    link: '/app/support',
  },
  {
    id: 'nightaudit',
    title: 'Run the night audit',
    desc: 'Close the business day in one click.',
    link: '/app/night-audit',
  },
];

export async function getTour(tenantId: string) {
  if (!tenantId) throw Object.assign(new Error('tenantId required'), { status: 400 });
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { isDemo: true, name: true },
  });
  if (!tenant?.isDemo) throw Object.assign(new Error('Not a demo tenant'), { status: 404 });
  return { hotelName: tenant.name, steps: TOUR_STEPS };
}

if (process.env.NODE_ENV !== 'test') {
  cron.schedule('0 * * * *', () =>
    sweepExpired().catch((e) => logger.error(e, 'demo sweep failed'))
  );
  cron.schedule('15 3 * * *', () =>
    sweepExpired().catch((e) => logger.error(e, 'demo purge failed'))
  );
}
