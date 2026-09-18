// apps/web/src/api/demo-access.ts
import { getApiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export interface DemoRequest {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  propertyType?: string;
  roomCount?: number;
  useCase?: string;
  preferredDate?: string;
  timezone?: string;
  status: 'pending' | 'approved' | 'rejected' | 'scheduled' | 'completed' | 'no_show';
  assignedTo?: string;
  notes?: string;
  source: string;
  utm?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface DemoSession {
  id: string;
  requestId: string;
  scheduledAt: string;
  duration: number;
  joinUrl?: string;
  recordingUrl?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  attendees: {
    name: string;
    email: string;
    attended: boolean;
  }[];
  notes?: string;
  followUpRequired: boolean;
  createdAt: string;
}

export interface DemoConversion {
  id: string;
  requestId: string;
  convertedAt: string;
  plan: string;
  value: number;
  onboardingCompleted: boolean;
  churnedAt?: string;
  churnReason?: string;
}

export interface DemoMetrics {
  date: string;
  requests: number;
  scheduled: number;
  completed: number;
  noShows: number;
  conversions: number;
  conversionRate: number;
  avgDealValue: number;
}

const client = getApiClient();

export async function getDemoRequests(
  params?: PaginationParams & { status?: string; dateFrom?: string; dateTo?: string }
): Promise<PaginatedResponse<DemoRequest>> {
  return client.get('/admin/demo-access/requests', params as Record<string, unknown>);
}

export async function getDemoRequest(id: string): Promise<DemoRequest> {
  return client.get(`/admin/demo-access/requests/${id}`);
}

export async function createDemoRequest(
  data: Omit<DemoRequest, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DemoRequest> {
  return client.post('/admin/demo-access/requests', data);
}

export async function updateDemoRequest(
  id: string,
  data: Partial<DemoRequest>
): Promise<DemoRequest> {
  return client.patch(`/admin/demo-access/requests/${id}`, data);
}

export async function approveDemoRequest(id: string, assignedTo?: string): Promise<DemoRequest> {
  return client.post(`/admin/demo-access/requests/${id}/approve`, { assignedTo });
}

export async function rejectDemoRequest(id: string, reason: string): Promise<DemoRequest> {
  return client.post(`/admin/demo-access/requests/${id}/reject`, { reason });
}

export async function getDemoSessions(
  params?: PaginationParams & { requestId?: string; status?: string }
): Promise<PaginatedResponse<DemoSession>> {
  return client.get('/admin/demo-access/sessions', params as Record<string, unknown>);
}

export async function getDemoSession(id: string): Promise<DemoSession> {
  return client.get(`/admin/demo-access/sessions/${id}`);
}

export async function scheduleDemo(
  requestId: string,
  scheduledAt: string,
  duration: number,
  joinUrl?: string
): Promise<DemoSession> {
  return client.post('/admin/demo-access/sessions', { requestId, scheduledAt, duration, joinUrl });
}

export async function updateDemoSession(
  id: string,
  data: Partial<DemoSession>
): Promise<DemoSession> {
  return client.patch(`/admin/demo-access/sessions/${id}`, data);
}

export async function completeDemoSession(
  id: string,
  notes: string,
  followUpRequired: boolean
): Promise<DemoSession> {
  return client.post(`/admin/demo-access/sessions/${id}/complete`, { notes, followUpRequired });
}

export async function getConversions(
  params?: PaginationParams
): Promise<PaginatedResponse<DemoConversion>> {
  return client.get('/admin/demo-access/conversions', params as Record<string, unknown>);
}

export async function recordConversion(
  requestId: string,
  plan: string,
  value: number
): Promise<DemoConversion> {
  return client.post('/admin/demo-access/conversions', { requestId, plan, value });
}

export async function getDemoMetrics(period: string): Promise<DemoMetrics[]> {
  return client.get('/admin/demo-access/metrics', { period });
}

export async function getDemoDashboard(): Promise<{
  totalRequests: number;
  pendingRequests: number;
  scheduledThisWeek: number;
  conversionRate: number;
  avgDealValue: number;
  pipelineValue: number;
}> {
  return client.get('/admin/demo-access/dashboard');
}

export async function sendReminder(sessionId: string): Promise<{ sent: boolean }> {
  return client.post(`/admin/demo-access/sessions/${sessionId}/remind`);
}

export async function getDemoSettings(): Promise<{
  autoApprove: boolean;
  defaultDuration: number;
  reminderHours: number;
  cancellationPolicy: string;
}> {
  return client.get('/admin/demo-access/settings');
}

export async function updateDemoSettings(
  settings: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return client.patch('/admin/demo-access/settings', settings);
}
