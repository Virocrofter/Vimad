/* apps/api/src/modules/tasks/tasks.routes.ts — T1 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { extendZodWithOpenApi, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  authMiddleware,
  requirePermission,
  tenantScope,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody, validateQuery, validateParams } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import { ErrorResponseSchema } from '../../common/openapi-schemas.js';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  completeTask,
  cancelTask,
  taskSummary,
  listRules,
  createRule,
  updateRule,
  deleteRule,
  evaluateRule,
} from './tasks.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const departmentEnum = z.enum([
  'housekeeping',
  'front_desk',
  'maintenance',
  'security',
  'management',
  'concierge',
]);
const priorityEnum = z.enum(['low', 'normal', 'high', 'urgent']);

const conditionSchema = z.object({
  field: z.string(),
  op: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'contains', 'truthy', 'exists']),
  value: z.unknown().optional(),
});

const ruleTriggerSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('schedule'), everyMinutes: z.number().int().min(1) }),
  z.object({ type: z.literal('manual') }),
]);

const ruleActionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: priorityEnum.optional(),
  slaMinutes: z.number().int().min(1).optional(),
  dedupe: z.enum(['open', 'daily', 'once']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const listQuerySchema = paginationSchema.extend({
  status: z.string().optional(),
  department: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().optional(),
  ruleId: z.string().optional(),
  ruleKey: z.string().optional(),
  slaBreached: z.enum(['true', 'false']).optional(),
  openOnly: z.enum(['true', 'false']).optional(),
  q: z.string().optional(),
  dueBefore: z.string().optional(),
});

const createTaskSchema = z.object({
  propertyId: z.string().min(1),
  department: departmentEnum,
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  priority: priorityEnum.optional(),
  roomId: z.string().optional(),
  guestId: z.string().optional(),
  reservationId: z.string().optional(),
  assigneeId: z.string().optional(),
  slaMinutes: z.number().int().min(1).max(10080).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const updateTaskSchema = z.object({
  department: departmentEnum.optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  priority: priorityEnum.optional(),
  assigneeId: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  slaMinutes: z.number().int().min(1).max(10080).nullable().optional(),
  status: z.enum(['open', 'in_progress']).optional(),
});

const createRuleSchema = z.object({
  key: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  department: departmentEnum,
  description: z.string().optional(),
  propertyId: z.string().optional(),
  trigger: ruleTriggerSchema,
  conditions: z.object({ all: z.array(conditionSchema).optional() }).optional(),
  action: ruleActionSchema,
  config: z.record(z.string(), z.unknown()).optional(),
});

const idParamSchema = z.object({ id: z.string() });

export const tasksRouter = Router();
tasksRouter.use(authMiddleware, tenantScope);

/* ─── GET /tasks ─── */
registry.registerPath({
  method: 'get',
  path: '/tasks',
  tags: ['Tasks'],
  description: 'List tasks (filters: status, department, priority, rule, SLA breach)',
  responses: {
    200: { description: 'Paginated task list' },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

tasksRouter.get(
  '/',
  requirePermission('task', 'read'),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as AuthenticatedRequest).auth.tenantId;
      res.json(await listTasks(tenantId, req.validatedQuery as Record<string, string>));
    } catch (err) {
      next(err);
    }
  }
);

/* ─── GET /tasks/summary ─── */
tasksRouter.get(
  '/summary',
  requirePermission('task', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as AuthenticatedRequest).auth.tenantId;
      res.json({ data: await taskSummary(tenantId) });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /tasks (idempotency-key header supported) ─── */
registry.registerPath({
  method: 'post',
  path: '/tasks',
  tags: ['Tasks'],
  description: 'Create a manual task',
  responses: {
    201: { description: 'Task created' },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

tasksRouter.post(
  '/',
  requirePermission('task', 'create'),
  validateBody(createTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const task = await createTask(
        auth.tenantId,
        req.validatedBody as Parameters<typeof createTask>[1]
      );
      res.status(201).json({ data: task });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── GET /tasks/:id ─── */
tasksRouter.get(
  '/:id',
  requirePermission('task', 'read'),
  validateParams(idParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as AuthenticatedRequest).auth.tenantId;
      res.json({ data: await getTask(tenantId, req.params.id) });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── PATCH /tasks/:id ─── */
tasksRouter.patch(
  '/:id',
  requirePermission('task', 'update'),
  validateParams(idParamSchema),
  validateBody(updateTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as AuthenticatedRequest).auth.tenantId;
      res.json({
        data: await updateTask(
          tenantId,
          req.params.id,
          req.validatedBody as Parameters<typeof updateTask>[2]
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /tasks/:id/complete ─── */
tasksRouter.post(
  '/:id/complete',
  requirePermission('task', 'update'),
  validateParams(idParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      res.json({ data: await completeTask(auth.tenantId, req.params.id, auth.userId) });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /tasks/:id/cancel ─── */
tasksRouter.post(
  '/:id/cancel',
  requirePermission('task', 'update'),
  validateParams(idParamSchema),
  validateBody(z.object({ reason: z.string().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as AuthenticatedRequest).auth.tenantId;
      res.json({
        data: await cancelTask(
          tenantId,
          req.params.id,
          (req.validatedBody as { reason?: string }).reason
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── GET /tasks/rules/list ─── */
tasksRouter.get(
  '/rules/list',
  requirePermission('task_rule', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as AuthenticatedRequest).auth.tenantId;
      res.json({ data: await listRules(tenantId) });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /tasks/rules ─── */
tasksRouter.post(
  '/rules',
  requirePermission('task_rule', 'manage'),
  validateBody(createRuleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as AuthenticatedRequest).auth.tenantId;
      const rule = await createRule(
        tenantId,
        req.validatedBody as Parameters<typeof createRule>[1]
      );
      res.status(201).json({ data: rule });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── PATCH /tasks/rules/:id ─── */
tasksRouter.patch(
  '/rules/:id',
  requirePermission('task_rule', 'manage'),
  validateParams(idParamSchema),
  validateBody(
    z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
      trigger: ruleTriggerSchema.optional(),
      conditions: z.object({ all: z.array(conditionSchema).optional() }).optional(),
      action: ruleActionSchema.optional(),
      config: z.record(z.string(), z.unknown()).optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as AuthenticatedRequest).auth.tenantId;
      res.json({
        data: await updateRule(
          tenantId,
          req.params.id,
          req.validatedBody as Parameters<typeof updateRule>[2]
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── DELETE /tasks/rules/:id ─── */
tasksRouter.delete(
  '/rules/:id',
  requirePermission('task_rule', 'manage'),
  validateParams(idParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as AuthenticatedRequest).auth.tenantId;
      res.json({ data: await deleteRule(tenantId, req.params.id) });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /tasks/rules/:id/run-now ─── */
tasksRouter.post(
  '/rules/:id/run-now',
  requirePermission('task_rule', 'manage'),
  validateParams(idParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = await evaluateRule(req.params.id);
      res.json({ data: { created } });
    } catch (err) {
      next(err);
    }
  }
);
