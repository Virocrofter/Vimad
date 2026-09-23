/* apps/web/src/hooks/useRooms.ts */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMockQuery } from './useMockQuery';
import {
  listRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  type Room,
  type CreateRoomInput,
} from '../api/rooms';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

const MOCK_ROOMS: Room[] = [
  {
    id: '101',

    propertyId: 'TNT-001',
    roomTypeId: 'rt-std-king',
    number: '101',
    floor: 1,
    status: 'clean',
    housekeepingStatus: 'clean',
  },
  {
    id: '102',

    propertyId: 'TNT-001',
    roomTypeId: 'rt-std-king',
    number: '102',
    floor: 1,
    status: 'occupied',
    housekeepingStatus: 'dirty',
  },
  {
    id: '103',

    propertyId: 'TNT-001',
    roomTypeId: 'rt-std-twin',
    number: '103',
    floor: 1,
    status: 'dirty',
    housekeepingStatus: 'dirty',
  },
  {
    id: '104',

    propertyId: 'TNT-001',
    roomTypeId: 'rt-del-king',
    number: '104',
    floor: 1,
    status: 'inspected',
    housekeepingStatus: 'inspected',
  },
  {
    id: '105',

    propertyId: 'TNT-001',
    roomTypeId: 'rt-suite',
    number: '105',
    floor: 1,
    status: 'clean',
    housekeepingStatus: 'clean',
  },
  {
    id: '201',

    propertyId: 'TNT-001',
    roomTypeId: 'rt-std-king',
    number: '201',
    floor: 2,
    status: 'clean',
    housekeepingStatus: 'clean',
  },
  {
    id: '202',

    propertyId: 'TNT-001',
    roomTypeId: 'rt-std-twin',
    number: '202',
    floor: 2,
    status: 'occupied',
    housekeepingStatus: 'dirty',
  },
  {
    id: '203',

    propertyId: 'TNT-001',
    roomTypeId: 'rt-del-king',
    number: '203',
    floor: 2,
    status: 'clean',
    housekeepingStatus: 'clean',
  },
  {
    id: '204',

    propertyId: 'TNT-001',
    roomTypeId: 'rt-del-king',
    number: '204',
    floor: 2,
    status: 'occupied',
    housekeepingStatus: 'clean',
  },
  {
    id: '205',

    propertyId: 'TNT-001',
    roomTypeId: 'rt-suite',
    number: '205',
    floor: 2,
    status: 'dirty',
    housekeepingStatus: 'dirty',
  },
  {
    id: '301',

    propertyId: 'TNT-001',
    roomTypeId: 'rt-std-king',
    number: '301',
    floor: 3,
    status: 'clean',
    housekeepingStatus: 'clean',
  },
  {
    id: '302',

    propertyId: 'TNT-001',
    roomTypeId: 'rt-del-king',
    number: '302',
    floor: 3,
    status: 'inspected',
    housekeepingStatus: 'inspected',
  },
  {
    id: '303',

    propertyId: 'TNT-001',
    roomTypeId: 'rt-suite',
    number: '303',
    floor: 3,
    status: 'clean',
    housekeepingStatus: 'clean',
  },
];

export function useRooms() {
  return useMockQuery<Room[]>(['rooms'], async () => {
    if (USE_MOCK) {
      return MOCK_ROOMS;
    }
    const { data } = await listRooms();
    return data;
  });
}

export function useRoomMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (input: CreateRoomInput) => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return {
          ...input,
          id: `room-${Date.now()}`,

          propertyId: 'TNT-001',
        } as Room;
      }
      const { data } = await createRoom(input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CreateRoomInput> }) => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return { ...input, id } as Room;
      }
      const { data } = await updateRoom(id, input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return id;
      }
      await deleteRoom(id);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });

  return { create, update, remove };
}
