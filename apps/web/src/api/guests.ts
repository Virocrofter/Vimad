import { apiClient } from './client';
import type { PaginationParams, PaginatedResponse } from './types';

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: string;
  city?: string;
  country?: string;
  passportNumber?: string;
  vipStatus?: string;
  doNotDisturb?: boolean;
  blacklisted?: boolean;
  blacklistReason?: string;
  notes?: string;
  loyaltyPoints?: number;
  createdAt: string;
  updatedAt: string;
  totalStays?: number;
  totalNights?: number;
  totalRevenue?: number;
  _count?: { reservations: number };
}

export interface GuestPreference {
  id: string;
  category: string;
  key: string;
  value: string;
}

export interface GuestDocument {
  id: string;
  type: string;
  number?: string;
  issuedBy?: string;
  issueDate?: string;
  expiryDate?: string;
  fileUrl?: string;
}

export interface GuestNote {
  id: string;
  guestId: string;
  authorId?: string;
  body: string;
  createdAt: string;
  author?: { id: string; firstName?: string; lastName?: string } | null;
}

export interface GuestReservation {
  id: string;
  confirmationNumber: string;
  status: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  totalAmount: number | string;
  balance: number | string;
  property?: { id: string; name: string };
  stays?: { id: string; date: string; room?: { id: string; number: string } }[];
}

export interface GuestDetail extends Omit<Guest, 'notes'> {
  preferences: GuestPreference[];
  documents: GuestDocument[];
  notes: GuestNote[];
  reservations: GuestReservation[];
}

export interface GuestStats {
  total: number;
  vip: number;
  newThisMonth: number;
  inHouse: number;
  blacklisted: number;
}

export interface CreateGuestInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: string;
  city?: string;
  country?: string;
  passportNumber?: string;
  vipStatus?: string;
  doNotDisturb?: boolean;
  blacklisted?: boolean;
  blacklistReason?: string;
  notes?: string;
}

export type UpdateGuestInput = Partial<CreateGuestInput>;

export interface GuestListParams extends PaginationParams {
  search?: string;
  vipStatus?: string;
  blacklisted?: 'true' | 'false';
  sortBy?: 'firstName' | 'lastName' | 'email' | 'vipStatus' | 'createdAt';
  sortDir?: 'asc' | 'desc';
}

export interface GuestMergeResult {
  target: Guest;
  movedReservations: number;
  movedNotes: number;
  movedPreferences: number;
  movedDocuments: number;
  movedLoyaltyTransactions: number;
}

export async function listGuests(params?: GuestListParams): Promise<PaginatedResponse<Guest>> {
  const response = await apiClient.get<PaginatedResponse<Guest>>('/v1/guests', { params });
  return response.data;
}

export async function getGuestStats(): Promise<GuestStats> {
  const response = await apiClient.get<{ data: GuestStats }>('/v1/guests/stats');
  return response.data.data;
}

export async function getGuest(id: string): Promise<GuestDetail> {
  const response = await apiClient.get<{ data: GuestDetail }>(`/v1/guests/${id}`);
  return response.data.data;
}

export async function createGuest(input: CreateGuestInput): Promise<Guest> {
  const response = await apiClient.post<{ data: Guest }>('/v1/guests', input);
  return response.data.data;
}

export async function updateGuest(id: string, input: UpdateGuestInput): Promise<Guest> {
  const response = await apiClient.patch<{ data: Guest }>(`/v1/guests/${id}`, input);
  return response.data.data;
}

export async function deleteGuest(id: string): Promise<void> {
  await apiClient.delete(`/v1/guests/${id}`);
}

export async function mergeGuest(id: string, targetGuestId: string): Promise<GuestMergeResult> {
  const response = await apiClient.post<{ data: GuestMergeResult }>(`/v1/guests/${id}/merge`, {
    targetGuestId,
  });
  return response.data.data;
}

// ─── Notes ───

export async function listGuestNotes(id: string): Promise<GuestNote[]> {
  const response = await apiClient.get<{ data: GuestNote[] }>(`/v1/guests/${id}/notes`);
  return response.data.data;
}

export async function createGuestNote(id: string, body: string): Promise<GuestNote> {
  const response = await apiClient.post<{ data: GuestNote }>(`/v1/guests/${id}/notes`, { body });
  return response.data.data;
}

export async function deleteGuestNote(id: string, noteId: string): Promise<void> {
  await apiClient.delete(`/v1/guests/${id}/notes/${noteId}`);
}

// ─── Preferences ───

export async function createGuestPreference(
  id: string,
  input: Omit<GuestPreference, 'id'>
): Promise<GuestPreference> {
  const response = await apiClient.post<{ data: GuestPreference }>(
    `/v1/guests/${id}/preferences`,
    input
  );
  return response.data.data;
}

export async function deleteGuestPreference(id: string, prefId: string): Promise<void> {
  await apiClient.delete(`/v1/guests/${id}/preferences/${prefId}`);
}

// ─── Documents ───

export async function createGuestDocument(
  id: string,
  input: Omit<GuestDocument, 'id'>
): Promise<GuestDocument> {
  const response = await apiClient.post<{ data: GuestDocument }>(
    `/v1/guests/${id}/documents`,
    input
  );
  return response.data.data;
}

export async function deleteGuestDocument(id: string, docId: string): Promise<void> {
  await apiClient.delete(`/v1/guests/${id}/documents/${docId}`);
}

// ─── CSV Export ───

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function buildGuestsCsv(guests: Guest[]): string {
  const headers = [
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Nationality',
    'City',
    'Country',
    'Passport',
    'VIP',
    'Stays',
    'Joined',
  ];
  const rows = guests.map((g) => [
    g.firstName,
    g.lastName,
    g.email,
    g.phone,
    g.nationality,
    g.city,
    g.country,
    g.passportNumber,
    g.vipStatus,
    g._count?.reservations ?? g.totalStays ?? 0,
    g.createdAt ? new Date(g.createdAt).toISOString().split('T')[0] : '',
  ]);
  return [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n');
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
