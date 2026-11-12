/* apps/web/src/api/exceptions.ts — Phase 4 exception queue client. */
import { apiClient } from './client';

export interface ExceptionItem {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  detail?: string | null;
  recommendedAction?: string | null;
  actionUrl?: string | null;
  status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';
  ownerId?: string | null;
  assigneeId?: string | null;
  slaDueAt?: string | null;
  resolutionNote?: string | null;
  dismissReason?: string | null;
  createdAt: string;
  reservationId?: string | null;
  roomId?: string | null;
  paymentId?: string | null;
}

export interface ExceptionsData {
  generatedAt: string;
  items: ExceptionItem[];
  counts: Record<string, number>;
}

export async function listExceptions(status = 'active'): Promise<ExceptionsData> {
  const response = await apiClient.get('/v1/exceptions', { params: { status } });
  return response.data.data;
}
export async function ackException(id: string): Promise<void> {
  await apiClient.post(`/v1/exceptions/${id}/ack`, {});
}
export async function assignException(id: string): Promise<void> {
  await apiClient.post(`/v1/exceptions/${id}/assign`, {});
}
export async function resolveException(id: string, note?: string): Promise<void> {
  await apiClient.post(`/v1/exceptions/${id}/resolve`, { note });
}
export async function dismissException(id: string, reason: string): Promise<void> {
  await apiClient.post(`/v1/exceptions/${id}/dismiss`, { reason });
}
