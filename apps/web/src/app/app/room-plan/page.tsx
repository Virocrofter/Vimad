/* apps/web/src/app/app/room-plan/page.tsx */
import { useMemo } from 'react';
import { format, addDays, subDays, startOfDay } from 'date-fns';
import { useReservations } from '../../../hooks/useReservations';
import { useRooms } from '../../../hooks/useRooms';
import { useRoomTypes } from '../../../hooks/useRoomTypes';
import TapeChart from '../../../components/room-plan/TapeChart';

const RANGE_DAYS = 30;

export default function RoomPlanPage() {
  // Load reservations overlapping a rolling window around today so the tape
  // chart always has data regardless of which view mode is selected.
  const rangeParams = useMemo(() => {
    const today = startOfDay(new Date());
    return {
      from: format(subDays(today, 7), 'yyyy-MM-dd'),
      to: format(addDays(today, RANGE_DAYS), 'yyyy-MM-dd'),
      pageSize: 200,
    };
  }, []);

  const {
    reservations,
    isLoading: reservationsLoading,
    isFetching: reservationsFetching,
    error: reservationsError,
    refetch: refetchReservations,
  } = useReservations(rangeParams);

  const { rooms, isLoading: roomsLoading, error: roomsError, refetch: refetchRooms } = useRooms();
  const { roomTypes, isLoading: roomTypesLoading } = useRoomTypes();

  if (reservationsLoading || roomsLoading || roomTypesLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
          <p className="text-sm text-text-muted">Loading room plan…</p>
        </div>
      </div>
    );
  }

  if (reservationsError || roomsError) {
    const err = (reservationsError || roomsError) as Error;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-background p-8 text-center">
        <p className="text-sm text-danger">{err?.message || 'Failed to load the room plan'}</p>
        <button
          type="button"
          onClick={() => {
            refetchReservations();
            refetchRooms();
          }}
          className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <TapeChart
        rooms={rooms}
        roomTypes={roomTypes}
        reservations={reservations}
        isFetching={reservationsFetching}
      />
    </div>
  );
}
