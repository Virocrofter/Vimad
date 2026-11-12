import { randomUUID } from 'node:crypto';
import { prisma } from '../../../common/prisma.js';
import { AppError } from '../../../common/errors.js';

async function audit(entry: {
  actorEmail: string;
  action: string;
  entityId: string;
  tenantId?: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
}) {
  await prisma.platformAuditEvent.create({
    data: {
      id: randomUUID(),
      actorEmail: entry.actorEmail,
      action: entry.action,
      entity: 'tenant',
      entityId: entry.entityId,
      tenantId: entry.tenantId,
      before:
        entry.before === undefined ? undefined : JSON.parse(JSON.stringify(entry.before ?? null)),
      after:
        entry.after === undefined ? undefined : JSON.parse(JSON.stringify(entry.after ?? null)),
      reason: entry.reason,
      source: 'console',
    },
  });
}

export async function listTenants(query: any) {
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
  const where: any = {};
  if (query.status) where.status = query.status;
  if (query.plan) where.plan = query.plan;
  if (query.search)
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { slug: { contains: query.search, mode: 'insensitive' } },
    ];
  const [total, rows] = await Promise.all([
    prisma.tenant.count({ where }),
    prisma.tenant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { properties: true, users: true } } },
    }),
  ]);
  return { rows, total, page, limit };
}

export async function tenantDetail(id: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      properties: true,
      _count: { select: { users: true, guests: true, reservations: true } },
    },
  });
  if (!tenant) throw new AppError(404, 'Tenant not found', 'NOT_FOUND');
  const [invoiceAgg, supportOpen] = await Promise.all([
    prisma.invoice.aggregate({
      where: { tenantId: id, status: { in: ['sent', 'overdue'] } },
      _sum: { totalAmount: true },
    }),
    prisma.supportCase.count({
      where: { tenantId: id, status: { in: ['open', 'in_progress', 'pending'] } },
    }),
  ]);
  return {
    ...tenant,
    outstandingAmount: Number(invoiceAgg._sum.totalAmount ?? 0),
    openSupportCases: supportOpen,
  };
}

export async function tenantTimeline(id: string) {
  const events = await prisma.platformAuditEvent.findMany({
    where: { tenantId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return events;
}

export async function suspendTenant(id: string, reason: string, actorEmail: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) throw new AppError(404, 'Tenant not found', 'NOT_FOUND');
  if (tenant.status === 'suspended')
    throw new AppError(409, 'Tenant already suspended', 'INVALID_STATE');
  const updated = await prisma.tenant.update({ where: { id }, data: { status: 'suspended' } });
  await audit({
    actorEmail,
    action: 'platform.tenant.suspended',
    entityId: id,
    tenantId: id,
    before: { status: 'active' },
    after: { status: 'suspended' },
    reason,
  });
  return updated;
}

export async function reactivateTenant(id: string, actorEmail: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) throw new AppError(404, 'Tenant not found', 'NOT_FOUND');
  if (tenant.status === 'active') throw new AppError(409, 'Tenant already active', 'INVALID_STATE');
  const updated = await prisma.tenant.update({ where: { id }, data: { status: 'active' } });
  await audit({
    actorEmail,
    action: 'platform.tenant.reactivated',
    entityId: id,
    tenantId: id,
    before: { status: tenant.status },
    after: { status: 'active' },
  });
  return updated;
}

export async function setTenantPlan(id: string, plan: string, reason: string, actorEmail: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) throw new AppError(404, 'Tenant not found', 'NOT_FOUND');
  const updated = await prisma.tenant.update({ where: { id }, data: { plan } });
  await audit({
    actorEmail,
    action: 'platform.tenant.plan_changed',
    entityId: id,
    tenantId: id,
    before: { plan: tenant.plan },
    after: { plan },
    reason,
  });
  return updated;
}

export async function globalSearch(q: string) {
  const like = { contains: q, mode: 'insensitive' as const };
  const [tenants, users, cases] = await Promise.all([
    prisma.tenant.findMany({
      where: { OR: [{ name: like }, { slug: like }] },
      take: 5,
      select: { id: true, name: true, slug: true, status: true },
    }),
    prisma.user.findMany({
      where: { email: like },
      take: 5,
      select: { id: true, email: true, tenantId: true },
    }),
    prisma.supportCase.findMany({
      where: { OR: [{ subject: like }, { number: like }] },
      take: 5,
      select: { id: true, number: true, subject: true, status: true, tenantId: true },
    }),
  ]);
  return { tenants, users, cases };
}
