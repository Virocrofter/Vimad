// Flags — tenant-scoped consumption client (/v1/flags)
import { api } from './client';

export const evaluateMyFlags = () => api.get('/v1/flags/evaluate');
export const evaluateFlag = (key: string) =>
  api.get(`/v1/flags/evaluate/${encodeURIComponent(key)}`);
export const pushFlagImpressions = (
  items: Array<{
    flagKey: string;
    tenantId?: string;
    flagId?: string;
    on?: boolean;
    error?: boolean;
  }>
) => api.post('/v1/flags/impressions', { items });
