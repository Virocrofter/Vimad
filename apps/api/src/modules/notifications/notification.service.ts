import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginate, paginationSchema, skipTake } from '../../common/pagination.js';

export const notificationCreateSchema = z.object({
  userId: z.string(),
  type: z.string().min(1),
  category: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  title: z.string().min(1),
  message: z.string().min(1),
  actionUrl: z.string().optional(),
  actionLabel: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  deliveredVia: z.array(z.string()).default([]),
});

export const notificationUpdateSchema = z.object({
  read: z.boolean().optional(),
});

export const notificationBroadcastSchema = notificationCreateSchema.omit({ userId: true });

export type NotificationCreateInput = z.infer<typeof notificationCreateSchema>;
export type NotificationUpdateInput = z.infer<typeof notificationUpdateSchema>;

// Socket emits disabled to break circular dependency: socket.js → auth.service.ts → prisma.js
function emitToUser(_userId: string, _event: string, _payload: unknown): void {
  // no-op
}
function emitToTenant(_tenantId: string, _event: string, _payload: unknown): void {
  // no-op
}

// Lazy-load push service so a VAPID init failure at module load can never
// block the request pipeline.
async function sendPushSafely(
  userId: string,
  payload: {
    title: string;
    body: string;
    data: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const { sendPushToUser } = await import('../push/push.service.js');
    await sendPushToUser(userId, payload);
  } catch {
    // Push is best-effort; never block the request path.
  }
}

export async function listNotifications(
  userId: string,
  tenantId: string,
  query: { page: number; pageSize: number; unreadOnly?: boolean }
) {
  const pagination = paginationSchema.parse(query);
  const where: Record<string, unknown> = { userId, tenantId };

  if (query.unreadOnly) where.read = false;

  const [total, items] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...skipTake(pagination),
    }),
  ]);

  return paginate(items, total, pagination);
}

export async function getNotification(userId: string, tenantId: string, id: string) {
  const notification = await prisma.notification.findFirst({
    where: { id, userId, tenantId },
  });
  if (!notification) {
    throw new AppError(404, 'Notification not found', 'NOT_FOUND');
  }
  return notification;
}

export async function createNotification(tenantId: string, input: NotificationCreateInput) {
  const user = await prisma.user.findFirst({
    where: { id: input.userId, tenantId, status: 'active' },
  });
  if (!user) {
    throw new AppError(404, 'User not found or inactive', 'NOT_FOUND');
  }

  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      tenantId,
      type: input.type,
      category: input.category,
      title: input.title,
      message: input.message,
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel,
      entityType: input.entityType,
      entityId: input.entityId,
      deliveredVia: input.deliveredVia,
      read: false,
    },
  });

  emitToUser(input.userId, 'notification:new', notification);

  void sendPushSafely(input.userId, {
    title: input.title,
    body: input.message,
    data: {
      notificationId: notification.id,
      category: input.category,
      actionUrl: input.actionUrl,
      entityType: input.entityType,
      entityId: input.entityId,
    },
  });

  return notification;
}

export async function createBroadcastNotification(
  tenantId: string,
  input: z.infer<typeof notificationBroadcastSchema>
) {
  const users = await prisma.user.findMany({
    where: { tenantId, status: 'active' },
    select: { id: true },
  });

  const notifications = await prisma.$transaction(
    users.map((user) =>
      prisma.notification.create({
        data: {
          userId: user.id,
          tenantId,
          type: input.type,
          category: input.category,
          title: input.title,
          message: input.message,
          actionUrl: input.actionUrl,
          actionLabel: input.actionLabel,
          entityType: input.entityType,
          entityId: input.entityId,
          deliveredVia: input.deliveredVia,
          read: false,
        },
      })
    )
  );

  emitToTenant(tenantId, 'notification:broadcast', { tenantId, ...input });

  return notifications;
}

export async function updateNotification(
  userId: string,
  tenantId: string,
  id: string,
  input: NotificationUpdateInput
) {
  const notification = await getNotification(userId, tenantId, id);

  const updated = await prisma.notification.update({
    where: { id },
    data: {
      read: input.read ?? notification.read,
      readAt: input.read && !notification.read ? new Date() : notification.readAt,
    },
  });

  emitToUser(userId, 'notification:updated', updated);

  return updated;
}

export async function markAllAsRead(userId: string, tenantId: string) {
  await prisma.notification.updateMany({
    where: { userId, tenantId, read: false },
    data: { read: true, readAt: new Date() },
  });

  emitToUser(userId, 'notifications:all_read', { userId, tenantId });

  return { updated: true };
}

export async function deleteNotification(userId: string, tenantId: string, id: string) {
  await getNotification(userId, tenantId, id);
  await prisma.notification.delete({ where: { id } });

  emitToUser(userId, 'notification:deleted', { id });

  return { id };
}

export async function getUnreadCount(userId: string, tenantId: string) {
  const count = await prisma.notification.count({
    where: { userId, tenantId, read: false },
  });
  return { count };
}
