/* apps/web/src/api/channel.ts — channel manager client
 * Payloads match channel.service.ts zod schemas exactly:
 * channelConnectSchema / availabilityPushSchema / ratesPushSchema.
 */
import { apiClient } from './client';

export interface ChannelConnection {
  id: string;
  tenantId: string;
  propertyId: string;
  provider: string;
  hotelId: string;
  endpoint: string | null;
  status: string; // pending | active | error | disconnected
  lastSyncStatus: string | null;
  lastSyncAt: string | null;
  connectedAt: string | null;
  disconnectedAt: string | null;
  property?: { id: string; name: string } | null;
}

export interface ChannelStats {
  totalConnections: number;
  active: number;
  syncing: number;
  failed: number;
}

export interface ChannelStatus {
  connections: ChannelConnection[];
  stats: ChannelStats;
}

/* channelConnectSchema: provider / propertyId / credentials{...} / settings? */
export interface ConnectChannelInput {
  propertyId: string;
  provider: string;
  credentials: {
    apiKey: string;
    apiSecret?: string;
    hotelId: string;
    endpoint?: string;
  };
  settings?: {
    syncInterval?: number;
    autoConfirm?: boolean;
  };
}

/* availabilityPushSchema / ratesPushSchema: propertyId / channelIds? / dateFrom / dateTo / roomTypes?|ratePlans? */
export interface PushAvailabilityInput {
  propertyId: string;
  channelIds?: string[];
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
  roomTypes?: string[];
}

export interface PushRatesInput {
  propertyId: string;
  channelIds?: string[];
  dateFrom: string;
  dateTo: string;
  ratePlans?: string[];
}

export const CHANNEL_PROVIDERS = [
  { value: 'bookingcom', label: 'Booking.com' },
  { value: 'expedia', label: 'Expedia' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'agoda', label: 'Agoda' },
  { value: 'tripcom', label: 'Trip.com' },
  { value: 'vrbo', label: 'Vrbo' },
  { value: 'custom', label: 'Custom / API' },
] as const;

export const channelApi = {
  status: (): Promise<ChannelStatus> => apiClient.get('/channel/status').then((r) => r.data.data),

  list: (): Promise<ChannelConnection[]> =>
    apiClient.get('/channel/channels').then((r) => r.data.data),

  connect: (input: ConnectChannelInput): Promise<ChannelConnection> =>
    apiClient.post('/channel/connect', input).then((r) => r.data.data),

  disconnect: (channelId: string): Promise<void> =>
    apiClient.post(`/channel/${channelId}/disconnect`).then(() => undefined),

  pushAvailability: (input: PushAvailabilityInput): Promise<unknown> =>
    apiClient.post('/channel/push/availability', input).then((r) => r.data.data),

  pushRates: (input: PushRatesInput): Promise<unknown> =>
    apiClient.post('/channel/push/rates', input).then((r) => r.data.data),

  syncReservations: (channelId?: string): Promise<unknown[]> =>
    apiClient.post('/channel/sync/reservations', { channelId }).then((r) => r.data.data),
};
