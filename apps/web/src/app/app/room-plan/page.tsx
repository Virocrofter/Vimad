import { Calendar, LayoutGrid } from 'lucide-react';
import { useMemo } from 'react';
import { useRooms } from '../../../hooks/useRooms';
import { useReservations } from '../../../hooks/useReservations';
import { Button } from '@/components/ui/button';
import { Skeleton, SkeletonText } from '../../../components/ui/skeleton';
import TapeChart from '../../../components/room-plan/TapeChart';

function getRoomTypeName(roomTypeId: string): string {
  const map: Record<string, string> = {
    'rt-std-king': 'Standard King',
    'rt-std-twin': 'Standard Twin',
    'rt-std-queen': 'Standard Queen',
    'rt-del-king': 'Deluxe King',
    'rt-suite': 'Suite',
  };
  return map[roomTypeId] ?? roomTypeId;
}

export default function RoomPlanPage() {
  const {
    data: roomsData = [],
    isLoading: roomsLoading,
    error: roomsError,
    refetch: refetchRooms,
  } = useRooms();
  const {
    data: reservationsData = [],
    isLoading: reservationsLoading,
    error: reservationsError,
    refetch: refetchReservations,
  } = useReservations();

  const isLoading = roomsLoading || reservationsLoading;
  const error = roomsError || reservationsError;

  const rooms = useMemo(
    () =>
      roomsData.map((room) => ({
        id: room.id,
        floor: room.floor,
        type: getRoomTypeName(room.roomTypeId),
        status: room.status,
      })),
    [roomsData]
  );

  const reservations = useMemo(
    () =>
      reservationsData
        .filter((reservation) => reservation.roomId != null)
        .map((reservation) => ({
          id: reservation.id,
          guest: `${reservation.guest.firstName} ${reservation.guest.lastName}`,
          roomId: reservation.roomId as string,
          startDate: reservation.arrival,
          endDate: reservation.departure,
          status: reservation.status,
          rate: reservation.rate,
          adults: reservation.adults,
          children: reservation.children,
          phone: reservation.guest.phone ?? '',
          email: reservation.guest.email ?? '',
          balance: reservation.balance,
        })),
    [reservationsData]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Room Plan</h1>
          <p className="text-sm text-text-secondary">
            Visual tape chart — drag reservations, view availability, and manage assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-secondary">
            <LayoutGrid className="h-3.5 w-3.5" /> Drag to assign
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-secondary">
            <Calendar className="h-3.5 w-3.5" /> 7-day view
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-8 text-center">
          <p className="text-sm font-medium text-danger">Failed to load room plan</p>
          <p className="mt-1 text-xs text-text-muted">{error.message}</p>
          <Button
            onClick={() => {
              refetchRooms();
              refetchReservations();
            }}
            className="mt-4"
            size="sm"
          >
            Retry
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-2">
              <SkeletonText />
              <SkeletonText />
              <SkeletonText />
              <SkeletonText />
              <SkeletonText />
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <TapeChart rooms={rooms} reservations={reservations} />
        </div>
      )}
    </div>
  );
}
