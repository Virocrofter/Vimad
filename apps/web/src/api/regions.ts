// apps/web/src/api/regions.ts
import { getApiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export interface Region {
  id: string;
  name: string;
  code: string;
  datacenter: string;
  status: 'active' | 'degraded' | 'maintenance' | 'offline';
  tenantCount: number;
  propertyCount: number;
  latency: number;
  capacity: {
    cpu: number;
    memory: number;
    storage: number;
  };
  usage: {
    cpu: number;
    memory: number;
    storage: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MigrationJob {
  id: string;
  tenantId: string;
  tenantName: string;
  sourceRegion: string;
  targetRegion: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  progress: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  estimatedDuration: number;
}

const client = getApiClient();

export async function getRegions(): Promise<Region[]> {
  return client.get('/admin/regions');
}

export async function getRegion(id: string): Promise<Region> {
  return client.get(`/admin/regions/${id}`);
}

export async function updateRegion(id: string, data: Partial<Region>): Promise<Region> {
  return client.patch(`/admin/regions/${id}`, data);
}

export async function getMigrationJobs(
  params?: PaginationParams & {
    status?: string;
    tenantId?: string;
  }
): Promise<PaginatedResponse<MigrationJob>> {
  return client.get('/admin/regions/migrations', params);
}

export async function createMigration(data: {
  tenantId: string;
  sourceRegion: string;
  targetRegion: string;
}): Promise<MigrationJob> {
  return client.post('/admin/regions/migrations', data);
}

export async function cancelMigration(id: string): Promise<MigrationJob> {
  return client.post(`/admin/regions/migrations/${id}/cancel`);
}

export async function getRegionStats(): Promise<{
  totalRegions: number;
  activeRegions: number;
  degradedRegions: number;
  totalTenants: number;
  avgLatency: number;
  capacityUtilization: number;
}> {
  return client.get('/admin/regions/stats');
}
