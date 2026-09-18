import { prisma } from '../../common/prisma.js';
import { logger } from '../../common/logger.js';
import webpush from 'web-push';
import { env } from '../../common/env.js';

// Configure web-push with VAPID keys
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

export async function subscribeToPush(
  userId: string,
  tenantId: string,
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }
) {
  return prisma.pushSubscription.upsert({
    where: { userId },
    update: {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    create: {
      userId,
      tenantId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

export async function unsubscribeFromPush(userId: string) {
  return prisma.pushSubscription.deleteMany({
    where: { userId },
  });
}

export async function sendPushToUser(
  userId: string,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, unknown>;
  }
) {
  const subscription = await prisma.pushSubscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    logger.warn({ userId }, 'No push subscription found for user');
    return { sent: false, reason: 'no_subscription' };
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
    return { sent: true };
  } catch (err) {
    logger.error({ err, userId }, 'Failed to send push notification');

    // If subscription is invalid (410 Gone), remove it
    if ((err as { statusCode?: number }).statusCode === 410) {
      await unsubscribeFromPush(userId);
      return { sent: false, reason: 'subscription_expired' };
    }

    return { sent: false, reason: 'send_failed' };
  }
}

export async function sendPushToTenant(
  tenantId: string,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, unknown>;
  }
) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { tenantId },
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload)
      )
    )
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  logger.info({ tenantId, sent, failed }, 'Push notifications sent to tenant');

  return { sent, failed };
}
