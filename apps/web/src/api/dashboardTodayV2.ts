// Today v2 typed client (plan section 7.5 shape).
import { apiClient } from './client';

export interface TodayV2Ref {
  type: string;
  id: string;
}

export interface TodayV2Context {
  tenantId: string;
  property: { id: string; name: string };
  businessDate: string;
  timezone: string;
  currency: string;
  generatedAt: string;
}

export interface TodayV2Entitlements {
  sections: string[];
  actions: Record<string, boolean>;
  rolePriorities: string[];
}

export interface TodayV2Section {
  status: 'ready' | 'error';
  error?: string;
  computedAt?: string;
  [key: string]: any;
}

export interface TodayV2Response {
  context: TodayV2Context;
  entitlements: TodayV2Entitlements;
  sections: Record<string, TodayV2Section>;
}

export const fetchTodayV2 = (
  propertyId: string,
  opts?: { workRange?: string; page?: number; pageSize?: number }
): Promise<TodayV2Response> =>
  apiClient
    .get('/v1/dashboard/today/v2', { params: { propertyId, ...(opts ?? {}) } })
    .then((r) => (r.data as any).data as TodayV2Response);
