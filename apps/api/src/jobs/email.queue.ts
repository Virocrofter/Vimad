/* apps/api/src/jobs/email.queue.ts */
import { enqueue } from '../common/queue.js';
import { prisma } from '../common/prisma.js';

export const EMAIL_QUEUE = 'email';

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType?: string;
}

export type EmailTemplate =
  | 'welcome'
  | 'password-reset'
  | 'invoice'
  | 'maintenance'
  | 'generic'
  | 'payment-request'
  | 'reservation-confirmation'
  | 'pre-arrival'
  | 'payment-receipt'
  | 'folio-email'
  | 'booking-cancelled'
  | 'tax-invoice'
  | 'receipt'
  | 'credit-note';

export interface EmailJobData {
  to: string;
  subject: string;
  template: EmailTemplate;
  payload: Record<string, unknown>;
  attachments?: EmailAttachment[];
  // A3: log context — every send is recorded in email_logs
  tenantId?: string;
  relatedType?: string; // 'reservation' | 'payment'
  relatedId?: string;
  logId?: string; // set internally after the log row is created
}

export async function sendEmail(data: EmailJobData, opts?: { delay?: number }): Promise<void> {
  // 1. Write the log row FIRST so queued emails are visible even if the
  //    worker is down. The worker flips it to sent/failed.
  const log = await prisma.emailLog.create({
    data: {
      tenantId: data.tenantId ?? null,
      to: data.to,
      subject: data.subject,
      template: data.template,
      payload: (data.payload ?? {}) as object,
      relatedType: data.relatedType ?? null,
      relatedId: data.relatedId ?? null,
      status: 'queued',
    },
  });

  try {
    await enqueue(EMAIL_QUEUE, data.template, { ...data, logId: log.id }, { delay: opts?.delay });
  } catch (err) {
    await prisma.emailLog
      .update({ where: { id: log.id }, data: { status: 'failed', error: 'enqueue failed' } })
      .catch(() => {});
    throw err;
  }
}

// ─── Convenience helpers ───

export function sendWelcomeEmail(to: string, firstName: string, tenantName: string) {
  return sendEmail({
    to,
    subject: `Welcome to ${tenantName}`,
    template: 'welcome',
    payload: { firstName, tenantName, loginUrl: `${process.env.WEB_URL}/auth/login` },
  });
}

export function sendPasswordResetEmail(to: string, resetToken: string) {
  return sendEmail({
    to,
    subject: 'Reset your password',
    template: 'password-reset',
    payload: { resetUrl: `${process.env.WEB_URL}/auth/reset-password?token=${resetToken}` },
  });
}

export function sendInvoiceEmail(to: string, invoiceId: string, amount: number, currency: string) {
  return sendEmail({
    to,
    subject: `Invoice #${invoiceId}`,
    template: 'invoice',
    payload: {
      invoiceId,
      amount,
      currency,
      viewUrl: `${process.env.WEB_URL}/app/billing/invoice/${invoiceId}`,
    },
  });
}

export function sendMaintenanceNotification(
  to: string,
  maintenanceTitle: string,
  startTime: string,
  affectedServices: string[]
) {
  return sendEmail({
    to,
    subject: `Scheduled Maintenance: ${maintenanceTitle}`,
    template: 'maintenance',
    payload: { maintenanceTitle, startTime, affectedServices },
  });
}
