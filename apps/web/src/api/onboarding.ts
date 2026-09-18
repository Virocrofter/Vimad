// apps/web/src/api/onboarding.ts
import { getApiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export interface OnboardingFlow {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  steps: {
    id: string;
    title: string;
    description: string;
    type: 'form' | 'video' | 'tutorial' | 'action' | 'verification';
    required: boolean;
    order: number;
    config?: Record<string, unknown>;
    completedAt?: string;
  }[];
  status: 'active' | 'draft' | 'archived';
  targetRole?: string;
  completionRate: number;
  averageTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingSession {
  id: string;
  flowId: string;
  userId: string;
  userName: string;
  status: 'in_progress' | 'completed' | 'abandoned' | 'overdue';
  currentStepId: string;
  progress: number;
  startedAt: string;
  completedAt?: string;
  lastActivityAt: string;
  stepsCompleted: string[];
  interventions: {
    id: string;
    type: 'email' | 'notification' | 'manual';
    sentAt: string;
    resolved: boolean;
  }[];
}

export interface OnboardingIntervention {
  id: string;
  sessionId: string;
  type: 'email' | 'notification' | 'manual' | 'auto';
  message: string;
  sentAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  effect: 'positive' | 'neutral' | 'negative';
}

export interface OnboardingMetric {
  date: string;
  started: number;
  completed: number;
  abandoned: number;
  averageProgress: number;
  averageTimeMinutes: number;
  interventionRate: number;
}

const client = getApiClient();

export async function getFlows(
  params?: PaginationParams & { status?: string }
): Promise<PaginatedResponse<OnboardingFlow>> {
  return client.get('/admin/onboarding/flows', params);
}

export async function getFlow(id: string): Promise<OnboardingFlow> {
  return client.get(`/admin/onboarding/flows/${id}`);
}

export async function createFlow(
  data: Omit<
    OnboardingFlow,
    'id' | 'createdAt' | 'updatedAt' | 'completionRate' | 'averageTimeMinutes'
  >
): Promise<OnboardingFlow> {
  return client.post('/admin/onboarding/flows', data);
}

export async function updateFlow(
  id: string,
  data: Partial<OnboardingFlow>
): Promise<OnboardingFlow> {
  return client.patch(`/admin/onboarding/flows/${id}`, data);
}

export async function deleteFlow(id: string): Promise<void> {
  return client.delete(`/admin/onboarding/flows/${id}`);
}

export async function getSessions(
  params?: PaginationParams & {
    flowId?: string;
    status?: string;
    userId?: string;
  }
): Promise<PaginatedResponse<OnboardingSession>> {
  return client.get('/admin/onboarding/sessions', params);
}

export async function getSession(id: string): Promise<OnboardingSession> {
  return client.get(`/admin/onboarding/sessions/${id}`);
}

export async function updateSessionStep(
  sessionId: string,
  stepId: string,
  completed: boolean
): Promise<OnboardingSession> {
  return client.patch(`/admin/onboarding/sessions/${sessionId}/steps/${stepId}`, { completed });
}

export async function getInterventions(
  sessionId?: string,
  params?: PaginationParams
): Promise<PaginatedResponse<OnboardingIntervention>> {
  return client.get('/admin/onboarding/interventions', { sessionId, ...params });
}

export async function createIntervention(
  data: Omit<OnboardingIntervention, 'id' | 'sentAt'>
): Promise<OnboardingIntervention> {
  return client.post('/admin/onboarding/interventions', data);
}

export async function resolveIntervention(
  id: string,
  resolvedBy: string
): Promise<OnboardingIntervention> {
  return client.patch(`/admin/onboarding/interventions/${id}`, {
    resolvedBy,
    resolvedAt: new Date().toISOString(),
  });
}

export async function getMetrics(period: string, flowId?: string): Promise<OnboardingMetric[]> {
  return client.get('/admin/onboarding/metrics', { period, flowId });
}

export async function getOnboardingDashboard(): Promise<{
  activeFlows: number;
  activeSessions: number;
  completionRate: number;
  averageTimeMinutes: number;
  atRiskSessions: number;
  interventionsToday: number;
}> {
  return client.get('/admin/onboarding/dashboard');
}

export async function triggerIntervention(
  sessionId: string,
  type: string,
  message: string
): Promise<OnboardingIntervention> {
  return client.post(`/admin/onboarding/sessions/${sessionId}/intervene`, { type, message });
}

export async function cloneFlow(id: string, name: string): Promise<OnboardingFlow> {
  return client.post(`/admin/onboarding/flows/${id}/clone`, { name });
}
