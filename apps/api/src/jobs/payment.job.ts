/* apps/api/src/jobs/payment.job.ts
 * Idempotent payment-side-effects worker. Safe to run multiple times:
 * every handler re-checks state before writing.
 * A3 note: the guest receipt email fires inside postPaymentToFolio (the single
 * posting chokepoint), so this worker no longer triggers its own copy.
 */
import { createWorker } from '../common/queue.js';
import { prisma } from '../common/prisma.js';
import { logger } from '../common/logger.js';
import { fetchTransaction } from '../common/paystack.js';
import { PAYMENTS_QUEUE } from '../modules/payments/payments.webhook.js';
import { postPaymentToFolio, postRefundToFolio } from '../modules/payments/payments.service.js';
import { settlePaymentRequestForPayment } from '../modules/payments/payment-requests.service.js';
import cron from 'node-cron';

type PaymentJobData =
  | { reference: string; transactionId?: number }
  | { reference: string; reason: string }
  | { reference: string; transactionId?: number; refundedAmount?: number };

export const paymentWorker = createWorker<PaymentJobData>(PAYMENTS_QUEUE, async (job) => {
  const data = job.data as {
    reference: string;
    reason?: string;
    refundedAmount?: number;
    transactionId?: number;
  };

  if (job.name === 'post-to-folio') {
    const payment = await prisma.payment.findUnique({ where: { reference: data.reference } });
    if (!payment) {
      logger.warn({ reference: data.reference }, 'webhook for unknown payment reference');
      return;
    }
    if (payment.status === 'cancelled') {
      logger.info(
        { reference: data.reference },
        'payment was cancelled (request voided) — ignoring webhook'
      );
      return;
    }

    // Reconcile with Paystack if still pending.
    if (payment.status === 'pending') {
      const txId = data.transactionId ?? payment.paystackId;
      if (!txId) {
        throw new Error(`no transaction id available to reconcile ${data.reference}`);
      }
      const txData = await fetchTransaction(Number(txId));
      if (txData.status === 'success') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'success', feeMinor: txData.fees ?? 0, paystackId: BigInt(txId) },
        });
      }
    }

    // Folio posting — this is also where the A3 guest receipt email fires.
    await postPaymentToFolio(payment.id);
    // Deposit automation (A2): flip the payment request to paid.
    await settlePaymentRequestForPayment(payment.id);
    return;
  }

  if (job.name === 'mark-failed') {
    await prisma.payment.updateMany({
      where: { reference: data.reference, status: 'pending' },
      data: { status: 'failed', failureReason: data.reason?.slice(0, 500) },
    });
    return;
  }

  if (job.name === 'refund-processed') {
    const payment = await prisma.payment.findUnique({ where: { reference: data.reference } });
    if (!payment) return;

    const txData = await fetchTransaction(data.transactionId ?? Number(payment.paystackId));
    const totalRefunded = txData.amount_refunded ?? data.refundedAmount ?? payment.refundedMinor;
    const delta = totalRefunded - payment.refundedMinor;

    if (delta > 0) {
      // Canonical lifecycle guard (roadmap #9): a refund event for a payment
      // that is not in a refundable state fails here and retries; an
      // out-of-order event self-heals once the charge.success job lands.
      const p5nextStatus = totalRefunded >= payment.amountMinor ? 'refunded' : 'partially_refunded';
      const { assertTransition } = await import('../common/lifecycle.js');
      assertTransition('payment', payment.status, p5nextStatus, { reference: payment.reference });
      // Atomic claim on the refund progression: a concurrent refund-processed
      // job for the same payment can only advance refundedMinor from the
      // snapshot we read; the loser skips, and the next event reconciles.
      const claimed = await prisma.payment.updateMany({
        where: { id: payment.id, refundedMinor: payment.refundedMinor },
        data: {
          refundedMinor: totalRefunded,
          status: totalRefunded >= payment.amountMinor ? 'refunded' : 'partially_refunded',
        },
      });
      if (claimed.count === 1) {
        await postRefundToFolio(payment.id, delta);
      }
    }
  }
});

// ─── [E2x] Abandoned-deposit sweep ───
// Orphan release in createPublicBooking covers deposit-INIT failure. This
// covers checkout abandonment after successful init: guest closes the tab,
// confirmed reservation + pending deposit sit forever, I1 inventory held.
// Hourly: pending web-deposit payments older than 24h -> failed
// (abandoned_checkout), reservation cancelled (deposit_abandoned).
export async function sweepAbandonedDeposits(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - 24 * 3600 * 1000);
  const stale = await prisma.payment.findMany({
    where: { status: 'pending', reference: { endsWith: '-deposit' }, createdAt: { lt: cutoff } },
    include: { reservation: { select: { id: true, status: true } } },
    take: 100,
  });
  for (const pay of stale) {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: pay.id },
        data: { status: 'failed', failureReason: 'abandoned_checkout' },
      }),
      ...(pay.reservation && pay.reservation.status === 'confirmed'
        ? [
            prisma.reservation.update({
              where: { id: pay.reservation.id },
              data: {
                status: 'cancelled',
                cancelledAt: now,
                cancelledBy: 'system',
                cancelReason: 'deposit_abandoned',
              },
            }),
          ]
        : []),
    ]);
  }
  if (stale.length) logger.info({ count: stale.length }, 'abandoned deposits swept');
  return stale.length;
}

export function startAbandonedDepositScheduler(): void {
  cron.schedule('37 * * * *', async () => {
    try {
      await sweepAbandonedDeposits();
    } catch (err) {
      logger.error({ err }, 'abandoned deposit sweep failed');
    }
  });
  logger.info('Abandoned-deposit scheduler started (hourly :37)');
}
