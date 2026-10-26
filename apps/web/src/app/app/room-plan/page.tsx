import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRoomPlan } from '../../../api/room-plan';
import { usePropertyScope } from '../../../hooks/usePropertyScope';
import TapeChart from '../../../components/room-plan/TapeChart';

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function addDays(key: string, n: number): string {
  const d = new Date(`${key}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export default function RoomPlanPage() {
  const scope = usePropertyScope();
  const properties = scope.properties ?? [];
  const propertyId = scope.current?.id ?? properties[0]?.id ?? null;

  const [range, setRange] = useState(14);
  const [anchor, setAnchor] = useState<string>(() => toKey(new Date()));

  const from = addDays(anchor, -Math.floor(range / 4));
  const to = addDays(from, range);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['room-plan', propertyId, from, to],
    queryFn: () => fetchRoomPlan({ propertyId: propertyId as string, from, to }),
    enabled: !!propertyId,
    staleTime: 20_000,
    refetchInterval: 60_000,
  });

  const navigate = (dir: -1 | 1) => setAnchor((a) => addDays(a, dir * range));
  const goToday = () => setAnchor(toKey(new Date()));

  if (!propertyId) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No property selected. Choose a property in the switcher.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Loading room plan…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm">
        <span className="text-destructive">Failed to load the room plan.</span>
        <button
          onClick={() => refetch()}
          className="rounded-md border px-3 py-1 text-xs hover:bg-accent"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <TapeChart
      property={data.property}
      rooms={data.rooms}
      roomTypes={data.roomTypes}
      reservations={data.reservations}
      stays={data.stays}
      blocks={data.blocks}
      restrictions={data.restrictions}
      holds={data.holds}
      dayStats={data.dayStats}
      from={from}
      to={to}
      range={range}
      onRangeChange={setRange}
      onNavigate={navigate}
      onToday={goToday}
      isFetching={isFetching}
      onRefetch={() => refetch()}
    />
  );
}
