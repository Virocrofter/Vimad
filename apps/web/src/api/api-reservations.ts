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
  ratePlanId?: string;
  eta?: string;
  specialRequests?: string;
  marketSegment?: string;
  guaranteed?: boolean;
  houseUse?: boolean;
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
  ratePlanId?: string;
  eta?: string;
  specialRequests?: string;
  marketSegment?: string;
  guaranteed?: boolean;
  houseUse?: boolean;
  doNotMove?: boolean;
  fixedRoom?: boolean;
}

export interface AssignRoomInput {
  roomId: string;
  rate?: number;
}

export interface ReservationTrace {
  id: string;
  reservationId: string;
  body: string;
  department: string;
  dueAt?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  createdById?: string | null;
  createdAt: string;
}

export interface ReservationCompanion {
  id: string;
  reservationId: string;
  guestId?: string | null;
  firstName: string;
  lastName: string;
  relationship?: string | null;
  sharesFolio: boolean;
  createdAt: string;
}

export interface CreateTraceInput {
  body: string;
  department?: string;
  dueAt?: string;
}

export interface AddCompanionInput {
  guestId?: string;
  firstName: string;
  lastName: string;
  relationship?: string;
  sharesFolio?: boolean;
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

export async function getReservationWorkspace(id: string): Promise<{ data: any }> {
  const response = await apiClient.get<{ data: any }>(`/reservation-workspace/${id}`);
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

export async function noShowReservation(id: string): Promise<{ data: Reservation }> {
  const response = await apiClient.post<{ data: Reservation }>(`/reservations/${id}/no-show`);
  return response.data;
}

export async function resendConfirmation(id: string): Promise<{ success: boolean }> {
  const response = await apiClient.post<{ success: boolean }>(
    `/reservations/${id}/resend-confirmation`
  );
  return response.data;
}

export async function updateStayRate(stayId: string, rate: number): Promise<{ data: Reservation }> {
  const response = await apiClient.patch<{ data: Reservation }>(`/reservations/stays/${stayId}`, {
    rate,
  });
  return response.data;
}

export async function listTraces(reservationId: string): Promise<{ data: ReservationTrace[] }> {
  const response = await apiClient.get<{ data: ReservationTrace[] }>(
    `/reservations/${reservationId}/traces`
  );
  return response.data;
}

export async function createTrace(
  reservationId: string,
  input: CreateTraceInput
): Promise<{ data: ReservationTrace }> {
  const response = await apiClient.post<{ data: ReservationTrace }>(
    `/reservations/${reservationId}/traces`,
    input
  );
  return response.data;
}

export async function resolveTrace(traceId: string): Promise<{ data: ReservationTrace }> {
  const response = await apiClient.post<{ data: ReservationTrace }>(
    `/reservations/traces/${traceId}/resolve`
  );
  return response.data;
}

export async function listCompanions(
  reservationId: string
): Promise<{ data: ReservationCompanion[] }> {
  const response = await apiClient.get<{ data: ReservationCompanion[] }>(
    `/reservations/${reservationId}/companions`
  );
  return response.data;
}

export async function addCompanion(
  reservationId: string,
  input: AddCompanionInput
): Promise<{ data: ReservationCompanion }> {
  const response = await apiClient.post<{ data: ReservationCompanion }>(
    `/reservations/${reservationId}/companions`,
    input
  );
  return response.data;
}

export async function removeCompanion(companionId: string): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ success: boolean }>(
    `/reservations/companions/${companionId}`
  );
  return response.data;
}
