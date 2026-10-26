import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import * as svc from './marketing.service.js';
import { HttpError } from './marketing.service.js';

const tenantOf = (req: Request): string => {
  const t = (req as any).auth?.tenantId ?? (req as any).tenantId ?? (req as any).user?.tenantId;
  if (!t) throw new HttpError(401, 'UNAUTHORIZED', 'Tenant context missing');
  return String(t);
};

const rangeOf = (req: Request) => ({
  from: req.query.from ? new Date(String(req.query.from)) : undefined,
  to: req.query.to ? new Date(String(req.query.to)) : undefined,
});

const h =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof HttpError) {
        res.status(err.status).json({ error: { code: err.code, message: err.message } });
        return;
      }
      if (err instanceof ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
          },
        });
        return;
      }
      next(err);
    }
  };

export const overview = h(async (req, res) => {
  res.json(await svc.getOverview(tenantOf(req), rangeOf(req)));
});

// campaigns
export const listCampaigns = h(async (req, res) => {
  res.json(await svc.listCampaigns(tenantOf(req)));
});
export const createCampaign = h(async (req, res) => {
  res.status(201).json(await svc.createCampaign(tenantOf(req), req.body));
});
export const updateCampaign = h(async (req, res) => {
  res.json(await svc.updateCampaign(tenantOf(req), String(req.params.id), req.body));
});
export const deleteCampaign = h(async (req, res) => {
  res.json(await svc.deleteCampaign(tenantOf(req), String(req.params.id)));
});
export const campaignStats = h(async (req, res) => {
  res.json(await svc.campaignStats(tenantOf(req), String(req.params.id)));
});

// workflows
export const listWorkflows = h(async (req, res) => {
  res.json(await svc.listWorkflows(tenantOf(req)));
});
export const createWorkflow = h(async (req, res) => {
  res.status(201).json(await svc.createWorkflow(tenantOf(req), req.body));
});
export const updateWorkflow = h(async (req, res) => {
  res.json(await svc.updateWorkflow(tenantOf(req), String(req.params.id), req.body));
});
export const toggleWorkflow = h(async (req, res) => {
  res.json(await svc.toggleWorkflow(tenantOf(req), String(req.params.id)));
});
export const runWorkflow = h(async (req, res) => {
  res.status(201).json(await svc.runWorkflow(tenantOf(req), String(req.params.id)));
});
export const deleteWorkflow = h(async (req, res) => {
  res.json(await svc.deleteWorkflow(tenantOf(req), String(req.params.id)));
});

// templates
export const listTemplates = h(async (req, res) => {
  res.json(await svc.listTemplates(tenantOf(req)));
});
export const createTemplate = h(async (req, res) => {
  res.status(201).json(await svc.createTemplate(tenantOf(req), req.body));
});
export const updateTemplate = h(async (req, res) => {
  res.json(await svc.updateTemplate(tenantOf(req), String(req.params.id), req.body));
});
export const deleteTemplate = h(async (req, res) => {
  res.json(await svc.deleteTemplate(tenantOf(req), String(req.params.id)));
});
export const duplicateTemplate = h(async (req, res) => {
  res.status(201).json(await svc.duplicateTemplate(tenantOf(req), String(req.params.id)));
});
export const applyTemplate = h(async (req, res) => {
  res.status(201).json(await svc.applyTemplate(tenantOf(req), String(req.params.id)));
});

// segments
export const listSegments = h(async (req, res) => {
  res.json(await svc.listSegments(tenantOf(req)));
});
export const createSegment = h(async (req, res) => {
  res.status(201).json(await svc.createSegment(tenantOf(req), req.body));
});
export const refreshSegment = h(async (req, res) => {
  res.json(await svc.refreshSegment(tenantOf(req), String(req.params.id)));
});
export const deleteSegment = h(async (req, res) => {
  res.json(await svc.deleteSegment(tenantOf(req), String(req.params.id)));
});

// error mapper — mount once in index.ts, or reuse your existing zod/http handler
export function marketingErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      },
    });
    return;
  }
  next(err);
}
