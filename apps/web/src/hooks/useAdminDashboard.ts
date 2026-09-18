import { useMockQuery } from './useMockQuery';

export function useAdminKpiData() {
  return useMockQuery(['admin', 'kpi'], async () => {
    const { kpiData } = await import('../app/admin/dashboard/data.js');
    return kpiData;
  });
}

export function useAdminSystemHealth() {
  return useMockQuery(['admin', 'health'], async () => {
    const { systemHealth } = await import('../app/admin/dashboard/data.js');
    return systemHealth;
  });
}

export function useAdminRecentAlerts() {
  return useMockQuery(['admin', 'alerts'], async () => {
    const { recentAlerts } = await import('../app/admin/dashboard/data.js');
    return recentAlerts;
  });
}

export function useAdminTenantActivity() {
  return useMockQuery(['admin', 'activity'], async () => {
    const { tenantActivity } = await import('../app/admin/dashboard/data.js');
    return tenantActivity;
  });
}
