/* apps/web/src/api/room-types.ts */
import { apiGet, apiPost, apiPatch, apiDelete } from './client';

export interface RoomType {
  id: string;
  tenantId: string;
  propertyId: string;
  name: string;
  code: string;
  description?: string;
  baseOccupancy: number;
  maxOccupancy: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoomTypeInput {
  propertyId: string;
  name: string;
  code: string;
  description?: string;
  baseOccupancy?: number;
  maxOccupancy?: number;
}

export interface UpdateRoomTypeInput extends Partial<CreateRoomTypeInput> {
  status?: string;
}

export async function listRoomTypes(propertyId?: string): Promise<RoomType[]> {
  const response = await apiGet<{ data: RoomType[] }>('/v1/room-types', {
    propertyId,
  });
  return response.data;
}

export async function getRoomType(id: string): Promise<RoomType> {
  const response = await apiGet<{ data: RoomType }>(`/v1/room-types/${id}`);
  return response.data;
}

export async function createRoomType(input: CreateRoomTypeInput): Promise<RoomType> {
  const response = await apiPost<{ data: RoomType }>('/v1/room-types', input);
  return response.data;
}

export async function updateRoomType(id: string, input: UpdateRoomTypeInput): Promise<RoomType> {
  const response = await apiPatch<{ data: RoomType }>(`/v1/room-types/${id}`, input);
  return response.data;
}

export async function deleteRoomType(id: string): Promise<void> {
  await apiDelete(`/v1/room-types/${id}`);
}
