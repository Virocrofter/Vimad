/* apps/api/src/common/twilio.ts — T5: thin Twilio client (SMS + WhatsApp).
 * No SDK dependency — plain REST with Basic auth.
 *   SMS:      TWILIO_PHONE_NUMBER (E.164, e.g. +27123456789)
 *   WhatsApp: TWILIO_WHATSAPP_FROM (defaults to the shared sandbox sender;
 *             replace with your approved sender once WhatsApp Business is approved)
 */
import { logger } from './logger.js';

const SID = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const SMS_FROM = process.env.TWILIO_PHONE_NUMBER;
const WA_FROM = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886';

export type PushChannel = 'sms' | 'whatsapp';

export function twilioConfigured(channel: PushChannel): boolean {
  if (!SID || !TOKEN) return false;
  return channel === 'whatsapp' ? true : Boolean(SMS_FROM);
}

export interface PushMessage {
  to: string; // E.164-ish, normalized below
  body: string;
  channel: PushChannel;
}

export async function sendTwilioMessage({
  to,
  body,
  channel,
}: PushMessage): Promise<{ sid: string; channel: PushChannel }> {
  if (!SID || !TOKEN) {
    throw new Error('Twilio is not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)');
  }
  const toAddr = channel === 'whatsapp' ? `whatsapp:${normalizePhone(to)}` : normalizePhone(to);
  const from = channel === 'whatsapp' ? WA_FROM : SMS_FROM;
  if (!from) throw new Error('TWILIO_PHONE_NUMBER is not set — cannot send SMS');

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${SID}:${TOKEN}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: from, To: toAddr, Body: body }).toString(),
  });

  const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
  if (!res.ok || !data.sid) {
    logger.warn({ status: res.status, to: toAddr, channel }, `Twilio error: ${data.message}`);
    throw new Error(`Twilio: ${data.message ?? `request failed (${res.status})`}`);
  }

  logger.info({ sid: data.sid, channel, to: toAddr }, 'Twilio message sent');
  return { sid: data.sid, channel };
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.startsWith('+') ? digits : `+${digits}`;
}
