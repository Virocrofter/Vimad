// apps/web/src/api/feedback.ts
import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export interface FeedbackItem {
  id: string;
  tenantId: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  type: 'bug' | 'feature_request' | 'praise' | 'complaint' | 'general';
  category: string;
  title: string;
  description: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'triaged' | 'in_progress' | 'resolved' | 'closed' | 'deferred';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  assigneeId?: string;
  assigneeName?: string;
  resolution?: string;
  resolvedAt?: string;
  votes: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface NpsSurvey {
  id: string;
  tenantId: string;
  name: string;
  question: string;
  status: 'active' | 'paused' | 'closed';
  responses: number;
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  sentAt?: string;
  closedAt?: string;
  createdAt: string;
}

export interface NpsResponse {
  id: string;
  surveyId: string;
  userId?: string;
  score: number;
  comment?: string;
  followUp?: boolean;
  createdAt: string;
}

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'submitted' | 'under_review' | 'planned' | 'in_development' | 'released' | 'declined';
  votes: number;
  voterIds: string[];
  targetRelease?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackResponse {
  id: string;
  feedbackId: string;
  responderId: string;
  responderName: string;
  message: string;
  isPublic: boolean;
  createdAt: string;
}

const client = apiClient;

export async function getFeedback(
  params?: PaginationParams & {
    type?: string;
    status?: string;
    priority?: string;
    category?: string;
  }
): Promise<PaginatedResponse<FeedbackItem>> {
  return client.get('/admin/feedback', { params });
}

export async function getFeedbackItem(id: string): Promise<FeedbackItem> {
  return client.get(`/admin/feedback/${id}`);
}

export async function createFeedback(
  data: Omit<FeedbackItem, 'id' | 'createdAt' | 'updatedAt' | 'votes'>
): Promise<FeedbackItem> {
  return client.post('/admin/feedback', data);
}

export async function updateFeedback(
  id: string,
  data: Partial<FeedbackItem>
): Promise<FeedbackItem> {
  return client.patch(`/admin/feedback/${id}`, data);
}

export async function deleteFeedback(id: string): Promise<void> {
  return client.delete(`/admin/feedback/${id}`);
}

export async function voteFeedback(id: string): Promise<{ votes: number }> {
  return client.post(`/admin/feedback/${id}/vote`);
}

export async function getResponses(feedbackId: string): Promise<FeedbackResponse[]> {
  return client.get(`/admin/feedback/${feedbackId}/responses`);
}

export async function createResponse(
  feedbackId: string,
  message: string,
  isPublic: boolean
): Promise<FeedbackResponse> {
  return client.post(`/admin/feedback/${feedbackId}/responses`, { message, isPublic });
}

export async function getNpsSurveys(
  params?: PaginationParams
): Promise<PaginatedResponse<NpsSurvey>> {
  return client.get('/admin/feedback/nps', { params });
}

export async function getNpsSurvey(id: string): Promise<NpsSurvey> {
  return client.get(`/admin/feedback/nps/${id}`);
}

export async function createNpsSurvey(
  data: Omit<
    NpsSurvey,
    'id' | 'createdAt' | 'responses' | 'npsScore' | 'promoters' | 'passives' | 'detractors'
  >
): Promise<NpsSurvey> {
  return client.post('/admin/feedback/nps', data);
}

export async function getNpsResponses(
  surveyId: string,
  params?: PaginationParams
): Promise<PaginatedResponse<NpsResponse>> {
  return client.get(`/admin/feedback/nps/${surveyId}/responses`, { params });
}

export async function getFeatureRequests(
  params?: PaginationParams & { status?: string }
): Promise<PaginatedResponse<FeatureRequest>> {
  return client.get('/admin/feedback/features', { params });
}

export async function getFeatureRequest(id: string): Promise<FeatureRequest> {
  return client.get(`/admin/feedback/features/${id}`);
}

export async function createFeatureRequest(
  data: Omit<FeatureRequest, 'id' | 'createdAt' | 'updatedAt' | 'votes' | 'voterIds'>
): Promise<FeatureRequest> {
  return client.post('/admin/feedback/features', data);
}

export async function updateFeatureRequest(
  id: string,
  data: Partial<FeatureRequest>
): Promise<FeatureRequest> {
  return client.patch(`/admin/feedback/features/${id}`, data);
}

export async function voteFeatureRequest(id: string): Promise<{ votes: number; voted: boolean }> {
  return client.post(`/admin/feedback/features/${id}/vote`);
}

export async function getFeedbackDashboard(): Promise<{
  totalFeedback: number;
  openIssues: number;
  avgResponseTime: number;
  npsScore: number;
  featureRequests: number;
  satisfactionRate: number;
}> {
  return client.get('/admin/feedback/dashboard');
}

export async function getFeedbackCategories(): Promise<string[]> {
  return client.get('/admin/feedback/categories');
}

export async function exportFeedback(
  format: 'csv' | 'json',
  filters?: Record<string, unknown>
): Promise<{ downloadUrl: string }> {
  return client.post('/admin/feedback/export', { format, filters });
}
