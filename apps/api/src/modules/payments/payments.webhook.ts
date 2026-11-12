/* apps/api/src/modules/payments/payments.webhook.ts
 * PUBLIC endpoint — no auth middleware. Security = HMAC signature on the raw body.
 * The raw body is captured via the `verify` callback patched into express.json in index.ts (req.rawBody).
 */
import { Router, type Request, type Response } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { verifyWebhookSignature } from '../../common/paystack.js';
import { enqueue } from '../../common/queue.js';
import { logger } from '../../common/logger.js';
import { ErrorResponseSchema } from '../../common/openapi-schemas.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export const PAYMENTS_QUEUE = 'payments';

export const paymentsWebhookRouter = Router();

registry.registerPath({
  method: 'post',
  path: '/v1/payments/webhook',
  tags: ['Payments'],
  description:
    'Paystack webhook receiver (public, HMAC-SHA512 signed). Point the Paystack dashboard here.',
  responses: {
    200: { description: 'Event acknowledged (processed asynchronously via queue)' },
    401: {
      description: 'Invalid signature',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

paymentsWebhookRouter.post('/', (req: Request, res: Response) => {
  const rawBody = (req as any).rawBody as Buffer | undefined;
  const signature = req.get('x-paystack-signature');

  if (!rawBody || !verifyWebhookSignature(rawBody, signature)) {
    logger.warn({ ip: req.ip }, 'Paystack webhook rejected — bad signature');
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid signature' } });
    return;
  }

  const event = req.body as {
    event: string;
    data: {
      reference?: string;
      id?: number;
      status?: string;
      gateway_response?: string;
      refunded_amount?: number;
      metadata?: { reference?: string } | null;
    };
  };

  // Acknowledge fast; process asynchronously via queue (with retries + DLQ).
  res.status(200).json({ received: true });

  // Payment-request charges use Paystack's auto-generated reference on the
  // hosted page; our internal reference rides in metadata.
  const reference = event.data?.metadata?.reference ?? event.data?.reference;
  if (!reference) return;

  switch (event.event) {
    case 'charge.success':
      void enqueue(PAYMENTS_QUEUE, 'post-to-folio', {
        reference,
        transactionId: event.data.id,
      });
      break;
    case 'charge.failed':
      void enqueue(PAYMENTS_QUEUE, 'mark-failed', {
        reference,
        reason: event.data.gateway_response ?? 'charge failed',
      });
      break;
    case 'refund.processed':
      void enqueue(PAYMENTS_QUEUE, 'refund-processed', {
        reference,
        transactionId: event.data.id,
        refundedAmount: event.data.refunded_amount,
      });
      break;
    default:
      logger.debug({ event: event.event }, 'unhandled Paystack webhook event');
  }
});
