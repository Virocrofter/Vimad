/* apps/api/src/modules/notifications/notification.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    $transaction: vi.fn(),
    notification: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    user: { findFirst: vi.fn(), findMany: vi.fn() },
  },
}));

// Push is lazy-loaded via dynamic import inside the service; the mock
// intercepts it. Socket emits are local no-ops in the service itself
// (circular-dependency workaround) — nothing to mock and nothing to assert.
vi.mock('../push/push.service.js', () => ({
  sendPushToUser: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from '../../common/prisma.js';
import { sendPushToUser } from '../push/push.service.js';
import {
  listNotifications,
  getNotification,
  createNotification,
  createBroadcastNotification,
  updateNotification,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from './notification.service.js';

const mockNotification = prisma.notification as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockUser = prisma.user as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;
const mockPush = sendPushToUser as unknown as ReturnType<typeof vi.fn>;

const notification = {
  id: 'n1',
  userId: 'u1',
  tenantId: 't1',
  type: 'reservation',
  category: 'info',
  title: 'New reservation',
  message: 'RSV-1 was created',
  read: false,
  readAt: null,
};

const createInput = {
  userId: 'u1',
  type: 'reservation',
  category: 'info' as const,
  title: 'New reservation',
  message: 'RSV-1 was created',
  deliveredVia: [],
};

beforeEach(() => vi.clearAllMocks());

describe('listNotifications', () => {
  it('returns paginated notifications for the user and tenant', async () => {
    mockNotification.count.mockResolvedValue(1);
    mockNotification.findMany.mockResolvedValue([notification]);

    const result = await listNotifications('u1', 't1', { page: 1, pageSize: 20 });

    expect(mockNotification.findMany.mock.calls[0][0].where).toEqual({
      userId: 'u1',
      tenantId: 't1',
    });
    expect(result.data).toEqual([notification]);
  });

  it('filters to unread notifications when unreadOnly is set', async () => {
    mockNotification.count.mockResolvedValue(0);
    mockNotification.findMany.mockResolvedValue([]);

    await listNotifications('u1', 't1', { page: 1, pageSize: 20, unreadOnly: true });

    expect(mockNotification.findMany.mock.calls[0][0].where.read).toBe(false);
  });
});

describe('getNotification', () => {
  it('throws 404 when the notification belongs to another user', async () => {
    mockNotification.findFirst.mockResolvedValue(null);
    await expect(getNotification('u1', 't1', 'n1')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });
});

describe('createNotification', () => {
  it('throws 404 when the user is missing or inactive', async () => {
    mockUser.findFirst.mockResolvedValue(null);

    await expect(createNotification('t1', createInput)).rejects.toMatchObject({
      statusCode: 404,
      message: 'User not found or inactive',
    });
    expect(mockNotification.create).not.toHaveBeenCalled();
  });

  it('creates the notification unread and triggers a push notification', async () => {
    mockUser.findFirst.mockResolvedValue({ id: 'u1' });
    mockNotification.create.mockResolvedValue(notification);

    const result = await createNotification('t1', createInput);

    expect(mockNotification.create.mock.calls[0][0].data).toMatchObject({
      userId: 'u1',
      tenantId: 't1',
      title: 'New reservation',
      read: false,
    });
    // Push is fire-and-forget through a lazy dynamic import — wait for it
    await vi.waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({
          title: 'New reservation',
          body: 'RSV-1 was created',
          data: expect.objectContaining({ notificationId: 'n1' }),
        })
      )
    );
    expect(result).toEqual(notification);
  });
});

describe('createBroadcastNotification', () => {
  it('creates one notification per active user in a transaction', async () => {
    mockUser.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);
    mockNotification.create
      .mockResolvedValueOnce({ ...notification, id: 'n1' })
      .mockResolvedValueOnce({ ...notification, id: 'n2', userId: 'u2' });
    mockTransaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));

    const { userId: _omit, ...broadcastInput } = createInput;
    const result = await createBroadcastNotification('t1', broadcastInput);

    expect(mockUser.findMany.mock.calls[0][0].where).toEqual({
      tenantId: 't1',
      status: 'active',
    });
    expect(mockNotification.create).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });
});

describe('updateNotification', () => {
  it('throws 404 when the notification is not found', async () => {
    mockNotification.findFirst.mockResolvedValue(null);
    await expect(updateNotification('u1', 't1', 'n1', { read: true })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('sets readAt when marking an unread notification as read', async () => {
    mockNotification.findFirst.mockResolvedValue(notification);
    mockNotification.update.mockResolvedValue({ ...notification, read: true });

    await updateNotification('u1', 't1', 'n1', { read: true });

    const data = mockNotification.update.mock.calls[0][0].data;
    expect(data.read).toBe(true);
    expect(data.readAt).toBeInstanceOf(Date);
  });

  it('keeps the existing readAt when the read flag does not change', async () => {
    const readNotification = { ...notification, read: true, readAt: new Date('2026-09-01') };
    mockNotification.findFirst.mockResolvedValue(readNotification);
    mockNotification.update.mockResolvedValue(readNotification);

    await updateNotification('u1', 't1', 'n1', { read: true });

    expect(mockNotification.update.mock.calls[0][0].data.readAt).toEqual(readNotification.readAt);
  });
});

describe('markAllAsRead', () => {
  it('marks every unread notification as read', async () => {
    mockNotification.updateMany.mockResolvedValue({ count: 3 });

    const result = await markAllAsRead('u1', 't1');

    expect(mockNotification.updateMany.mock.calls[0][0]).toMatchObject({
      where: { userId: 'u1', tenantId: 't1', read: false },
      data: { read: true, readAt: expect.any(Date) },
    });
    expect(result).toEqual({ updated: true });
  });
});

describe('deleteNotification', () => {
  it('throws 404 when the notification is not found', async () => {
    mockNotification.findFirst.mockResolvedValue(null);
    await expect(deleteNotification('u1', 't1', 'n1')).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(mockNotification.delete).not.toHaveBeenCalled();
  });

  it('deletes the notification', async () => {
    mockNotification.findFirst.mockResolvedValue(notification);
    mockNotification.delete.mockResolvedValue(notification);

    const result = await deleteNotification('u1', 't1', 'n1');

    expect(mockNotification.delete).toHaveBeenCalledWith({ where: { id: 'n1' } });
    expect(result).toEqual({ id: 'n1' });
  });
});

describe('getUnreadCount', () => {
  it('returns the unread count for the user', async () => {
    mockNotification.count.mockResolvedValue(4);

    const result = await getUnreadCount('u1', 't1');

    expect(mockNotification.count.mock.calls[0][0].where).toEqual({
      userId: 'u1',
      tenantId: 't1',
      read: false,
    });
    expect(result).toEqual({ count: 4 });
  });
});
