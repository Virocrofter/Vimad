/* apps/api/src/modules/push/push.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    pushSubscription: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));

import webPush from 'web-push';
import { prisma } from '../../common/prisma.js';
import {
  saveSubscription,
  getSubscription,
  removeSubscription,
  sendPushToUser,
  pushSubscriptionSchema,
} from './push.service.js';

const mockSubscription = prisma.pushSubscription as unknown as Record<
  string,
  ReturnType<typeof vi.fn>
>;

const subscription = {
  id: 'sub1',
  userId: 'u1',
  tenantId: 't1',
  endpoint: 'https://push.example/endpoint',
  p256dh: 'key',
  auth: 'auth',
};

const input = pushSubscriptionSchema.parse({
  endpoint: 'https://push.example/endpoint',
  keys: { p256dh: 'key', auth: 'auth' },
});

beforeEach(() => vi.clearAllMocks());

describe('saveSubscription', () => {
  it('upserts by userId, replacing any previous endpoint', async () => {
    mockSubscription.upsert.mockResolvedValue(subscription);

    await saveSubscription('u1', 't1', input);

    expect(mockSubscription.upsert.mock.calls[0][0]).toEqual({
      where: { userId: 'u1' },
      update: {
        endpoint: input.endpoint,
        p256dh: 'key',
        auth: 'auth',
        tenantId: 't1',
      },
      create: {
        userId: 'u1',
        tenantId: 't1',
        endpoint: input.endpoint,
        p256dh: 'key',
        auth: 'auth',
      },
    });
  });
});

describe('getSubscription', () => {
  it('looks up by userId', async () => {
    mockSubscription.findUnique.mockResolvedValue(subscription);

    const result = await getSubscription('u1');

    expect(mockSubscription.findUnique).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(result).toEqual(subscription);
  });
});

describe('removeSubscription', () => {
  it('deletes every subscription row for the user', async () => {
    mockSubscription.deleteMany.mockResolvedValue({ count: 1 });

    await removeSubscription('u1');

    expect(mockSubscription.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
  });
});

describe('sendPushToUser', () => {
  const payload = { title: 'New reservation', body: 'RSV-1 was created', data: { id: 'n1' } };

  it('is a no-op when the user has no subscription', async () => {
    mockSubscription.findUnique.mockResolvedValue(null);

    await sendPushToUser('u1', payload);

    expect(webPush.sendNotification).not.toHaveBeenCalled();
  });

  it('sends the JSON-serialised payload to the stored endpoint', async () => {
    mockSubscription.findUnique.mockResolvedValue(subscription);
    (webPush.sendNotification as any).mockResolvedValue({});

    await sendPushToUser('u1', payload);

    expect(webPush.sendNotification).toHaveBeenCalledWith(
      { endpoint: subscription.endpoint, keys: { p256dh: 'key', auth: 'auth' } },
      JSON.stringify(payload)
    );
  });

  it('prunes a gone (410) subscription and rethrows', async () => {
    mockSubscription.findUnique.mockResolvedValue(subscription);
    const gone = Object.assign(new Error('gone'), { statusCode: 410 });
    (webPush.sendNotification as any).mockRejectedValue(gone);
    mockSubscription.deleteMany.mockResolvedValue({ count: 1 });

    await expect(sendPushToUser('u1', payload)).rejects.toThrow('gone');

    expect(mockSubscription.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
  });
});
