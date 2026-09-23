import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  authMiddleware,
  tenantScope,
  requirePermission,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody } from '../../common/validate.js';
import { ErrorResponseSchema, IdParamSchema } from '../../common/openapi-schemas.js';
import {
  getAuditStatus,
  runNightAudit,
  rollbackNightAudit,
  getAuditHistory,
  generateAuditReport,
  nightAuditSchema,
} from './night-audit.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const NightAuditInputSchema = nightAuditSchema.openapi('NightAuditInput');

const AuditStatusSchema = z
  .object({
    data: z.object({
      lastAuditDate: z.date().or(z.string()).nullable(),
      lastAuditStatus: z.string().nullable(),
      isDayClosed: z.boolean(),
      pendingCheckouts: z.number().int(),
      unbalancedFolios: z.number().int(),
      canRunAudit: z.boolean(),
    }),
  })
  .openapi('AuditStatusResponse');

const AuditItemSchema = z
  .object({
    id: z.string(),
    propertyId: z.string(),
    auditDate: z.date().or(z.string()),
    status: z.enum(['in_progress', 'completed', 'failed', 'rolled_back']),
    runBy: z.string(),
    completedAt: z.date().or(z.string()).optional(),
    results: z.record(z.string(), z.unknown()).optional(),
    createdAt: z.date().or(z.string()).optional(),
    updatedAt: z.date().or(z.string()).optional(),
  })
  .openapi('AuditItem');

const AuditResponseSchema = z.object({ data: AuditItemSchema }).openapi('AuditResponse');
const AuditHistoryResponseSchema = z
  .object({ data: z.array(AuditItemSchema) })
  .openapi('AuditHistoryResponse');

const AuditReportResponseSchema = z
  .object({
    data: z.object({
      audit: AuditItemSchema,
      summary: z.record(z.string(), z.unknown()).optional(),
      generatedAt: z.string(),
    }),
  })
  .openapi('AuditReportResponse');

export const nightAuditRouter = Router();

nightAuditRouter.use(authMiddleware, tenantScope);

registry.registerPath({
  method: 'get',
  path: '/status',
  tags: ['Night Audit'],
  description: 'Get night audit status',
  responses: {
    200: {
      description: 'Audit status',
      content: { 'application/json': { schema: AuditStatusSchema } },
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

nightAuditRouter.get(
  '/status',
  requirePermission('night_audit', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getAuditStatus(req.tenantId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/run',
  tags: ['Night Audit'],
  description: 'Run night audit',
  request: {
    body: {
      description: 'Night audit payload',
      content: { 'application/json': { schema: NightAuditInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Audit completed',
      content: { 'application/json': { schema: AuditResponseSchema } },
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
      description: 'Property not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Audit already completed or preconditions not met',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

nightAuditRouter.post(
  '/run',
  requirePermission('night_audit', 'run'),
  validateBody(nightAuditSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await runNightAudit(
        req.tenantId,
        (req as AuthenticatedRequest).auth.user.id,
        req.validatedBody as z.infer<typeof nightAuditSchema>
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/{id}/rollback',
  tags: ['Night Audit'],
  description: 'Rollback a completed night audit',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: 'Audit rolled back',
      content: { 'application/json': { schema: AuditResponseSchema } },
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
      description: 'Audit not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Audit cannot be rolled back',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

nightAuditRouter.post(
  '/:id/rollback',
  requirePermission('night_audit', 'run'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await rollbackNightAudit(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'get',
  path: '/history',
  tags: ['Night Audit'],
  description: 'Get night audit history',
  responses: {
    200: {
      description: 'Audit history',
      content: { 'application/json': { schema: AuditHistoryResponseSchema } },
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

nightAuditRouter.get(
  '/history',
  requirePermission('night_audit', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getAuditHistory(req.tenantId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'get',
  path: '/{id}/report',
  tags: ['Night Audit'],
  description: 'Generate a night audit report',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: 'Audit report',
      content: { 'application/json': { schema: AuditReportResponseSchema } },
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
      description: 'Audit not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

nightAuditRouter.get(
  '/:id/report',
  requirePermission('night_audit', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await generateAuditReport(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
