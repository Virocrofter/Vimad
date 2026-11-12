// Platform router - identity, flags, customers, billing, contracts mounted behind the DB-backed guard.
import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware.js';
import { platformGuard } from './platform.middleware.js';
import { identityRouter } from './identity/identity.routes.js';
import { flagsRouter } from './flags/flags.routes.js';
import { customersRouter } from './customers/customers.routes.js';
import { billingRouter } from './billing/billing.routes.js';
import { contractsRouter } from './contracts/contracts.routes.js';

export const platformRouter = Router();

platformRouter.get('/health/live', (_req, res) =>
  res.json({ data: { status: 'ok', scope: 'platform' } })
);

platformRouter.use(authMiddleware);
platformRouter.use(platformGuard);
platformRouter.use(identityRouter);
platformRouter.use(flagsRouter);
platformRouter.use(customersRouter);
platformRouter.use(billingRouter);
platformRouter.use(contractsRouter);
