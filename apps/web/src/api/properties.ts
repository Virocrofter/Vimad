/* apps/web/src/api/properties.ts */
import { apiGet, apiPost, apiPatch, apiDelete } from './client';

export interface Property {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  country?: string;
  timezone: string;
  currency: string;
  status: string;
  currentBusinessDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePropertyInput {
  name: string;
  code: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  currency?: string;
}

export interface UpdatePropertyInput extends Partial<CreatePropertyInput> {
  status?: string;
}

export async function listProperties(): Promise<Property[]> {
  const response = await apiGet<{ data: Property[] }>('/v1/properties');
  return response.data;
}

export async function getProperty(id: string): Promise<Property> {
  const response = await apiGet<{ data: Property }>(`/v1/properties/${id}`);
  return response.data;
}

export async function createProperty(input: CreatePropertyInput): Promise<Property> {
  const response = await apiPost<{ data: Property }>('/v1/properties', input);
  return response.data;
}

export async function updateProperty(id: string, input: UpdatePropertyInput): Promise<Property> {
  const response = await apiPatch<{ data: Property }>(`/v1/properties/${id}`, input);
  return response.data;
}

export async function deleteProperty(id: string): Promise<void> {
  await apiDelete(`/v1/properties/${id}`);
}
