import { getApiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';
import type { Property } from '../types';

export type { Property };

export interface CreatePropertyInput {
  name: string;
  code: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  currency?: string;
}

export type UpdatePropertyInput = Partial<CreatePropertyInput>;

export async function listProperties(
  params?: PaginationParams
): Promise<PaginatedResponse<Property>> {
  const client = getApiClient();
  const response = await client.get<PaginatedResponse<Property>>('/properties', { params });
  return response.data;
}

export async function getProperty(id: string): Promise<{ data: Property }> {
  const client = getApiClient();
  const response = await client.get<{ data: Property }>(`/properties/${id}`);
  return response.data;
}

export async function createProperty(input: CreatePropertyInput): Promise<{ data: Property }> {
  const client = getApiClient();
  const response = await client.post<{ data: Property }>('/properties', input);
  return response.data;
}

export async function updateProperty(
  id: string,
  input: UpdatePropertyInput
): Promise<{ data: Property }> {
  const client = getApiClient();
  const response = await client.patch<{ data: Property }>(`/properties/${id}`, input);
  return response.data;
}

export async function deleteProperty(id: string): Promise<void> {
  const client = getApiClient();
  await client.delete(`/properties/${id}`);
}
