/* apps/api/src/modules/sales-catering/sales-catering.service.ts */
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logAuditEvent } from '../audit/audit.service.js';

// Fire-and-forget S&C audit — never blocks the request
function scAudit(
  tenantId: string,
  action: string,
  entityType: string,
  entityId: string,
  name: string
): void {
  void logAuditEvent({
    tenantId,
    action,
    category: 'sales_catering',
    label: `${entityType} ${action}`,
    description: `S&C ${entityType} "${name}" ${action}`,
    entityType,
    entityId,
    metadata: { name },
  }).catch(() => {});
}

export const EVENT_STATUSES = [
  'lead',
  'quoted',
  'contracted',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'lost',
] as const;
export const BEO_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'signed',
  'changes_requested',
] as const;

const dec = (v: unknown): number => (v == null ? 0 : Number(v));
const r2 = (n: number) => Math.round(n * 100) / 100;

// ─── BEO pricing — single source of truth (server recomputes; client never trusted) ───

export async function computeBeoFinancials(beo: {
  venueId?: string | null;
  setupId?: string | null;
  menuId?: string | null;
  avId?: string | null;
  guestCount: number;
  priceOverrides?: any;
  additionalServices?: any;
  decor?: any;
  snapshots?: any;
}) {
  const ov = (beo.priceOverrides ?? {}) as Record<string, number>;
  const snap = (beo.snapshots ?? {}) as any;

  // Snapshots win: a versioned BEO prices off what was snapshotted at save time
  const venue =
    snap.venue ??
    (beo.venueId ? await prisma.venue.findUnique({ where: { id: beo.venueId } }) : null);
  const setup =
    snap.setup ??
    (beo.setupId ? await prisma.setupStyle.findUnique({ where: { id: beo.setupId } }) : null);
  const menu =
    snap.menu ??
    (beo.menuId ? await prisma.menuPackage.findUnique({ where: { id: beo.menuId } }) : null);
  const av =
    snap.av ?? (beo.avId ? await prisma.avPackage.findUnique({ where: { id: beo.avId } }) : null);

  const roomPrice = venue ? dec(ov.room ?? venue.rentalPrice) : 0;
  const setupPrice = setup ? dec(ov.setup ?? setup.price) : 0;
  const menuPrice = menu ? dec(ov.menu ?? menu.pricePerPerson) * (beo.guestCount || 0) : 0;
  const avPrice = av ? dec(ov.av ?? av.price) : 0;
  const servicesTotal = ((beo.additionalServices as any[]) ?? []).reduce(
    (s, x) => s + dec(x.price),
    0
  );

  let decorTotal = 0;
  const decorItems: { name: string; qty: number; unitPrice: number; total: number }[] = [];
  for (const d of (beo.decor as any[]) ?? []) {
    const opt =
      snap.decor?.find((o: any) => o.id === d.optionId) ??
      (await prisma.decorOption.findUnique({ where: { id: d.optionId } }));
    if (!opt) continue;
    const unit = dec(opt.price);
    decorItems.push({ name: opt.name, qty: d.qty, unitPrice: unit, total: r2(unit * d.qty) });
    decorTotal += unit * d.qty;
  }
  decorTotal = r2(decorTotal);

  const subtotal = r2(roomPrice + setupPrice + menuPrice + avPrice + servicesTotal + decorTotal);
  const gratuity = r2(menuPrice * 0.22); // 22% service on F&B
  const vat = r2((subtotal + gratuity) * 0.15); // SARS 15% VAT
  const grandTotal = r2(subtotal + gratuity + vat);

  return {
    roomPrice,
    setupPrice,
    menuPrice,
    avPrice,
    servicesTotal: r2(servicesTotal),
    decorTotal,
    decorItems,
    subtotal,
    gratuity,
    vat,
    grandTotal,
  };
}

async function snapshotCatalog(beo: any) {
  const [venue, setup, menu, av, decor] = await Promise.all([
    beo.venueId ? prisma.venue.findUnique({ where: { id: beo.venueId } }) : null,
    beo.setupId ? prisma.setupStyle.findUnique({ where: { id: beo.setupId } }) : null,
    beo.menuId ? prisma.menuPackage.findUnique({ where: { id: beo.menuId } }) : null,
    beo.avId ? prisma.avPackage.findUnique({ where: { id: beo.avId } }) : null,
    prisma.decorOption.findMany({ where: { tenantId: beo.tenantId, status: 'active' } }),
  ]);
  return { venue, setup, menu, av, decor };
}

// ─── Clients ───

export async function listClients(tenantId: string, q: string) {
  return prisma.scClient.findMany({
    where: {
      tenantId,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { primaryContact: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { events: true } },
      events: {
        where: { status: { in: ['confirmed', 'contracted', 'in_progress'] } },
        select: { id: true, name: true, eventDate: true, guestCount: true, type: true },
        orderBy: { eventDate: 'asc' },
        take: 3,
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getClient(tenantId: string, id: string) {
  const client = await prisma.scClient.findFirst({
    where: { id, tenantId },
    include: {
      accountManager: { select: { id: true, firstName: true, lastName: true } },
      events: {
        orderBy: { eventDate: 'desc' },
        include: { beos: { orderBy: { version: 'desc' }, take: 1 } },
      },
      activities: { orderBy: { createdAt: 'desc' }, take: 100 },
    },
  });
  if (!client) throw new AppError(404, 'Client not found', 'NOT_FOUND');
  const lifetimeValue = client.events
    .filter((e) => e.status === 'completed')
    .reduce((s, e) => s + dec(e.budget), 0);
  return { ...client, lifetimeValue };
}

export async function createClient(tenantId: string, data: any, _userId: string) {
  const client = await prisma.scClient.create({
    data: {
      tenantId,
      name: data.name,
      type: data.type ?? 'corporate',
      primaryContact: data.primaryContact,
      email: data.email,
      phone: data.phone,
      address: data.address,
      accountManagerId: data.accountManagerId,
      tags: data.tags ?? [],
      notes: data.notes,
    },
  });
  scAudit(tenantId, 'create', 'sc_client', client.id, client.name);
  return client;
}

export async function updateClient(tenantId: string, id: string, data: any) {
  const existing = await prisma.scClient.findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppError(404, 'Client not found', 'NOT_FOUND');
  return prisma.scClient.update({ where: { id }, data });
}

export async function deleteClient(tenantId: string, id: string) {
  const existing = await prisma.scClient.findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppError(404, 'Client not found', 'NOT_FOUND');
  await prisma.scClient.delete({ where: { id } });
  return { deleted: true };
}

// ─── Events ───

export async function listEvents(
  tenantId: string,
  filters: {
    status?: string;
    type?: string;
    from?: string;
    to?: string;
    clientId?: string;
  }
) {
  return prisma.scEvent.findMany({
    where: {
      tenantId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.clientId ? { clientId: filters.clientId } : {}),
      ...(filters.from || filters.to
        ? {
            eventDate: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
    },
    include: {
      client: { select: { id: true, name: true, primaryContact: true } },
      owner: { select: { id: true, firstName: true, lastName: true } },
      beos: {
        orderBy: { version: 'desc' },
        take: 1,
        select: { id: true, version: true, status: true },
      },
      _count: { select: { beos: true } },
    },
    orderBy: [{ eventDate: 'asc' }],
  });
}

export async function getEvent(tenantId: string, id: string) {
  const event = await prisma.scEvent.findFirst({
    where: { id, tenantId },
    include: {
      client: true,
      owner: { select: { id: true, firstName: true, lastName: true } },
      beos: {
        orderBy: { version: 'desc' },
        include: {
          venue: { select: { id: true, name: true, capacity: true } },
          setup: { select: { id: true, name: true } },
          menu: { select: { id: true, name: true, pricePerPerson: true } },
          av: { select: { id: true, name: true } },
        },
      },
      activities: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
  });
  if (!event) throw new AppError(404, 'Event not found', 'NOT_FOUND');
  const financials = event.beos[0] ? await computeBeoFinancials(event.beos[0]) : null;
  return { ...event, financials };
}

export async function createEvent(tenantId: string, data: any, userId: string) {
  const event = await prisma.scEvent.create({
    data: {
      tenantId,
      propertyId: data.propertyId,
      clientId: data.clientId,
      name: data.name,
      type: data.type ?? 'corporate',
      status: data.status && EVENT_STATUSES.includes(data.status) ? data.status : 'lead',
      eventDate: new Date(data.eventDate),
      startTime: data.startTime,
      endTime: data.endTime,
      guestCount: data.guestCount ?? 0,
      budget: data.budget,
      source: data.source ?? 'direct',
      probability: data.probability ?? 20,
      ownerId: data.ownerId ?? userId,
      notes: data.notes,
    },
  });
  await prisma.scActivity.create({
    data: {
      tenantId,
      eventId: event.id,
      type: 'status_change',
      body: `Event created as ${event.status}`,
      createdById: userId,
    },
  });
  scAudit(tenantId, 'create', 'sc_event', event.id, event.name);
  return event;
}

export async function updateEvent(tenantId: string, id: string, data: any, userId: string) {
  const existing = await prisma.scEvent.findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppError(404, 'Event not found', 'NOT_FOUND');

  if (data.status && data.status !== existing.status) {
    if (!EVENT_STATUSES.includes(data.status)) {
      throw new AppError(400, `Invalid status "${data.status}"`, 'VALIDATION_ERROR');
    }
    await prisma.scActivity.create({
      data: {
        tenantId,
        eventId: id,
        type: 'status_change',
        body: `Status: ${existing.status} → ${data.status}${data.lostReason ? ` (${data.lostReason})` : ''}`,
        createdById: userId,
      },
    });
  }

  return prisma.scEvent.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.eventDate !== undefined && { eventDate: new Date(data.eventDate) }),
      ...(data.startTime !== undefined && { startTime: data.startTime }),
      ...(data.endTime !== undefined && { endTime: data.endTime }),
      ...(data.guestCount !== undefined && { guestCount: data.guestCount }),
      ...(data.budget !== undefined && { budget: data.budget }),
      ...(data.probability !== undefined && { probability: data.probability }),
      ...(data.clientId !== undefined && { clientId: data.clientId }),
      ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.lostReason !== undefined && { lostReason: data.lostReason }),
      ...(data.propertyId !== undefined && { propertyId: data.propertyId }),
    },
  });
}

export async function deleteEvent(tenantId: string, id: string) {
  const existing = await prisma.scEvent.findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppError(404, 'Event not found', 'NOT_FOUND');
  await prisma.scEvent.delete({ where: { id } });
  return { deleted: true };
}

// ─── Pipeline stats (dashboard) ───

export async function pipelineStats(tenantId: string) {
  const now = new Date();
  const events = await prisma.scEvent.findMany({
    where: {
      tenantId,
      status: { in: ['lead', 'quoted', 'contracted', 'confirmed', 'in_progress'] },
    },
    include: { beos: { orderBy: { version: 'desc' }, take: 1 } },
  });
  const byStatus: Record<string, { count: number; weighted: number; total: number }> = {};
  for (const e of events) {
    const value = e.beos[0]
      ? dec((await computeBeoFinancials(e.beos[0])).grandTotal)
      : dec(e.budget);
    const bucket = (byStatus[e.status] ??= { count: 0, weighted: 0, total: 0 });
    bucket.count += 1;
    bucket.total += value;
    bucket.weighted += value * (e.probability / 100);
  }
  const upcoming = await prisma.scEvent.count({
    where: {
      tenantId,
      status: { in: ['confirmed', 'contracted', 'in_progress'] },
      eventDate: { gte: now },
    },
  });
  const completedThisYear = await prisma.scEvent.count({
    where: {
      tenantId,
      status: 'completed',
      eventDate: { gte: new Date(now.getFullYear(), 0, 1) },
    },
  });
  return {
    pipeline: EVENT_STATUSES.slice(0, 5).map((s) => ({
      status: s,
      count: byStatus[s]?.count ?? 0,
      total: r2(byStatus[s]?.total ?? 0),
      weighted: r2(byStatus[s]?.weighted ?? 0),
    })),
    upcoming,
    completedThisYear,
    openBeos: await prisma.beo.count({
      where: { tenantId, status: { in: ['draft', 'pending_approval'] } },
    }),
  };
}

// ─── BEOs ───

export async function listBeos(tenantId: string, filters: { status?: string; eventId?: string }) {
  const beos = await prisma.beo.findMany({
    where: {
      tenantId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.eventId ? { eventId: filters.eventId } : {}),
    },
    include: {
      event: { select: { id: true, name: true, type: true, client: { select: { name: true } } } },
      venue: { select: { id: true, name: true } },
      menu: { select: { id: true, name: true } },
    },
    orderBy: [{ eventDate: 'asc' }, { version: 'desc' }],
  });
  return Promise.all(beos.map(async (b) => ({ ...b, financials: await computeBeoFinancials(b) })));
}

export async function getBeo(tenantId: string, id: string) {
  const beo = await prisma.beo.findFirst({
    where: { id, tenantId },
    include: {
      event: { include: { client: true } },
      venue: true,
      setup: true,
      menu: true,
      av: true,
    },
  });
  if (!beo) throw new AppError(404, 'BEO not found', 'NOT_FOUND');
  const financials = await computeBeoFinancials(beo);
  const decorOptions = await prisma.decorOption.findMany({ where: { tenantId, status: 'active' } });
  return { ...beo, financials, decorOptions };
}

export async function upsertBeo(tenantId: string, data: any, userId: string) {
  const event = await prisma.scEvent.findFirst({ where: { id: data.eventId, tenantId } });
  if (!event) throw new AppError(404, 'Event not found', 'NOT_FOUND');

  // Versioning rule: only ONE editable (draft) BEO per event. Saving an
  // approved/signed BEO creates a new version row instead of mutating.
  let beo;
  if (data.id) {
    beo = await prisma.beo.findFirst({ where: { id: data.id, tenantId } });
    if (!beo) throw new AppError(404, 'BEO not found', 'NOT_FOUND');

    if (['approved', 'signed'].includes(beo.status)) {
      const snapshots = await snapshotCatalog({ ...data, tenantId });
      const latest = await prisma.beo.aggregate({
        where: { eventId: beo.eventId },
        _max: { version: true },
      });
      beo = await prisma.beo.create({
        data: {
          tenantId,
          eventId: beo.eventId,
          version: (latest._max.version ?? 0) + 1,
          status: 'draft',
          title: data.title ?? beo.title,
          eventDate: data.eventDate ? new Date(data.eventDate) : beo.eventDate,
          startTime: data.startTime ?? beo.startTime,
          endTime: data.endTime ?? beo.endTime,
          guestCount: data.guestCount ?? beo.guestCount,
          venueId: data.venueId ?? beo.venueId,
          setupId: data.setupId ?? beo.setupId,
          menuId: data.menuId ?? beo.menuId,
          avId: data.avId ?? beo.avId,
          priceOverrides: data.priceOverrides ?? beo.priceOverrides,
          additionalServices: data.additionalServices ?? beo.additionalServices,
          decor: data.decor ?? beo.decor,
          specialInstructions: data.specialInstructions ?? beo.specialInstructions,
          logistics: data.logistics ?? beo.logistics,
          snapshots,
          createdById: userId,
        },
      });
      await prisma.scActivity.create({
        data: {
          tenantId,
          eventId: beo.eventId,
          type: 'note',
          body: `BEO v${beo.version} created from v${beo.version - 1} (${beo.status})`,
          createdById: userId,
        },
      });
    } else {
      beo = await prisma.beo.update({
        where: { id: beo.id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.eventDate !== undefined && { eventDate: new Date(data.eventDate) }),
          ...(data.startTime !== undefined && { startTime: data.startTime }),
          ...(data.endTime !== undefined && { endTime: data.endTime }),
          ...(data.guestCount !== undefined && { guestCount: data.guestCount }),
          ...(data.venueId !== undefined && { venueId: data.venueId }),
          ...(data.setupId !== undefined && { setupId: data.setupId }),
          ...(data.menuId !== undefined && { menuId: data.menuId }),
          ...(data.avId !== undefined && { avId: data.avId }),
          ...(data.priceOverrides !== undefined && { priceOverrides: data.priceOverrides }),
          ...(data.additionalServices !== undefined && {
            additionalServices: data.additionalServices,
          }),
          ...(data.decor !== undefined && { decor: data.decor }),
          ...(data.specialInstructions !== undefined && {
            specialInstructions: data.specialInstructions,
          }),
          ...(data.logistics !== undefined && { logistics: data.logistics }),
        },
      });
    }
  } else {
    // One editable BEO per event: if a draft already exists, update it in place
    const existingDraft = await prisma.beo.findFirst({
      where: { eventId: data.eventId, tenantId, status: { in: ['draft', 'changes_requested'] } },
      orderBy: { version: 'desc' },
    });
    if (existingDraft) {
      return upsertBeo(tenantId, { ...data, id: existingDraft.id }, userId);
    }
    const snapshots = await snapshotCatalog({ ...data, tenantId });
    beo = await prisma.beo.create({
      data: {
        tenantId,
        eventId: data.eventId,
        title: data.title ?? `${event.name} — BEO`,
        eventDate: data.eventDate ? new Date(data.eventDate) : event.eventDate,
        startTime: data.startTime,
        endTime: data.endTime,
        guestCount: data.guestCount ?? event.guestCount,
        venueId: data.venueId,
        setupId: data.setupId,
        menuId: data.menuId,
        avId: data.avId,
        priceOverrides: data.priceOverrides ?? {},
        additionalServices: data.additionalServices ?? [],
        decor: data.decor ?? [],
        logistics: data.logistics ?? {},
        specialInstructions: data.specialInstructions,
        snapshots,
        createdById: userId,
      },
    });
  }

  // Keep snapshots fresh while still editable
  if (!['approved', 'signed'].includes(beo.status)) {
    const fresh = await snapshotCatalog(beo);
    beo = await prisma.beo.update({ where: { id: beo.id }, data: { snapshots: fresh } });
  }
  return beo;
}

export async function submitBeoForApproval(tenantId: string, id: string, userId: string) {
  const beo = await getBeo(tenantId, id);
  if (!['draft', 'changes_requested'].includes(beo.status)) {
    throw new AppError(
      409,
      `BEO v${beo.version} is ${beo.status} — cannot submit`,
      'INVALID_STATE'
    );
  }
  const updated = await prisma.beo.update({
    where: { id },
    data: { status: 'pending_approval' },
  });
  await prisma.scActivity.create({
    data: {
      tenantId,
      eventId: beo.eventId,
      type: 'status_change',
      body: `BEO v${beo.version} submitted for approval`,
      createdById: userId,
    },
  });
  return updated;
}

export async function decideBeo(
  tenantId: string,
  id: string,
  action: 'approve' | 'request_changes',
  userId: string
) {
  const beo = await getBeo(tenantId, id);
  if (beo.status !== 'pending_approval') {
    throw new AppError(409, 'BEO is not awaiting approval', 'INVALID_STATE');
  }
  const updated = await prisma.beo.update({
    where: { id },
    data:
      action === 'approve'
        ? { status: 'approved', approvedById: userId, approvedAt: new Date() }
        : { status: 'changes_requested' },
  });
  await prisma.scActivity.create({
    data: {
      tenantId,
      eventId: beo.eventId,
      type: 'status_change',
      body: `BEO v${beo.version} ${action === 'approve' ? 'approved' : 'changes requested'}`,
      createdById: userId,
    },
  });
  return updated;
}

export async function signBeo(
  tenantId: string,
  id: string,
  signer: { name: string; role: string },
  req: any
) {
  const beo = await getBeo(tenantId, id);
  if (beo.status !== 'approved') {
    throw new AppError(409, 'BEO must be approved before signature', 'INVALID_STATE');
  }
  const signatures = (beo.signatures as any[]) ?? [];
  if (signatures.some((s) => s.name.toLowerCase() === signer.name.toLowerCase())) {
    throw new AppError(409, `${signer.name} has already signed this BEO`, 'DUPLICATE_SIGNATURE');
  }
  signatures.push({
    name: signer.name,
    role: signer.role ?? 'Client',
    signedAt: new Date().toISOString(),
    ip: req.ip,
  });
  const allSigned = signatures.length >= 2; // client + manager
  const updated = await prisma.beo.update({
    where: { id },
    data: { signatures, status: allSigned ? 'signed' : 'approved' },
  });
  if (allSigned) {
    await prisma.scEvent.update({
      where: { id: beo.eventId },
      data: { status: 'confirmed' },
    });
  }
  return updated;
}

// ─── Catalogs ───

const catalogMap = {
  venues: { model: 'venue', name: 'Venue' },
  menus: { model: 'menuPackage', name: 'Menu package' },
  'av-packages': { model: 'avPackage', name: 'AV package' },
  setups: { model: 'setupStyle', name: 'Setup style' },
  decor: { model: 'decorOption', name: 'Decor option' },
} as const;

export type CatalogKey = keyof typeof catalogMap;

export async function listCatalog(tenantId: string, key: CatalogKey) {
  const { model } = catalogMap[key];
  return (prisma as any)[model].findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createCatalogItem(tenantId: string, key: CatalogKey, data: any) {
  const { model } = catalogMap[key];
  if (!data?.name || !String(data.name).trim()) {
    throw new AppError(400, 'Name is required', 'VALIDATION_ERROR');
  }
  if (key === 'venues' && data.code) {
    const clash = await prisma.venue.findUnique({
      where: { tenantId_code: { tenantId, code: data.code } },
    });
    if (clash) throw new AppError(409, `Venue code "${data.code}" already exists`, 'DUPLICATE');
  }
  const created = await (prisma as any)[model].create({ data: { ...data, tenantId } });
  scAudit(tenantId, 'create', `sc_${key}`, created.id, created.name);
  return created;
}

export async function updateCatalogItem(tenantId: string, key: CatalogKey, id: string, data: any) {
  const { model, name } = catalogMap[key];
  const existing = await (prisma as any)[model].findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppError(404, `${name} not found`, 'NOT_FOUND');
  const { tenantId: _t, id: _i, ...rest } = data;
  return (prisma as any)[model].update({ where: { id }, data: rest });
}

export async function deleteCatalogItem(tenantId: string, key: CatalogKey, id: string) {
  const { model, name } = catalogMap[key];
  const existing = await (prisma as any)[model].findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppError(404, `${name} not found`, 'NOT_FOUND');
  // BEO snapshots reference catalog rows — soft-delete instead of breaking history
  return (prisma as any)[model].update({ where: { id }, data: { status: 'archived' } });
}

// ─── Activity ───

export async function addActivity(tenantId: string, data: any, userId: string) {
  if (!data.clientId && !data.eventId) {
    throw new AppError(400, 'clientId or eventId is required', 'VALIDATION_ERROR');
  }
  return prisma.scActivity.create({
    data: {
      tenantId,
      clientId: data.clientId,
      eventId: data.eventId,
      type: data.type ?? 'note',
      body: data.body,
      createdById: userId,
    },
  });
}
