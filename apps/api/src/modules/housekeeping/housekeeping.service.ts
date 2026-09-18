import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginate, paginationSchema, skipTake } from '../../common/pagination.js';

export const taskCreateSchema = z.object({
  propertyId: z.string(),
  roomId: z.string(),
  type: z.enum(['cleaning', 'inspection', 'maintenance', 'turndown', 'deep_clean']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  scheduledAt: z.coerce.date(),
  estimatedDuration: z.number().int().min(5).optional(),
  notes: z.string().optional(),
  checklist: z.array(z.string()).optional(),
});

export const taskUpdateSchema = taskCreateSchema.partial().omit({ propertyId: true, roomId: true });

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

export async function listTasks(
  tenantId: string,
  query: {
    page: number;
    pageSize: number;
    propertyId?: string;
    roomId?: string;
    assigneeId?: string;
    status?: string;
    priority?: string;
    date?: string;
  }
) {
  const pagination = paginationSchema.parse(query);
  const where: Record<string, unknown> = { tenantId };

  if (query.propertyId) where.propertyId = query.propertyId;
  if (query.roomId) where.roomId = query.roomId;
  if (query.assigneeId) where.assigneeId = query.assigneeId;
  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.date) {
    const date = new Date(query.date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    where.scheduledAt = { gte: date, lt: nextDay };
  }

  const [total, items] = await Promise.all([
    prisma.housekeepingTask.count({ where }),
    prisma.housekeepingTask.findMany({
      where,
      include: {
        room: { select: { id: true, number: true, floor: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
        property: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { scheduledAt: 'asc' }],
      ...skipTake(pagination),
    }),
  ]);

  return paginate(items, total, pagination);
}

export async function getTask(tenantId: string, id: string) {
  const task = await prisma.housekeepingTask.findFirst({
    where: { id, tenantId },
    include: {
      room: { select: { id: true, number: true, floor: true, status: true } },
      assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
      property: { select: { id: true, name: true } },
      inspector: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!task) {
    throw new AppError(404, 'Housekeeping task not found', 'NOT_FOUND');
  }
  return task;
}

export async function createTask(tenantId: string, input: TaskCreateInput) {
  const room = await prisma.room.findFirst({
    where: { id: input.roomId, tenantId, propertyId: input.propertyId },
  });
  if (!room) {
    throw new AppError(404, 'Room not found for this property', 'NOT_FOUND');
  }

  return prisma.housekeepingTask.create({
    data: {
      tenantId,
      propertyId: input.propertyId,
      roomId: input.roomId,
      type: input.type,
      priority: input.priority,
      scheduledAt: input.scheduledAt,
      estimatedDuration: input.estimatedDuration,
      notes: input.notes,
      checklist: input.checklist ?? [],
      status: 'pending',
    },
    include: {
      room: { select: { id: true, number: true } },
      property: { select: { id: true, name: true } },
    },
  });
}

export async function updateTask(tenantId: string, id: string, input: TaskUpdateInput) {
  await getTask(tenantId, id);
  return prisma.housekeepingTask.update({
    where: { id },
    data: input,
  });
}

export async function assignTask(tenantId: string, id: string, assigneeId: string) {
  await getTask(tenantId, id);

  const assignee = await prisma.user.findFirst({
    where: { id: assigneeId, tenantId, status: 'active' },
  });
  if (!assignee) {
    throw new AppError(404, 'Assignee not found or inactive', 'NOT_FOUND');
  }

  return prisma.housekeepingTask.update({
    where: { id },
    data: {
      assigneeId,
      status: 'in_progress',
      startedAt: new Date(),
    },
    include: {
      room: true,
      assignee: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function completeTask(
  tenantId: string,
  id: string,
  input: { notes?: string; issues?: string[] }
) {
  const task = await getTask(tenantId, id);

  if (task.status !== 'in_progress' && task.status !== 'pending') {
    throw new AppError(409, 'Task must be in progress or pending to complete', 'CONFLICT');
  }

  return prisma.housekeepingTask.update({
    where: { id },
    data: {
      status: 'completed',
      completedAt: new Date(),
      notes: input.notes,
    },
    include: {
      room: true,
      assignee: true,
    },
  });
}

export async function inspectTask(
  tenantId: string,
  id: string,
  input: { passed: boolean; notes?: string }
) {
  const task = await getTask(tenantId, id);

  if (task.status !== 'completed') {
    throw new AppError(409, 'Task must be completed before inspection', 'CONFLICT');
  }

  const result = await prisma.housekeepingTask.update({
    where: { id },
    data: {
      status: input.passed ? 'verified' : 'pending',
      notes: input.notes ?? task.notes,
      verifiedAt: new Date(),
    },
    include: {
      room: true,
      assignee: true,
    },
  });

  if (input.passed && task.type === 'cleaning') {
    await prisma.room.update({
      where: { id: task.roomId },
      data: { housekeepingStatus: 'ready', status: 'clean' },
    });
  }

  return result;
}

export async function deleteTask(tenantId: string, id: string) {
  await getTask(tenantId, id);
  return prisma.housekeepingTask.delete({ where: { id } });
}
