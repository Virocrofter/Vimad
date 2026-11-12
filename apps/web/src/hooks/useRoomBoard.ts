/* apps/web/src/hooks/useRoomBoard.ts — room board v2 (slice #3). */
import { useQuery } from '@tanstack/react-query';
import {
  getRoomBoard,
  getRoomBoardRoom,
  type RoomBoardData,
  type RoomBoardDetail,
} from '../api/housekeeping';
import { listProperties } from '../api/properties';
import { getCurrentPropertyId } from '../stores/propertyStore';

function useActivePropertyId(): string | undefined {
  const scoped = getCurrentPropertyId();
  const q = useQuery({
    queryKey: ['properties', 'list'],
    queryFn: listProperties,
    staleTime: 60_000,
    enabled: !scoped,
  });
  return scoped ?? q.data?.[0]?.id;
}

export function useRoomBoard(date?: string) {
  const propertyId = useActivePropertyId();
  return useQuery<RoomBoardData>({
    queryKey: ['room-board', propertyId, date],
    queryFn: async () => (await getRoomBoard(propertyId as string, date)).data,
    enabled: !!propertyId,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useRoomBoardDetail(roomId?: string | null) {
  return useQuery<RoomBoardDetail>({
    queryKey: ['room-board', 'detail', roomId],
    queryFn: async () => (await getRoomBoardRoom(roomId as string)).data,
    enabled: !!roomId,
  });
}
