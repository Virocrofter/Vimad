// apps/web/src/api/profiler.ts
import { getApiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export interface SlowQuery {
  id: string;
  query: string;
  durationMs: number;
  rowsAffected: number;
  source: string;
  userId?: string;
  tenantId?: string;
  createdAt: string;
  stackTrace?: string;
  optimizationSuggestion?: string;
}

export interface EndpointPerformance {
  path: string;
  method: string;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestCount: number;
  errorRate: number;
  lastAccessed: string;
}

export interface DatabaseStats {
  tableName: string;
  rowCount: number;
  tableSize: string;
  indexSize: string;
  lastVacuum: string;
  lastAnalyze: string;
  bloatRatio: number;
}

const client = getApiClient();

export async function getSlowQueries(
  params?: PaginationParams & {
    minDuration?: number;
    source?: string;
  }
): Promise<PaginatedResponse<SlowQuery>> {
  return client.get('/admin/profiler/slow-queries', params);
}

export async function getEndpointPerformance(
  params?: PaginationParams
): Promise<PaginatedResponse<EndpointPerformance>> {
  return client.get('/admin/profiler/endpoints', params);
}

export async function getDatabaseStats(): Promise<DatabaseStats[]> {
  return client.get('/admin/profiler/database-stats');
}

export async function explainQuery(query: string): Promise<{
  plan: string;
  estimatedCost: number;
  suggestions: string[];
}> {
  return client.post('/admin/profiler/explain', { query });
}

export async function getProfilerSummary(): Promise<{
  totalSlowQueries: number;
  avgResponseTime: number;
  topEndpoints: EndpointPerformance[];
  databaseSize: string;
  cacheHitRatio: number;
}> {
  return client.get('/admin/profiler/summary');
}
