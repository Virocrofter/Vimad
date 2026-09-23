/* apps/api/src/jobs/dashboard.ts */
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import type { RequestHandler } from 'express';
import { getQueue, QUEUE_NAMES } from '../common/queue.js';
import { authMiddleware, requirePermission } from '../modules/auth/auth.middleware.js';

const BASE_PATH = '/admin/queues';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath(BASE_PATH);

createBullBoard({
  queues: QUEUE_NAMES.map((name) => new BullMQAdapter(getQueue(name))),
  serverAdapter,
});

const boardRouter = serverAdapter.getRouter() as unknown as RequestHandler;

// ─── Middleware: auth + permission, then Bull Board UI ───
export function queueDashboardMiddleware(): RequestHandler[] {
  return [authMiddleware, requirePermission('report', 'read'), boardRouter];
}
