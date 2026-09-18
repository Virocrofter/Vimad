/* apps/api/src/modules/admin/admin.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    tenant: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    user: {
      count: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
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
} from './admin.service.js';

const mockTenant = prisma.tenant as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockUser = prisma.user as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockInvoice = prisma.invoice as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockAuditLog = prisma.auditLog as unknown as Record<string, ReturnType<typeof vi.fn>>;
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
