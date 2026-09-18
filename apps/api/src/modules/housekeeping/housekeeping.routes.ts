import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { authMiddleware, tenantScope, requirePermission } from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import {
  ErrorResponseSchema,
  IdParamSchema,
  PaginatedResponseSchema,
} from '../../common/openapi-schemas.js';
import {
  assignTask,
  completeTask,
  createTask,
  deleteTask,
  getTask,
  inspectTask,
  listTasks,
  taskCreateSchema,
  taskUpdateSchema,
  updateTask,
  type TaskCreateInput,
  type TaskUpdateInput,
} from './housekeeping.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const taskQuerySchema = paginationSchema
  .extend({
    propertyId: z.string().optional(),
    roomId: z.string().optional(),
    assigneeId: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'inspected', 'skipped']).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    date: z.string().optional(),
  })
  .openapi('TaskQuery');
const TaskCreateInputSchema = taskCreateSchema.openapi('TaskCreateInput');
const TaskUpdateInputSchema = taskUpdateSchema.openapi('TaskUpdateInput');
const AssignTaskInputSchema = z.object({ assigneeId: z.string() }).openapi('AssignTaskInput');
const CompleteTaskInputSchema = z
  .object({
    notes: z.string().optional(),
    issues: z.array(z.string()).optional(),
  })
  .openapi('CompleteTaskInput');
const InspectTaskInputSchema = z
  .object({
    passed: z.boolean(),
    notes: z.string().optional(),
  })
  .openapi('InspectTaskInput');

const TaskItemSchema = z
  .object({
    id: z.string(),
    propertyId: z.string(),
    roomId: z.string(),
    type: z.enum(['cleaning', 'inspection', 'maintenance', 'turndown', 'deep_clean']),
    status: z.enum(['pending', 'in_progress', 'completed', 'inspected', 'skipped', 'verified']),
    priority: z.enum(['low', 'normal', 'high', 'urgent']),
    scheduledAt: z.date().or(z.string()),
    estimatedDuration: z.number().int().optional(),
    notes: z.string().optional(),
    checklist: z.array(z.string()).optional(),
    createdAt: z.date().or(z.string()).optional(),
    updatedAt: z.date().or(z.string()).optional(),
  })
  .openapi('TaskItem');

const TaskResponseSchema = z.object({ data: TaskItemSchema }).openapi('TaskResponse');
const TaskListResponseSchema = PaginatedResponseSchema(TaskItemSchema).openapi('TaskListResponse');

export const housekeepingRouter = Router();

housekeepingRouter.use(authMiddleware, tenantScope);

registry.registerPath({
  method: 'get',
  path: '/',
  tags: ['Housekeeping'],
  description: 'List housekeeping tasks',
  request: {
    query: taskQuerySchema,
  },
  responses: {
    200: {
      description: 'Paginated list of tasks',
      content: { 'application/json': { schema: TaskListResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

housekeepingRouter.get(
  '/',
  requirePermission('housekeeping', 'read'),
  validateQuery(taskQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listTasks(
        req.tenantId,
        req.validatedQuery as {
          page: number;
          pageSize: number;
          propertyId?: string;
          roomId?: string;
          assigneeId?: string;
          status?: string;
          priority?: string;
          date?: string;
        }
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'get',
  path: '/{id}',
  tags: ['Housekeeping'],
  description: 'Get a housekeeping task by ID',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: 'Task details',
      content: { 'application/json': { schema: TaskResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Task not found',
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

registry.registerPath({
  method: 'post',
  path: '/',
  tags: ['Housekeeping'],
  description: 'Create a housekeeping task',
  request: {
    body: {
      description: 'Task payload',
      content: { 'application/json': { schema: TaskCreateInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Task created',
      content: { 'application/json': { schema: TaskResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Room not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

housekeepingRouter.post(
  '/',
  requirePermission('housekeeping', 'create'),
  validateBody(taskCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createTask(req.tenantId, req.validatedBody as TaskCreateInput);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'patch',
  path: '/{id}',
  tags: ['Housekeeping'],
  description: 'Update a housekeeping task',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Task update payload',
      content: { 'application/json': { schema: TaskUpdateInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Task updated',
      content: { 'application/json': { schema: TaskResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Task not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

housekeepingRouter.patch(
  '/:id',
  requirePermission('housekeeping', 'update'),
  validateBody(taskUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateTask(
        req.tenantId,
        req.params.id,
        req.validatedBody as TaskUpdateInput
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/{id}/assign',
  tags: ['Housekeeping'],
  description: 'Assign a task to a user',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Assignee payload',
      content: { 'application/json': { schema: AssignTaskInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Task assigned',
      content: { 'application/json': { schema: TaskResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Task or assignee not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

housekeepingRouter.post(
  '/:id/assign',
  requirePermission('housekeeping', 'update'),
  validateBody(z.object({ assigneeId: z.string() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await assignTask(
        req.tenantId,
        req.params.id,
        (req.validatedBody as { assigneeId: string }).assigneeId
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/{id}/complete',
  tags: ['Housekeeping'],
  description: 'Complete a housekeeping task',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Completion notes',
      content: { 'application/json': { schema: CompleteTaskInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Task completed',
      content: { 'application/json': { schema: TaskResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Task not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Task cannot be completed',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

housekeepingRouter.post(
  '/:id/complete',
  requirePermission('housekeeping', 'update'),
  validateBody(z.object({ notes: z.string().optional(), issues: z.array(z.string()).optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await completeTask(
        req.tenantId,
        req.params.id,
        req.validatedBody as { notes?: string; issues?: string[] }
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/{id}/inspect',
  tags: ['Housekeeping'],
  description: 'Inspect a completed housekeeping task',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Inspection result',
      content: { 'application/json': { schema: InspectTaskInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Task inspected',
      content: { 'application/json': { schema: TaskResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Task not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Task must be completed before inspection',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

housekeepingRouter.post(
  '/:id/inspect',
  requirePermission('housekeeping', 'update'),
  validateBody(z.object({ passed: z.boolean(), notes: z.string().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await inspectTask(
        req.tenantId,
        req.params.id,
        req.validatedBody as { passed: boolean; notes?: string }
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'delete',
  path: '/{id}',
  tags: ['Housekeeping'],
  description: 'Delete a housekeeping task',
  request: {
    params: IdParamSchema,
  },
  responses: {
    204: {
      description: 'Task deleted',
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Task not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

housekeepingRouter.delete(
  '/:id',
  requirePermission('housekeeping', 'delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteTask(req.tenantId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);
