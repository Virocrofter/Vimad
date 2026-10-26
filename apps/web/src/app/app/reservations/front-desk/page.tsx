/* apps/web/src/app/app/reservations/front-desk/page.tsx */
import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRightToLine,
  ArrowLeftToLine,
  BedDouble,
  DoorOpen,
  Plus,
  FilePlus2,
  ListChecks,
  Receipt,
  Sparkles,
  Moon,
  Search,
  LogIn,
  UserPlus,
  X,
} from 'lucide-react';
import { cn, formatCurrency } from '../../../../lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '../../../../components/ui/skeleton';
import type { Reservation } from '../../../../types';
import {
  useReservations,
  useCheckIn,
  useCheckOut,
  useAssignRoom,
} from '../../../../hooks/useReservations';
import { useRooms } from '../../../../hooks/useRooms';
import { hasQueuedMutationFor } from '../../../../lib/offline';
import { useToast } from '../../../../hooks/use-toast';

type Tab = 'arrivals' | 'inhouse' | 'departures';

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
];

function guestName(r: Reservation): string {
  if (r.guestName) return r.guestName;
  const g = r.guest as { firstName?: string; lastName?: string } | undefined;
  const n = g ? `${g.firstName ?? ''} ${g.lastName ?? ''}`.trim() : '';
  return n || 'Unknown';
}

function initials(name: string) {
  return (
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const day = (d?: string) => (d ?? new Date().toISOString().slice(0, 10)).slice(0, 10);
const isInHouse = (r: Reservation) => r.status === 'checked_in';
const isArrival = (r: Reservation) => r.status === 'confirmed' && day(r.arrivalDate) === day();
const isDeparture = (r: Reservation) =>
  (r.status === 'checked_in' && day(r.departureDate) === day()) ||
  (r.status === 'checked_out' && day(r.departureDate) >= day());

function formatDates(r: Reservation) {
  const a = r.arrivalDate ? new Date(r.arrivalDate) : null;
  const d = r.departureDate ? new Date(r.departureDate) : null;
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return { range: `${a ? fmt(a) : '—'} → ${d ? fmt(d) : '—'}`, nights: r.nights };
}

const money = (v?: number | string) =>
  Number.isFinite(Number(v ?? NaN)) ? formatCurrency(Number(v)) : '—';

export default function FrontDeskPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('arrivals');
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [assignFor, setAssignFor] = useState<Reservation | null>(null);
  const [assignRoomId, setAssignRoomId] = useState('');
  const { toast } = useToast();

  const { reservations, isLoading, error, refetch } = useReservations({ pageSize: 200 });
  const { rooms } = useRooms();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const assignRoom = useAssignRoom();

  const availableRooms = useMemo(
    () => rooms.filter((r) => (r.status ?? '') !== 'occupied').length,
    [rooms]
  );

  const counts = useMemo(
    () => ({
      arrivals: reservations.filter(isArrival).length,
      departures: reservations.filter(isDeparture).length,
      inhouse: reservations.filter(isInHouse).length,
    }),
    [reservations]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base: Reservation[];
    if (tab === 'arrivals') {
      base = reservations.filter(isArrival);
    } else if (tab === 'inhouse') {
      base = reservations.filter(isInHouse);
    } else {
      base = reservations.filter(isDeparture);
    }
    if (!q) return base;
    return base.filter((r) => {
      const name = guestName(r).toLowerCase();
      const room = String(r.roomNumber ?? '');
      const conf = (r.confirmationNumber ?? '').toLowerCase();
      return name.includes(q) || room.includes(q) || conf.includes(q);
    });
  }, [reservations, tab, search]);

  const run = (fn: () => void) => {
    setActionError(null);
    fn();
  };

  const doCheckIn = async (r: Reservation) => {
    const hasRoom = (r.stays?.length ?? 0) > 0 || Boolean(r.roomNumber);
    const willHaveRoom =
      hasRoom || !navigator.onLine || (await hasQueuedMutationFor(`/reservations/${r.id}`));

    if (!willHaveRoom) {
      setActionError(`${r.confirmationNumber} has no room assigned — assign a room first.`);
      setAssignFor(r);
      return;
    }
    setBusyId(r.id);
    checkIn.mutate(r.id, {
      onSettled: () => setBusyId(null),
      onSuccess: (data: { queued?: boolean; data?: Reservation } | undefined) => {
        if (data?.queued) {
          toast({
            title: 'Queued — will sync',
            description: `${r.confirmationNumber}: check-in is queued and will sync when the connection returns.`,
          });
        } else {
          toast({ title: 'Checked in', description: r.confirmationNumber });
        }
      },
      onError: (e: Error) => setActionError(`${r.confirmationNumber}: ${e.message}`),
    });
  };

  const doCheckOut = (r: Reservation) => {
    setBusyId(r.id);
    checkOut.mutate(r.id, {
      onSettled: () => setBusyId(null),
      onSuccess: (data: { queued?: boolean; data?: Reservation } | undefined) => {
        if (data?.queued) {
          toast({
            title: 'Queued — will sync',
            description: `${r.confirmationNumber}: check-out is queued and will sync when the connection returns.`,
          });
        } else {
          toast({ title: 'Checked out', description: r.confirmationNumber });
        }
      },
      onError: (e: Error) => setActionError(`${r.confirmationNumber}: ${e.message}`),
    });
  };

  const openAssign = (r: Reservation) => {
    setAssignFor(r);
    setAssignRoomId('');
  };

  const doAssign = () => {
    if (!assignFor || !assignRoomId) return;
    const target = assignFor;
    setBusyId(target.id);
    assignRoom.mutate(
      { id: target.id, input: { roomId: assignRoomId } },
      {
        onSettled: () => {
          setBusyId(null);
          setAssignFor(null);
        },
        onSuccess: (data: { queued?: boolean; data?: Reservation } | undefined) => {
          if (data?.queued) {
            toast({
              title: 'Queued — will sync',
              description: `${target.confirmationNumber}: room assignment is queued and will sync when the connection returns.`,
            });
          } else {
            toast({
              title: 'Room assigned',
              description: `${target.confirmationNumber} → Room ${
                rooms.find((rm) => rm.id === assignRoomId)?.number ?? ''
              }`,
            });
          }
        },
        onError: (e: Error) => setActionError(`${target.confirmationNumber}: ${e.message}`),
      }
    );
  };

  const stats = [
    {
      label: 'ARRIVALS',
      value: counts.arrivals,
      icon: ArrowRightToLine,
      color: 'text-emerald-400',
    },
    {
      label: 'DEPARTURES',
      value: counts.departures,
      icon: ArrowLeftToLine,
      color: 'text-amber-400',
    },
    { label: 'IN-HOUSE', value: counts.inhouse, icon: BedDouble, color: 'text-sky-400' },
    { label: 'AVAILABLE', value: availableRooms, icon: DoorOpen, color: 'text-violet-400' },
  ];

  const quickActions = [
    { label: 'New Reservation', icon: FilePlus2, onClick: () => navigate('/app/reservations/new') },
    { label: 'All Reservations', icon: ListChecks, onClick: () => navigate('/app/reservations') },
    { label: 'Billing & Folio', icon: Receipt, onClick: () => navigate('/app/billing') },
    { label: 'Housekeeping', icon: Sparkles, onClick: () => navigate('/app/housekeeping') },
    { label: 'Night Audit', icon: Moon, onClick: () => navigate('/app/night-audit') },
  ];

  const tabs: Array<{ key: Tab; label: string; count: number; icon: typeof LogIn }> = [
    { key: 'arrivals', label: 'Arrivals', count: counts.arrivals, icon: ArrowRightToLine },
    { key: 'inhouse', label: 'In-House', count: counts.inhouse, icon: BedDouble },
    { key: 'departures', label: 'Departures', count: counts.departures, icon: ArrowLeftToLine },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Front Desk</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage arrivals, departures, and in-house guests
          </p>
        </div>
        <Button onClick={() => navigate('/app/reservations/new')}>
          <Plus size={16} className="mr-2" /> Walk-In
        </Button>
      </div>

      {actionError && (
        <div className="flex items-center justify-between rounded-lg border border-danger/20 bg-danger/5 px-4 py-2.5">
          <p className="text-sm text-danger">{actionError}</p>
          <button
            onClick={() => setActionError(null)}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            Dismiss
          </button>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-danger/20 bg-danger/5 px-4 py-2.5">
          <p className="text-sm text-danger">
            Failed to load reservations: {(error as Error).message}
          </p>
          <button onClick={() => refetch()} className="text-xs text-secondary hover:underline">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-xl border border-border bg-surface p-4"
          >
            <div>
              <div className="text-xs font-medium tracking-wide text-text-muted">{label}</div>
              <div className="text-2xl font-bold text-text-primary mt-1">{value}</div>
            </div>
            <Icon size={22} className={color} />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {quickActions.map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-surface text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition"
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-border bg-surface p-1">
          {tabs.map(({ key, label, count, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition',
                tab === key
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <Icon size={14} /> {label}
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  tab === key ? 'bg-white/20' : 'bg-surface-elevated text-text-muted'
                )}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guest, room, conf#..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_0.75fr_1.5fr_0.75fr_1fr_auto] gap-4 px-5 py-3 border-b border-border text-xs font-medium tracking-wide text-text-muted">
          <span>Guest</span>
          <span>Room</span>
          <span>Dates</span>
          <span>Total</span>
          <span>Status</span>
          <span />
        </div>
        {filtered.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-text-muted">
            No reservations for this view.
          </div>
        )}
        {filtered.map((r) => {
          const name = guestName(r);
          const { range, nights } = formatDates(r);
          const roomNo = r.roomNumber;
          const inHouse = isInHouse(r);
          const departed = r.status === 'checked_out';
          const rowBusy = busyId === r.id;
          return (
            <div
              key={r.id}
              className="grid grid-cols-1 md:grid-cols-[2fr_0.75fr_1.5fr_0.75fr_1fr_auto] items-center gap-3 md:gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-surface-elevated transition"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0',
                    avatarColor(name)
                  )}
                >
                  {initials(name)}
                </div>
                <div className="min-w-0">
                  <Link
                    to={`/app/reservations/${r.id}`}
                    className="text-sm font-medium text-text-primary hover:text-secondary truncate block"
                  >
                    {name}
                  </Link>
                  <div className="text-xs text-text-muted">#{r.confirmationNumber ?? r.id}</div>
                </div>
              </div>
              <div className="text-sm text-text-secondary pl-12 md:pl-0">{roomNo ?? '—'}</div>
              <div className="pl-12 md:pl-0">
                <div className="text-sm text-text-secondary">{range}</div>
                {nights !== null && <div className="text-xs text-text-muted">{nights} nights</div>}
              </div>
              <div className="text-sm font-medium text-text-primary pl-12 md:pl-0">
                {money(r.totalAmount)}
              </div>
              <div className="pl-12 md:pl-0">
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    inHouse
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : departed
                        ? 'bg-text-muted/15 text-text-muted'
                        : 'bg-sky-500/15 text-sky-400'
                  )}
                >
                  {inHouse
                    ? 'In-House'
                    : departed
                      ? 'Departed'
                      : tab === 'departures'
                        ? 'Due Out'
                        : 'Arrival'}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-12 md:pl-0">
                {departed ? (
                  <span className="text-xs text-text-muted">—</span>
                ) : inHouse ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => run(() => doCheckOut(r))}
                    disabled={rowBusy}
                  >
                    <ArrowLeftToLine size={14} className="mr-1.5" /> Check Out
                  </Button>
                ) : (
                  <>
                    {!roomNo && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAssign(r)}
                        disabled={rowBusy}
                      >
                        <UserPlus size={14} className="mr-1.5" /> Assign
                      </Button>
                    )}
                    <Button size="sm" onClick={() => run(() => doCheckIn(r))} disabled={rowBusy}>
                      <LogIn size={14} className="mr-1.5" /> Check In
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {assignFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                Assign Room — {assignFor.confirmationNumber}
              </h3>
              <button
                onClick={() => setAssignFor(null)}
                className="text-text-muted hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              {guestName(assignFor)} · {day(assignFor.arrivalDate)} → {day(assignFor.departureDate)}{' '}
              · {assignFor.nights} night{assignFor.nights === 1 ? '' : 's'}
            </p>
            {rooms.filter((rm) => (rm.status ?? '') !== 'occupied').length === 0 ? (
              <p className="text-sm text-text-muted">No vacant rooms available.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1">
                {rooms
                  .filter((rm) => (rm.status ?? '') !== 'occupied')
                  .map((rm) => (
                    <button
                      key={rm.id}
                      onClick={() => setAssignRoomId(rm.id)}
                      className={cn(
                        'w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm transition',
                        assignRoomId === rm.id
                          ? 'border-secondary bg-secondary/10 text-text-primary'
                          : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                      )}
                    >
                      <span className="font-medium">Room {rm.number}</span>
                      <span className="text-xs text-text-muted">
                        Floor {rm.floor ?? '—'} · {rm.status}
                      </span>
                    </button>
                  ))}
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAssignFor(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={doAssign} disabled={!assignRoomId || assignRoom.isPending}>
                Assign Room
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
