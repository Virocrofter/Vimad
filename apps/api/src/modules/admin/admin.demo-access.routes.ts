import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../auth/auth.middleware.js';
import { requireAdminRole } from './admin.middleware.js';
import * as svc from './admin.demo-access.service.js';

export const demoAccessAdminRouter = Router();
export const demoAccessPublicRouter = Router();

const wrap = (fn: (req: any, res: any) => Promise<any>) => (req: any, res: any) =>
  fn(req, res)
    .then((data) => res.json({ data }))
    .catch((e) => {
      res.status(e.status ?? 500).json({ error: e.message ?? 'Server error' });
    });

const actor = (req: any) => req.auth?.user?.email ?? 'platform';

demoAccessAdminRouter.use(authMiddleware);
demoAccessAdminRouter.get(
  '/demo-access/stats',
  requireAdminRole,
  wrap(async () => svc.getStats())
);
demoAccessAdminRouter.get(
  '/demo-access/sessions',
  requireAdminRole,
  wrap(async (req) => svc.listSessions(req.query as any))
);
demoAccessAdminRouter.get(
  '/demo-access/sessions/:id',
  requireAdminRole,
  wrap(async (req) => svc.getSession(req.params.id))
);
demoAccessAdminRouter.post(
  '/demo-access/sessions/:id/approve',
  requireAdminRole,
  wrap(async (req) => svc.approveSession(req.params.id, { ...req.body, grantedBy: actor(req) }))
);
demoAccessAdminRouter.post(
  '/demo-access/sessions/:id/reject',
  requireAdminRole,
  wrap(async (req) => svc.rejectSession(req.params.id, actor(req), req.body?.reason))
);
demoAccessAdminRouter.post(
  '/demo-access/sessions/:id/invite',
  requireAdminRole,
  wrap(async (req) => svc.inviteSession(req.params.id, actor(req)))
);
demoAccessAdminRouter.post(
  '/demo-access/sessions/:id/extend',
  requireAdminRole,
  wrap(async (req) => svc.extendSession(req.params.id, { ...req.body, by: actor(req) }))
);
demoAccessAdminRouter.post(
  '/demo-access/sessions/:id/convert',
  requireAdminRole,
  wrap(async (req) => svc.convertSession(req.params.id, actor(req)))
);
demoAccessAdminRouter.post(
  '/demo-access/sessions/:id/revoke',
  requireAdminRole,
  wrap(async (req) => svc.revokeSession(req.params.id, { ...req.body, by: actor(req) }))
);
demoAccessAdminRouter.post(
  '/demo-access/sessions/:id/reset',
  requireAdminRole,
  wrap(async (req) => svc.resetSession(req.params.id, actor(req)))
);

demoAccessPublicRouter.use(
  rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false })
);
demoAccessPublicRouter.get(
  '/tour',
  wrap(async (req) => svc.getTour(String((req as any).query.tenantId ?? '')))
);
demoAccessPublicRouter.post(
  '/request',
  wrap(async (req) => svc.requestDemo(req.body ?? {}))
);
demoAccessPublicRouter.post(
  '/enter',
  wrap(async (req) => svc.enterDemo(String(req.body?.token ?? '')))
);
