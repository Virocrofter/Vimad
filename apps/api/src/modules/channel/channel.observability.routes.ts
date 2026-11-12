/* apps/api/src/modules/channel/channel.observability.routes.ts
 * B1: sync-error dashboard + safe idempotent replay over channel_push_log.
 * Dashboard surfaces failed pushes per tenant/connection. Replay re-dispatches
 * the original payload through the real adapter (sendToChannel — channel
 * pushes in this codebase are synchronous, there is no push queue), records
 * the retry outcome on the ORIGINAL log row, and is guarded by an
 * idempotency key: a double replay is a no-op, never duplicate work or rows.
 */
import { Router, type Request, type Response } from 'express';
import { prisma } from '../../common/prisma.js';
import { authMiddleware, tenantScope } from '../auth/auth.middleware.js';
import { sendToChannel } from './channel.service.js';

export const channelObservabilityRouter = Router();
channelObservabilityRouter.use(authMiddleware, tenantScope);

// GET /v1/channel/push-log?status=failed&connectionId=…
channelObservabilityRouter.get('/push-log', async (req: Request, res: Response) => {
  const { status, connectionId } = req.query as { status?: string; connectionId?: string };
  const tenantId = ((req as any).user?.tenantId ?? (req as any).tenantId) as string | undefined;
  const where: any = {};
  if (tenantId) where.tenantId = tenantId;
  if (connectionId) where.connectionId = connectionId;
  const scoped = { ...where, ...(status ? { status } : {}) };
  const [items, total, failed] = await Promise.all([
    prisma.channelPushLog.findMany({ where: scoped, orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.channelPushLog.count({ where }),
    prisma.channelPushLog.count({ where: { ...where, status: 'failed' } }),
  ]);
  res.json({ data: { items, total, failed } });
});

// POST /v1/channel/push-log/replay  { id, connectionId }
channelObservabilityRouter.post('/push-log/replay', async (req: Request, res: Response) => {
  const { id, connectionId } = (req.body ?? {}) as any;
  if (!id || !connectionId) {
    return res
      .status(400)
      .json({ error: { code: 'VALIDATION_ERROR', message: 'id and connectionId are required' } });
  }
  const tenantId = ((req as any).user?.tenantId ?? (req as any).tenantId) as string | undefined;
  const log = await prisma.channelPushLog.findFirst({
    where: {
      id: String(id),
      connectionId: String(connectionId),
      ...(tenantId ? { tenantId } : {}),
    },
  });
  if (!log) {
    return res
      .status(404)
      .json({ error: { code: 'NOT_FOUND', message: 'push log row not found' } });
  }

  const idemKey = `channel-replay:${log.id}`;
  const seen = await prisma.idempotencyKey.findUnique({ where: { key: idemKey } });
  if (seen) {
    return res.json({
      data: { replayed: true, duplicate: true, logId: log.id, previous: seen.response ?? null },
    });
  }

  // Real re-dispatch through the adapter layer. In test the seeded connection
  // points at a fake endpoint, so this fails fast and cleanly — which is
  // itself verified behavior: replay surfaces the outcome instead of throwing.
  const connection = await prisma.channelConnection.findUnique({
    where: { id: log.connectionId },
  });
  let outcome = { success: false, message: 'connection not found' };
  const started = Date.now();
  if (connection) {
    try {
      outcome = await sendToChannel(
        connection,
        'availability',
        (log.payload as any)?.availability ?? log.payload
      );
    } catch (err: any) {
      outcome = { success: false, message: String(err?.message ?? err) };
    }
  }
  const latencyMs = Date.now() - started;

  // Record the retry on the original row — no new push_log rows, so the
  // dashboard's row count is stable and replay stays idempotent.
  const prior = (log.payload as any) ?? {};
  await prisma.channelPushLog.update({
    where: { id: log.id },
    data: {
      status: outcome.success ? 'ok' : 'failed',
      latencyMs,
      payload: {
        ...prior,
        availability: prior.availability,
        replayedAt: new Date().toISOString(),
        replayAttempts: (prior.replayAttempts ?? 0) + 1,
      },
    },
  });

  const result = { replayed: true, duplicate: false, logId: log.id, outcome };
  await prisma.idempotencyKey.create({
    data: {
      key: idemKey,
      scope: 'channel-replay',
      status: 'completed',
      payload: { logId: log.id, connectionId: log.connectionId },
      response: result,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    },
  });

  return res.json({ data: result });
});
