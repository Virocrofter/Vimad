/* apps/api/src/common/idempotency.ts */
import type { Request, Response, NextFunction } from 'express';
import { prisma } from './prisma.js';
import { logger } from './logger.js';

const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';

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

  // Only apply to state-changing requests that include a body
  if (!req.body || typeof req.body !== 'object') {
    return next();
  }

  const stored = await prisma.idempotencyKey.findUnique({
    where: { key },
  });

  if (stored && stored.response) {
    const response = stored.response as unknown as StoredResponse;
    res.status(response.statusCode ?? 200);
    res.json(response.body);
    return;
  }

  // Capture the response
  const originalJson = res.json.bind(res);
  const originalStatus = res.status.bind(res);
  let capturedStatus = 200;

  res.status = (code: number) => {
    capturedStatus = code;
    return originalStatus(code);
  };

  res.json = (body: unknown) => {
    // Store the response for future replay
    prisma.idempotencyKey
      .upsert({
        where: { key },
        update: {
          response: { statusCode: capturedStatus, body } as any,
          updatedAt: new Date(),
        },
        create: {
          key,
          requestPath: req.path,
          requestBody: req.body as any,
          response: { statusCode: capturedStatus, body } as any,
        },
      })
      .catch((err) => {
        logger.error({ err, key }, 'failed to store idempotency key');
      });

    return originalJson(body);
  };

  next();
}
