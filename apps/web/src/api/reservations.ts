import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';
import type { Reservation, Availability } from '../types';

export type { Reservation, Availability };

export interface CreateReservationInput {
  propertyId: string;
  guestId: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  rate: number;
  adults?: number;
  children?: number;
  roomTypeId?: string;
  roomId?: string;
  source?: string;
  notes?: string;
}

export interface UpdateReservationInput {
  status?: Reservation['status'];
  roomId?: string;
  notes?: string;
}

export interface CheckInOutInput {
  id: string;
  roomId?: string;
}

export async function listReservations(
  params?: PaginationParams & { status?: string; propertyId?: string; guestId?: string }
): Promise<PaginatedResponse<Reservation>> {
  const response = await apiClient.get<PaginatedResponse<Reservation>>('/reservations', { params });
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

// The backend has no dedicated check-in/out/cancel endpoints; status transitions
// go through PATCH /reservations/:id (see reservationUpdateSchema in apps/api).
export async function checkInReservation(input: CheckInOutInput): Promise<{ data: Reservation }> {
  const response = await apiClient.patch<{ data: Reservation }>(`/reservations/${input.id}`, {
    status: 'checked_in',
    ...(input.roomId ? { roomId: input.roomId } : {}),
  });
  return response.data;
}

export async function checkOutReservation(id: string): Promise<{ data: Reservation }> {
  const response = await apiClient.patch<{ data: Reservation }>(`/reservations/${id}`, {
    status: 'checked_out',
  });
  return response.data;
}

export async function cancelReservation(id: string): Promise<{ data: Reservation }> {
  const response = await apiClient.patch<{ data: Reservation }>(`/reservations/${id}`, {
    status: 'cancelled',
  });
  return response.data;
}

export async function getAvailability(params: {
  propertyId: string;
  startDate: string;
  endDate: string;
  roomTypeId?: string;
}): Promise<{ data: Availability[] }> {
  const response = await apiClient.get<{ data: Availability[] }>('/availability', { params });
  return response.data;
}
