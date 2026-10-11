/* apps/web/src/api/rates.ts */
import { apiGet, apiPost, apiPatch, apiDelete } from './client';

export interface RatePlan {
  id: string;
  tenantId?: string;
  propertyId: string;
  roomTypeId: string;
  name: string;
  code: string;
  description?: string | null;
  baseRate: number;
  currency: string;
  calculationMethod: 'fixed' | 'percent' | 'amount';
  calculationValue?: number | null;
  advanceDays?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  minStay?: number | null;
  maxStay?: number | null;
  closeToArrival: boolean;
  closeToDeparture: boolean;
  status: string;
  roomType?: { id: string; name: string; code: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRatePlanInput {
  propertyId: string;
  roomTypeId: string;
  name: string;
  code: string;
  description?: string;
  baseRate: number;
  currency?: string;
  calculationMethod?: 'fixed' | 'percent' | 'amount';
  calculationValue?: number;
  advanceDays?: number;
  startDate?: string;
  endDate?: string;
  minStay?: number;
  maxStay?: number;
  closeToArrival?: boolean;
  closeToDeparture?: boolean;
  status?: string;
}

export interface UpdateRatePlanInput extends Partial<CreateRatePlanInput> {}

export interface AvailabilityDay {
  total: number;
  booked: number;
  available: number;
}

export interface AvailabilityRow {
  roomType: { id: string; name: string; code: string };
  days: Record<string, AvailabilityDay>;
}

export interface AvailabilityResponse {
  from: string;
  to: string;
  days: string[];
  data: AvailabilityRow[];
}

export async function listRatePlans(params?: {
  propertyId?: string;
  roomTypeId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}): Promise<RatePlan[]> {
  const response = await apiGet<{ data: RatePlan[] }>('/v1/rates', {
    page: 1,
    pageSize: 100,
    ...params,
  });
  return response.data;
}

export async function getRatePlan(id: string): Promise<RatePlan> {
  const response = await apiGet<{ data: RatePlan }>(`/v1/rates/${id}`);
  return response.data;
}

export async function createRatePlan(input: CreateRatePlanInput): Promise<RatePlan> {
  const response = await apiPost<{ data: RatePlan }>('/v1/rates', input);
  return response.data;
}

export async function updateRatePlan(id: string, input: UpdateRatePlanInput): Promise<RatePlan> {
  const response = await apiPatch<{ data: RatePlan }>(`/v1/rates/${id}`, input);
  return response.data;
}

export async function deleteRatePlan(id: string): Promise<void> {
  await apiDelete(`/v1/rates/${id}`);
}

export async function getAvailability(params: {
  from: string;
  to: string;
  propertyId?: string;
}): Promise<AvailabilityResponse> {
  const response = await apiGet<AvailabilityResponse>('/v1/rates/availability', params);
  return response;
}

export async function getChannelStatus(): Promise<{ active: number }> {
  const response = await apiGet<{ data: { active: number } }>('/v1/channel/status');
  return response.data;
}
