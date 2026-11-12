// Feature flags v2 — full admin API client (/admin/feature-flags)
import { api } from './client';

export interface FlagVariant {
  name: string;
  value: unknown;
}
export interface SegmentRule {
  name?: string;
  all: Array<{ field: string; op: string; value: unknown }>;
  value?: unknown;
}

export interface FeatureFlag {
  id: string;
  key: string;
  description: string;
  owner: string;
  environment: string;
  status: 'active' | 'killed';
  valueType: 'boolean' | 'string' | 'number' | 'json';
  defaultValue: unknown;
  variants: FlagVariant[];
  failMode: 'open' | 'closed';
  protected: boolean;
  rolloutPct: number;
  segmentRules: SegmentRule[];
  killReason?: string | null;
  killedAt?: string | null;
  createdBy?: string;
  overridesCount: number;
  lastChangeAt?: string | null;
  lastChangeBy?: string | null;
}

export interface FlagOverride {
  id: string;
  flagId: string;
  tenantId: string;
  value: unknown;
  cohort?: string | null;
  createdBy?: string;
  reason?: string;
  createdAt: string;
  tenantSlug?: string;
  tenantName?: string;
}

export interface EvaluationResult {
  key: string;
  flagId: string;
  value: unknown;
  source: 'kill' | 'override' | 'segment' | 'rollout' | 'default';
  detail: string;
  hashPct?: number;
  valueType?: string;
}

export const listFlags = () => api.get('/admin/feature-flags');
export const getFlag = (id: string) => api.get(`/admin/feature-flags/${id}`);
export const createFlag = (payload: Record<string, unknown>) =>
  api.post('/admin/feature-flags', payload);
export const updateFlag = (id: string, payload: Record<string, unknown>) =>
  api.patch(`/admin/feature-flags/${id}`, payload);
export const setFlagDefault = (id: string, value: unknown, reason: string) =>
  api.post(`/admin/feature-flags/${id}/default`, { value, reason });
export const setRollout = (id: string, rolloutPct: number, reason: string) =>
  api.post(`/admin/feature-flags/${id}/rollout`, { rolloutPct, reason });
export const killFlag = (id: string, reason: string) =>
  api.post(`/admin/feature-flags/${id}/kill`, { reason });
export const restoreFlag = (id: string, reason: string) =>
  api.post(`/admin/feature-flags/${id}/restore`, { reason });
export const setOverride = (
  flagId: string,
  payload: { tenantId: string; value: unknown; reason: string }
) => api.post(`/admin/feature-flags/${flagId}/overrides`, payload);
export const deleteOverride = (overrideId: string, reason?: string) =>
  api.delete(
    `/admin/feature-flags/overrides/${overrideId}${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`
  );
export const deleteFlag = (id: string) => api.delete(`/admin/feature-flags/${id}`);
export const evaluateTenant = (tenantRef: string) =>
  api.get(`/admin/feature-flags/evaluate/${encodeURIComponent(tenantRef)}`);
export const bootstrapTenant = (tenantRef: string) =>
  api.get(`/admin/feature-flags/bootstrap/${encodeURIComponent(tenantRef)}`);
export const traceFlag = (flagId: string, tenantRef: string) =>
  api.get(`/admin/feature-flags/${flagId}/trace/${encodeURIComponent(tenantRef)}`);
export const listOverrides = () => api.get('/admin/feature-flags/overrides');
export const pushImpressions = (
  items: Array<{
    flagKey: string;
    tenantId: string;
    flagId?: string;
    on?: boolean;
    error?: boolean;
  }>
) => api.post('/admin/feature-flags/impressions', { items });
