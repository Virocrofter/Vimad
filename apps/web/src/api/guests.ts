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
  notes?: string;
  createdAt: string;
  updatedAt: string;
  totalStays?: number;
  totalNights?: number;
  totalRevenue?: number;
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
  notes?: string;
}

export type UpdateGuestInput = Partial<CreateGuestInput>;

const client = apiClient;

export async function listGuests(
  params?: PaginationParams & { search?: string }
): Promise<PaginatedResponse<Guest>> {
  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);
  if (params?.search) queryParams.search = params.search;
  return client.get('/v1/guests', queryParams);
}

export async function getGuest(id: string): Promise<Guest> {
  return client.get(`/v1/guests/${id}`);
}

export async function createGuest(input: CreateGuestInput): Promise<Guest> {
  return client.post('/v1/guests', input);
}

export async function updateGuest(id: string, input: UpdateGuestInput): Promise<Guest> {
  return client.patch(`/v1/guests/${id}`, input);
}

export async function deleteGuest(id: string): Promise<void> {
  return client.delete(`/v1/guests/${id}`);
}
