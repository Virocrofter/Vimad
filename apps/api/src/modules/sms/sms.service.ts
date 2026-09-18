/* apps/api/src/modules/sms/sms.service.ts */
import { z } from 'zod';
import twilio, { type Twilio } from 'twilio';
import { logger } from '../../common/logger.js';
import { env } from '../../common/env.js';

// Twilio client is a lazy singleton — one REST client per process.
// When credentials are absent (dev), messages are logged, not sent.

const SMS_ENABLED = Boolean(
  env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER
);

let client: Twilio | null = null;

function getClient(): Twilio {
  if (!client) {
    client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

export const smsSendSchema = z.object({
  to: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Must be E.164 format (+1234567890)'),
  body: z.string().min(1).max(1600),
  templateId: z.string().optional(), // for template-based messages
  variables: z.record(z.string(), z.string()).optional(),
});

export type SmsSendInput = z.infer<typeof smsSendSchema>;

export interface SmsTemplate {
  id: string;
  name: string;
  body: string;
  variables: string[];
}

// Pre-defined templates for hospitality use cases
export const SMS_TEMPLATES: Record<string, SmsTemplate> = {
  'booking-confirmation': {
    id: 'booking-confirmation',
    name: 'Booking Confirmation',
    body: 'Hi {{guestName}}, your reservation {{confirmationNumber}} at {{propertyName}} is confirmed. Check-in: {{arrivalDate}}. We look forward to welcoming you!',
    variables: ['guestName', 'confirmationNumber', 'propertyName', 'arrivalDate'],
  },
  'check-in-code': {
    id: 'check-in-code',
    name: 'Mobile Check-in Code',
    body: 'Your mobile check-in code for {{propertyName}} is: {{code}}. Room: {{roomNumber}}. Valid from {{arrivalDate}}. Do not share this code.',
    variables: ['propertyName', 'code', 'roomNumber', 'arrivalDate'],
  },
  'check-in-reminder': {
    id: 'check-in-reminder',
    name: 'Check-in Reminder',
    body: 'Reminder: Your check-in at {{propertyName}} is tomorrow ({{arrivalDate}}). Confirmation: {{confirmationNumber}}. Reply HELP for assistance.',
    variables: ['propertyName', 'arrivalDate', 'confirmationNumber'],
  },
  'checkout-reminder': {
    id: 'checkout-reminder',
    name: 'Checkout Reminder',
    body: 'Thank you for staying with us at {{propertyName}}! Checkout is at 11:00 AM today. We hope you enjoyed your stay. Safe travels!',
    variables: ['propertyName'],
  },
  'room-ready': {
    id: 'room-ready',
    name: 'Room Ready Notification',
    body: 'Great news! Your room {{roomNumber}} at {{propertyName}} is ready for early check-in. Head to the front desk when you arrive.',
    variables: ['roomNumber', 'propertyName'],
  },
};

export async function sendSms(
  input: SmsSendInput
): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!SMS_ENABLED) {
    logger.warn(
      { to: input.to, bodyLength: input.body.length },
      'SMS not configured (set TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_PHONE_NUMBER) — message logged, not sent'
    );
    return { success: true, sid: `mock-${Date.now()}` };
  }

  try {
    const message = await getClient().messages.create({
      body: input.body,
      from: env.TWILIO_PHONE_NUMBER,
      to: input.to,
      ...(env.TWILIO_STATUS_CALLBACK_URL ? { statusCallback: env.TWILIO_STATUS_CALLBACK_URL } : {}),
    });

    logger.info({ to: input.to, sid: message.sid, status: message.status }, 'SMS sent');
    return { success: true, sid: message.sid };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Twilio errors carry a machine-readable code (e.g. 21211 invalid number,
    // 21614 unsubscribed) — keep it in the logs for support triage.
    const code = (err as { code?: number }).code;
    logger.error({ err, to: input.to, twilioCode: code }, 'SMS send failed');
    return { success: false, error: message };
  }
}

export function renderTemplate(templateId: string, variables: Record<string, string>): string {
  const template = SMS_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  let body = template.body;
  for (const [key, value] of Object.entries(variables)) {
    body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  // Check for unreplaced variables
  const unreplaced = body.match(/{{\w+}}/g);
  if (unreplaced) {
    logger.warn({ templateId, unreplaced }, 'unreplaced template variables');
  }

  return body;
}

export async function sendTemplatedSms(
  to: string,
  templateId: string,
  variables: Record<string, string>
): Promise<{ success: boolean; sid?: string; error?: string }> {
  const body = renderTemplate(templateId, variables);
  return sendSms({ to, body, templateId, variables });
}

export async function sendBookingConfirmation(
  phone: string,
  data: {
    guestName: string;
    confirmationNumber: string;
    propertyName: string;
    arrivalDate: string;
  }
): Promise<{ success: boolean; sid?: string; error?: string }> {
  return sendTemplatedSms(phone, 'booking-confirmation', data);
}

export async function sendCheckInCode(
  phone: string,
  data: {
    propertyName: string;
    code: string;
    roomNumber: string;
    arrivalDate: string;
  }
): Promise<{ success: boolean; sid?: string; error?: string }> {
  return sendTemplatedSms(phone, 'check-in-code', data);
}
