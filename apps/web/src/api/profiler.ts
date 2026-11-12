// Admin System Profiler client — production rebuild (2026-11-04)
import { apiGet, apiPost } from './client';

export const getProfilerSummary = () => apiGet('/admin/profiler/summary');
export const getProfilerSlowQueries = (range = 24, search = '') =>
  apiGet(
    `/admin/profiler/slow-queries?range=${range}${search ? `&search=${encodeURIComponent(search)}` : ''}`
  );
export const getProfilerEndpoints = () => apiGet('/admin/profiler/endpoints');
export const getProfilerDatabase = () => apiGet('/admin/profiler/database');
export const getProfilerQueues = () => apiGet('/admin/profiler/queues');
export const getProfilerRuntime = () => apiGet('/admin/profiler/runtime');
export const getProfilerTenants = () => apiGet('/admin/profiler/tenants');
export const explainQuery = (query: string) => apiPost('/admin/profiler/explain', { query });
