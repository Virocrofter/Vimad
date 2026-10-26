/* apps/api/src/jobs/email.worker.ts */
import nodemailer, { type Transporter } from 'nodemailer';
import { createWorker } from '../common/queue.js';
import { prisma } from '../common/prisma.js';
import { logger } from '../common/logger.js';
import { env } from '../common/env.js';
import type { EmailJobData } from './email.queue.js';

const EMAIL_QUEUE = 'email';

// ─── Transport ───
// Provider selection (env.EMAIL_PROVIDER):
//   - "smtp"     → plain SMTP. Dev default targets MailHog (localhost:1025).
//   - "sendgrid" → SendGrid SMTP relay (smtp.sendgrid.net:587, apikey auth).
//   - "ses"      → AWS SES SMTP endpoint (SMTP_USER/SMTP_PASS = SES SMTP creds).

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
      // Dev: MailHog (docker compose service). Prod: any SMTP relay via env config.
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

const button = (href: string, label: string) => `
  <a href="${href}" style="display:inline-block;padding:14px 32px;background:#863bff;color:#ffffff;
     border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">${label}</a>`;

const shell = (title: string, inner: string) => `
  <div style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e;">
    <h1 style="font-size:22px;">${title}</h1>
    ${inner}
    <hr style="border:none;border-top:1px solid #eee;margin:28px 0;" />
    <p style="font-size:12px;color:#888;">Sent by ${env.EMAIL_FROM ?? 'your property management system'}.
       Please do not reply to this automated message.</p>
  </div>`;

function renderTemplate(
  template: EmailJobData['template'],
  payload: Record<string, unknown>
): string {
  const p = payload as Record<string, string>;
  const templates: Record<string, (p: Record<string, string>) => string> = {
    welcome: (p) => `
      <h1>Welcome, ${p.firstName}!</h1>
      <p>Your account for <strong>${p.tenantName}</strong> is ready.</p>
      ${button(p.loginUrl, 'Log In')}
    `,
    'password-reset': (p) => `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      ${button(p.resetUrl, 'Reset Password')}
    `,
    invoice: (p) => `
      <h1>Invoice #${p.invoiceId}</h1>
      <p>Amount due: <strong>${p.amount} ${p.currency}</strong></p>
      ${button(p.viewUrl, 'View Invoice')}
    `,
    'payment-request': (p) => `
      <div style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e;">
        <h1 style="font-size:22px;">${p.isReminder === 'true' ? 'Friendly reminder: your deposit is due' : 'Secure your reservation'}</h1>
        <p>Hi ${p.guestName},</p>
        <p>To secure your upcoming stay at <strong>${p.propertyName}</strong>
           (reservation <strong>${p.confirmationNumber}</strong>, arriving ${p.arrivalDate}),
           please pay your deposit of <strong>${p.currency} ${p.amount}</strong> by
           <strong>${p.dueDate}</strong>.</p>
        <p style="background:#f8f7fc;border-radius:8px;padding:14px 18px;">${p.description}</p>
        <div style="text-align:center;margin:28px 0;">${button(p.payUrl, `Pay ${p.currency} ${p.amount}`)}</div>
        <p style="font-size:12px;color:#888;">This is a secure payment page hosted by Paystack.
           We never see or store your card number. If the button doesn't work, copy this link:
           <br/><a href="${p.payUrl}">${p.payUrl}</a></p>
        ${p.isReminder === 'true' ? '<p style="color:#b45309;"><strong>Please note:</strong> unpaid reservations may be automatically released.</p>' : ''}
      </div>
    `,
    'reservation-confirmation': (p) =>
      shell(
        'Your reservation is confirmed',
        `
      <p>Hi ${p.guestName},</p>
      <p>Your stay at <strong>${p.propertyName}</strong> is confirmed.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;color:#888;">Confirmation #</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;">${p.confirmationNumber}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Arrival</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;">${p.arrivalDate}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Departure</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;">${p.departureDate}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Room</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;">${p.roomLabel}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Guests</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;">${p.partyLabel}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Balance on arrival</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;">${p.balanceLabel}</td></tr>
      </table>
      <p style="font-size:13px;color:#555;">Check-in is from 14:00 on your arrival day. Please bring a
         valid ID matching the reservation name.</p>
      <p style="font-size:13px;color:#555;">Plans changed? You can cancel free of charge up to 48 hours
         before check-in: <a href="${p.cancelUrl}" style="color:#863bff;">Cancel booking</a></p>
    `
      ),
    'pre-arrival': (p) =>
      shell(
        'See you tomorrow',
        `
      <p>Hi ${p.guestName},</p>
      <p>Your stay at <strong>${p.propertyName}</strong> (reservation
         <strong>${p.confirmationNumber}</strong>) starts on <strong>${p.arrivalDate}</strong>.
         We look forward to welcoming you.</p>
      <ul style="padding-left:18px;font-size:14px;line-height:1.7;">
        <li>Check-in from 14:00 · Check-out by 10:00</li>
        <li>Balance on arrival: <strong>${p.balanceLabel}</strong></li>
        <li>Bring a valid ID matching the reservation name</li>
      </ul>
      <p style="font-size:13px;color:#555;">If your plans have changed, please reply to
         ${p.propertyName} as soon as possible so we can release the room.</p>
    `
      ),
    'payment-receipt': (p) =>
      shell(
        'Payment received — thank you',
        `
      <p>Hi ${p.guestName},</p>
      <p>We've received your payment for reservation
         <strong>${p.confirmationNumber}</strong> at <strong>${p.propertyName}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;color:#888;">Amount</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;">${p.currency} ${p.amount}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Type</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;">${p.typeLabel}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Reference</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;">${p.reference}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Date</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;">${p.paidAt}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Remaining balance</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;">${p.balanceLabel}</td></tr>
      </table>
      <p style="font-size:13px;color:#555;">This email serves as your payment receipt.</p>
    `
      ),
    'folio-email': (p) =>
      shell(
        `Your folio — ${p.propertyName}`,
        `
      <p>Hi ${p.guestName},</p>
      <p>Here is the current folio for reservation <strong>${p.confirmationNumber}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">
        <thead>
          <tr style="border-bottom:1px solid #ddd;">
            <th style="text-align:left;padding:6px 0;color:#888;">Date</th>
            <th style="text-align:left;padding:6px 0;color:#888;">Description</th>
            <th style="text-align:right;padding:6px 0;color:#888;">Amount</th>
          </tr>
        </thead>
        <tbody>${p.itemsHtml ?? ''}</tbody>
        <tfoot>
          <tr style="border-top:2px solid #1a1a2e;">
            <td colspan="2" style="padding:8px 0;font-weight:700;">Balance</td>
            <td style="padding:8px 0;text-align:right;font-weight:700;">${p.balanceLabel}</td>
          </tr>
        </tfoot>
      </table>
    `
      ),
    'booking-cancelled': (p) =>
      shell(
        'Your booking has been cancelled',
        `
      <p>Hi ${p.guestName},</p>
      <p>Your booking <strong>${p.confirmationNumber}</strong> at <strong>${p.propertyName}</strong>
         (arriving ${p.arrivalDate}) has been cancelled. Any deposit already paid will be refunded
         to the original card within 5–7 business days.</p>
      <p style="font-size:13px;color:#555;">If you didn't request this cancellation, please contact
         ${p.propertyName} immediately.</p>
    `
      ),
    'tax-invoice': (p) =>
      shell(
        `Tax Invoice ${p.number} — ${p.propertyName}`,
        `
      <p>Hi ${p.guestName},</p>
      <p>Please find your <strong>tax invoice ${p.number}</strong> from
         <strong>${p.propertyName}</strong>, issued ${p.issueDate}, for
         <strong>${p.totalLabel}</strong> (VAT inclusive).</p>
      <p>Balance due: <strong>${p.balanceLabel}</strong>. Payment can be made at the property
         or via the payment link in your confirmation email.</p>
      <p style="font-size:13px;color:#555;">VAT is charged at 15% as required by SARS. Keep this
         invoice for your records.</p>
    `
      ),
    receipt: (p) =>
      shell(
        `Receipt ${p.number} — ${p.propertyName}`,
        `
      <p>Hi ${p.guestName},</p>
      <p>Thank you — we received your payment of <strong>${p.totalLabel}</strong>.
         Receipt <strong>${p.number}</strong> from <strong>${p.propertyName}</strong>,
         issued ${p.issueDate}.</p>
      <p style="font-size:13px;color:#555;">This receipt is a computer-generated tax document
         and requires no signature.</p>
    `
      ),
    'credit-note': (p) =>
      shell(
        `Credit Note ${p.number} — ${p.propertyName}`,
        `
      <p>Hi ${p.guestName},</p>
      <p>A credit note <strong>${p.number}</strong> has been issued against
         <strong>${p.originalNumber}</strong> from <strong>${p.propertyName}</strong>,
         dated ${p.issueDate}.</p>
      <p>Reason: ${p.reason}</p>
      <p>Credit amount: <strong>${p.totalLabel}</strong> (VAT inclusive).</p>
      <p style="font-size:13px;color:#555;">Any payment already made against the original
         invoice will be refunded to the original card within 5–7 business days.</p>
    `
      ),
    'group-confirmation': (p) => `
      <div style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e;">
        <h1 style="font-size:22px;">Group block confirmed</h1>
        <p>Hi ${p.contactName},</p>
        <p>Your group block <strong>${p.groupCode}</strong> (${p.groupName}) at
           <strong>${p.propertyName}</strong> is confirmed.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#888;">Arrival</td>
              <td style="padding:8px 0;text-align:right;font-weight:600;">${p.arrival}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Departure</td>
              <td style="padding:8px 0;text-align:right;font-weight:600;">${p.departure}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Room cut-off</td>
              <td style="padding:8px 0;text-align:right;font-weight:600;">${p.cutOff}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Block type</td>
              <td style="padding:8px 0;text-align:right;font-weight:600;">${p.blockType}</td></tr>
        </table>
        <p style="white-space:pre-line;background:#f8f7fc;border-radius:8px;padding:14px 18px;">${p.blockLines}</p>
        <p style="font-size:13px;color:#555;">Rooms not picked up by the cut-off date may be
           released back to general inventory per the block agreement. To add guests to the
           rooming list, reply to this email or contact the property directly.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:28px 0;" />
        <p style="font-size:12px;color:#888;">Sent by ${env.EMAIL_FROM ?? 'your property management system'}.
           Please do not reply to this automated message.</p>
      </div>
    `,
    maintenance: (p) => `
      <h1>Scheduled Maintenance</h1>
      <p><strong>${p.maintenanceTitle}</strong></p>
      <p>Start: ${p.startTime}</p>
      <p>Affected: ${(p.affectedServices as unknown as string[]).join(', ')}</p>
    `,
    'ar-overdue-reminder': (p) => `
      <div style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e;">
        <h1 style="font-size:22px;">Payment reminder</h1>
        <p>Dear ${p.accountName},</p>
        <p>Our records show invoice <strong>${p.invoiceNumber}</strong> for
           <strong>${p.currency} ${p.amount}</strong> was due on
           <strong>${p.dueDate}</strong> and remains outstanding.</p>
        <p>Please arrange payment at your earliest convenience. If payment is
           already on its way, please disregard this reminder.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:28px 0;" />
        <p style="font-size:12px;color:#888;">Sent by ${env.EMAIL_FROM ?? 'your property management system'}.
           Please do not reply to this automated message.</p>
      </div>
    `,
    generic: (p) => `<p>${p.message ?? 'Notification from Vimad'}</p>`,
  };

  return (templates[template] ?? templates.generic)(p);
}

export const emailWorker = createWorker<EmailJobData>(EMAIL_QUEUE, async (job) => {
  const { to, subject, template, payload, attachments, logId } = job.data;
  const html = renderTemplate(template, payload);

  try {
    // Throwing here lets BullMQ retry with exponential backoff → DLQ on permanent failure.
    await deliver(to, subject, html, attachments);
    if (logId) {
      await prisma.emailLog
        .update({ where: { id: logId }, data: { status: 'sent', sentAt: new Date(), error: null } })
        .catch(() => {});
    }
  } catch (err) {
    if (logId) {
      await prisma.emailLog
        .update({
          where: { id: logId },
          data: { status: 'failed', error: String(err).slice(0, 500) },
        })
        .catch(() => {});
    }
    throw err;
  }
});
