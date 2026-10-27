/* apps/web/src/api/chainLoyalty.ts */
import { apiClient } from './client';

export const chainLoyaltyApi = {
  config: () => apiClient.get('/v1/chain-loyalty/config').then((r) => r.data),
  saveConfig: (payload: {
    earnRate?: number;
    redeemValue?: number;
    tiers?: { name: string; threshold: number }[];
  }) => apiClient.put('/v1/chain-loyalty/config', payload).then((r) => r.data),

  chain: () => apiClient.get('/v1/chain-loyalty/chain').then((r) => r.data),

  guestView: (guestId: string) =>
    apiClient.get(`/v1/chain-loyalty/guests/${guestId}`).then((r) => r.data),

  earn: (payload: { guestId: string; amount: number; propertyId?: string; description?: string }) =>
    apiClient.post('/v1/chain-loyalty/earn', payload).then((r) => r.data),

  redeem: (payload: {
    guestId: string;
    points: number;
    propertyId?: string;
    description?: string;
  }) => apiClient.post('/v1/chain-loyalty/redeem', payload).then((r) => r.data),

  guests: () =>
    apiClient.get('/v1/guests').then((r) => {
      const d = r.data;
      return Array.isArray(d) ? d : (d?.data ?? []);
    }),

  properties: () =>
    apiClient.get('/v1/properties').then((r) => {
      const d = r.data;
      return Array.isArray(d) ? d : (d?.data ?? []);
    }),
};

export default chainLoyaltyApi;
