// Admin System Health client — production rebuild (2026-11-04)
import { apiGet, apiPost } from './client';

export const getHealthOverview = () => apiGet('/admin/health/overview');
export const getHeartbeats = () => apiGet('/admin/health/heartbeats');
export const getProbes = () => apiGet('/admin/health/probes');
export const runProbes = () => apiPost('/admin/health/probes/run');
export const getIncidents = () => apiGet('/admin/health/incidents');
export const getTenantScores = () => apiGet('/admin/health/tenants');
export const getTenantHealth = (id: string) => apiGet(`/admin/health/tenants/${id}`);
export const getJourneys = () => apiGet('/admin/health/journeys');
export const getNightly = () => apiGet('/admin/health/nightly');
export const getPublicStatus = () => apiGet('/v1/public/status');
