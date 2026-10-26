import { Router } from 'express';
// Auth middleware — same pattern as your other staff modules.
// If your export is named differently (authMiddleware / authenticate), change this one import.
import { authMiddleware } from '../auth/auth.middleware.js';
import * as ctrl from './marketing.controller.js';

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

export default marketingRouter;
