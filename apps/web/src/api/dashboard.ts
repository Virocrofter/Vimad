// apps/web/src/api/dashboard.ts
import { getApiClient } from './client';

export interface KpiData {
  totalRevenue: number;
  totalReservations: number;
  revenueGrowth: number;
  occupancyRate: number;
  occupancyGrowth: number;
  adr: number;
  inHouseGuests: number;
  checkInsToday: number;
  reservationGrowth: number;
  revpar: number;
  revparGrowth: number;
  checkOutsToday: number;
  mrr: {
    current: number;
    trend: number[];
  };
}

export interface HealthData {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: string;
  lastIncident: string;
  services: {
    name: string;
    status: 'operational' | 'degraded' | 'critical';
    latency?: string;
    responseTime?: string;
  }[];
}

export interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  source: string;
  timestamp?: string;
  time?: string;
  acknowledged: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: 'secondary' | 'accent' | 'info' | 'warning' | 'neutral';
}

export interface ActivityItem {
  id: string;
  tenant: string;
  action: string;
  detail: string;
  user?: string;
  time: string;
  type: 'upgrade' | 'booking' | 'user' | 'security' | 'rate' | 'billing' | 'sync';
}

export interface PlanDistributionItem {
  plan: string;
  count: number;
  percentage: number;
  color?: string;
}

const client = getApiClient();

export async function getKpiCards(): Promise<KpiData> {
  return client.get('/admin/kpis');
}

export async function getSystemHealth(): Promise<HealthData> {
  return client.get('/admin/health');
}

export async function getRecentAlerts(): Promise<AlertItem[]> {
  return client.get('/admin/alerts');
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  return client.post(`/admin/alerts/${alertId}/acknowledge`);
}

export async function getQuickActions(): Promise<QuickAction[]> {
  return client.get('/admin/quick-actions');
}

export async function getTenantActivity(): Promise<ActivityItem[]> {
  return client.get('/admin/activity');
}

export async function getPlanDistribution(): Promise<PlanDistributionItem[]> {
  return client.get('/admin/plans');
}
