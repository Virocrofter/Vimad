/* apps/web/src/app/app/housekeeping/space-status/page.jsx — T2+ Space Status report
 * Mews-depth: lifecycle stats header, arrivals/departures/stayover cards,
 * color-coded space grid (Clean=blue, Dirty=orange, Inspected=green, OOS=red,
 * OOO=slate), three-dot style status change with mandatory reason, bulk
 * selection, filter-first assignment, CSV export, run-rules for supervisors.
 */
import { useState, useMemo } from 'react';
import {
  useSpaceStatus,
  useRoomStatusTransition,
  useRunHkRule,
  useCreateHousekeepingTask,
} from '../../../../hooks/useHousekeeping';
import { useProperties } from '../../../../hooks/useProperties';
import { usePropertyScope } from '../../../../hooks/usePropertyScope';
import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Checkbox } from '../../../../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../components/ui/dialog';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { LoadingSkeleton } from '../../../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { toast } from '../../../../hooks/use-toast';
import { cn } from '../../../../lib/utils';
import {
  LayoutGrid,
  ArrowDownToLine,
  ArrowUpFromLine,
  BedDouble,
  Download,
  Play,
  Brush,
  Sparkles,
  Search,
  Ban,
} from 'lucide-react';

// Mews color coding
const HK_STYLE = {
  clean: {
    label: 'Clean',
    dot: 'bg-blue-500',
    tile: 'border-blue-300 bg-blue-50',
    text: 'text-blue-700',
  },
  dirty: {
    label: 'Dirty',
    dot: 'bg-orange-500',
    tile: 'border-orange-300 bg-orange-50',
    text: 'text-orange-700',
  },
  inspected: {
    label: 'Inspected',
    dot: 'bg-green-500',
    tile: 'border-green-300 bg-green-50',
    text: 'text-green-700',
  },
  in_progress: {
    label: 'In progress',
    dot: 'bg-yellow-500',
    tile: 'border-yellow-300 bg-yellow-50',
    text: 'text-yellow-700',
  },
  ready: {
    label: 'Ready',
    dot: 'bg-emerald-500',
    tile: 'border-emerald-300 bg-emerald-50',
    text: 'text-emerald-700',
  },
};
const SERVICE_STYLE = {
  active: null,
  ooo: { label: 'OOO', ring: 'ring-2 ring-slate-500', badge: 'bg-slate-200 text-slate-700' },
  oos: { label: 'OOS', ring: 'ring-2 ring-red-500', badge: 'bg-red-100 text-red-700' },
};
const HK_OPTIONS = ['clean', 'dirty', 'inspected', 'in_progress', 'ready'];
const SERVICE_OPTIONS = ['active', 'ooo', 'oos'];

export default function SpaceStatusPage() {
  const { currentPropertyId } = usePropertyScope();
  const { data, isLoading, error, refetch } = useSpaceStatus(currentPropertyId);
  const transition = useRoomStatusTransition();
  const runRule = useRunHkRule();
  const createTask = useCreateHousekeepingTask();

  const [floorFilter, setFloorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [selected, setSelected] = useState({});
  const [dialogRoom, setDialogRoom] = useState(null);
  const [hkStatus, setHkStatus] = useState('clean');
  const [serviceStatus, setServiceStatus] = useState('active');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  const grid = data?.data;
  const rooms = useMemo(() => grid?.rooms ?? [], [grid]);
  const floors = useMemo(
    () => [...new Set(rooms.map((r) => r.floor).filter(Boolean))].sort(),
    [rooms]
  );

  const filtered = useMemo(
    () =>
      rooms.filter(
        (r) =>
          (floorFilter === 'all' || r.floor === floorFilter) &&
          (statusFilter === 'all' || r.housekeepingStatus === statusFilter) &&
          (serviceFilter === 'all' || r.serviceStatus === serviceFilter)
      ),
    [rooms, floorFilter, statusFilter, serviceFilter]
  );

  const byFloor = useMemo(() => {
    const m = new Map();
    for (const r of filtered) {
      const f = r.floor ?? '—';
      if (!m.has(f)) m.set(f, []);
      m.get(f).push(r);
    }
    return [...m.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }, [filtered]);

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);

  const openDialog = (room) => {
    setDialogRoom(room);
    setHkStatus(room.housekeepingStatus);
    setServiceStatus(room.serviceStatus);
    setReason('');
    setNote('');
  };

  const saveTransition = async () => {
    const needsReason = serviceStatus === 'ooo' || serviceStatus === 'oos' || hkStatus === 'dirty';
    if (needsReason && reason.trim().length < 2) {
      toast({
        title: 'Reason required',
        description: 'OOO/OOS/Dirty transitions need a reason.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await transition.mutateAsync({
        id: dialogRoom.id,
        input: {
          housekeepingStatus: hkStatus !== dialogRoom.housekeepingStatus ? hkStatus : undefined,
          serviceStatus: serviceStatus !== dialogRoom.serviceStatus ? serviceStatus : undefined,
          reason: reason.trim() || undefined,
          note: note.trim() || undefined,
        },
      });
      toast({ title: `Room ${dialogRoom.number} updated` });
      setDialogRoom(null);
    } catch (e) {
      toast({
        title: 'Update failed',
        description: e?.response?.data?.error?.message ?? e.message,
        variant: 'destructive',
      });
    }
  };

  const bulkAssign = async () => {
    if (selectedIds.length === 0) return;
    const targets = rooms.filter((r) => selectedIds.includes(r.id));
    try {
      for (const room of targets) {
        await createTask.mutateAsync({
          propertyId: currentPropertyId,
          roomId: room.id,
          type: 'cleaning',
          priority: room.housekeepingStatus === 'dirty' ? 'high' : 'normal',
          notes: `Bulk-assigned from Space Status (${room.number})`,
        });
      }
      toast({ title: `${targets.length} cleaning task(s) created` });
      setSelected({});
    } catch (e) {
      toast({ title: 'Bulk assign failed', description: e.message, variant: 'destructive' });
    }
  };

  if (error) return <ErrorState title="Space Status failed to load" onRetry={() => refetch()} />;
  if (isLoading || !grid) return <LoadingSkeleton className="h-40" count={4} />;

  const statCards = [
    { key: 'clean', label: 'Clean', count: grid.stats.byHousekeeping.clean ?? 0 },
    { key: 'dirty', label: 'Dirty', count: grid.stats.byHousekeeping.dirty ?? 0 },
    { key: 'inspected', label: 'Inspected', count: grid.stats.byHousekeeping.inspected ?? 0 },
    { key: 'in_progress', label: 'In progress', count: grid.stats.byHousekeeping.in_progress ?? 0 },
    { key: 'ooo', label: 'OOO', count: grid.stats.byService.ooo ?? 0 },
    { key: 'oos', label: 'OOS', count: grid.stats.byService.oos ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
            <LayoutGrid className="h-6 w-6 text-secondary" /> Space Status
          </h1>
          <p className="text-sm text-text-secondary">
            {grid.stats.total} spaces · live (30s auto-refresh)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              runRule.mutate('hk-stagnant-vacant', {
                onSuccess: (r) => toast({ title: `Stagnant rule: ${r.data.flipped} flipped` }),
                onError: (e) =>
                  toast({ title: 'Rule failed', description: e.message, variant: 'destructive' }),
              })
            }
          >
            <Play className="mr-1 h-4 w-4" /> Run rules
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              import('../../../../api/housekeeping').then((m) =>
                m.downloadSpaceStatus(currentPropertyId)
              )
            }
          >
            <Download className="mr-1 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Lifecycle stats header */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {statCards.map(({ key, label, count }) => {
          const style = HK_STYLE[key] ?? SERVICE_STYLE[key];
          return (
            <Card
              key={key}
              className="cursor-pointer"
              onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <span
                  className={cn(
                    'h-3 w-3 rounded-full',
                    style?.dot ?? (key === 'ooo' ? 'bg-slate-500' : 'bg-red-500')
                  )}
                />
                <div>
                  <p className="text-xl font-bold font-mono text-text-primary">{count}</p>
                  <p className="text-xs text-text-muted">{label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Operations cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            icon: ArrowDownToLine,
            label: 'Arrivals today',
            value: grid.cards.arrivals,
            color: 'text-blue-600',
          },
          {
            icon: ArrowUpFromLine,
            label: 'Departures today',
            value: grid.cards.departures,
            color: 'text-amber-600',
          },
          {
            icon: BedDouble,
            label: 'Stayovers',
            value: grid.cards.stayovers,
            color: 'text-emerald-600',
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className={cn('h-5 w-5', color)} />
              <div>
                <p className="text-xl font-bold font-mono text-text-primary">{value}</p>
                <p className="text-xs text-text-muted">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + bulk actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={floorFilter} onValueChange={setFloorFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Floor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All floors</SelectItem>
            {floors.map((f) => (
              <SelectItem key={f} value={f}>
                Floor {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {HK_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {HK_STYLE[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All service</SelectItem>
            {SERVICE_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedIds.length > 0 && (
          <Button onClick={bulkAssign} disabled={createTask.isPending}>
            <Brush className="mr-1 h-4 w-4" /> Assign {selectedIds.length} to cleaning
          </Button>
        )}
        <span className="ml-auto text-xs text-text-muted">
          {filtered.length} of {rooms.length} shown
        </span>
      </div>

      {/* Space grid by floor */}
      {byFloor.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No rooms match the filters"
          description="Adjust the filters above."
        />
      ) : (
        byFloor.map(([floor, floorRooms]) => (
          <div key={floor}>
            <h2 className="mb-2 text-sm font-semibold text-text-secondary">Floor {floor}</h2>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
              {floorRooms.map((room) => {
                const hk = HK_STYLE[room.housekeepingStatus] ?? HK_STYLE.clean;
                const svc = SERVICE_STYLE[room.serviceStatus];
                return (
                  <div
                    key={room.id}
                    className={cn(
                      'relative cursor-pointer rounded-md border p-2 transition hover:shadow-md',
                      hk.tile,
                      svc?.ring
                    )}
                    onClick={() => openDialog(room)}
                    title={
                      room.serviceReason
                        ? `${hk.label} · ${room.serviceStatus.toUpperCase()}: ${room.serviceReason}`
                        : hk.label
                    }
                  >
                    <div className="flex items-start justify-between">
                      <Checkbox
                        className="h-3.5 w-3.5"
                        checked={!!selected[room.id]}
                        onCheckedChange={(v) => setSelected((s) => ({ ...s, [room.id]: !!v }))}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {svc && (
                        <Badge className={cn('px-1 py-0 text-[9px]', svc.badge)}>{svc.label}</Badge>
                      )}
                    </div>
                    <p className={cn('mt-1 text-center font-mono text-sm font-bold', hk.text)}>
                      {room.number}
                    </p>
                    <p className="text-center text-[10px] text-text-muted">
                      {room.roomType.code}
                      {room._count.childRooms > 0 ? ` · +${room._count.childRooms}` : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Status change dialog (three-dot equivalent) */}
      <Dialog open={!!dialogRoom} onOpenChange={(o) => !o && setDialogRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Room {dialogRoom?.number} — {dialogRoom?.roomType.name}
            </DialogTitle>
          </DialogHeader>
          {dialogRoom?.serviceReason && (
            <p className="rounded bg-slate-50 px-3 py-2 text-xs text-text-secondary">
              Current reason: {dialogRoom.serviceReason}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Housekeeping status</Label>
              <Select value={hkStatus} onValueChange={setHkStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HK_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {HK_STYLE[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service status</Label>
              <Select value={serviceStatus} onValueChange={setServiceStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>
              Reason{' '}
              {(serviceStatus === 'ooo' || serviceStatus === 'oos' || hkStatus === 'dirty') && (
                <span className="text-red-500">*</span>
              )}
            </Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. AC repair, deep clean"
            />
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogRoom(null)}>
              Cancel
            </Button>
            <Button onClick={saveTransition} disabled={transition.isPending}>
              <Sparkles className="mr-1 h-4 w-4" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
