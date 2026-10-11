/* apps/web/src/api/night-audit.ts */
import { apiClient } from './client';

export interface PreCheckItem {
  id: string;
  label: string;
  detail: string;
  severity: 'danger' | 'warning' | 'success' | 'info';
  count: number;
  autoResolvable: boolean;
}

export interface PreCheckResponse {
  checklist: PreCheckItem[];
  summary: {
    pendingArrivals: number;
    pendingDepartures: number;
    noShows: number;
    unpostedCharges: number;
    unbalancedFolios: number;
    dirtyRooms: number;
    oooRooms: number;
    isDayClosed: boolean;
    businessDate?: string;
    propertyName?: string;
  };
  canRunAudit: boolean;
  blockerCount: number;
  warningCount: number;
}

export interface AuditStatus {
  lastAuditDate: string | null;
  lastAuditStatus: string | null;
  lastAuditId: string | null;
  isDayClosed: boolean;
  pendingCheckouts: number;
  unbalancedFolios: number;
  canRunAudit: boolean;
  businessDate: string | null;
  propertyName: string | null;
  todayStats: {
    arrivals: number;
    departures: number;
    inHouse: number;
    occupiedRooms: number;
    totalRooms: number;
    occupancyRate: number;
  };
}

export interface AuditRunInput {
  propertyId: string;
  auditDate: string;
  autoPostRoomCharges: boolean;
  verifyBalances: boolean;
  generateReports: boolean;
  closeDay: boolean;
  processNoShows: boolean;
  updateRoomStatuses: boolean;
  loadRatesForNewDate: boolean;
}

export interface AuditItem {
  id: string;
  propertyId: string;
  auditDate: string;
  status: 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  runBy: string;
  completedAt?: string;
  results?: Record<string, unknown>;
  errorMessage?: string;
  createdAt?: string;
  property?: {
    id: string;
    name: string;
    code?: string;
    currentBusinessDate?: string;
  };
}

export interface AuditHistoryResponse {
  data: AuditItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditSchedule {
  id: string;
  propertyId: string;
  scheduledTime: string;
  timezone: string;
  isActive: boolean;
  autoRun: boolean;
  steps: Record<string, boolean>;
  notifyEmails: string[];
  lastRunAt?: string;
  nextRunAt?: string;
}

export const nightAuditApi = {
  getPreChecks: (propertyId: string) =>
    apiClient.get<{ data: PreCheckResponse }>(`/night-audit/pre-checks?propertyId=${propertyId}`),

  getStatus: (propertyId?: string) =>
    apiClient.get<{ data: AuditStatus }>(
      `/night-audit/status${propertyId ? `?propertyId=${propertyId}` : ''}`
    ),

  run: (input: AuditRunInput) => apiClient.post<{ data: AuditItem }>('/night-audit/run', input),

  rollback: (auditId: string) =>
    apiClient.post<{ data: AuditItem }>(`/night-audit/${auditId}/rollback`),

  getHistory: (propertyId?: string, page = 1, pageSize = 20) =>
    apiClient.get<AuditHistoryResponse>(
      `/night-audit/history?${propertyId ? `propertyId=${propertyId}&` : ''}page=${page}&pageSize=${pageSize}`
    ),

  getReport: (auditId: string) =>
    apiClient.get<{
      data: { audit: AuditItem; summary: Record<string, unknown>; generatedAt: string };
    }>(`/night-audit/${auditId}/report`),

  getSchedule: (propertyId: string) =>
    apiClient.get<{ data: AuditSchedule | null }>(`/night-audit/schedule?propertyId=${propertyId}`),

  saveSchedule: (input: {
    propertyId: string;
    scheduledTime: string;
    timezone: string;
    isActive: boolean;
    autoRun: boolean;
    steps: Record<string, boolean>;
    notifyEmails: string[];
  }) => apiClient.put<{ data: AuditSchedule }>('/night-audit/schedule', input),
};
