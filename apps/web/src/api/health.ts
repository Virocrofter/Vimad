// apps/web/src/api/health.ts
import { apiClient } from './client';

export interface ServiceHealth {
  name: string;
  status: 'operational' | 'degraded' | 'critical';
  responseTime: string;
  uptime?: string;
  latency?: { current: number; p95: number; p99: number };
  requestsPerMin?: number;
  errorsPerMin?: number;
  lastRestart?: string;
  version?: string;
  region?: string;
  connections?: { active: number; max: number; pool: number };
  diskUsage?: { used: number; total: number; unit: string };
  memoryUsage?: { used: number; total: number; unit: string };
  hitRate?: number;
  evictions?: number;
  queueDepth?: number;
  processedPerMin?: number;
  failedPerMin?: number;
  alert?: string;
  storageUsed?: { used: number; total: number; unit: string };
}

export interface SystemHealthOverview {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: string;
  lastIncident: string;
  services: ServiceHealth[];
}

export interface HealthIncident {
  date: string;
  description: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  resolved: boolean;
}

export interface SystemOverview {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: {
    current: string;
    last7Days: string;
    last30Days: string;
    totalHours: number;
  };
  lastIncident: HealthIncident;
}

const client = apiClient;

/**
 * Get admin system health overview (from admin service).
 * Endpoint: GET /admin/health
 */
export async function getAdminSystemHealth(): Promise<SystemHealthOverview> {
  const { data } = await client.get('/admin/health');
  return data;
}

/**
 * Get general system health (from health module).
 * Endpoint: GET /health
 */
export async function getSystemHealth(): Promise<{
  status: 'ok' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  responseTimeMs: number;
  workers?: number;
  checks: Record<
    string,
    { status: 'ok' | 'error' | 'degraded' | 'unknown'; responseTimeMs?: number; message?: string }
  >;
}> {
  const { data } = await client.get('/health');
  return data;
}

/**
 * Get liveness probe.
 * Endpoint: GET /health/live
 */
export async function getLiveness(): Promise<{ status: 'alive' }> {
  const { data } = await client.get('/health/live');
  return data;
}

/**
 * Fetch admin system health overview (services, status, uptime).
 * Consumed by the admin health page.
 * Endpoint: GET /admin/health
 */
export async function fetchSystemHealth(): Promise<SystemHealthOverview> {
  const { data } = await client.get('/admin/health');
  return data;
}

/**
 * Fetch per-service metric details keyed by service name.
 * Each entry is a flat map of metric label → value rendered by the health page.
 * Endpoint: GET /admin/health/metrics
 */
export async function fetchServiceMetrics(): Promise<
  Record<string, Record<string, string | number>>
> {
  const { data } = await client.get('/admin/health/metrics');
  return data;
}

/**
 * Get readiness probe.
 * Endpoint: GET /health/ready
 */
export async function getReadiness(): Promise<{
  status: 'ready' | 'not_ready';
  checks?: Record<string, string>;
}> {
  const { data } = await client.get('/health/ready');
  return data;
}
