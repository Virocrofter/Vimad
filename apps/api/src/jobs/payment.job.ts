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
      const txData = await fetchTransaction(txId);
      if (txData.status === 'success') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'success', feeMinor: txData.fees ?? 0, paystackId: txId },
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

    const txData = await fetchTransaction(data.transactionId ?? payment.paystackId!);
    const totalRefunded = txData.amount_refunded ?? data.refundedAmount ?? payment.refundedMinor;
    const delta = totalRefunded - payment.refundedMinor;

    if (delta > 0) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          refundedMinor: totalRefunded,
          status: totalRefunded >= payment.amountMinor ? 'refunded' : 'partially_refunded',
        },
      });
      await postRefundToFolio(payment.id, delta);
    }
  }
});
