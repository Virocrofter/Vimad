/* apps/api/src/common/idempotency.ts */
import type { Request, Response, NextFunction } from 'express';
import { prisma } from './prisma.js';
import { logger } from './logger.js';
import { AppError } from './errors.js';

const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
const KEY_TTL_MS = 24 * 60 * 60 * 1000;

interface StoredResponse {
  statusCode: number;
  body: unknown;
}

export async function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const key = req.get(IDEMPOTENCY_KEY_HEADER);

  if (!key || req.method !== 'POST') {
    return next();
  }

  if (!req.body || typeof req.body !== 'object') {
    return next();
  }

  try {
    // ─── 1. Claim the key BEFORE the handler runs ───
    // Insert a pending record. If another request with the same key is
    // already in flight, the unique constraint rejects us here and we
    // return 409 instead of double-executing the operation.
    const claim = await prisma.idempotencyKey
      .create({
        data: {
          key,
          scope: req.path,
          requestPath: req.path,
          requestBody: req.body as object,
          payload: req.body as object,
          status: 'pending',
          expiresAt: new Date(Date.now() + KEY_TTL_MS),
        },
      })
      .catch(async (err: unknown) => {
        // Unique violation → key already claimed. Either a replay (return
        // the stored response) or a concurrent duplicate (409).
        const isUniqueViolation =
          typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          (err as { code: string }).code === 'P2002';

        if (!isUniqueViolation) throw err;

        const stored = await prisma.idempotencyKey.findUnique({ where: { key } });

        if (stored?.response) {
          const response = stored.response as unknown as StoredResponse;
          res.status(response.statusCode ?? 200).json(response.body);
          return null;
        }

        // Claimed but no response yet → the original request is still running.
        throw new AppError(
          409,
          'A request with this idempotency key is already in progress',
          'IDEMPOTENCY_IN_PROGRESS'
        );
      });

    if (claim === null) {
      return; // replay already responded
    }

    // ─── 2. Capture the response and AWAIT the store ───
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);
    let capturedStatus = 200;

    res.status = (code: number) => {
      capturedStatus = code;
      return originalStatus(code);
    };

    res.json = (body: unknown) => {
      // Fire-and-forget is the bug this fixes: the response is only sent
      // after the upsert settles, so a crash mid-request can't lose the
      // stored response and allow a duplicate execution on retry.
      // Never store error responses: a stored 4xx/5xx would replay forever
      // and poison every legitimate retry of the same key (P4b saga).
      if (capturedStatus >= 400) {
        return originalJson(body);
      }

      prisma.idempotencyKey
        .update({
          where: { key },
          data: {
            response: { statusCode: capturedStatus, body } as object,
            status: 'completed',
          },
        })
        .then(() => {
          logger.debug({ key }, 'idempotency response stored');
        })
        .catch((err: unknown) => {
          // Never block the client response on a storage failure — but log
          // loudly, because the replay guarantee is now degraded.
          logger.error({ err, key }, 'failed to store idempotency response');
        })
        .finally(() => {
          originalJson(body);
        });

      return res;
    };

    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
      return;
    }
    logger.error({ err, key }, 'idempotency middleware error');
    next();
  }
}
