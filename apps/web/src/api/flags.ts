// Flags — tenant-scoped consumption client (/v1/flags)
import { api } from './client';

export interface FlagEvalPayload {
  values: Record<string, unknown>;
  meta: Record<string, { source: string; detail: string }>;
  generatedAt?: string;
  cached?: boolean;
}

export interface FlagEvalItem {
  key: string;
  value: unknown;
  source: string;
  detail: string;
}

export const evaluateMyFlags = () => api.get<FlagEvalPayload>('/v1/flags/evaluate');
export const evaluateFlag = (key: string) =>
  api.get<FlagEvalItem>(`/v1/flags/evaluate/${encodeURIComponent(key)}`);
export const pushFlagImpressions = (
  items: Array<{
    flagKey: string;
    tenantId?: string;
    flagId?: string;
    on?: boolean;
    error?: boolean;
  }>
) => api.post('/v1/flags/impressions', { items });
