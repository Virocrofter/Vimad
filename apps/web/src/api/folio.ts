import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export interface Folio {
  id: string;
  reservationId: string;
  tenantId: string;
  status: 'open' | 'closed' | 'transferred';
  totalCharges: number;
  totalPayments: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
  items?: FolioItem[];
  reservation?: {
    id: string;
    confirmationNumber: string;
    guest: { firstName: string; lastName: string };
  };
}

export interface FolioItem {
  id: string;
  folioId: string;
  type: string;
  description: string;
  amount: number;
  quantity: number;
  postedAt: string;
  createdAt: string;
}

export interface ChargeInput {
  type: 'room_charge' | 'tax' | 'service' | 'incidental' | 'adjustment' | 'penalty';
  description: string;
  amount: number;
  quantity?: number;
  postedAt?: string;
}

export interface PaymentInput {
  type: 'cash' | 'card' | 'bank_transfer' | 'check' | 'voucher' | 'refund';
  description?: string;
  amount: number;
  reference?: string;
  processedAt?: string;
}

export async function listFolios(
  params?: PaginationParams & { reservationId?: string; status?: string }
): Promise<PaginatedResponse<Folio>> {
  const response = await apiClient.get<PaginatedResponse<Folio>>('/folios', { params });
  return response.data;
}

export async function getFolio(id: string): Promise<{ data: Folio }> {
  const response = await apiClient.get<{ data: Folio }>(`/folios/${id}`);
  return response.data;
}

export async function createFolio(input: {
  reservationId: string;
  type?: 'guest' | 'master' | 'split';
  name?: string;
}): Promise<{ data: Folio }> {
  const response = await apiClient.post<{ data: Folio }>('/folios', input);
  return response.data;
}

export async function postCharge(
  folioId: string,
  input: ChargeInput
): Promise<{ data: FolioItem }> {
  const response = await apiClient.post<{ data: FolioItem }>(`/folios/${folioId}/charges`, input);
  return response.data;
}

export async function postPayment(
  folioId: string,
  input: PaymentInput
): Promise<{ data: FolioItem }> {
  const response = await apiClient.post<{ data: FolioItem }>(`/folios/${folioId}/payments`, input);
  return response.data;
}

export async function reverseCharge(
  folioId: string,
  chargeId: string,
  reason: string
): Promise<{ data: FolioItem }> {
  const response = await apiClient.post<{ data: FolioItem }>(
    `/folios/${folioId}/charges/${chargeId}/reverse`,
    { reason }
  );
  return response.data;
}

export async function transferToCityLedger(folioId: string): Promise<{ data: Folio }> {
  const response = await apiClient.post<{ data: Folio }>(
    `/folios/${folioId}/transfer-to-city-ledger`
  );
  return response.data;
}

export async function deleteFolio(id: string): Promise<void> {
  await apiClient.delete(`/folios/${id}`);
}
