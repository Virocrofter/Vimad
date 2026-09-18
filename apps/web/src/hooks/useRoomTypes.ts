import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMockQuery } from './useMockQuery';
import {
  listRoomTypes,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  type RoomType,
  type CreateRoomTypeInput,
} from '../api/room-types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

const MOCK_ROOM_TYPES: RoomType[] = [
  {
    id: 'rt-std-king',
    tenantId: 'tenant-001',
    propertyId: 'TNT-001',
    name: 'Standard King',
    code: 'STK',
    description: 'Comfortable king room with city view',
    baseRate: 149,
    maxOccupancy: 2,
    bedConfig: '1 King',
    amenities: ['wifi', 'tv', 'workspace'],
    status: 'active',
  },
  {
    id: 'rt-del-king',
    tenantId: 'tenant-001',
    propertyId: 'TNT-001',
    name: 'Deluxe King',
    code: 'DLK',
    description: 'Spacious deluxe king with premium amenities',
    baseRate: 189,
    maxOccupancy: 2,
    bedConfig: '1 King',
    amenities: ['wifi', 'tv', 'minibar', 'workspace', 'balcony'],
    status: 'active',
  },
  {
    id: 'rt-std-twin',
    tenantId: 'tenant-001',
    propertyId: 'TNT-001',
    name: 'Standard Twin',
    code: 'STT',
    description: 'Two twin beds, ideal for families or shared stays',
    baseRate: 145,
    maxOccupancy: 2,
    bedConfig: '2 Twin',
    amenities: ['wifi', 'tv'],
    status: 'active',
  },
  {
    id: 'rt-suite',
    tenantId: 'tenant-001',
    propertyId: 'TNT-001',
    name: 'Executive Suite',
    code: 'SUT',
    description: 'Separate living area and premium views',
    baseRate: 320,
    maxOccupancy: 4,
    bedConfig: '1 King + Sofa Bed',
    amenities: ['wifi', 'tv', 'minibar', 'workspace', 'balcony', 'jacuzzi'],
    status: 'active',
  },
];

export function useRoomTypes() {
  return useMockQuery<RoomType[]>(['room-types'], async () => {
    if (USE_MOCK) {
      return MOCK_ROOM_TYPES;
    }
    const { data } = await listRoomTypes();
    return data;
  });
}

export function useRoomTypeMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (input: CreateRoomTypeInput) => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return {
          ...input,
          id: `rt-${Date.now()}`,
          tenantId: 'tenant-001',
          propertyId: 'TNT-001',
        } as RoomType;
      }
      const { data } = await createRoomType(input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['room-types'] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CreateRoomTypeInput> }) => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return { ...input, id } as RoomType;
      }
      const { data } = await updateRoomType(id, input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['room-types'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return id;
      }
      await deleteRoomType(id);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['room-types'] }),
  });

  return { create, update, remove };
}
