import { Router } from 'express';
// Auth middleware — same pattern as your other staff modules.
// If your export is named differently (authMiddleware / authenticate), change this one import.
import { authMiddleware } from '../auth/auth.middleware.js';
import * as ctrl from './marketing.controller.js';
import * as svc from './marketing.service.js';
import { HttpError } from './marketing.service.js';

// Same tenant resolution as the controller (auth middleware sets req.auth).
const tenantOf = (req: any): string => {
  const t = req.auth?.tenantId ?? req.tenantId ?? req.user?.tenantId;
  if (!t) throw new HttpError(401, 'UNAUTHORIZED', 'Tenant context missing');
  return String(t);
};

const consentHandler =
  (fn: (req: any) => Promise<unknown>) => async (req: any, res: any, next: any) => {
    try {
      res.json({ data: await fn(req) });
    } catch (err) {
      if (err instanceof HttpError) {
        res.status(err.status).json({ error: { code: err.code, message: err.message } });
        return;
      }
      next(err);
    }
  };

export const marketingRouter = Router();

// All marketing routes require an authenticated tenant-scoped session.
marketingRouter.use(authMiddleware);

// analytics
marketingRouter.get('/analytics/overview', ctrl.overview);

// campaigns
marketingRouter.get('/campaigns', ctrl.listCampaigns);
marketingRouter.post('/campaigns', ctrl.createCampaign);
marketingRouter.get('/campaigns/:id/stats', ctrl.campaignStats);
marketingRouter.patch('/campaigns/:id', ctrl.updateCampaign);
marketingRouter.delete('/campaigns/:id', ctrl.deleteCampaign);

// automation workflows
marketingRouter.get('/workflows', ctrl.listWorkflows);
marketingRouter.post('/workflows', ctrl.createWorkflow);
marketingRouter.patch('/workflows/:id', ctrl.updateWorkflow);
marketingRouter.post('/workflows/:id/toggle', ctrl.toggleWorkflow);
marketingRouter.post('/workflows/:id/run', ctrl.runWorkflow);
marketingRouter.delete('/workflows/:id', ctrl.deleteWorkflow);

// templates
marketingRouter.get('/templates', ctrl.listTemplates);
marketingRouter.post('/templates', ctrl.createTemplate);
marketingRouter.patch('/templates/:id', ctrl.updateTemplate);
marketingRouter.delete('/templates/:id', ctrl.deleteTemplate);
marketingRouter.post('/templates/:id/duplicate', ctrl.duplicateTemplate);
marketingRouter.post('/templates/:id/apply', ctrl.applyTemplate);

// segments
marketingRouter.get('/segments', ctrl.listSegments);
marketingRouter.post('/segments', ctrl.createSegment);
marketingRouter.post('/segments/:id/refresh', ctrl.refreshSegment);
marketingRouter.delete('/segments/:id', ctrl.deleteSegment);

// E5 consents — record, history, and the send-time audience gate
marketingRouter.post(
  '/consents',
  consentHandler(async (req) => svc.recordConsent(tenantOf(req), req.body.guestId, req.body))
);
marketingRouter.get(
  '/consents/guest/:guestId',
  consentHandler(async (req) => svc.consentHistory(tenantOf(req), req.params.guestId))
);
marketingRouter.post(
  '/audience',
  consentHandler(async (req) => svc.gateAudience(tenantOf(req), req.body))
);
marketingRouter.post(
  '/winback/run',
  consentHandler(async (req) => svc.runWinback(tenantOf(req), req.body))
);

export default marketingRouter;
