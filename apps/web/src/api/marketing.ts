/**
 * Marketing API client. Single integration point for the marketing module.
 * If your axios instance lives elsewhere, change ONLY this import.
 */
import { apiClient } from './client';

// ─── types ────────────────────────────────────────────────────────

export interface MarketingKpis {
  campaigns: number;
  activeCampaigns: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
  spend: number;
  revenue: number;
  roi: number;
  budget: number;
}

export interface CampaignPerformance {
  id: string;
  name: string;
  channel: string;
  status: string;
  segmentId: string | null;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
  spend: number;
  revenue: number;
  roi: number;
}

export interface DeviceBreakdownItem {
  device: string;
  count: number;
  pct: number;
}
export interface TopSegment {
  id: string | null;
  name: string;
  conversions: number;
  events: number;
  cvr: number;
}
export interface ChannelBreakdown {
  channel: string;
  conversions: number;
  revenue: number;
  spend: number;
  roi: number;
}

export interface AnalyticsOverview {
  kpis: MarketingKpis;
  campaignPerformance: CampaignPerformance[];
  deviceBreakdown: DeviceBreakdownItem[];
  topSegments: TopSegment[];
  channelBreakdown: ChannelBreakdown[];
}

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  channel: string;
  status: string;
  segmentId: string | null;
  segmentName?: string | null;
  budget: number;
  spend: number;
  revenue: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface CampaignInput {
  name: string;
  channel: string;
  status?: string;
  segmentId?: string | null;
  budget?: number;
  startDate?: string | null;
  endDate?: string | null;
}

export interface WorkflowAction {
  type: 'send_email' | 'send_sms' | 'send_whatsapp' | 'webhook' | 'delay';
  templateId?: string;
  to?: string;
  url?: string;
  minutes?: number;
  message?: string;
}

export interface WorkflowRun {
  id: string;
  status: string;
  detail: string | null;
  createdAt: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  actions: WorkflowAction[];
  active: boolean;
  lastRunAt: string | null;
  runCount: number;
  createdAt: string;
  runs?: WorkflowRun[];
}

export interface Template {
  id: string;
  tenantId: string | null;
  name: string;
  category: string;
  subject: string | null;
  body: string;
  tags: string[];
  usageCount: number;
  createdAt: string;
}

export interface Segment {
  id: string;
  name: string;
  criteria: { hasEmail?: boolean; hasPhone?: boolean };
  guestCount: number;
  createdAt: string;
}

// ─── analytics ────────────────────────────────────────────────────

export const getMarketingOverview = (days?: number) =>
  apiClient
    .get<AnalyticsOverview>('/v1/marketing/analytics/overview', {
      params: days ? { from: new Date(Date.now() - days * 86400_000).toISOString() } : {},
    })
    .then((r) => r.data);

// ─── campaigns ────────────────────────────────────────────────────

export const listCampaigns = () =>
  apiClient.get<Campaign[]>('/v1/marketing/campaigns').then((r) => r.data);
export const createCampaign = (data: CampaignInput) =>
  apiClient.post<Campaign>('/v1/marketing/campaigns', data).then((r) => r.data);
export const updateCampaign = (id: string, data: Partial<CampaignInput>) =>
  apiClient.patch<Campaign>(`/v1/marketing/campaigns/${id}`, data).then((r) => r.data);
export const deleteCampaign = (id: string) =>
  apiClient.delete(`/v1/marketing/campaigns/${id}`).then((r) => r.data);

// ─── workflows ────────────────────────────────────────────────────

export const listWorkflows = () =>
  apiClient.get<Workflow[]>('/v1/marketing/workflows').then((r) => r.data);
export const createWorkflow = (
  data: Partial<Workflow> & { name: string; trigger: string; actions: WorkflowAction[] }
) => apiClient.post<Workflow>('/v1/marketing/workflows', data).then((r) => r.data);
export const updateWorkflow = (id: string, data: Partial<Workflow>) =>
  apiClient.patch<Workflow>(`/v1/marketing/workflows/${id}`, data).then((r) => r.data);
export const toggleWorkflow = (id: string) =>
  apiClient.post<Workflow>(`/v1/marketing/workflows/${id}/toggle`).then((r) => r.data);
export const runWorkflow = (id: string) =>
  apiClient.post<WorkflowRun>(`/v1/marketing/workflows/${id}/run`).then((r) => r.data);
export const deleteWorkflow = (id: string) =>
  apiClient.delete(`/v1/marketing/workflows/${id}`).then((r) => r.data);

// ─── templates ────────────────────────────────────────────────────

export const listTemplates = () =>
  apiClient.get<Template[]>('/v1/marketing/templates').then((r) => r.data);
export const createTemplate = (
  data: Partial<Template> & { name: string; category: string; body: string }
) => apiClient.post<Template>('/v1/marketing/templates', data).then((r) => r.data);
export const updateTemplate = (id: string, data: Partial<Template>) =>
  apiClient.patch<Template>(`/v1/marketing/templates/${id}`, data).then((r) => r.data);
export const deleteTemplate = (id: string) =>
  apiClient.delete(`/v1/marketing/templates/${id}`).then((r) => r.data);
export const duplicateTemplate = (id: string) =>
  apiClient.post<Template>(`/v1/marketing/templates/${id}/duplicate`).then((r) => r.data);
export const applyTemplate = (id: string) =>
  apiClient.post<Campaign>(`/v1/marketing/templates/${id}/apply`).then((r) => r.data);

// ─── segments ─────────────────────────────────────────────────────

export const listSegments = () =>
  apiClient.get<Segment[]>('/v1/marketing/segments').then((r) => r.data);
export const createSegment = (data: { name: string; criteria?: Segment['criteria'] }) =>
  apiClient.post<Segment>('/v1/marketing/segments', data).then((r) => r.data);
export const refreshSegment = (id: string) =>
  apiClient.post<Segment>(`/v1/marketing/segments/${id}/refresh`).then((r) => r.data);
export const deleteSegment = (id: string) =>
  apiClient.delete(`/v1/marketing/segments/${id}`).then((r) => r.data);
