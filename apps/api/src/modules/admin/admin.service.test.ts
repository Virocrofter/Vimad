/* apps/api/src/modules/admin/admin.service.test.ts */
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    tenant: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    supportCase: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    usageRecord: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    room: {
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

vi.mock('../../common/logger.js', () => ({
  logger: { error: vi.fn(), info: vi.fn() },
}));

vi.mock('../../common/queue.js', () => ({
  getRedisClient: vi.fn(),
}));

import { prisma } from '../../common/prisma.js';
import { getRedisClient } from '../../common/queue.js';
import {
  getAdminKpis,
  getAdminSystemHealth,
  getAdminAlerts,
  getAdminTenantActivity,
  getAdminPlanDistribution,
  getAdminQuickActions,
  getAdminAuditLogs,
  getAdminAuditStats,
  getAdminTicketQueue,
  getAdminTenants,
  getAdminBillingDashboard,
  getAdminRevenueByPlan,
  listAdminSubscriptions,
  updateAdminSubscription,
  cancelAdminSubscription,
  generateAdminInvoice,
  createAdminCreditNote,
  getAdminCreditNotes,
  applyAdminCreditNote,
  getAdminDunning,
  deleteAdminInvoice,
} from './admin.service.js';
import { requireAdminRole } from './admin.middleware.js';

const mockTenant = prisma.tenant as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockUser = prisma.user as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockInvoice = prisma.invoice as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockAuditLog = prisma.auditLog as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockSupportCase = prisma.supportCase as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockTenantList = prisma.tenant as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockUsage = prisma.usageRecord as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockRoom = prisma.room as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockRedis = getRedisClient as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('getAdminKpis', () => {
  it('returns KPIs with real database counts', async () => {
    mockTenant.count.mockResolvedValue(5);
    mockUser.count.mockResolvedValue(12);
    mockInvoice.findMany.mockResolvedValue([
      { totalAmount: 99, plan: 'starter' },
      { totalAmount: 299, plan: 'professional' },
    ]);

    const result = await getAdminKpis();

    expect(result.totalTenants.value).toBe(5);
    expect(result.mrr.value).toBe(398);
    expect(result.activeUsers.value).toBe(12);
    expect(result.churnRate.value).toBeGreaterThanOrEqual(0);
    expect(result.totalTenants.trend).toHaveLength(7);
  });
});

describe('getAdminSystemHealth', () => {
  it('returns healthy when all services are up', async () => {
    mockRedis.mockReturnValue({ ping: vi.fn().mockResolvedValue('PONG') });

    const result = await getAdminSystemHealth();

    expect(result.status).toBe('healthy');
    expect(result.services).toHaveLength(5);
    expect(result.services[0].name).toBe('API Server');
    expect(result.uptime).toMatch(/^\d/); // starts with a digit
  });

  it('returns degraded when redis is disconnected', async () => {
    mockRedis.mockReturnValue(null);

    const result = await getAdminSystemHealth();

    expect(result.status).toBe('degraded');
    const redisService = result.services.find((s) => s.name.includes('Redis'));
    expect(redisService?.status).toBe('degraded');
  });
});

describe('getAdminAlerts', () => {
  it('returns fallback alerts when no error logs exist', async () => {
    mockAuditLog.findMany.mockResolvedValue([]);

    const result = await getAdminAlerts();

    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0].severity).toBe('info');
  });

  it('maps audit logs to alerts', async () => {
    mockAuditLog.findMany.mockResolvedValue([
      {
        id: 'log1',
        action: 'reservation.error',
        entity: 'reservation',
        metadata: { description: 'Payment failed' },
        tenant: { name: 'Demo Hotel' },
        createdAt: new Date(Date.now() - 3600000),
      },
    ]);

    const result = await getAdminAlerts();

    expect(result[0].id).toBe('alert-log1');
    expect(result[0].source).toBe('Demo Hotel');
  });
});

describe('getAdminTenantActivity', () => {
  it('returns fallback activity when no logs exist', async () => {
    mockAuditLog.findMany.mockResolvedValue([]);

    const result = await getAdminTenantActivity();

    expect(result.length).toBe(3);
    expect(result[0].tenant).toBe('Demo Hotel Group');
  });

  it('maps audit logs to activity items', async () => {
    mockAuditLog.findMany.mockResolvedValue([
      {
        id: 'log1',
        action: 'reservation.create',
        entity: 'reservation',
        metadata: { label: 'New Reservation', description: 'RSV-1001 created' },
        tenant: { name: 'Test Hotel' },
        createdAt: new Date(Date.now() - 7200000),
      },
    ]);

    const result = await getAdminTenantActivity();

    expect(result[0].type).toBe('booking');
    expect(result[0].tenant).toBe('Test Hotel');
  });
});

describe('getAdminPlanDistribution', () => {
  it('returns plan distribution with percentages', async () => {
    mockTenant.groupBy.mockResolvedValue([
      { plan: 'starter', _count: { plan: 3 } },
      { plan: 'professional', _count: { plan: 2 } },
    ]);

    const result = await getAdminPlanDistribution();

    expect(result).toHaveLength(2);
    expect(result[0].percentage).toBe(60); // 3/5
    expect(result[0].color).toBeDefined();
  });
});

describe('getAdminQuickActions', () => {
  it('returns static quick action list', () => {
    const result = getAdminQuickActions();

    expect(result.length).toBe(6);
    expect(result[0].id).toBe('new-tenant');
    expect(result.map((a) => a.color)).toContain('secondary');
    expect(result.map((a) => a.color)).toContain('accent');
  });
});

describe('A1 admin audit logs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps raw rows to the AuditEntry contract with exact meta', async () => {
    mockAuditLog.findMany.mockResolvedValue([
      {
        id: 'a1',
        action: 'reservation.create',
        entity: 'reservation',
        entityId: 'r1',
        userId: 'u1',
        ipAddress: '10.0.0.1',
        createdAt: new Date('2026-11-02T00:00:00.000Z'),
        metadata: {
          severity: 'high',
          description: 'Reservation created',
          changes: [{ field: 'status', old: '', new: 'confirmed' }],
          sessionId: 's1',
        },
      },
    ]);
    mockAuditLog.count.mockResolvedValue(1);
    mockUser.findMany.mockResolvedValue([
      { id: 'u1', firstName: 'Demo', lastName: 'Owner', role: 'owner' },
    ]);

    const result = await getAdminAuditLogs({ page: 1, pageSize: 25 });
    expect(result.meta).toEqual({ page: 1, pageSize: 25, total: 1, totalPages: 1 });
    const e = result.data[0];
    expect(e.severity).toBe('high');
    expect(e.user).toEqual({ name: 'Demo Owner', role: 'owner', ip: '10.0.0.1' });
    expect(e.action.type).toBe('reservation.create');
    expect(e.resource).toEqual({ type: 'reservation', id: 'r1', name: 'r1' }); // name falls back to entityId
    expect(e.changes).toHaveLength(1);
    expect(e.sessionId).toBe('s1');
    expect(e.timestamp).toBe('2026-11-02T00:00:00.000Z');
  });

  it('falls back to info severity and System user without metadata/user', async () => {
    mockAuditLog.findMany.mockResolvedValue([
      {
        id: 'a2',
        action: 'folio.post',
        entity: 'folio',
        entityId: null,
        userId: null,
        ipAddress: null,
        createdAt: new Date('2026-11-01T00:00:00.000Z'),
        metadata: null,
      },
    ]);
    mockAuditLog.count.mockResolvedValue(1);
    const result = await getAdminAuditLogs({});
    expect(result.data[0].severity).toBe('info');
    expect(result.data[0].user.name).toBe('System');
  });

  it('stats contract: totals, critical, 24h, unique users', async () => {
    mockAuditLog.count
      .mockResolvedValueOnce(120)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(30);
    mockAuditLog.groupBy.mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }]);
    const stats = await getAdminAuditStats();
    expect(stats).toEqual({
      totalEvents: 120,
      criticalEvents: 4,
      eventsLast24h: 30,
      uniqueUsers: 2,
    });
  });
});

describe('A2 admin ticket queue', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps support_cases to the queue item contract with meta', async () => {
    mockSupportCase.findMany.mockResolvedValue([
      {
        id: 'c1',
        number: 'VIM-1001',
        subject: 'Payments failing',
        status: 'open',
        priority: 'critical',
        category: 'billing',
        source: 'tenant',
        tenant: { id: 't1', name: 'Grand Hotel' },
        assignee: { firstName: 'Sam', lastName: 'Ops' },
        createdAt: new Date('2026-11-01T08:00:00.000Z'),
        lastMessageAt: new Date('2026-11-02T07:00:00.000Z'),
        slaResolveDueAt: new Date('2026-11-01T00:00:00.000Z'),
        messages: [{ id: 'm1' }, { id: 'm2' }],
      },
    ]);
    mockSupportCase.count.mockResolvedValue(1);

    const result = await getAdminTicketQueue({ status: 'open', page: 1, pageSize: 25 });
    expect(result.meta).toEqual({ page: 1, pageSize: 25, total: 1, totalPages: 1 });
    const item = result.data[0];
    expect(item.number).toBe('VIM-1001');
    expect(item.tenantName).toBe('Grand Hotel');
    expect(item.assigneeName).toBe('Sam Ops');
    expect(item.slaBreached).toBe(true);
    expect(item.escalationLevel).toBe(1);
    expect(item.messageCount).toBe(2);
    expect(mockSupportCase.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'open' } })
    );
  });
});

describe('A3 admin tenants', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps tenants with user/property counts', async () => {
    mockTenantList.findMany.mockResolvedValue([
      {
        id: 't1',
        name: 'Demo V2 Hotels',
        slug: 'demo-v2',
        plan: 'pro',
        status: 'active',
        createdAt: new Date('2026-11-02T00:00:00.000Z'),
        _count: { users: 1, properties: 2 },
      },
    ]);
    const tenants = await getAdminTenants();
    expect(tenants).toHaveLength(1);
    expect(tenants[0]).toEqual({
      id: 't1',
      name: 'Demo V2 Hotels',
      slug: 'demo-v2',
      plan: 'pro',
      status: 'active',
      userCount: 1,
      propertyCount: 2,
      createdAt: '2026-11-02T00:00:00.000Z',
    });
  });
});

describe('B0 platform-admin guard', () => {
  const ORIG = process.env.PLATFORM_ADMIN_EMAILS;
  afterEach(() => {
    if (ORIG === undefined) delete process.env.PLATFORM_ADMIN_EMAILS;
    else process.env.PLATFORM_ADMIN_EMAILS = ORIG;
  });
  const mkRes = () => ({ status: vi.fn(), json: vi.fn() }) as any;
  const mkReq = (email: string, role = 'owner') => ({ auth: { user: { email, role } } }) as any;
  const run = (req: any, res: any) => {
    const next = vi.fn();
    requireAdminRole(req, res, next);
    return next;
  };

  it('fail-closed: unset PLATFORM_ADMIN_EMAILS denies everyone with 503-class error', () => {
    delete process.env.PLATFORM_ADMIN_EMAILS;
    const next = run(mkReq('owner@demov2.test'), mkRes());
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(String(err?.message ?? '')).toContain('not configured');
  });

  it('denies a tenant owner whose email is not designated', () => {
    process.env.PLATFORM_ADMIN_EMAILS = 'vin@example.com';
    const next = run(mkReq('owner@somehotel.co.za'), mkRes());
    expect(next).toHaveBeenCalledTimes(1);
    expect(String(next.mock.calls[0][0]?.message ?? '')).toContain('Platform admin only');
  });

  it('passes a designated platform admin regardless of tenant role', () => {
    process.env.PLATFORM_ADMIN_EMAILS = 'vin@example.com, ops@example.com';
    const next = run(mkReq('OPS@example.com', 'staff'), mkRes());
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });
});

describe('B1 billing dashboard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('computes the exact dashboard contract from invoices + tenants', async () => {
    mockInvoice.aggregate
      .mockResolvedValueOnce({ _sum: { totalAmount: 12500 } })
      .mockResolvedValueOnce({ _sum: { totalAmount: 1500 } });
    mockInvoice.count.mockResolvedValue(3);
    mockTenantList.findMany.mockResolvedValue([{ plan: 'starter' }, { plan: 'professional' }]);
    mockTenantList.count.mockResolvedValue(2);
    mockTenantList.count.mockResolvedValueOnce(2).mockResolvedValueOnce(3);

    const d = await getAdminBillingDashboard();
    expect(d).toEqual({
      totalRevenue: 12500,
      mrr: 199 + 499,
      outstandingInvoices: 3,
      overdueAmount: 1500,
      activeSubscriptions: 2,
      trialConversions: 3,
    });
  });

  it('revenue-by-plan groups tenants with property counts and mrr', async () => {
    mockTenantList.findMany.mockResolvedValue([
      { id: 't1', plan: 'starter', _count: { properties: 1 } },
      { id: 't2', plan: 'starter', _count: { properties: 2 } },
      { id: 't3', plan: 'enterprise', _count: { properties: 4 } },
    ]);
    const rows = await getAdminRevenueByPlan();
    expect(rows).toEqual([
      { plan: 'starter', tenants: 2, properties: 3, mrr: 398 },
      { plan: 'enterprise', tenants: 1, properties: 4, mrr: 999 },
    ]);
  });
});

describe('B3 derived subscriptions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('derives the Subscription contract with usage counts', async () => {
    mockTenantList.findMany.mockResolvedValue([
      {
        id: 't1',
        plan: 'professional',
        status: 'active',
        createdAt: new Date('2026-01-05T00:00:00.000Z'),
        _count: { properties: 2, users: 4 },
      },
    ]);
    mockTenantList.count.mockResolvedValue(1);
    mockRoom.count.mockResolvedValue(18);
    mockUsage.aggregate.mockResolvedValue({ _sum: { quantity: 4200 } });

    const r = await listAdminSubscriptions({});
    expect(r.meta.totalPages).toBe(1);
    const sub = r.data[0];
    expect(sub.id).toBe('t1');
    expect(sub.plan).toBe('professional');
    expect(sub.status).toBe('active');
    expect(sub.usage).toEqual({ properties: 2, rooms: 18, users: 4, apiCalls: 4200 });
    expect(sub.cancelAtPeriodEnd).toBe(false);
  });

  it('update validates against the catalog; cancel(immediately) suspends', async () => {
    mockTenantList.update.mockResolvedValue({});
    mockTenantList.findUnique.mockResolvedValue({
      id: 't1',
      plan: 'professional',
      status: 'active',
      createdAt: new Date(),
      _count: { properties: 1, users: 1 },
    });
    mockRoom.count.mockResolvedValue(6);
    mockUsage.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });

    await updateAdminSubscription('t1', { plan: 'professional' });
    expect(mockTenantList.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { plan: 'professional' },
    });
    await expect(updateAdminSubscription('t1', { plan: 'platinum' })).rejects.toThrow(
      'unknown plan'
    );

    const cancelled = await cancelAdminSubscription('t1', { immediately: true });
    expect(mockTenantList.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { status: 'suspended' },
    });
    expect(cancelled.status).toBe('active'); // derived pre-suspension snapshot
  });
});

describe('B2 generate idempotency', () => {
  beforeEach(() => vi.clearAllMocks());

  it('return-existing: same (tenant, period) returns the first invoice, never duplicates', async () => {
    const existing = { id: 'inv-1', totalAmount: 499 };
    mockTenantList.findUnique.mockResolvedValue({ id: 't1', plan: 'professional' });
    mockInvoice.findFirst.mockResolvedValue(existing);
    const again = await generateAdminInvoice({
      tenantId: 't1',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
    });
    expect(again.id).toBe('inv-1');
    expect(mockInvoice.create).not.toHaveBeenCalled();
  });

  it('creates once with reconciled total = planFee, usage itemised at 0', async () => {
    mockTenantList.findUnique.mockResolvedValue({ id: 't1', plan: 'professional' });
    mockInvoice.findFirst.mockResolvedValue(null);
    mockUsage.groupBy.mockResolvedValue([{ metric: 'sms', _sum: { quantity: 1200 } }]);
    mockInvoice.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'inv-new', ...data })
    );

    const inv: any = await generateAdminInvoice({
      tenantId: 't1',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
    });
    expect(Number(inv.totalAmount)).toBe(499);
    expect(Number(inv.baseAmount)).toBe(499);
    expect(inv.status).toBe('sent');
    expect(inv.items.lines[0]).toMatchObject({ type: 'base', amount: 499 });
    expect(inv.items.lines[1]).toMatchObject({
      type: 'usage',
      description: 'usage: sms × 1200',
      amount: 0,
    });
    expect(new Date(inv.dueDate).getTime()).toBe(new Date('2026-10-31').getTime() + 14 * 86400_000);
  });

  it('trials are never invoiced; unknown tenants rejected', async () => {
    mockTenantList.findUnique.mockResolvedValue({ id: 't2', plan: 'trial' });
    await expect(
      generateAdminInvoice({ tenantId: 't2', periodStart: '2026-10-01', periodEnd: '2026-10-31' })
    ).rejects.toThrow('trial');
    mockTenantList.findUnique.mockResolvedValue(null);
    await expect(
      generateAdminInvoice({ tenantId: 'nope', periodStart: '2026-10-01', periodEnd: '2026-10-31' })
    ).rejects.toThrow('tenant not found');
  });
});

describe('B4 credit notes + dunning', () => {
  beforeEach(() => vi.clearAllMocks());

  it('credit note lifecycle: negative invoice -> list view -> applied', async () => {
    const parent = {
      id: 'inv-9',
      tenantId: 't1',
      plan: 'starter',
      currency: 'ZAR',
      periodStart: new Date('2026-10-01'),
      periodEnd: new Date('2026-10-31'),
      dueDate: new Date('2026-11-14'),
      createdAt: new Date(),
      items: {},
    };
    mockInvoice.findUnique.mockResolvedValue(parent);
    mockInvoice.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'cn-1', createdAt: new Date('2026-11-02T00:00:00.000Z'), ...data })
    );
    const cn: any = await createAdminCreditNote({
      invoiceId: 'inv-9',
      amount: 199,
      reason: 'goodwill',
    });
    expect(Number(cn.totalAmount)).toBe(-199);
    expect(cn.items.creditOf).toBe('inv-9');
    expect(cn.items.status).toBe('pending');

    mockInvoice.findMany.mockResolvedValue([cn]);
    const listed = await getAdminCreditNotes('inv-9');
    expect(listed).toEqual([
      {
        id: 'cn-1',
        invoiceId: 'inv-9',
        amount: 199,
        currency: 'ZAR',
        reason: 'goodwill',
        status: 'pending',
        createdAt: '2026-11-02T00:00:00.000Z',
      },
    ]);

    mockInvoice.update.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'cn-1', ...cn, items: data.items })
    );
    const applied: any = await applyAdminCreditNote('cn-1');
    expect(applied.items.status).toBe('applied');
  });

  it('dunning queue derives overdue invoices; paid invoices are not dunned', async () => {
    const overdue = {
      id: 'inv-d1',
      status: 'sent',
      dueDate: new Date(Date.now() - 3 * 86400_000),
      totalAmount: 499,
      items: {},
    };
    mockInvoice.findMany.mockResolvedValue([overdue]);
    const queue = await getAdminDunning();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ invoiceId: 'inv-d1', attempt: 1, status: 'sent' });

    mockInvoice.findUnique.mockResolvedValue({ id: 'inv-p1', status: 'paid' });
    await expect(deleteAdminInvoice('inv-p1')).rejects.toThrow('only draft or cancelled');
  });
});
