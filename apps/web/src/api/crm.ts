import { apiClient } from './client';
import type { PaginationParams } from './types';

export interface Rfm {
  recencyDays: number | null;
  stays: number;
  spend: number;
  score: 0 | 1 | 2 | 3 | 4 | 5;
}

export interface CrmOverview {
  totals: { guests: number; guestsWithStays: number; totalSpend: number };
  topGuests: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    vipStatus?: string;
    tags: string[];
    name: string;
    rfm: Rfm;
  }>;
  followUpsDue: GuestFollowUp[];
  segments: Array<{
    id: string;
    name: string;
    memberCount: number;
    isActive: boolean;
    lastRunAt?: string;
  }>;
  vipBreakdown: Record<string, number>;
}

export interface Guest360 {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  vipStatus?: string;
  tags: string[];
  loyaltyPoints: number;
  blacklisted: boolean;
  doNotDisturb: boolean;
  corporateAccount?: { id: string; name: string } | null;
  rfm: Rfm;
  stats: { stays: number; spend: number; lastStayAt: string | null };
  segments: Array<{ id: string; name: string; isActive: boolean }>;
  openFollowUps: GuestFollowUp[];
  recentNotes: CrmNote[];
}

export interface CrmNote {
  id: string;
  body: string;
  pinned: boolean;
  authorId?: string | null;
  createdAt: string;
}

export interface TimelineEvent {
  at: string;
  kind: 'reservation' | 'payment' | 'note' | 'follow_up' | 'email';
  title: string;
  detail: string;
  refId: string | null;
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  rule: SegmentRule;
  isActive: boolean;
  memberCount: number;
  lastRunAt?: string;
  createdAt: string;
}

export interface SegmentRule {
  minStays?: number;
  minSpend?: number;
  maxRecencyDays?: number;
  vipOnly?: boolean;
  tagAny?: string[];
  tagAll?: string[];
}

export interface SegmentMember {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email?: string;
  phone?: string;
  vipStatus?: string;
  tags: string[];
  stays: number;
  spend: number;
  lastStayAt: string | null;
  addedAt: string;
}

export interface GuestFollowUp {
  id: string;
  guestId: string;
  title: string;
  dueAt?: string | null;
  doneAt?: string | null;
  assigneeId: string;
  createdAt: string;
}

export interface CorporateAccount {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  negotiatedRate?: number | string;
  notes?: string;
  isActive: boolean;
  guestCount: number;
  scClientId?: string | null;
  scClient?: { id: string; name: string } | null;
  createdAt: string;
}

export interface CorporateAccountDetail extends Omit<CorporateAccount, 'guestCount'> {
  guests: Array<{
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    email?: string;
    phone?: string;
    stays: number;
    spend: number;
  }>;
  totals: { stays: number; spend: number };
}

export interface ScClientRef {
  id: string;
  name: string;
  type: string;
}

export interface Assignee {
  id: string;
  name: string;
  email: string;
}

export const getCrmOverview = () => apiClient.get<CrmOverview>('/crm/overview').then((r) => r.data);
export const getCrmAssignees = () =>
  apiClient.get<Assignee[]>('/crm/assignees').then((r) => r.data);

export const getGuest360 = (guestId: string) =>
  apiClient.get<Guest360>(`/crm/guests/${guestId}/360`).then((r) => r.data);
export const getGuestTimeline = (guestId: string, limit = 50) =>
  apiClient
    .get<TimelineEvent[]>(`/crm/guests/${guestId}/timeline`, { params: { pageSize: limit } })
    .then((r) => r.data);
export const updateGuestCrm = (guestId: string, input: { tags?: string[]; vipStatus?: string }) =>
  apiClient.patch(`/crm/guests/${guestId}`, input).then((r) => r.data);

export const createCrmNote = (guestId: string, input: { body: string; pinned?: boolean }) =>
  apiClient.post<CrmNote>(`/crm/guests/${guestId}/notes`, input).then((r) => r.data);
export const updateCrmNote = (noteId: string, input: { body?: string; pinned?: boolean }) =>
  apiClient.patch<CrmNote>(`/crm/notes/${noteId}`, input).then((r) => r.data);
export const deleteCrmNote = (noteId: string) =>
  apiClient.delete(`/crm/notes/${noteId}`).then((r) => r.data);

export const listSegments = () => apiClient.get<Segment[]>('/crm/segments').then((r) => r.data);
export const createSegment = (input: { name: string; description?: string; rule: SegmentRule }) =>
  apiClient.post<Segment>('/crm/segments', input).then((r) => r.data);
export const updateSegment = (
  id: string,
  input: Partial<{ name: string; description: string; rule: SegmentRule; isActive: boolean }>
) => apiClient.patch<Segment>(`/crm/segments/${id}`, input).then((r) => r.data);
export const deleteSegment = (id: string) =>
  apiClient.delete(`/crm/segments/${id}`).then((r) => r.data);
export const evaluateSegment = (id: string) =>
  apiClient
    .post<{ segmentId: string; memberCount: number }>(`/crm/segments/${id}/evaluate`)
    .then((r) => r.data);
export const emailSegment = (id: string, input: { subject: string; body: string }) =>
  apiClient
    .post<{ segmentId: string; queued: number; skippedNoEmail: number; capped: boolean }>(
      `/crm/segments/${id}/email`,
      input
    )
    .then((r) => r.data);
export const listSegmentMembers = (id: string, params?: PaginationParams) =>
  apiClient
    .get<{
      segment: { id: string; name: string; memberCount: number };
      members: SegmentMember[];
      total: number;
    }>(`/crm/segments/${id}/members`, { params })
    .then((r) => r.data);

export const listFollowUps = (params?: { done?: boolean; guestId?: string } & PaginationParams) =>
  apiClient
    .get<{ total: number; items: GuestFollowUp[] }>('/crm/follow-ups', {
      params: { ...params, done: params?.done === undefined ? undefined : String(params.done) },
    })
    .then((r) => r.data);
export const createFollowUp = (input: {
  guestId: string;
  assigneeId: string;
  title: string;
  dueAt?: string;
}) => apiClient.post<GuestFollowUp>('/crm/follow-ups', input).then((r) => r.data);
export const updateFollowUp = (
  id: string,
  input: { title?: string; assigneeId?: string; dueAt?: string | null; done?: boolean }
) => apiClient.patch<GuestFollowUp>(`/crm/follow-ups/${id}`, input).then((r) => r.data);

export const listCorporateAccounts = () =>
  apiClient.get<CorporateAccount[]>('/crm/corporate-accounts').then((r) => r.data);
export const getCorporateAccount = (id: string) =>
  apiClient.get<CorporateAccountDetail>(`/crm/corporate-accounts/${id}`).then((r) => r.data);
export const createCorporateAccount = (input: Partial<CorporateAccount>) =>
  apiClient.post<CorporateAccount>('/crm/corporate-accounts', input).then((r) => r.data);
export const updateCorporateAccount = (id: string, input: Partial<CorporateAccount>) =>
  apiClient.patch<CorporateAccount>(`/crm/corporate-accounts/${id}`, input).then((r) => r.data);

export const listScClients = () =>
  apiClient.get<ScClientRef[]>('/crm/sc-clients').then((r) => r.data);
