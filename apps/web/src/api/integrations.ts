// apps/web/src/api/integrations.ts
import { getApiClient } from './client';

export interface Integration {
  id: string;
  provider: string;
  name: string;
  description: string;
  category: 'payment' | 'accounting' | 'crm' | 'communication' | 'analytics' | 'channel' | 'other';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  config: Record<string, unknown>;
  webhooks?: {
    url: string;
    events: string[];
    secret?: string;
  }[];
  lastSyncAt?: string;
  lastSyncStatus?: 'success' | 'error' | 'partial';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationProvider {
  id: string;
  name: string;
  description: string;
  category: string;
  authType: 'oauth2' | 'api_key' | 'basic' | 'none';
  requiredConfig: {
    key: string;
    label: string;
    type: string;
    required: boolean;
    sensitive: boolean;
  }[];
  supportedOperations: string[];
  webhookSupport: boolean;
  logoUrl?: string;
  documentationUrl?: string;
}

export interface WebhookEvent {
  id: string;
  integrationId: string;
  event: string;
  payload: Record<string, unknown>;
  status: 'delivered' | 'failed' | 'pending' | 'retrying';
  attempts: number;
  lastAttemptAt?: string;
  responseStatus?: number;
  createdAt: string;
}

export interface IntegrationLog {
  id: string;
  integrationId: string;
  operation: string;
  status: 'success' | 'error' | 'warning';
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  errorMessage?: string;
  durationMs: number;
  createdAt: string;
}

const client = getApiClient();

export async function getIntegrations(params?: {
  category?: string;
  status?: string;
}): Promise<Integration[]> {
  return client.get('/admin/integrations', params);
}

export async function getIntegration(id: string): Promise<Integration> {
  return client.get(`/admin/integrations/${id}`);
}

export async function getAvailableProviders(): Promise<IntegrationProvider[]> {
  return client.get('/admin/integrations/providers');
}

export async function getProvider(id: string): Promise<IntegrationProvider> {
  return client.get(`/admin/integrations/providers/${id}`);
}

export async function connectIntegration(
  providerId: string,
  config: Record<string, unknown>
): Promise<Integration> {
  return client.post('/admin/integrations/connect', { providerId, config });
}

export async function disconnectIntegration(id: string): Promise<void> {
  return client.delete(`/admin/integrations/${id}`);
}

export async function updateIntegrationConfig(
  id: string,
  config: Record<string, unknown>
): Promise<Integration> {
  return client.patch(`/admin/integrations/${id}/config`, config);
}

export async function testIntegration(id: string): Promise<{ success: boolean; message: string }> {
  return client.post(`/admin/integrations/${id}/test`);
}

export async function syncIntegration(
  id: string
): Promise<{ success: boolean; recordsProcessed: number }> {
  return client.post(`/admin/integrations/${id}/sync`);
}

export async function getIntegrationLogs(
  integrationId: string,
  params?: { limit?: number; from?: string; to?: string }
): Promise<IntegrationLog[]> {
  return client.get(`/admin/integrations/${integrationId}/logs`, params);
}

export async function getWebhookEvents(
  integrationId?: string,
  params?: { limit?: number; status?: string }
): Promise<WebhookEvent[]> {
  return client.get('/admin/integrations/webhooks', { integrationId, ...params });
}

export async function retryWebhookEvent(id: string): Promise<WebhookEvent> {
  return client.post(`/admin/integrations/webhooks/${id}/retry`);
}

export async function configureWebhook(
  integrationId: string,
  config: { url: string; events: string[]; secret?: string }
): Promise<Integration> {
  return client.post(`/admin/integrations/${integrationId}/webhooks`, config);
}

export async function getIntegrationStats(): Promise<{
  total: number;
  connected: number;
  errors: number;
  last24hSyncs: number;
  pendingSyncs: number;
}> {
  return client.get('/admin/integrations/stats');
}
