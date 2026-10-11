/* apps/api/src/common/paystack.ts
 * Thin Paystack REST client. Card numbers never touch this server —
 * tokenization happens on Paystack's hosted checkout / inline popup.
 */
import crypto from 'node:crypto';
import { env } from './env.js';
import { AppError } from './errors.js';
import { logger } from './logger.js';

const BASE_URL = 'https://api.paystack.co';

export interface PaystackAuthorization {
  authorization_code: string;
  card_type?: string;
  brand?: string;
  last4?: string;
  exp_month?: string;
  exp_year?: string;
  bank?: string;
  channel?: string;
  reusable?: boolean;
  signature?: string;
}

export interface PaystackCustomer {
  id?: number;
  customer_code?: string;
  email?: string;
}

export interface PaystackTransaction {
  id: number;
  reference: string;
  status: 'success' | 'failed' | 'pending' | 'abandoned' | string;
  amount: number; // minor units
  currency: string;
  fees?: number;
  channel?: string;
  gateway_response?: string;
  message?: string;
  paid_at?: string;
  authorization?: PaystackAuthorization;
  customer?: PaystackCustomer;
  amount_refunded?: number;
}

export interface PaystackPaymentRequest {
  id: number;
  request_code: string;
  reference: string;
  status: 'pending' | 'success' | 'failed' | 'ongoing' | string;
  currency: string;
  amount: number; // minor units
  fees: number | null;
  description: string | null;
  paid: boolean;
  offline_reference: string;
  customer?: PaystackCustomer;
  created_at: string;
}

async function paystackFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new AppError(503, 'Paystack is not configured', 'PAYMENTS_NOT_CONFIGURED');
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const body = (await res.json().catch(() => null)) as {
    status: boolean;
    message: string;
    data?: T;
  } | null;

  if (!res.ok || !body?.status) {
    logger.warn({ path, status: res.status, message: body?.message }, 'Paystack API error');
    throw new AppError(
      502,
      body?.message ?? `Paystack request failed (${res.status})`,
      'PAYSTACK_ERROR'
    );
  }

  return body.data as T;
}

// ─── Initialize a hosted checkout / transaction ───

export async function initializeTransaction(input: {
  email: string;
  amountMinor: number;
  currency: string;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ authorization_url: string; access_code: string; reference: string }> {
  return paystackFetch('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      amount: input.amountMinor,
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
}

// ─── Verify a transaction after callback/webhook ───

export async function verifyTransaction(reference: string): Promise<PaystackTransaction> {
  return paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
}

// ─── Fetch full transaction record (for refund reconciliation) ───

export async function fetchTransaction(transactionId: number): Promise<PaystackTransaction> {
  return paystackFetch(`/transaction/${transactionId}`);
}

// ─── Charge a reusable authorization (saved card, no guest present) ───

export async function chargeAuthorization(input: {
  authorizationCode: string;
  email: string;
  amountMinor: number;
  currency: string;
  reference: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackTransaction> {
  return paystackFetch('/transaction/charge_authorization', {
    method: 'POST',
    body: JSON.stringify({
      authorization_code: input.authorizationCode,
      email: input.email,
      amount: input.amountMinor,
      currency: input.currency,
      reference: input.reference,
      metadata: input.metadata,
    }),
  });
}

// ─── Refund ───

export async function createRefund(input: {
  transactionId: number;
  amountMinor?: number; // omit = full refund
  currency?: string;
}): Promise<{ refundId: number }> {
  const data = await paystackFetch<{ id: number }>('/refund', {
    method: 'POST',
    body: JSON.stringify({
      transaction: input.transactionId,
      ...(input.amountMinor ? { amount: input.amountMinor, currency: input.currency } : {}),
    }),
  });
  return { refundId: data.id };
}

// ─── Customers (Payment Requests require an existing customer code) ───

export async function ensurePaystackCustomer(email: string, name?: string): Promise<string> {
  const parts = (name ?? '').trim().split(/\s+/);
  try {
    const created = await paystackFetch<PaystackCustomer>('/customer', {
      method: 'POST',
      body: JSON.stringify({
        email,
        first_name: parts[0] ?? '',
        last_name: parts.slice(1).join(' '),
      }),
    });
    if (created.customer_code) return created.customer_code;
  } catch {
    // Customer likely already exists — resolve below.
  }

  for (let page = 1; page <= 5; page++) {
    const res = await paystackFetch<{ data: PaystackCustomer[] }>(
      `/customer?perPage=100&page=${page}`
    );
    const hit = res.data?.find((c) => c.email?.toLowerCase() === email.toLowerCase());
    if (hit?.customer_code) return hit.customer_code;
    if (!res.data || res.data.length < 100) break;
  }

  throw new AppError(502, 'Could not resolve Paystack customer for this guest', 'PAYSTACK_ERROR');
}

// ─── Payment Request (hosted pay-now link emailed to the guest) ───
// Guest pays on Paystack's hosted page; the resulting charge fires a
// charge.success webhook carrying our metadata.reference for reconciliation.

export function paymentRequestHostedUrl(offlineReference: string): string {
  return `https://paystack.com/pay/${offlineReference}`;
}

export async function createPaystackPaymentRequest(input: {
  customerEmail: string; // customer CODE (or legacy email) — use ensurePaystackCustomer first
  amountMinor: number;
  currency: string;
  dueDate: Date;
  description: string;
  reference: string; // internal reference — echoed back in webhook metadata
  metadata?: Record<string, unknown>;
}): Promise<PaystackPaymentRequest> {
  return paystackFetch('/paymentrequest', {
    method: 'POST',
    body: JSON.stringify({
      customer: input.customerEmail,
      amount: input.amountMinor,
      currency: input.currency,
      due_date: input.dueDate.toISOString().slice(0, 10),
      description: input.description,
      metadata: { reference: input.reference, ...(input.metadata ?? {}) },
    }),
  });
}

export async function fetchPaystackPaymentRequest(
  requestCode: string
): Promise<PaystackPaymentRequest> {
  return paystackFetch(`/paymentrequest/${encodeURIComponent(requestCode)}`);
}

// ─── Webhook signature (HMAC-SHA512 of raw body with secret key) ───

export function verifyWebhookSignature(
  rawBody: Buffer,
  signature?: string | string[] | null
): boolean {
  if (!signature || Array.isArray(signature)) return false;
  const secret = env.PAYSTACK_WEBHOOK_SECRET || env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;

  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  const incoming = signature.trim();

  // Timing-safe compare; also tolerate hex casing differences.
  const a = Buffer.from(expected.toLowerCase(), 'utf8');
  const b = Buffer.from(incoming.toLowerCase(), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ─── Reference generator (unique per charge; URL-safe) ───

export function newReference(prefix = 'PSK'): string {
  const rand = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `${prefix}-${Date.now()}-${rand}`;
}
