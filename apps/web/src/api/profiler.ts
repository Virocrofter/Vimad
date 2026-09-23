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

/** Row shape used by the admin profiler page's slow-queries table. */
export interface SlowQuerySummary {
  id: string;
  query: string;
  duration: number;
  rows: number;
  timestamp: string;
}

/** Aggregate stats for the profiler page's stat cards. */
export interface QueryStats {
  totalQueries: number;
  queriesPerSecond: number;
  avgDuration: number;
  p95Duration: number;
  slowQueries: number;
  errors: number;
  errorRate: number;
}

/** Endpoint performance entry as rendered by the profiler page. */
export interface EndpointPerfEntry {
  method: string;
  path: string;
  avgDuration: number;
  requestCount: number;
  errorRate: number;
}

export async function fetchSlowQueries(params?: {
  range?: string;
  search?: string;
}): Promise<SlowQuerySummary[]> {
  return client.get('/admin/profiler/slow-queries', params);
}

export async function fetchQueryStats(params?: { range?: string }): Promise<QueryStats> {
  return client.get('/admin/profiler/query-stats', params);
}

export async function fetchEndpointPerformance(params?: {
  range?: string;
}): Promise<EndpointPerfEntry[]> {
  return client.get('/admin/profiler/endpoints', params);
}

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
