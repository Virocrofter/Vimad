/* apps/web/src/api/payments.ts */
import { apiGet, apiPost, apiDelete } from './client';

export interface PaymentConfig {
  publicKey: string | null;
  currency: string;
  configured: boolean;
}

export interface Payment {
  id: string;
  reference: string;
  type: string;
  status: string;
  amountMinor: number;
  currency: string;
  refundedMinor: number;
  feeMinor: number;
  channel: string;
  cardLast4: string | null;
  cardBrand: string | null;
  postedToFolio: boolean;
  failureReason: string | null;
  createdAt: string;
  guest?: { id: string; firstName: string; lastName: string } | null;
  reservation?: { id: string; confirmationNumber: string } | null;
}

export interface SavedCard {
  id: string;
  cardType: string | null;
  cardLast4: string;
  cardExpMonth: string | null;
  cardExpYear: string | null;
  bank: string | null;
  isDefault: boolean;
}

export const getPaymentConfig = () => apiGet<PaymentConfig>('/v1/payments/config');

export const listPayments = (params: Record<string, unknown>) =>
  apiGet<{ data: Payment[]; meta: any; summary: any }>('/v1/payments', params);

export const initializePayment = (body: Record<string, unknown>) =>
  apiPost<{ data: { reference: string; authorizationUrl: string } }>(
    '/v1/payments/initialize',
    body
  );

export const verifyPayment = (reference: string) =>
  apiGet<{ data: Payment }>(`/v1/payments/verify/${encodeURIComponent(reference)}`);

export const chargeSavedCard = (body: Record<string, unknown>) =>
  apiPost<{ data: Payment }>('/v1/payments/charge', body);

export const refundPayment = (id: string, body: { amountMinor?: number; reason?: string }) =>
  apiPost<{ data: Payment }>(`/v1/payments/${id}/refund`, body);

export const recordVccCharge = (body: Record<string, unknown>) =>
  apiPost<{ data: Payment }>('/v1/payments/vcc-charge', body);

export const listGuestPaymentMethods = (guestId: string) =>
  apiGet<{ data: SavedCard[] }>(`/v1/payments/guests/${encodeURIComponent(guestId)}/methods`);

export const removePaymentMethod = (id: string) =>
  apiDelete(`/v1/payments/methods/${encodeURIComponent(id)}`);
