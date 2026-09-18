/* apps/api/src/jobs/email.worker.ts */
import nodemailer, { type Transporter } from 'nodemailer';
import { createWorker } from '../common/queue.js';
import { logger } from '../common/logger.js';
import { env } from '../common/env.js';
import type { EmailJobData } from './email.queue.js';

const EMAIL_QUEUE = 'email';

// ─── Transport ───
// Provider selection (env.EMAIL_PROVIDER):
//   - "smtp"     → plain SMTP. Dev default targets MailHog (localhost:1025).
//   - "sendgrid" → SendGrid SMTP relay (smtp.sendgrid.net:587, apikey auth).
//   - "ses"      → AWS SES SMTP endpoint (SMTP_USER/SMTP_PASS = SES SMTP creds).
// Every provider goes through nodemailer so attachments/templates behave the same.

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const emailProvider = (env.EMAIL_PROVIDER as string | undefined) ?? 'smtp';

  switch (emailProvider) {
    case 'sendgrid': {
      if (!env.SENDGRID_API_KEY) {
        throw new Error('EMAIL_PROVIDER=sendgrid requires SENDGRID_API_KEY');
      }
      transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: { user: 'apikey', pass: env.SENDGRID_API_KEY },
        pool: true,
        maxConnections: 5,
      });
      break;
    }

    case 'ses': {
      // SES SMTP credentials are NOT the IAM keys — create them in the SES console.
      if (!env.SMTP_USER || !env.SMTP_PASS) {
        throw new Error(
          'EMAIL_PROVIDER=ses requires SMTP_USER and SMTP_PASS (SES SMTP credentials)'
        );
      }
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST, // e.g. email-smtp.us-east-1.amazonaws.com
        port: env.SMTP_PORT, // 587 (STARTTLS) or 465 (SSL)
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
        pool: true,
        maxConnections: 5,
      });
      break;
    }

    case 'smtp':
    default: {
      // Dev: MailHog (docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog)
      // Prod: any SMTP relay via env config.
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS ?? '' } } : {}),
        pool: true,
        maxConnections: 5,
      });
      break;
    }
  }

  transporter
    .verify()
    .then(() => logger.info({ provider: emailProvider }, 'email transport verified'))
    .catch((err) =>
      logger.warn(
        { err, provider: emailProvider },
        'email transport verification failed — emails will retry on send'
      )
    );

  return transporter;
}

async function deliver(
  to: string,
  subject: string,
  html: string,
  attachments?: EmailJobData['attachments']
): Promise<void> {
  const info = await getTransporter().sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.content, 'base64'),
      contentType: a.contentType,
    })),
  });

  logger.info(
    { to, subject, messageId: info.messageId, attachmentCount: attachments?.length ?? 0 },
    'email sent'
  );
}

function renderTemplate(
  template: EmailJobData['template'],
  payload: Record<string, unknown>
): string {
  const templates: Record<string, (p: typeof payload) => string> = {
    welcome: (p) => `
      <h1>Welcome, ${p.firstName}!</h1>
      <p>Your account for <strong>${p.tenantName}</strong> is ready.</p>
      <a href="${p.loginUrl}" style="padding:12px 24px;background:#863bff;color:#fff;border-radius:6px;text-decoration:none;">Log In</a>
    `,
    'password-reset': (p) => `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${p.resetUrl}" style="padding:12px 24px;background:#863bff;color:#fff;border-radius:6px;text-decoration:none;">Reset Password</a>
    `,
    invoice: (p) => `
      <h1>Invoice #${p.invoiceId}</h1>
      <p>Amount due: <strong>${p.amount} ${p.currency}</strong></p>
      <a href="${p.viewUrl}" style="padding:12px 24px;background:#863bff;color:#fff;border-radius:6px;text-decoration:none;">View Invoice</a>
    `,
    maintenance: (p) => `
      <h1>Scheduled Maintenance</h1>
      <p><strong>${p.maintenanceTitle}</strong></p>
      <p>Start: ${p.startTime}</p>
      <p>Affected: ${(p.affectedServices as string[]).join(', ')}</p>
    `,
    generic: (p) => `<p>${p.message ?? 'Notification from Vimad'}</p>`,
  };

  return (templates[template] ?? templates.generic)(payload);
}

export const emailWorker = createWorker<EmailJobData>(EMAIL_QUEUE, async (job) => {
  const { to, subject, template, payload, attachments } = job.data;
  const html = renderTemplate(template, payload);
  // Throwing here lets BullMQ retry with the configured exponential backoff,
  // and eventually lands in the dead-letter queue if the provider stays down.
  await deliver(to, subject, html, attachments);
});
