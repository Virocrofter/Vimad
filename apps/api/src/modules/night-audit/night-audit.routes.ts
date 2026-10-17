/* apps/api/src/modules/night-audit/night-audit.routes.ts */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  authMiddleware,
  tenantScope,
  requirePermission,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import { ErrorResponseSchema, IdParamSchema } from '../../common/openapi-schemas.js';
import {
  getAuditStatus,
  getPreAuditChecks,
  runNightAudit,
  rollbackNightAudit,
  getAuditHistory,
  generateAuditReport,
  getAuditSchedule,
  upsertAuditSchedule,
  nightAuditSchema,
  nightAuditScheduleSchema,
} from './night-audit.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const NightAuditInputSchema = nightAuditSchema.openapi('NightAuditInput');
const NightAuditScheduleInputSchema = nightAuditScheduleSchema.openapi('NightAuditScheduleInput');

const PreCheckItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  detail: z.string(),
  severity: z.enum(['danger', 'warning', 'success', 'info']),
  count: z.number().int(),
  autoResolvable: z.boolean(),
});

const PreCheckResponseSchema = z
  .object({
    data: z.object({
      checklist: z.array(PreCheckItemSchema),
      summary: z.object({
        pendingArrivals: z.number().int(),
        pendingDepartures: z.number().int(),
        noShows: z.number().int(),
        unpostedCharges: z.number().int(),
        unbalancedFolios: z.number().int(),
        dirtyRooms: z.number().int(),
        oooRooms: z.number().int(),
        isDayClosed: z.boolean(),
        businessDate: z.unknown().optional(),
        propertyName: z.string().optional(),
      }),
      canRunAudit: z.boolean(),
      blockerCount: z.number().int(),
      warningCount: z.number().int(),
    }),
  })
  .openapi('PreAuditCheckResponse');

const AuditStatusSchema = z
  .object({
    data: z.object({
      lastAuditDate: z.unknown().nullable(),
      lastAuditStatus: z.string().nullable(),
      lastAuditId: z.string().nullable(),
      isDayClosed: z.boolean(),
      pendingCheckouts: z.number().int(),
      unbalancedFolios: z.number().int(),
      canRunAudit: z.boolean(),
      businessDate: z.unknown().nullable(),
      propertyName: z.string().nullable(),
      todayStats: z.object({
        arrivals: z.number().int(),
        departures: z.number().int(),
        inHouse: z.number().int(),
        occupiedRooms: z.number().int(),
        totalRooms: z.number().int(),
        occupancyRate: z.number().int(),
      }),
    }),
  })
  .openapi('AuditStatusResponse');

const AuditItemSchema = z
  .object({
    id: z.string(),
    propertyId: z.string(),
    auditDate: z.unknown(),
    status: z.enum(['in_progress', 'completed', 'failed', 'rolled_back']),
    runBy: z.string(),
    completedAt: z.unknown().optional(),
    results: z.record(z.string(), z.unknown()).optional(),
    errorMessage: z.string().optional(),
    createdAt: z.unknown().optional(),
    updatedAt: z.unknown().optional(),
    property: z
      .object({
        id: z.string(),
        name: z.string(),
        code: z.string().optional(),
        currentBusinessDate: z.unknown().optional(),
      })
      .optional(),
  })
  .openapi('AuditItem');

const AuditResponseSchema = z.object({ data: AuditItemSchema }).openapi('AuditResponse');

const AuditHistoryResponseSchema = z
  .object({
    data: z.array(AuditItemSchema),
    meta: z.object({
      page: z.number().int(),
      pageSize: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  })
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

const ScheduleResponseSchema = z
  .object({
    data: z
      .object({
        id: z.string(),
        propertyId: z.string(),
        scheduledTime: z.string(),
        timezone: z.string(),
        isActive: z.boolean(),
        autoRun: z.boolean(),
        steps: z.record(z.string(), z.unknown()),
        notifyEmails: z.array(z.string()),
        lastRunAt: z.unknown().optional(),
        nextRunAt: z.unknown().optional(),
      })
      .nullable(),
  })
  .openapi('AuditScheduleResponse');

export const nightAuditRouter = Router();

nightAuditRouter.use(authMiddleware, tenantScope);

/* --- GET /pre-checks --- */
registry.registerPath({
  method: 'get',
  path: '/pre-checks',
  tags: ['Night Audit'],
  description: 'Get pre-audit checklist with live data',
  parameters: [{ name: 'propertyId', in: 'query', required: true, schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'Pre-audit checks',
      content: { 'application/json': { schema: PreCheckResponseSchema } },
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
  '/pre-checks',
  requirePermission('night_audit', 'read'),
  validateQuery(z.object({ propertyId: z.string() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId } = req.validatedQuery as { propertyId: string };
      const result = await getPreAuditChecks(req.tenantId, propertyId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* --- GET /status --- */
registry.registerPath({
  method: 'get',
  path: '/status',
  tags: ['Night Audit'],
  description: 'Get night audit status',
  parameters: [{ name: 'propertyId', in: 'query', required: false, schema: { type: 'string' } }],
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
  validateQuery(z.object({ propertyId: z.string().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId } = req.validatedQuery as { propertyId?: string };
      const result = await getAuditStatus(req.tenantId, propertyId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* --- POST /run --- */
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
      description: 'Audit already completed',
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
        req.validatedBody as z.infer<typeof nightAuditSchema>,
        req as AuthenticatedRequest
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* --- POST /:id/rollback --- */
registry.registerPath({
  method: 'post',
  path: '/{id}/rollback',
  tags: ['Night Audit'],
  description: 'Rollback a completed night audit',
  request: { params: IdParamSchema },
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
      description: 'Cannot rollback',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

nightAuditRouter.post(
  '/:id/rollback',
  requirePermission('night_audit', 'run'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await rollbackNightAudit(
        req.tenantId,
        req.params.id,
        (req as AuthenticatedRequest).auth.user.id,
        req as AuthenticatedRequest
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* --- GET /history --- */
registry.registerPath({
  method: 'get',
  path: '/history',
  tags: ['Night Audit'],
  description: 'Get night audit history with pagination',
  parameters: [
    { name: 'propertyId', in: 'query', required: false, schema: { type: 'string' } },
    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
    { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
  ],
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
  validateQuery(paginationSchema.extend({ propertyId: z.string().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId, page, pageSize } = req.validatedQuery as {
        propertyId?: string;
        page: number;
        pageSize: number;
      };
      const result = await getAuditHistory(req.tenantId, propertyId, page, pageSize);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/* --- GET /:id/report --- */
registry.registerPath({
  method: 'get',
  path: '/{id}/report',
  tags: ['Night Audit'],
  description: 'Generate a night audit report',
  request: { params: IdParamSchema },
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

/* --- GET /schedule --- */
registry.registerPath({
  method: 'get',
  path: '/schedule',
  tags: ['Night Audit'],
  description: 'Get night audit schedule configuration',
  parameters: [{ name: 'propertyId', in: 'query', required: true, schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'Schedule config',
      content: { 'application/json': { schema: ScheduleResponseSchema } },
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
  '/schedule',
  requirePermission('night_audit', 'read'),
  validateQuery(z.object({ propertyId: z.string() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId } = req.validatedQuery as { propertyId: string };
      const result = await getAuditSchedule(req.tenantId, propertyId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* --- PUT /schedule --- */
registry.registerPath({
  method: 'put',
  path: '/schedule',
  tags: ['Night Audit'],
  description: 'Create or update night audit schedule',
  request: {
    body: {
      description: 'Schedule configuration',
      content: { 'application/json': { schema: NightAuditScheduleInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Schedule saved',
      content: { 'application/json': { schema: ScheduleResponseSchema } },
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
  },
});

nightAuditRouter.put(
  '/schedule',
  requirePermission('night_audit', 'run'),
  validateBody(nightAuditScheduleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await upsertAuditSchedule(
        req.tenantId,
        req.validatedBody as z.infer<typeof nightAuditScheduleSchema>
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
