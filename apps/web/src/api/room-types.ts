import { getApiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';
import type { RoomType } from '../types';

export type { RoomType };

export interface CreateRoomTypeInput {
  name: string;
  code: string;
  description?: string;
  baseRate: number;
  maxOccupancy: number;
  bedConfig?: string;
  amenities?: string[];
  imageUrl?: string;
  status?: 'active' | 'inactive';
}

export type UpdateRoomTypeInput = Partial<CreateRoomTypeInput>;

export async function listRoomTypes(
  params?: PaginationParams
): Promise<PaginatedResponse<RoomType>> {
  const client = getApiClient();
  const response = await client.get<PaginatedResponse<RoomType>>('/room-types', { params });
  return response.data;
}

export async function getRoomType(id: string): Promise<{ data: RoomType }> {
  const client = getApiClient();
  const response = await client.get<{ data: RoomType }>(`/room-types/${id}`);
  return response.data;
}

export async function createRoomType(input: CreateRoomTypeInput): Promise<{ data: RoomType }> {
  const client = getApiClient();
  const response = await client.post<{ data: RoomType }>('/room-types', input);
  return response.data;
}

export async function updateRoomType(
  id: string,
  input: UpdateRoomTypeInput
): Promise<{ data: RoomType }> {
  const client = getApiClient();
  const response = await client.patch<{ data: RoomType }>(`/room-types/${id}`, input);
  return response.data;
}

export async function deleteRoomType(id: string): Promise<void> {
  const client = getApiClient();
  await client.delete(`/room-types/${id}`);
}
