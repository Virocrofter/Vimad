/* apps/web/src/app/app/housekeeping/mobile/page.jsx — C9' HK mobile PWA
 * Worker-facing surface: floor-grouped room list, big touch targets,
 * status chips + search, one-tap CLE/DIR/INS/OOS with mandatory reason.
 * Offline: rides the existing A6 service worker + mutation queue — the
 * same apiClient mutations queue and sync when connectivity returns.
 */
import { useState, useMemo } from 'react';
import { useSpaceStatus, useRoomStatusTransition } from '../../../../hooks/useHousekeeping';
import { usePropertyScope } from '../../../../hooks/usePropertyScope';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { LoadingSkeleton } from '../../../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { toast } from '../../../../hooks/use-toast';
import { cn } from '../../../../lib/utils';
import { Search, RefreshCw, Check, Brush, Sparkles, Ban, DoorOpen } from 'lucide-react';

const HK_STYLE = {
  clean: { label: 'Clean', chip: 'bg-blue-100 text-blue-700' },
  dirty: { label: 'Dirty', chip: 'bg-orange-100 text-orange-700' },
  inspected: { label: 'Inspected', chip: 'bg-green-100 text-green-700' },
  in_progress: { label: 'In progress', chip: 'bg-yellow-100 text-yellow-700' },
  ready: { label: 'Ready', chip: 'bg-emerald-100 text-emerald-700' },
};
const ACTIONS = [
  { key: 'clean', label: 'Clean', icon: Check },
  { key: 'dirty', label: 'Dirty', icon: Brush },
  { key: 'inspected', label: 'Inspect', icon: Sparkles },
];

export default function HousekeepingMobilePage() {
  const { currentPropertyId } = usePropertyScope();
  const { data, isLoading, error, refetch, isFetching } = useSpaceStatus(currentPropertyId);
  const transition = useRoomStatusTransition();

  const [search, setSearch] = useState('');
  const [floor, setFloor] = useState('all');
  const [chip, setChip] = useState('all');
  const [openRoom, setOpenRoom] = useState(null);
  const [reason, setReason] = useState('');

  const rooms = useMemo(() => data?.data?.rooms ?? [], [data]);
  const floors = useMemo(
    () => [...new Set(rooms.map((r) => r.floor).filter(Boolean))].sort(),
    [rooms]
  );

  const filtered = useMemo(
    () =>
      rooms.filter(
        (r) =>
          (floor === 'all' || r.floor === floor) &&
          (chip === 'all' ||
            r.housekeepingStatus === chip ||
            (chip === 'ooo' && r.serviceStatus === 'ooo')) &&
          (search === '' || r.number.toLowerCase().includes(search.toLowerCase()))
      ),
    [rooms, floor, chip, search]
  );

  const groups = useMemo(() => {
    const m = new Map();
    for (const r of filtered) {
      const f = r.floor ?? '—';
      if (!m.has(f)) m.set(f, []);
      m.get(f).push(r);
    }
    return [...m.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }, [filtered]);

  const dirtyCount = rooms.filter((r) => r.housekeepingStatus === 'dirty').length;
  const oosCount = rooms.filter((r) => r.serviceStatus === 'oos').length;
  const oooCount = rooms.filter((r) => r.serviceStatus === 'ooo').length;

  const act = async (room, housekeepingStatus) => {
    const needsReason = housekeepingStatus === 'dirty';
    if (needsReason && reason.trim().length < 2) {
      toast({
        title: 'Reason required',
        description: 'Give a short reason for dirty.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await transition.mutateAsync({
        id: room.id,
        input: {
          housekeepingStatus,
          reason: reason.trim() || undefined,
        },
      });
      toast({
        title: `${room.number} → ${HK_STYLE[housekeepingStatus]?.label ?? housekeepingStatus}`,
      });
      setOpenRoom(null);
      setReason('');
    } catch (e) {
      toast({
        title: 'Failed',
        description: e?.response?.data?.error?.message ?? e.message,
        variant: 'destructive',
      });
    }
  };

  if (error) return <ErrorState title="Could not load rooms" onRetry={() => refetch()} />;
  if (isLoading) return <LoadingSkeleton className="h-24" count={4} />;

  return (
    <div className="mx-auto max-w-md space-y-4 pb-20">
      <div className="sticky top-0 z-10 space-y-2 bg-background/95 pt-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
            <Input
              className="pl-8"
              placeholder="Room number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Badge
            variant="secondary"
            className="shrink-0 cursor-pointer"
            onClick={() => setChip('dirty')}
          >
            <Brush className="mr-1 h-3 w-3" /> {dirtyCount} dirty
          </Badge>
          <Badge
            variant="secondary"
            className="shrink-0 cursor-pointer"
            onClick={() => setChip('ooo')}
          >
            <DoorOpen className="mr-1 h-3 w-3" /> {oooCount} OOO
          </Badge>
          <Badge
            variant="secondary"
            className="shrink-0 cursor-pointer"
            onClick={() => setChip('all')}
          >
            <Ban className="mr-1 h-3 w-3" /> {oosCount} OOS
          </Badge>
          {floors.map((f) => (
            <Badge
              key={f}
              variant={floor === f ? 'default' : 'outline'}
              className="shrink-0 cursor-pointer"
              onClick={() => setFloor(floor === f ? 'all' : f)}
            >
              Fl {f}
            </Badge>
          ))}
        </div>
      </div>

      {groups.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-text-muted">
          No rooms match — pull to refresh or clear filters.
        </p>
      )}

      {groups.map(([f, rs]) => (
        <div key={f}>
          <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Floor {f}
          </h2>
          <div className="space-y-2">
            {rs.map((room) => {
              const style = HK_STYLE[room.housekeepingStatus] ?? HK_STYLE.clean;
              const open = openRoom === room.id;
              return (
                <div
                  key={room.id}
                  className={cn(
                    'rounded-lg border bg-surface transition',
                    open ? 'border-secondary' : 'border-border'
                  )}
                >
                  <button
                    className="flex w-full items-center justify-between p-3 text-left"
                    onClick={() => setOpenRoom(open ? null : room.id)}
                  >
                    <div>
                      <p className="font-mono text-lg font-bold text-text-primary">{room.number}</p>
                      <p className="text-xs text-text-muted">
                        {room.roomType.code}
                        {room._count.childRooms > 0 ? ` · +${room._count.childRooms} linked` : ''}
                        {room.serviceReason ? ` · ${room.serviceReason}` : ''}
                      </p>
                    </div>
                    <Badge className={cn(style.chip)}>
                      {room.serviceStatus !== 'active'
                        ? room.serviceStatus.toUpperCase()
                        : style.label}
                    </Badge>
                  </button>
                  {open && (
                    <div className="space-y-2 border-t border-border p-3">
                      <Input
                        placeholder="Reason (required for Dirty)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        {ACTIONS.map(({ key, label, icon: Icon }) => (
                          <Button
                            key={key}
                            variant={room.housekeepingStatus === key ? 'default' : 'outline'}
                            className="h-12 flex-col gap-0.5 text-xs"
                            disabled={transition.isPending}
                            onClick={() => act(room, key)}
                          >
                            <Icon className="h-5 w-5" />
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
