import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';
import type { Reservation } from '../types';

export type { Reservation };

export interface ReservationListParams extends PaginationParams {
  status?: string;
  source?: string;
  propertyId?: string;
  guestId?: string;
  search?: string;
  arrivalFrom?: string;
  arrivalTo?: string;
  departureFrom?: string;
  departureTo?: string;
  /** Overlap filter: reservations active anywhere in [from, to) — used by the room plan */
  from?: string;
  to?: string;
}

export interface CreateReservationInput {
  propertyId: string;
  guestId: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  rate?: number;
  adults?: number;
  children?: number;
  roomTypeId?: string;
  roomId?: string;
  source?: string;
  notes?: string;
}

export interface UpdateReservationInput {
  arrivalDate?: string;
  departureDate?: string;
  nights?: number;
  adults?: number;
  children?: number;
  notes?: string;
  source?: string;
  roomId?: string;
  rate?: number;
}

export interface AssignRoomInput {
  roomId: string;
  rate?: number;
}

export async function listReservations(
  params?: ReservationListParams
): Promise<PaginatedResponse<Reservation>> {
  const response = await apiClient.get<PaginatedResponse<Reservation>>('/reservations', {
    params,
  });
  return response.data;
}

export async function getReservation(id: string): Promise<{ data: Reservation }> {
  const response = await apiClient.get<{ data: Reservation }>(`/reservations/${id}`);
  return response.data;
}

export async function createReservation(
  input: CreateReservationInput
): Promise<{ data: Reservation }> {
  const response = await apiClient.post<{ data: Reservation }>('/reservations', input);
  return response.data;
}

export async function updateReservation(
  id: string,
  input: UpdateReservationInput
): Promise<{ data: Reservation }> {
  const response = await apiClient.patch<{ data: Reservation }>(`/reservations/${id}`, input);
  return response.data;
}

export async function deleteReservation(id: string): Promise<void> {
  await apiClient.delete(`/reservations/${id}`);
}

export async function assignRoom(
  id: string,
  input: AssignRoomInput
): Promise<{ data: Reservation }> {
  const response = await apiClient.post<{ data: Reservation }>(
    `/reservations/${id}/assign-room`,
    input
  );
  return response.data;
}

export async function checkInReservation(id: string): Promise<{ data: Reservation }> {
  const response = await apiClient.post<{ data: Reservation }>(`/reservations/${id}/check-in`);
  return response.data;
}

export async function checkOutReservation(id: string): Promise<{ data: Reservation }> {
  const response = await apiClient.post<{ data: Reservation }>(`/reservations/${id}/check-out`);
  return response.data;
}

export async function cancelReservation(
  id: string,
  reason?: string
): Promise<{ data: Reservation }> {
  const response = await apiClient.post<{ data: Reservation }>(`/reservations/${id}/cancel`, {
    reason,
  });
  return response.data;
}
