/* apps/api/src/modules/onboarding/onboarding.routes.ts */
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { authMiddleware } from '../auth/auth.middleware.js';
import { AppError } from '../../common/errors.js';
import { buildTemplateCsv } from './onboarding.csv.js';
import * as svc from './onboarding.service.js';

export const registry = new OpenAPIRegistry();

const router = Router();
router.use(authMiddleware);

type Authed = Request & {
  auth?: { tenantId: string; user?: { id?: string; role?: string } };
};

const ctx = (req: Request): { tenantId: string; userId: string | undefined } => {
  const a = (req as Authed).auth;
  if (!a?.tenantId) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  return { tenantId: a.tenantId, userId: a.user?.id };
};

const parseBody = <T>(schema: z.ZodType<T>, body: unknown): T => {
  const r = schema.safeParse(body);
  if (!r.success) {
    const msg = r.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ');
    throw new AppError(400, msg, 'VALIDATION_ERROR');
  }
  return r.data;
};

const h =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: (e: unknown) => void) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

const ImportCreateSchema = z.object({
  fileName: z.string().min(1).max(255),
  csv: z.string().min(1).max(2_000_000),
});

const TemplateCreateSchema = z.object({
  name: z.string().min(1).max(120),
  config: z.unknown(),
});

const CaptureSchema = z.object({
  name: z.string().min(1).max(120),
});

const PropertyCreateSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().min(2).max(20),
  city: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
});

const CloneSchema = PropertyCreateSchema.extend({
  sourcePropertyId: z.string().min(1),
});

const ChainSaveSchema = z.object({
  propertyId: z.string().optional(),
  name: z.string().max(120).optional(),
  config: z.unknown().optional(),
});

router.get(
  '/template.csv',
  h(async (req, res) => {
    ctx(req);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="vimad-onboarding-template.csv"');
    res.send(buildTemplateCsv());
  })
);

router.get(
  '/imports',
  h(async (req, res) => {
    const { tenantId } = ctx(req);
    res.json(await svc.listImports(tenantId));
  })
);

router.post(
  '/imports',
  h(async (req, res) => {
    const { tenantId, userId } = ctx(req);
    const body = parseBody(ImportCreateSchema, req.body);
    res.status(201).json(await svc.createImport(tenantId, userId, body.fileName, body.csv));
  })
);

router.get(
  '/imports/:id',
  h(async (req, res) => {
    const { tenantId } = ctx(req);
    res.json(await svc.getImport(tenantId, req.params.id));
  })
);

router.post(
  '/imports/:id/execute',
  h(async (req, res) => {
    const { tenantId } = ctx(req);
    res.json(await svc.executeImport(tenantId, req.params.id));
  })
);

router.get(
  '/templates',
  h(async (req, res) => {
    const { tenantId } = ctx(req);
    res.json(await svc.listTemplates(tenantId));
  })
);

router.post(
  '/templates',
  h(async (req, res) => {
    const { tenantId, userId } = ctx(req);
    const body = parseBody(TemplateCreateSchema, req.body);
    res.status(201).json(await svc.createTemplate(tenantId, userId, body.name, body.config));
  })
);

router.post(
  '/templates/from-property/:propertyId',
  h(async (req, res) => {
    const { tenantId, userId } = ctx(req);
    const body = parseBody(CaptureSchema, req.body);
    res
      .status(201)
      .json(
        await svc.captureTemplateFromProperty(tenantId, userId, req.params.propertyId, body.name)
      );
  })
);

router.post(
  '/templates/:id/apply',
  h(async (req, res) => {
    const { tenantId, userId } = ctx(req);
    const body = parseBody(PropertyCreateSchema, req.body);
    res.status(201).json(await svc.applyTemplate(tenantId, userId, req.params.id, body));
  })
);

router.delete(
  '/templates/:id',
  h(async (req, res) => {
    const { tenantId } = ctx(req);
    res.json(await svc.deleteTemplate(tenantId, req.params.id));
  })
);

router.post(
  '/clone',
  h(async (req, res) => {
    const { tenantId, userId } = ctx(req);
    const body = parseBody(CloneSchema, req.body);
    res.status(201).json(await svc.cloneProperty(tenantId, userId, body.sourcePropertyId, body));
  })
);

router.get(
  '/chain-standard',
  h(async (req, res) => {
    const { tenantId } = ctx(req);
    res.json(await svc.getChainStandard(tenantId));
  })
);

router.put(
  '/chain-standard',
  h(async (req, res) => {
    const { tenantId, userId } = ctx(req);
    const body = parseBody(ChainSaveSchema, req.body);
    res.json(await svc.saveChainStandard(tenantId, userId, body));
  })
);

registry.registerPath({
  method: 'get',
  path: '/v1/onboarding/imports',
  summary: 'List bulk onboarding imports',
  responses: { 200: { description: 'Onboarding imports, newest first' } },
});

registry.registerPath({
  method: 'post',
  path: '/v1/onboarding/imports',
  summary: 'Stage a CSV import (parse + validate)',
  responses: {
    201: { description: 'Import staged with per-row validation results' },
    400: { description: 'Invalid CSV or headers' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/onboarding/imports/{id}/execute',
  summary: 'Execute a staged import (idempotent, one property per transaction)',
  responses: {
    200: { description: 'Import executed with per-property results' },
    409: { description: 'Already executed or already running' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/onboarding/clone',
  summary: 'Clone a property (room types, rooms, rate plans — no guests/stays)',
  responses: {
    201: { description: 'New property created' },
    409: { description: 'Code already exists' },
  },
});

export const onboardingRouter = router;
export default router;
