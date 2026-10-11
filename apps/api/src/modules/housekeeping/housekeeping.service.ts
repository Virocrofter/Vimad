/* apps/api/src/modules/housekeeping/housekeeping.service.ts */
import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';

// ─── Schemas ───

export const createTaskSchema = z.object({
  propertyId: z.string(),
  roomId: z.string(),
  type: z
    .enum(['cleaning', 'inspection', 'maintenance', 'turndown', 'deep_clean'])
    .default('cleaning'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  scheduledAt: z.string().optional(),
  estimatedDuration: z.number().int().min(5).max(480).optional(),
  notes: z.string().optional(),
  checklist: z.array(z.string()).default([]),
  assigneeId: z.string().optional(),
});

export const updateTaskSchema = z.object({
  type: z.enum(['cleaning', 'inspection', 'maintenance', 'turndown', 'deep_clean']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  scheduledAt: z.string().optional(),
  estimatedDuration: z.number().int().min(5).max(480).optional(),
  notes: z.string().optional(),
  checklist: z.array(z.string()).optional(),
  assigneeId: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'inspected', 'skipped']).optional(),
});

export const assignTaskSchema = z.object({
  assigneeId: z.string(),
});

export const completeTaskSchema = z.object({
  notes: z.string().optional(),
  issues: z.array(z.string()).optional(),
  actualDuration: z.number().int().optional(),
});

export const inspectTaskSchema = z.object({
  passed: z.boolean(),
  notes: z.string().optional(),
});

export const bulkAssignSchema = z.object({
  taskIds: z.array(z.string()).min(1),
  assigneeId: z.string(),
});

export const listTasksQuerySchema = z.object({
  propertyId: z.string().optional(),
  roomId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  type: z.string().optional(),
  floor: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

// ─── Types ───

type TaskInclude = {
  room: {
    select: {
      id: true;
      number: true;
      floor: true;
      housekeepingStatus: true;
      roomType: { select: { id: true; name: true; code: true } };
    };
  };
  assignee: { select: { id: true; firstName: true; lastName: true; email: true; role: true } };
  inspector: { select: { id: true; firstName: true; lastName: true } };
};

const TASK_INCLUDE: TaskInclude = {
  room: {
    select: {
      id: true,
      number: true,
      floor: true,
      housekeepingStatus: true,
      roomType: { select: { id: true, name: true, code: true } },
    },
  },
  assignee: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
  inspector: { select: { id: true, firstName: true, lastName: true } },
};

// ─── CRUD ───

export async function listTasks(tenantId: string, query: z.infer<typeof listTasksQuerySchema>) {
  const {
    page,
    pageSize,
    propertyId,
    roomId,
    assigneeId,
    status,
    priority,
    type,
    floor,
    dateFrom,
    dateTo,
  } = query;

  const where: Record<string, unknown> = { tenantId };
  if (propertyId) where.propertyId = propertyId;
  if (roomId) where.roomId = roomId;
  if (assigneeId) where.assigneeId = assigneeId;
  if (status) where.status = { in: status.split(',') };
  if (priority) where.priority = priority;
  if (type) where.type = type;
  if (floor) where.room = { floor };
  if (dateFrom || dateTo) {
    where.scheduledAt = {};
    if (dateFrom) (where.scheduledAt as Record<string, Date>).gte = new Date(dateFrom);
    if (dateTo) (where.scheduledAt as Record<string, Date>).lte = new Date(dateTo + 'T23:59:59');
  }

  const [total, tasks] = await Promise.all([
    prisma.housekeepingTask.count({ where }),
    prisma.housekeepingTask.findMany({
      where,
      include: TASK_INCLUDE,
      orderBy: [{ priority: 'desc' }, { scheduledAt: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    data: tasks,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getTask(tenantId: string, id: string) {
  const task = await prisma.housekeepingTask.findFirst({
    where: { id, tenantId },
    include: TASK_INCLUDE,
  });
  if (!task) throw new AppError(404, 'Task not found', 'NOT_FOUND');
  return task;
}

export async function createTask(tenantId: string, input: z.infer<typeof createTaskSchema>) {
  const room = await prisma.room.findFirst({
    where: { id: input.roomId, tenantId },
  });
  if (!room) throw new AppError(404, 'Room not found', 'NOT_FOUND');

  // Default checklist per type
  const defaultChecklists: Record<string, string[]> = {
    cleaning: ['Make bed', 'Clean bathroom', 'Restock towels', 'Vacuum floor', 'Wipe surfaces'],
    deep_clean: [
      'Strip bed',
      'Clean bathroom thoroughly',
      'Dust all surfaces',
      'Clean windows',
      'Shampoo carpet',
      'Check minibar',
    ],
    inspection: ['Verify cleanliness', 'Check amenities', 'Test TV/AC', 'Inspect for damage'],
    maintenance: ['Assess issue', 'Fix or escalate', 'Test functionality', 'Clean up'],
    turndown: ['Turn down bed', 'Replace towels', 'Empty trash', 'Dim lights'],
  };

  const task = await prisma.housekeepingTask.create({
    data: {
      tenantId,
      propertyId: input.propertyId,
      roomId: input.roomId,
      type: input.type,
      priority: input.priority,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : new Date(),
      estimatedDuration: input.estimatedDuration ?? 30,
      notes: input.notes,
      checklist:
        input.checklist.length > 0 ? input.checklist : (defaultChecklists[input.type] ?? []),
      assigneeId: input.assigneeId,
      status: 'pending',
    },
    include: TASK_INCLUDE,
  });

  logger.info(
    { taskId: task.id, roomId: input.roomId, type: input.type },
    'housekeeping task created'
  );
  return task;
}

export async function updateTask(
  tenantId: string,
  id: string,
  input: z.infer<typeof updateTaskSchema>
) {
  const existing = await prisma.housekeepingTask.findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppError(404, 'Task not found', 'NOT_FOUND');

  const task = await prisma.housekeepingTask.update({
    where: { id },
    data: {
      ...(input.type && { type: input.type }),
      ...(input.priority && { priority: input.priority }),
      ...(input.scheduledAt && { scheduledAt: new Date(input.scheduledAt) }),
      ...(input.estimatedDuration && { estimatedDuration: input.estimatedDuration }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.checklist && { checklist: input.checklist }),
      ...(input.assigneeId !== undefined && { assigneeId: input.assigneeId }),
    },
    include: TASK_INCLUDE,
  });

  return task;
}

export async function deleteTask(tenantId: string, id: string) {
  const existing = await prisma.housekeepingTask.findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppError(404, 'Task not found', 'NOT_FOUND');
  await prisma.housekeepingTask.delete({ where: { id } });
}

// ─── Workflow ───

export async function assignTask(tenantId: string, id: string, assigneeId: string) {
  const [task, assignee] = await Promise.all([
    prisma.housekeepingTask.findFirst({ where: { id, tenantId } }),
    prisma.user.findFirst({ where: { id: assigneeId, tenantId, status: 'active' } }),
  ]);

  if (!task) throw new AppError(404, 'Task not found', 'NOT_FOUND');
  if (!assignee) throw new AppError(404, 'Assignee not found', 'NOT_FOUND');

  const updated = await prisma.housekeepingTask.update({
    where: { id },
    data: { assigneeId },
    include: TASK_INCLUDE,
  });

  logger.info(
    { taskId: id, assigneeId, assigneeName: `${assignee.firstName} ${assignee.lastName}` },
    'task assigned'
  );
  return updated;
}

export async function startTask(tenantId: string, id: string) {
  const task = await prisma.housekeepingTask.findFirst({ where: { id, tenantId } });
  if (!task) throw new AppError(404, 'Task not found', 'NOT_FOUND');
  if (task.status !== 'pending') throw new AppError(409, 'Task already started', 'CONFLICT');

  const updated = await prisma.housekeepingTask.update({
    where: { id },
    data: { status: 'in_progress', startedAt: new Date() },
    include: TASK_INCLUDE,
  });

  // Update room status
  await prisma.room.update({
    where: { id: task.roomId },
    data: { housekeepingStatus: 'in_progress' },
  });

  return updated;
}

export async function completeTask(
  tenantId: string,
  id: string,
  input: z.infer<typeof completeTaskSchema>
) {
  const task = await prisma.housekeepingTask.findFirst({ where: { id, tenantId } });
  if (!task) throw new AppError(404, 'Task not found', 'NOT_FOUND');
  if (task.status === 'completed' || task.status === 'inspected') {
    throw new AppError(409, 'Task already completed', 'CONFLICT');
  }

  const now = new Date();
  const startedAt = task.startedAt ?? task.createdAt;
  const actualDuration =
    input.actualDuration ?? Math.round((now.getTime() - startedAt.getTime()) / 60000);

  const [updated] = await prisma.$transaction([
    prisma.housekeepingTask.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: now,
        actualDuration,
        ...(input.notes && { notes: task.notes ? `${task.notes}\n${input.notes}` : input.notes }),
      },
      include: TASK_INCLUDE,
    }),
    // Room becomes dirty until inspected
    prisma.room.update({
      where: { id: task.roomId },
      data: { housekeepingStatus: 'dirty' },
    }),
  ]);

  logger.info(
    { taskId: id, actualDuration, roomId: task.roomId },
    'task completed, room marked dirty'
  );
  return updated;
}

export async function inspectTask(
  tenantId: string,
  id: string,
  inspectorId: string,
  input: z.infer<typeof inspectTaskSchema>
) {
  const task = await prisma.housekeepingTask.findFirst({ where: { id, tenantId } });
  if (!task) throw new AppError(404, 'Task not found', 'NOT_FOUND');
  if (task.status !== 'completed')
    throw new AppError(409, 'Task must be completed before inspection', 'CONFLICT');

  const newStatus = input.passed ? 'inspected' : 'pending';
  const roomStatus = input.passed ? 'clean' : 'dirty';

  const [updated] = await prisma.$transaction([
    prisma.housekeepingTask.update({
      where: { id },
      data: {
        status: newStatus,
        verifiedAt: input.passed ? new Date() : null,
        inspectorId: input.passed ? inspectorId : null,
        ...(input.notes && {
          notes: task.notes
            ? `${task.notes}\nInspection: ${input.notes}`
            : `Inspection: ${input.notes}`,
        }),
      },
      include: TASK_INCLUDE,
    }),
    prisma.room.update({
      where: { id: task.roomId },
      data: { housekeepingStatus: roomStatus },
    }),
  ]);

  logger.info({ taskId: id, passed: input.passed, roomId: task.roomId }, 'task inspected');
  return updated;
}

export async function skipTask(tenantId: string, id: string, reason?: string) {
  const task = await prisma.housekeepingTask.findFirst({ where: { id, tenantId } });
  if (!task) throw new AppError(404, 'Task not found', 'NOT_FOUND');

  const updated = await prisma.housekeepingTask.update({
    where: { id },
    data: {
      status: 'skipped',
      ...(reason && {
        notes: task.notes ? `${task.notes}\nSkipped: ${reason}` : `Skipped: ${reason}`,
      }),
    },
    include: TASK_INCLUDE,
  });

  return updated;
}

// ─── Bulk Operations ───

export async function bulkAssign(tenantId: string, input: z.infer<typeof bulkAssignSchema>) {
  const assignee = await prisma.user.findFirst({
    where: { id: input.assigneeId, tenantId, status: 'active' },
  });
  if (!assignee) throw new AppError(404, 'Assignee not found', 'NOT_FOUND');

  const result = await prisma.housekeepingTask.updateMany({
    where: { id: { in: input.taskIds }, tenantId },
    data: { assigneeId: input.assigneeId },
  });

  logger.info({ taskCount: result.count, assigneeId: input.assigneeId }, 'bulk assign completed');
  return { updated: result.count };
}

// ─── Stats ───

export async function getStats(tenantId: string, propertyId?: string, date?: string) {
  const targetDate = date ? new Date(date) : new Date();
  const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
  const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

  const baseWhere: Record<string, unknown> = {
    tenantId,
    ...(propertyId && { propertyId }),
  };

  const todayWhere = { ...baseWhere, scheduledAt: { gte: dayStart, lte: dayEnd } };

  const [
    totalToday,
    pendingToday,
    inProgressToday,
    completedToday,
    inspectedToday,
    overdueTasks,
    totalStaff,
    avgDuration,
    tasksByPriority,
    tasksByType,
    recentCompleted,
  ] = await Promise.all([
    prisma.housekeepingTask.count({ where: todayWhere }),
    prisma.housekeepingTask.count({ where: { ...todayWhere, status: 'pending' } }),
    prisma.housekeepingTask.count({ where: { ...todayWhere, status: 'in_progress' } }),
    prisma.housekeepingTask.count({ where: { ...todayWhere, status: 'completed' } }),
    prisma.housekeepingTask.count({ where: { ...todayWhere, status: 'inspected' } }),
    prisma.housekeepingTask.count({
      where: {
        ...baseWhere,
        status: { in: ['pending', 'in_progress'] },
        scheduledAt: { lt: dayStart },
      },
    }),
    prisma.user.count({
      where: {
        tenantId,
        status: 'active',
        role: { in: ['staff', 'housekeeper', 'manager', 'admin', 'owner'] },
      },
    }),
    prisma.housekeepingTask.aggregate({
      where: { ...baseWhere, actualDuration: { not: null } },
      _avg: { actualDuration: true },
    }),
    prisma.housekeepingTask.groupBy({
      by: ['priority'],
      where: todayWhere,
      _count: { priority: true },
    }),
    prisma.housekeepingTask.groupBy({
      by: ['type'],
      where: todayWhere,
      _count: { type: true },
    }),
    prisma.housekeepingTask.findMany({
      where: { ...baseWhere, status: { in: ['completed', 'inspected'] } },
      orderBy: { completedAt: 'desc' },
      take: 10,
      include: {
        room: { select: { number: true } },
        assignee: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  const completionRate =
    totalToday > 0 ? Math.round(((completedToday + inspectedToday) / totalToday) * 100) : 0;

  return {
    today: {
      total: totalToday,
      pending: pendingToday,
      inProgress: inProgressToday,
      completed: completedToday,
      inspected: inspectedToday,
      completionRate,
    },
    overdue: overdueTasks,
    staffOnDuty: totalStaff,
    avgCleaningDuration: Math.round(avgDuration._avg.actualDuration ?? 0),
    byPriority: tasksByPriority.map((p) => ({ priority: p.priority, count: p._count.priority })),
    byType: tasksByType.map((t) => ({ type: t.type, count: t._count.type })),
    recentCompleted,
  };
}

// ─── Staff List ───

export async function getStaff(tenantId: string) {
  const staff = await prisma.user.findMany({
    where: {
      tenantId,
      status: 'active',
      role: { in: ['staff', 'housekeeper', 'manager', 'admin', 'owner'] },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
    orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
  });

  // Get today's task count per staff
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const taskCounts = await prisma.housekeepingTask.groupBy({
    by: ['assigneeId'],
    where: {
      tenantId,
      assigneeId: { in: staff.map((s) => s.id) },
      scheduledAt: { gte: todayStart },
    },
    _count: { assigneeId: true },
  });

  const countMap = new Map(taskCounts.map((t) => [t.assigneeId, t._count.assigneeId]));

  return staff.map((s) => ({
    ...s,
    todayTaskCount: countMap.get(s.id) ?? 0,
  }));
}

// ─── Auto-generate on checkout ───

export async function autoGenerateCheckoutTask(
  tenantId: string,
  propertyId: string,
  roomId: string,
  reservationId: string
) {
  // Check if there's already a pending cleaning task for this room
  const existing = await prisma.housekeepingTask.findFirst({
    where: {
      tenantId,
      roomId,
      type: 'cleaning',
      status: { in: ['pending', 'in_progress'] },
    },
  });

  if (existing) {
    logger.info({ roomId, existingTaskId: existing.id }, 'cleaning task already exists for room');
    return existing;
  }

  const task = await prisma.housekeepingTask.create({
    data: {
      tenantId,
      propertyId,
      roomId,
      type: 'cleaning',
      priority: 'high', // Checkout cleans are high priority
      scheduledAt: new Date(),
      estimatedDuration: 45,
      notes: `Auto-generated from checkout: ${reservationId}`,
      checklist: [
        'Strip bed',
        'Clean bathroom',
        'Restock amenities',
        'Vacuum',
        'Wipe surfaces',
        'Check for damage',
      ],
      status: 'pending',
    },
  });

  // Mark room as dirty
  await prisma.room.update({
    where: { id: roomId },
    data: { housekeepingStatus: 'dirty' },
  });

  logger.info({ taskId: task.id, roomId, reservationId }, 'auto-generated checkout cleaning task');
  return task;
}
