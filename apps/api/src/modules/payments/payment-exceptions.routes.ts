/* apps/api/src/modules/payments/payment-exceptions.routes.ts
 * Payment exception worklist (roadmap addendum 5.3, Phase 3 slice #4).
 * One queue for payments that need a HUMAN — failed charges, and pending
 * charges older than STALE_MS (a browser redirect is not settlement; the
 * provider/webhook is — so stale pendings surface for verification, not
 * blind retry). Each item carries server-computed validActions:
 *   failed       -> verify | retry | send-payment-link | dismiss
 *   stale pending-> verify | dismiss        (NO retry: re-charging a
 *     charge that may be in flight risks a double charge — provider rules
 *     beat convenience)
 * Dismiss requires a reason, is idempotent, and writes an audit row.
 * Recovery mutations themselves stay on the existing, tested endpoints
 * (payments initialize/verify, payment-requests create/send) — this route
 * only aggregates + acknowledges.
 */
import { Router, type Request, type Response } from 'express';
import { prisma } from '../../common/prisma.js';
import { authMiddleware, tenantScope } from '../auth/auth.middleware.js';

export const paymentExceptionsRouter = Router();
paymentExceptionsRouter.use(authMiddleware, tenantScope);

const STALE_MS = 2 * 3600 * 1000;

function tenantOf(req: Request): string | undefined {
  return ((req as any).user?.tenantId ?? (req as any).tenantId) as string | undefined;
}
function isDismissed(p: any): boolean {
  return Boolean((p.metadata as any)?.exception?.dismissedAt);
}
function actionsFor(p: any): string[] {
  if (p.status === 'failed') return ['verify', 'retry', 'send-payment-link', 'dismiss'];
  return ['verify', 'dismiss'];
}
function item(p: any) {
  const type = p.status === 'failed' ? 'failed' : 'stale_pending';
  return {
    id: p.id,
    type,
    severity: type === 'failed' ? 'critical' : 'high',
    reference: p.reference,
    status: p.status,
    amountMinor: p.amountMinor,
    currency: p.currency,
    channel: p.channel,
    failureReason: p.failureReason,
    createdAt: p.createdAt,
    ageMinutes: Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 60000),
    guestName: p.guest ? `${p.guest.firstName} ${p.guest.lastName}` : null,
    reservationId: p.reservationId,
    confirmationNumber: p.reservation?.confirmationNumber ?? null,
    folioId: p.folioId,
    folioBalance: p.folio ? Number(p.folio.balance) : null,
    validActions: actionsFor(p),
  };
}

// GET /v1/payment-exceptions
paymentExceptionsRouter.get('/', async (req: Request, res: Response) => {
  const tenantId = tenantOf(req)!;
  const staleBefore = new Date(Date.now() - STALE_MS);
  const [failed, stale] = await Promise.all([
    prisma.payment.findMany({
      where: { tenantId, status: 'failed' },
      include: { guest: true, reservation: true, folio: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.payment.findMany({
      where: { tenantId, status: 'pending', createdAt: { lt: staleBefore } },
      include: { guest: true, reservation: true, folio: true },
      orderBy: { createdAt: 'asc' },
      take: 100,
    }),
  ]);
  const items = [...failed, ...stale].filter((p) => !isDismissed(p)).map(item);
  return res.json({ data: { generatedAt: new Date().toISOString(), items } });
});

// POST /v1/payment-exceptions/dismiss { paymentId, reason }
paymentExceptionsRouter.post('/dismiss', async (req: Request, res: Response) => {
  const tenantId = tenantOf(req)!;
  const userId =
    (req as any).user?.userId ?? (req as any).user?.id ?? (req as any).user?.sub ?? null;
  const { paymentId, reason } = (req.body ?? {}) as { paymentId?: string; reason?: string };
  if (!reason || !String(reason).trim()) {
    return res
      .status(400)
      .json({
        error: { code: 'REASON_REQUIRED', message: 'a dismissal reason is required (audited)' },
      });
  }
  const payment = await prisma.payment.findFirst({
    where: { id: String(paymentId ?? ''), tenantId },
  });
  if (!payment) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'payment not found' } });
  }
  const metadata = {
    ...((payment.metadata as object | null) ?? {}),
    exception: {
      dismissedAt: new Date().toISOString(),
      dismissedBy: userId,
      reason: String(reason).trim(),
    },
  };
  await prisma.payment.update({ where: { id: payment.id }, data: { metadata } });
  await prisma.auditLog.create({
    data: {
      tenantId,
      userId,
      action: 'payment_exception.dismiss',
      entity: 'payment',
      entityId: payment.id,
      metadata: { reason: String(reason).trim(), reference: payment.reference },
    },
  });
  return res.json({ data: { dismissed: true } });
});
