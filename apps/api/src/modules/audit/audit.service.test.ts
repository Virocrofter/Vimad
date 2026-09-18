/* apps/api/src/modules/audit/audit.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    auditLog: { create: vi.fn() },
  },
}));

vi.mock('../../common/logger.js', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock('./audit.events.js', () => ({
  broadcastAuditEvent: vi.fn(),
}));

import { prisma } from '../../common/prisma.js';
import { logger } from '../../common/logger.js';
import { broadcastAuditEvent } from './audit.events.js';
import { logAuditEvent } from './audit.service.js';

const mockAuditLog = prisma.auditLog as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockBroadcast = broadcastAuditEvent as unknown as ReturnType<typeof vi.fn>;
const mockLoggerError = logger.error as unknown as ReturnType<typeof vi.fn>;

function reqWithUser(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      user: {
        id: 'u1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        role: 'admin',
      },
    },
    ip: '10.0.0.1',
    ...overrides,
  } as any;
}

const baseParams = {
  tenantId: 't1',
  action: 'reservation.update',
  category: 'reservation',
  label: 'Reservation Updated',
  description: 'Reservation r1 updated',
  entityType: 'reservation',
  entityId: 'r1',
};

beforeEach(() => vi.clearAllMocks());

describe('logAuditEvent', () => {
  it('persists an audit log built from the authenticated request', async () => {
    await logAuditEvent({ ...baseParams, req: reqWithUser() });

    expect(mockAuditLog.create).toHaveBeenCalledTimes(1);
    const data = mockAuditLog.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      tenantId: 't1',
      userId: 'u1',
      action: 'reservation.update',
      entity: 'reservation',
      entityId: 'r1',
      ipAddress: '10.0.0.1',
    });
    expect(data.metadata).toMatchObject({
      category: 'reservation',
      label: 'Reservation Updated',
      description: 'Reservation r1 updated',
      actor: { id: 'u1', name: 'Ada Lovelace', role: 'admin', ip: '10.0.0.1' },
    });
  });

  it('falls back to the email when the user has no name', async () => {
    await logAuditEvent({
      ...baseParams,
      req: reqWithUser({
        auth: {
          user: {
            id: 'u2',
            firstName: null,
            lastName: null,
            email: 'noname@example.com',
            role: 'staff',
          },
        },
      }),
    });

    const data = mockAuditLog.create.mock.calls[0][0].data;
    expect(data.metadata.actor.name).toBe('noname@example.com');
  });

  it('uses a system actor and no userId when no request is provided', async () => {
    await logAuditEvent(baseParams);

    const data = mockAuditLog.create.mock.calls[0][0].data;
    expect(data.userId).toBeUndefined();
    expect(data.metadata.actor).toBeNull();

    expect(mockBroadcast).toHaveBeenCalledTimes(1);
    expect(mockBroadcast.mock.calls[0][0].actor).toEqual({
      id: 'system',
      name: 'System',
      role: 'system',
      ip: 'internal',
    });
  });

  it('broadcasts the event with the default "info" severity', async () => {
    await logAuditEvent({ ...baseParams, req: reqWithUser() });

    const event = mockBroadcast.mock.calls[0][0];
    expect(event.severity).toBe('info');
    expect(event.action).toMatchObject({ type: 'reservation.update', category: 'reservation' });
    expect(event.target).toMatchObject({ type: 'reservation', id: 'r1', tenantId: 't1' });
  });

  it('uses the metadata name as the target name when provided', async () => {
    await logAuditEvent({ ...baseParams, metadata: { name: 'RSV-1001' }, severity: 'high' });

    const event = mockBroadcast.mock.calls[0][0];
    expect(event.target.name).toBe('RSV-1001');
    expect(event.severity).toBe('high');
  });

  it('still broadcasts when persistence fails, and logs the error', async () => {
    mockAuditLog.create.mockRejectedValue(new Error('db down'));

    await expect(logAuditEvent({ ...baseParams, req: reqWithUser() })).resolves.toBeUndefined();

    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockBroadcast).toHaveBeenCalledTimes(1);
  });
});
