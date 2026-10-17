/* apps/web/src/api/inventory.ts — I1 sellable room inventory client.
 * Rides the shared axios apiClient: JWT + property scope are attached by
 * interceptors (getAccessToken / getCurrentPropertyId in client.ts). */
import { apiClient } from './client';

const unwrap = (r: any) => r?.data?.data ?? r?.data;

export const inventoryApi = {
  grid: (from: string, to: string) =>
    apiClient.get('/v1/inventory/grid', { params: { from, to } }).then(unwrap),

  setRestriction: (body: Record<string, unknown>) =>
    apiClient.put('/v1/inventory/restrictions', body).then(unwrap),

  listOverbooking: () => apiClient.get('/v1/inventory/overbooking').then(unwrap),

  setOverbooking: (roomTypeId: string, limit: number) =>
    apiClient.put('/v1/inventory/overbooking', { roomTypeId, limit }).then(unwrap),

  listAllocations: (params: Record<string, string> = {}) =>
    apiClient.get('/v1/inventory/allocations', { params }).then(unwrap),

  createAllocation: (body: Record<string, unknown>) =>
    apiClient.post('/v1/inventory/allocations', body).then(unwrap),

  releaseAllocation: (id: string) =>
    apiClient.patch(`/v1/inventory/allocations/${id}/release`, {}).then(unwrap),

  history: () => apiClient.get('/v1/inventory/history').then(unwrap),

  /** Push I1-computed availability (OOO/holds/adjustments/stop-sell aware) to all connected channels. */
  pushChannels: () => apiClient.post('/v1/inventory/push-channels', {}).then(unwrap),
};
