import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';
import type { Room } from '../types';

export type { Room };

export interface CreateRoomInput {
  roomTypeId: string;
  number: string;
  floor?: number;
  status?: Room['status'];
  housekeepingStatus?: Room['housekeepingStatus'];
  notes?: string;
}

export type UpdateRoomInput = Partial<CreateRoomInput>;

export async function listRooms(
  params?: PaginationParams & { roomTypeId?: string }
): Promise<PaginatedResponse<Room>> {
  const response = await apiClient.get<PaginatedResponse<Room>>('/rooms', { params });
  return response.data;
}

export async function getRoom(id: string): Promise<{ data: Room }> {
  const response = await apiClient.get<{ data: Room }>(`/rooms/${id}`);
  return response.data;
}

export async function createRoom(input: CreateRoomInput): Promise<{ data: Room }> {
  const response = await apiClient.post<{ data: Room }>('/rooms', input);
  return response.data;
}

export async function updateRoom(id: string, input: UpdateRoomInput): Promise<{ data: Room }> {
  const response = await apiClient.patch<{ data: Room }>(`/rooms/${id}`, input);
  return response.data;
}

export async function deleteRoom(id: string): Promise<void> {
  await apiClient.delete(`/rooms/${id}`);
}
