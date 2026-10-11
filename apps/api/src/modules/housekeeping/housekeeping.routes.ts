/* apps/api/src/modules/housekeeping/housekeeping.routes.ts */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { authMiddleware, tenantScope, requirePermission } from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { ErrorResponseSchema } from '../../common/openapi-schemas.js';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  startTask,
  completeTask,
  inspectTask,
  skipTask,
  bulkAssign,
  getStats,
  getStaff,
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  completeTaskSchema,
  inspectTaskSchema,
  bulkAssignSchema,
  listTasksQuerySchema,
} from './housekeeping.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// ─── Schemas for OpenAPI ───

const TaskSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    propertyId: z.string(),
    roomId: z.string(),
    type: z.string(),
    priority: z.string(),
    status: z.string(),
    scheduledAt: z.string(),
    startedAt: z.string().nullable(),
    completedAt: z.string().nullable(),
    verifiedAt: z.string().nullable(),
    estimatedDuration: z.number().nullable(),
    actualDuration: z.number().nullable(),
    notes: z.string().nullable(),
    checklist: z.array(z.string()),
    assigneeId: z.string().nullable(),
    inspectorId: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    room: z
      .object({
        id: z.string(),
        number: z.string(),
        floor: z.string().nullable(),
        housekeepingStatus: z.string(),
        roomType: z.object({ id: z.string(), name: z.string(), code: z.string() }),
      })
      .optional(),
    assignee: z
      .object({
        id: z.string(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        email: z.string(),
        role: z.string(),
      })
      .nullable()
      .optional(),
    inspector: z
      .object({
        id: z.string(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
      })
      .nullable()
      .optional(),
  })
  .openapi('HousekeepingTask');

const TaskListResponseSchema = z
  .object({
    data: z.array(TaskSchema),
    meta: z.object({
      page: z.number(),
      pageSize: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi('HousekeepingTaskListResponse');

const TaskResponseSchema = z
  .object({
    data: TaskSchema,
  })
  .openapi('HousekeepingTaskResponse');

const StatsResponseSchema = z
  .object({
    data: z.object({
      today: z.object({
        total: z.number(),
        pending: z.number(),
        inProgress: z.number(),
        completed: z.number(),
        inspected: z.number(),
        completionRate: z.number(),
      }),
      overdue: z.number(),
      staffOnDuty: z.number(),
      avgCleaningDuration: z.number(),
      byPriority: z.array(z.object({ priority: z.string(), count: z.number() })),
      byType: z.array(z.object({ type: z.string(), count: z.number() })),
      recentCompleted: z.array(
        z.object({
          id: z.string(),
          room: z.object({ number: z.string() }),
          assignee: z
            .object({ firstName: z.string().nullable(), lastName: z.string().nullable() })
            .nullable(),
          completedAt: z.string().nullable(),
        })
      ),
    }),
  })
  .openapi('HousekeepingStatsResponse');

const StaffResponseSchema = z
  .object({
    data: z.array(
      z.object({
        id: z.string(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        email: z.string(),
        role: z.string(),
        todayTaskCount: z.number(),
      })
    ),
  })
  .openapi('HousekeepingStaffResponse');

// ─── Router ───

export const housekeepingRouter = Router();

housekeepingRouter.use(authMiddleware, tenantScope);

/* ─── GET /housekeeping ─── */
registry.registerPath({
  method: 'get',
  path: '/housekeeping',
  tags: ['Housekeeping'],
  description: 'List housekeeping tasks with filters',
  responses: {
    200: {
      description: 'Task list',
      content: { 'application/json': { schema: TaskListResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

housekeepingRouter.get(
  '/',
  requirePermission('housekeeping', 'read'),
  validateQuery(listTasksQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listTasks(
        req.tenantId,
        req.validatedQuery as z.infer<typeof listTasksQuerySchema>
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/* ─── GET /housekeeping/stats ─── */
registry.registerPath({
  method: 'get',
  path: '/housekeeping/stats',
  tags: ['Housekeeping'],
  description: 'Get housekeeping dashboard stats',
  responses: {
    200: { description: 'Stats', content: { 'application/json': { schema: StatsResponseSchema } } },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

housekeepingRouter.get(
  '/stats',
  requirePermission('housekeeping', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getStats(
        req.tenantId,
        req.query.propertyId as string,
        req.query.date as string
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── GET /housekeeping/staff ─── */
registry.registerPath({
  method: 'get',
  path: '/housekeeping/staff',
  tags: ['Housekeeping'],
  description: 'Get available staff for assignment',
  responses: {
    200: {
      description: 'Staff list',
      content: { 'application/json': { schema: StaffResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

housekeepingRouter.get(
  '/staff',
  requirePermission('housekeeping', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getStaff(req.tenantId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /housekeeping/bulk-assign ─── */
registry.registerPath({
  method: 'post',
  path: '/housekeeping/bulk-assign',
  tags: ['Housekeeping'],
  description: 'Bulk assign tasks to a staff member',
  responses: {
    200: { description: 'Bulk assign result' },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

housekeepingRouter.post(
  '/bulk-assign',
  requirePermission('housekeeping', 'assign'),
  validateBody(bulkAssignSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await bulkAssign(
        req.tenantId,
        req.validatedBody as z.infer<typeof bulkAssignSchema>
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── GET /housekeeping/:id ─── */
registry.registerPath({
  method: 'get',
  path: '/housekeeping/{id}',
  tags: ['Housekeeping'],
  description: 'Get a single task',
  responses: {
    200: { description: 'Task', content: { 'application/json': { schema: TaskResponseSchema } } },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

housekeepingRouter.get(
  '/:id',
  requirePermission('housekeeping', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getTask(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /housekeeping ─── */
registry.registerPath({
  method: 'post',
  path: '/housekeeping',
  tags: ['Housekeeping'],
  description: 'Create a new task',
  responses: {
    201: {
      description: 'Created',
      content: { 'application/json': { schema: TaskResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

housekeepingRouter.post(
  '/',
  requirePermission('housekeeping', 'assign'),
  validateBody(createTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createTask(
        req.tenantId,
        req.validatedBody as z.infer<typeof createTaskSchema>
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── PATCH /housekeeping/:id ─── */
housekeepingRouter.patch(
  '/:id',
  requirePermission('housekeeping', 'update'),
  validateBody(updateTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateTask(
        req.tenantId,
        req.params.id,
        req.validatedBody as z.infer<typeof updateTaskSchema>
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── DELETE /housekeeping/:id ─── */
housekeepingRouter.delete(
  '/:id',
  requirePermission('housekeeping', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteTask(req.tenantId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /housekeeping/:id/assign ─── */
housekeepingRouter.post(
  '/:id/assign',
  requirePermission('housekeeping', 'assign'),
  validateBody(assignTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await assignTask(
        req.tenantId,
        req.params.id,
        (req.validatedBody as z.infer<typeof assignTaskSchema>).assigneeId
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /housekeeping/:id/start ─── */
housekeepingRouter.post(
  '/:id/start',
  requirePermission('housekeeping', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await startTask(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /housekeeping/:id/complete ─── */
housekeepingRouter.post(
  '/:id/complete',
  requirePermission('housekeeping', 'update'),
  validateBody(completeTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await completeTask(
        req.tenantId,
        req.params.id,
        req.validatedBody as z.infer<typeof completeTaskSchema>
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /housekeeping/:id/inspect ─── */
housekeepingRouter.post(
  '/:id/inspect',
  requirePermission('housekeeping', 'update'),
  validateBody(inspectTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as any;
      const result = await inspectTask(
        req.tenantId,
        req.params.id,
        authReq.auth.user.id,
        req.validatedBody as z.infer<typeof inspectTaskSchema>
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /housekeeping/:id/skip ─── */
housekeepingRouter.post(
  '/:id/skip',
  requirePermission('housekeeping', 'update'),
  validateBody(z.object({ reason: z.string().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await skipTask(
        req.tenantId,
        req.params.id,
        (req.validatedBody as { reason?: string }).reason
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
