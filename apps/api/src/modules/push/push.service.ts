import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { env } from '../../common/env.js';
import webPush from 'web-push';

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

export function getVapidPublicKey(): string | null {
  return env.VAPID_PUBLIC_KEY ?? null;
}

function configureWebPush() {
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    webPush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  }
}

export async function saveSubscription(
  userId: string,
  tenantId: string,
  input: PushSubscriptionInput
) {
  configureWebPush();

  const subscription = await prisma.pushSubscription.upsert({
    where: { userId },
    update: {
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      tenantId,
    },
    create: {
      userId,
      tenantId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
    },
  });

  return subscription;
}

export async function getSubscription(userId: string) {
  return prisma.pushSubscription.findUnique({
    where: { userId },
  });
}

export async function removeSubscription(userId: string) {
  await prisma.pushSubscription.deleteMany({
    where: { userId },
  });
}

export async function sendPushToUser(
  userId: string,
  payload: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }
) {
  configureWebPush();

  const subscription = await getSubscription(userId);
  if (!subscription) return;

  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
  } catch (err) {
    // If push fails (e.g., subscription expired), remove it
    if ((err as any)?.statusCode === 410) {
      await removeSubscription(userId);
    }
    throw err;
  }
}
