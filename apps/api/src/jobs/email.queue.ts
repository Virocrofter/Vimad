/* apps/api/src/jobs/email.queue.ts */
import { enqueue } from '../common/queue.js';

export const EMAIL_QUEUE = 'email';

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType?: string;
}

export interface EmailJobData {
  to: string;
  subject: string;
  template: 'welcome' | 'password-reset' | 'invoice' | 'maintenance' | 'generic';
  payload: Record<string, unknown>;
  attachments?: EmailAttachment[];
}

export async function sendEmail(data: EmailJobData, opts?: { delay?: number }): Promise<void> {
  await enqueue(EMAIL_QUEUE, data.template, data, {
    delay: opts?.delay,
  });
}

// Convenience helpers
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
