// apps/web/src/api/feature-flags.ts
import { getApiClient } from './client';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  type: 'boolean' | 'string' | 'number' | 'json';
  defaultValue: unknown;
  rules: {
    id: string;
    name: string;
    condition: Record<string, unknown>;
    value: unknown;
    percentage?: number;
    startAt?: string;
    endAt?: string;
  }[];
  environments: {
    environment: string;
    enabled: boolean;
    value?: unknown;
  }[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagEvaluation {
  flagKey: string;
  value: unknown;
  ruleId?: string;
  reason: 'default' | 'rule_match' | 'percentage' | 'disabled';
}

export interface FeatureFlagAudit {
  id: string;
  flagId: string;
  action: 'created' | 'updated' | 'deleted' | 'toggled' | 'rule_changed';
  actorId: string;
  actorName: string;
  previousValue?: unknown;
  newValue?: unknown;
  createdAt: string;
}

const client = getApiClient();

export async function getFeatureFlags(params?: {
  environment?: string;
  tag?: string;
}): Promise<FeatureFlag[]> {
  return client.get('/admin/feature-flags', params);
}

export async function getFeatureFlag(id: string): Promise<FeatureFlag> {
  return client.get(`/admin/feature-flags/${id}`);
}

export async function getFeatureFlagByKey(key: string): Promise<FeatureFlag> {
  return client.get(`/admin/feature-flags/key/${key}`);
}

export async function createFeatureFlag(
  data: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>
): Promise<FeatureFlag> {
  return client.post('/admin/feature-flags', data);
}

export async function updateFeatureFlag(
  id: string,
  data: Partial<FeatureFlag>
): Promise<FeatureFlag> {
  return client.patch(`/admin/feature-flags/${id}`, data);
}

export async function deleteFeatureFlag(id: string): Promise<void> {
  return client.delete(`/admin/feature-flags/${id}`);
}

export async function toggleFeatureFlag(
  id: string,
  environment: string,
  enabled: boolean
): Promise<FeatureFlag> {
  return client.post(`/admin/feature-flags/${id}/toggle`, { environment, enabled });
}

export async function evaluateFeatureFlag(
  key: string,
  context: Record<string, unknown>
): Promise<FeatureFlagEvaluation> {
  return client.post(`/admin/feature-flags/evaluate`, { key, context });
}

export async function evaluateFeatureFlags(
  context: Record<string, unknown>
): Promise<Record<string, FeatureFlagEvaluation>> {
  return client.post('/admin/feature-flags/evaluate-all', context);
}

export async function getFeatureFlagHistory(id: string): Promise<FeatureFlagAudit[]> {
  return client.get(`/admin/feature-flags/${id}/history`);
}

export async function addRule(
  flagId: string,
  rule: Omit<FeatureFlag['rules'][0], 'id'>
): Promise<FeatureFlag> {
  return client.post(`/admin/feature-flags/${flagId}/rules`, rule);
}

export async function updateRule(
  flagId: string,
  ruleId: string,
  rule: Partial<FeatureFlag['rules'][0]>
): Promise<FeatureFlag> {
  return client.patch(`/admin/feature-flags/${flagId}/rules/${ruleId}`, rule);
}

export async function deleteRule(flagId: string, ruleId: string): Promise<FeatureFlag> {
  return client.delete(`/admin/feature-flags/${flagId}/rules/${ruleId}`);
}

export async function getFeatureFlagTags(): Promise<string[]> {
  return client.get('/admin/feature-flags/tags');
}

export async function bulkToggle(
  flagIds: string[],
  environment: string,
  enabled: boolean
): Promise<{ updated: number }> {
  return client.post('/admin/feature-flags/bulk-toggle', { flagIds, environment, enabled });
}

export async function cloneFeatureFlag(id: string, newKey: string): Promise<FeatureFlag> {
  return client.post(`/admin/feature-flags/${id}/clone`, { newKey });
}
