import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  RefreshCw,
  X,
  Check,
  BedDouble,
  Wrench,
  Ban,
  LogIn,
  LogOut,
  Eye,
  Filter,
  Search,
  UserPlus,
  Layers,
  Grid3X3,
  Rows3,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../../hooks/use-toast';
import {
  createReservation,
  updateReservation,
  assignRoom,
  checkInReservation,
  checkOutReservation,
  cancelReservation,
  noShowReservation,
  resendConfirmation,
} from '../../api/api-reservations';
import { listGuests, createGuest } from '../../api/guests';
import { createRoomBlock, returnRoomBlock } from '../../api/room-plan';
import TapeGrid from './TapeGrid';

export const STATUS_META = {
  confirmed: { label: 'Confirmed', color: '#6366f1', soft: '#eef2ff', text: '#3730a3' },
  checked_in: { label: 'In house', color: '#10b981', soft: '#ecfdf5', text: '#065f46' },
  checked_out: { label: 'Departed', color: '#94a3b8', soft: '#f1f5f9', text: '#475569' },
};

export const HK_META = {
  clean: { label: 'Clean', color: '#10b981' },
  dirty: { label: 'Dirty', color: '#f59e0b' },
  inspected: { label: 'Inspected', color: '#0ea5e9' },
  pickup: { label: 'Pickup', color: '#8b5cf6' },
  maintenance: { label: 'Maintenance', color: '#f43f5e' },
};

export const toKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(
    2,
    '0'
  )}`;

export const todayKey = () => toKey(new Date());

export const addDays = (key, n) => {
  const d = new Date(`${key}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toKey(d);
};

export const dayKeysBetween = (from, to) => {
  const out = [];
  let cur = from;
  while (cur < to) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
};

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatMoney(amount, currency = 'ZAR') {
  try {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  } catch {
    return `${currency} ${Number(amount) || 0}`;
  }
}

function buildStayMap(stays) {
  const map = new Map();
  for (const s of stays) {
    const k = `${s.roomId}|${s.date}`;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(s.reservationId);
  }
  return map;
}

export default function TapeChart({
  property,
  rooms,
  roomTypes,
  reservations,
  stays,
  blocks,
  restrictions,
  holds,
  dayStats,
  from,
  to,
  range,
  onRangeChange,
  onNavigate,
  onToday,
  isFetching,
  onRefetch,
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [density, setDensity] = useState('comfortable');
  const [filters, setFilters] = useState({
    floor: 'all',
    roomTypeId: 'all',
    status: 'all',
    roomState: 'all',
    search: '',
  });
  const [selected, setSelected] = useState(() => new Set());
  const [menu, setMenu] = useState(null);
  const [modal, setModal] = useState(null);
  const [collapsedTypes, setCollapsedTypes] = useState(() => new Set());

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['room-plan'] });
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
  }, [queryClient]);

  const notify = (msg) => toast({ title: msg });

  const onMutateError = (err) =>
    toast({
      title: 'Action failed',
      description: err?.response?.data?.error?.message ?? err?.message ?? 'Unknown error',
      variant: 'destructive',
    });

  const mAssign = useMutation({
    mutationFn: ({ id, roomId }) => assignRoom(id, { roomId }),
    onSuccess: () => {
      invalidate();
      notify('Room assigned');
    },
    onError: onMutateError,
  });
  const mCheckIn = useMutation({
    mutationFn: (id) => checkInReservation(id),
    onSuccess: () => {
      invalidate();
      notify('Checked in');
    },
    onError: onMutateError,
  });
  const mCheckOut = useMutation({
    mutationFn: (id) => checkOutReservation(id),
    onSuccess: () => {
      invalidate();
      notify('Checked out');
    },
    onError: onMutateError,
  });
  const mCancel = useMutation({
    mutationFn: ({ id, reason }) => cancelReservation(id, reason),
    onSuccess: () => {
      invalidate();
      notify('Reservation cancelled');
    },
    onError: onMutateError,
  });
  const mNoShow = useMutation({
    mutationFn: (id) => noShowReservation(id),
    onSuccess: () => {
      invalidate();
      notify('Marked no-show');
    },
    onError: onMutateError,
  });
  const mResend = useMutation({
    mutationFn: (id) => resendConfirmation(id),
    onSuccess: () => notify('Confirmation resent'),
    onError: onMutateError,
  });
  const mUpdate = useMutation({
    mutationFn: ({ id, input }) => updateReservation(id, input),
    onSuccess: () => {
      invalidate();
      notify('Reservation updated');
      setModal(null);
    },
    onError: onMutateError,
  });
  const mCreate = useMutation({
    mutationFn: (input) => createReservation(input),
    onSuccess: () => {
      invalidate();
      notify('Reservation created');
      setModal(null);
    },
    onError: onMutateError,
  });
  const mBlock = useMutation({
    mutationFn: (input) => createRoomBlock({ propertyId: property.id, ...input }),
    onSuccess: () => {
      invalidate();
      notify('Room blocked');
      setModal(null);
    },
    onError: onMutateError,
  });
  const mReturnBlock = useMutation({
    mutationFn: (blockId) => returnRoomBlock(blockId),
    onSuccess: () => {
      invalidate();
      notify('Block returned to service');
    },
    onError: onMutateError,
  });

  useEffect(() => setSelected(new Set()), [from, to, property.id]);

  useEffect(() => {
    if (!menu) return undefined;
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [menu]);

  const resById = useMemo(() => new Map(reservations.map((r) => [r.id, r])), [reservations]);
  const roomById = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);
  const stayMap = useMemo(() => buildStayMap(stays), [stays]);

  const filteredRooms = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const matchResIds = q
      ? new Set(
          reservations
            .filter(
              (r) =>
                r.guestName.toLowerCase().includes(q) ||
                r.confirmationNumber.toLowerCase().includes(q)
            )
            .map((r) => r.id)
        )
      : null;
    return rooms.filter((room) => {
      if (filters.floor !== 'all' && room.floor !== filters.floor) return false;
      if (filters.roomTypeId !== 'all' && room.roomTypeId !== filters.roomTypeId) return false;
      if (filters.roomState !== 'all' && room.housekeepingStatus !== filters.roomState)
        return false;
      if (matchResIds) {
        const roomResIds = stays.filter((s) => s.roomId === room.id).map((s) => s.reservationId);
        if (!roomResIds.some((id) => matchResIds.has(id))) return false;
      }
      return true;
    });
  }, [rooms, filters, reservations, stays]);

  const floors = useMemo(
    () => [...new Set(rooms.map((r) => r.floor).filter(Boolean))].sort(),
    [rooms]
  );

  const unassigned = useMemo(
    () =>
      reservations
        .filter((r) => !r.roomId && r.status === 'confirmed')
        .sort((a, b) => a.arrivalDate.localeCompare(b.arrivalDate)),
    [reservations]
  );

  const dayStatMap = useMemo(() => new Map(dayStats.map((d) => [d.date, d])), [dayStats]);
  const today = todayKey();
  const tonight = dayStatMap.get(today);

  const toggleSelect = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const canCheckIn = (r) =>
    r.status === 'confirmed' && r.arrivalDate <= today && !r.roomId
      ? false
      : r.status === 'confirmed' && r.arrivalDate <= today;

  const tryMove = (reservationId, roomId) => {
    const r = resById.get(reservationId);
    if (!r) return;
    if (r.doNotMove) {
      toast({
        title: 'Reservation is locked',
        description: 'Do-not-move is set on this reservation.',
        variant: 'destructive',
      });
      return;
    }
    const nights = dayKeysBetween(
      r.arrivalDate > from ? r.arrivalDate : from,
      r.departureDate < to ? r.departureDate : to
    );
    const conflict = nights.some((d) => {
      const ids = stayMap.get(`${roomId}|${d}`);
      return ids && ids.some((id) => id !== reservationId);
    });
    if (conflict) {
      toast({
        title: 'Move blocked',
        description: 'Room is occupied for one or more nights of this stay.',
        variant: 'destructive',
      });
      return;
    }
    mAssign.mutate({ id: reservationId, roomId });
  };

  const menuItem =
    'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs hover:bg-accent';

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">Room Plan</h1>
        <span className="text-xs text-muted-foreground">{property.name}</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => onNavigate(-1)}
            className="rounded-md border p-1.5 hover:bg-accent"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onToday}
            className="flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs hover:bg-accent"
          >
            <CalendarDays className="h-4 w-4" /> Today
          </button>
          <button
            onClick={() => onNavigate(1)}
            className="rounded-md border p-1.5 hover:bg-accent"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="ml-2 flex rounded-md border p-0.5">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => onRangeChange(d)}
                className={cn(
                  'rounded px-2 py-1 text-xs',
                  range === d ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                )}
              >
                {d}
              </button>
            ))}
          </div>
          <button
            onClick={() => setDensity((d) => (d === 'comfortable' ? 'compact' : 'comfortable'))}
            className="ml-2 rounded-md border p-1.5 hover:bg-accent"
            title="Toggle density"
          >
            {density === 'comfortable' ? (
              <Grid3X3 className="h-4 w-4" />
            ) : (
              <Rows3 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => setModal({ kind: 'block', roomId: null })}
            className="ml-2 flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs hover:bg-accent"
          >
            <Wrench className="h-4 w-4" /> Block room
          </button>
          <button
            onClick={onRefetch}
            className="ml-1 rounded-md border p-1.5 hover:bg-accent"
            title="Refresh"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </button>
        </div>
      </div>

      <StatsBar
        tonight={tonight}
        unassigned={unassigned.length}
        blocks={blocks}
        today={today}
        currency={property.currency}
      />

      <FilterBar
        floors={floors}
        roomTypes={roomTypes}
        filters={filters}
        onChange={setFilters}
        resultCount={filteredRooms.length}
        totalCount={rooms.length}
      />

      {unassigned.length > 0 && (
        <UnassignedStrip
          unassigned={unassigned}
          roomTypes={roomTypes}
          onContext={(e, r) => {
            e.preventDefault();
            setMenu({ x: e.clientX, y: e.clientY, kind: 'reservation', id: r.id });
          }}
          onAssign={(r) => setModal({ kind: 'assign', reservation: r })}
        />
      )}

      {selected.size > 0 && (
        <BulkActionBar
          count={selected.size}
          onCheckIn={() => {
            selected.forEach((id) => {
              const r = resById.get(id);
              if (r && canCheckIn(r)) mCheckIn.mutate(id);
            });
            setSelected(new Set());
          }}
          onCheckOut={() => {
            selected.forEach((id) => {
              const r = resById.get(id);
              if (r && r.status === 'checked_in') mCheckOut.mutate(id);
            });
            setSelected(new Set());
          }}
          onClear={() => setSelected(new Set())}
          busy={mCheckIn.isPending || mCheckOut.isPending}
        />
      )}

      <TapeGrid
        property={property}
        rooms={filteredRooms}
        roomTypes={roomTypes}
        reservations={reservations}
        stays={stays}
        blocks={blocks}
        restrictions={restrictions}
        holds={holds}
        dayStats={dayStats}
        from={from}
        to={to}
        density={density}
        selectedIds={selected}
        collapsedTypes={collapsedTypes}
        onToggleType={(id) =>
          setCollapsedTypes((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          })
        }
        onToggleSelect={toggleSelect}
        onCellContext={(e, roomId, date) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY, kind: 'cell', roomId, date });
        }}
        onCellDoubleClick={(roomId, date) =>
          setModal({ kind: 'create', roomId, arrivalDate: date })
        }
        onReservationContext={(e, reservationId) => {
          e.preventDefault();
          e.stopPropagation();
          setMenu({ x: e.clientX, y: e.clientY, kind: 'reservation', id: reservationId });
        }}
        onReservationClick={(reservationId) =>
          setModal({ kind: 'edit', reservation: resById.get(reservationId) })
        }
        onBlockContext={(e, block) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY, kind: 'block', block });
        }}
        onMoveReservation={tryMove}
      />

      {menu && (
        <div
          className="fixed z-50 min-w-44 rounded-md border bg-popover p-1 shadow-md"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {menu.kind === 'cell' && (
            <>
              <button
                className={menuItem}
                onClick={() => {
                  setModal({ kind: 'create', roomId: menu.roomId, arrivalDate: menu.date });
                  setMenu(null);
                }}
              >
                <BedDouble className="h-3.5 w-3.5" /> New reservation
              </button>
              <button
                className={menuItem}
                onClick={() => {
                  setModal({ kind: 'block', roomId: menu.roomId, startDate: menu.date });
                  setMenu(null);
                }}
              >
                <Wrench className="h-3.5 w-3.5" /> Out of order / service
              </button>
            </>
          )}
          {menu.kind === 'reservation' &&
            (() => {
              const r = resById.get(menu.id);
              if (!r) return null;
              return (
                <>
                  <button
                    className={menuItem}
                    onClick={() => {
                      setModal({ kind: 'edit', reservation: r });
                      setMenu(null);
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" /> View / edit
                  </button>
                  {canCheckIn(r) && (
                    <button
                      className={menuItem}
                      onClick={() => {
                        mCheckIn.mutate(r.id);
                        setMenu(null);
                      }}
                    >
                      <LogIn className="h-3.5 w-3.5" /> Check in
                    </button>
                  )}
                  {r.status === 'checked_in' && (
                    <button
                      className={menuItem}
                      onClick={() => {
                        mCheckOut.mutate(r.id);
                        setMenu(null);
                      }}
                    >
                      <LogOut className="h-3.5 w-3.5" /> Check out
                    </button>
                  )}
                  <button
                    className={menuItem}
                    onClick={() => {
                      setModal({ kind: 'assign', reservation: r });
                      setMenu(null);
                    }}
                  >
                    <BedDouble className="h-3.5 w-3.5" /> Assign room
                  </button>
                  <button
                    className={menuItem}
                    onClick={() => {
                      mResend.mutate(r.id);
                      setMenu(null);
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Resend confirmation
                  </button>
                  {r.status === 'confirmed' && (
                    <>
                      <button
                        className={menuItem}
                        onClick={() => {
                          mNoShow.mutate(r.id);
                          setMenu(null);
                        }}
                      >
                        <Ban className="h-3.5 w-3.5" /> No-show
                      </button>
                      <button
                        className={cn(menuItem, 'text-destructive')}
                        onClick={() => {
                          const reason =
                            window.prompt('Cancellation reason (optional)') ?? undefined;
                          mCancel.mutate({ id: r.id, reason });
                          setMenu(null);
                        }}
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </>
                  )}
                </>
              );
            })()}
          {menu.kind === 'block' && (
            <button
              className={menuItem}
              onClick={() => {
                mReturnBlock.mutate(menu.block.id);
                setMenu(null);
              }}
            >
              <Check className="h-3.5 w-3.5" /> Return to service
            </button>
          )}
        </div>
      )}

      {modal?.kind === 'create' && (
        <QuickCreateModal
          property={property}
          roomTypes={roomTypes}
          rooms={rooms}
          roomId={modal.roomId}
          arrivalDate={modal.arrivalDate}
          from={from}
          to={to}
          onClose={() => setModal(null)}
          onSubmit={(input) => mCreate.mutate(input)}
          busy={mCreate.isPending}
        />
      )}
      {modal?.kind === 'edit' && modal.reservation && (
        <EditReservationModal
          property={property}
          reservation={modal.reservation}
          onClose={() => setModal(null)}
          onSubmit={(id, input) => mUpdate.mutate({ id, input })}
          busy={mUpdate.isPending}
        />
      )}
      {modal?.kind === 'assign' && modal.reservation && (
        <AssignRoomModal
          property={property}
          reservation={modal.reservation}
          rooms={rooms}
          roomTypes={roomTypes}
          stayMap={stayMap}
          from={from}
          to={to}
          onClose={() => setModal(null)}
          onAssign={(roomId) => {
            mAssign.mutate({ id: modal.reservation.id, roomId });
            setModal(null);
          }}
          busy={mAssign.isPending}
        />
      )}
      {modal?.kind === 'block' && (
        <BlockRoomModal
          property={property}
          rooms={rooms}
          roomId={modal.roomId}
          startDate={modal.startDate}
          onClose={() => setModal(null)}
          onSubmit={(input) => mBlock.mutate(input)}
          busy={mBlock.isPending}
        />
      )}
    </div>
  );
}

function StatsBar({ tonight, unassigned, blocks, today, currency }) {
  const activeBlocks = blocks.filter((b) => b.startDate <= today && b.endDate > today);
  const stat = 'flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs shadow-sm';
  return (
    <div className="flex flex-wrap gap-2">
      <div className={stat}>
        <span className="text-muted-foreground">Occupancy tonight</span>
        <span className="font-semibold">
          {tonight ? `${tonight.occupancyPct}%` : '—'}
          {tonight ? (
            <span className="ml-1 font-normal text-muted-foreground">
              ({tonight.occupied}/{tonight.sellable})
            </span>
          ) : null}
        </span>
      </div>
      <div className={stat}>
        <span className="text-muted-foreground">ADR</span>
        <span className="font-semibold">{tonight ? formatMoney(tonight.adr, currency) : '—'}</span>
      </div>
      <div className={stat}>
        <span className="text-muted-foreground">Arrivals</span>
        <span className="font-semibold">{tonight?.arrivals ?? 0}</span>
      </div>
      <div className={stat}>
        <span className="text-muted-foreground">Departures</span>
        <span className="font-semibold">{tonight?.departures ?? 0}</span>
      </div>
      <div className={stat}>
        <span className="text-muted-foreground">Unassigned</span>
        <span
          className={cn('font-semibold', unassigned > 0 ? 'text-amber-600' : 'text-emerald-600')}
        >
          {unassigned}
        </span>
      </div>
      <div className={stat}>
        <span className="text-muted-foreground">OOO now</span>
        <span
          className={cn(
            'font-semibold',
            activeBlocks.length > 0 ? 'text-rose-600' : 'text-emerald-600'
          )}
        >
          {activeBlocks.length}
        </span>
      </div>
    </div>
  );
}

function FilterBar({ floors, roomTypes, filters, onChange, resultCount, totalCount }) {
  const select =
    'rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <select
        className={select}
        value={filters.floor}
        onChange={(e) => onChange({ ...filters, floor: e.target.value })}
      >
        <option value="all">All floors</option>
        {floors.map((f) => (
          <option key={f} value={f}>
            Floor {f}
          </option>
        ))}
      </select>
      <select
        className={select}
        value={filters.roomTypeId}
        onChange={(e) => onChange({ ...filters, roomTypeId: e.target.value })}
      >
        <option value="all">All types</option>
        {roomTypes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <select
        className={select}
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
      >
        <option value="all">All statuses</option>
        {Object.entries(STATUS_META).map(([k, v]) => (
          <option key={k} value={k}>
            {v.label}
          </option>
        ))}
      </select>
      <select
        className={select}
        value={filters.roomState}
        onChange={(e) => onChange({ ...filters, roomState: e.target.value })}
      >
        <option value="all">All room states</option>
        {Object.entries(HK_META).map(([k, v]) => (
          <option key={k} value={k}>
            {v.label}
          </option>
        ))}
      </select>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          className="w-52 rounded-md border bg-background py-1.5 pl-7 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Guest or confirmation #"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <span className="text-xs text-muted-foreground">
        {resultCount}/{totalCount} rooms
      </span>
    </div>
  );
}

function UnassignedStrip({ unassigned, roomTypes, onContext, onAssign }) {
  const typeName = (id) => roomTypes.find((t) => t.id === id)?.code ?? '—';
  return (
    <div className="rounded-lg border border-dashed bg-amber-50/50 p-2 dark:bg-amber-950/20">
      <div className="mb-1 flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
        <Layers className="h-3.5 w-3.5" /> Unassigned arrivals ({unassigned.length})
      </div>
      <div className="flex flex-wrap gap-1.5">
        {unassigned.slice(0, 24).map((r) => (
          <button
            key={r.id}
            onClick={() => onAssign(r)}
            onContextMenu={(e) => onContext(e, r)}
            className="flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs shadow-sm hover:border-primary"
            title={`${r.confirmationNumber} · ${typeName(r.roomTypeId)} · click to assign`}
          >
            <span className="font-medium">{r.guestName}</span>
            <span className="text-muted-foreground">
              {r.arrivalDate.slice(5)}→{r.departureDate.slice(5)}
            </span>
          </button>
        ))}
        {unassigned.length > 24 && (
          <span className="self-center text-xs text-muted-foreground">
            +{unassigned.length - 24} more
          </span>
        )}
      </div>
    </div>
  );
}

function BulkActionBar({ count, onCheckIn, onCheckOut, onClear, busy }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-primary/5 px-3 py-2 text-xs">
      <span className="font-medium">{count} selected</span>
      <button
        disabled={busy}
        onClick={onCheckIn}
        className="rounded-md border px-2 py-1 hover:bg-accent disabled:opacity-50"
      >
        Check in
      </button>
      <button
        disabled={busy}
        onClick={onCheckOut}
        className="rounded-md border px-2 py-1 hover:bg-accent disabled:opacity-50"
      >
        Check out
      </button>
      <button onClick={onClear} className="ml-auto rounded-md border px-2 py-1 hover:bg-accent">
        Clear
      </button>
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          'max-h-[90vh] overflow-y-auto rounded-lg border bg-background p-4 shadow-xl',
          wide ? 'w-full max-w-2xl' : 'w-full max-w-md'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring';
const labelCls = 'mb-0.5 block text-[11px] font-medium text-muted-foreground';

function GuestPicker({ onSelect }) {
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const { data, isFetching } = useQuery({
    queryKey: ['guests-search', q],
    queryFn: () => listGuests({ search: q, pageSize: 8 }),
    enabled: !creating,
  });
  const mCreateGuest = useMutation({
    mutationFn: () => createGuest(form),
    onSuccess: (g) => {
      onSelect(g);
    },
  });
  return (
    <div>
      {!creating ? (
        <>
          <div className="relative mb-1">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              className={cn(inputCls, 'pl-7')}
              placeholder="Search guests…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="max-h-36 overflow-y-auto rounded-md border">
            {(data?.data ?? []).map((g) => (
              <button
                key={g.id}
                onClick={() => onSelect(g)}
                className="flex w-full items-center justify-between px-2 py-1.5 text-left text-xs hover:bg-accent"
              >
                <span>
                  {g.firstName} {g.lastName}
                </span>
                <span className="text-muted-foreground">{g.email}</span>
              </button>
            ))}
            {!isFetching && (data?.data ?? []).length === 0 && (
              <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                No guests found
              </div>
            )}
          </div>
          <button
            onClick={() => setCreating(true)}
            className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <UserPlus className="h-3.5 w-3.5" /> Create new guest
          </button>
        </>
      ) : (
        <div className="space-y-2 rounded-md border p-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>First name</label>
              <input
                className={inputCls}
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Last name</label>
              <input
                className={inputCls}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input
              className={inputCls}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button
              disabled={!form.firstName || !form.lastName || mCreateGuest.isPending}
              onClick={() => mCreateGuest.mutate()}
              className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-50"
            >
              Create & select
            </button>
            <button
              onClick={() => setCreating(false)}
              className="rounded-md border px-3 py-1.5 text-xs"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickCreateModal({
  property,
  roomTypes,
  rooms,
  roomId,
  arrivalDate,
  onClose,
  onSubmit,
  busy,
}) {
  const room = roomId ? rooms.find((r) => r.id === roomId) : null;
  const [guest, setGuest] = useState(null);
  const [form, setForm] = useState({
    arrivalDate: arrivalDate ?? todayKey(),
    nights: 1,
    rate: room?.roomType?.baseOccupancy ?? '',
    adults: 2,
    children: 0,
    source: 'walkin',
    notes: '',
  });
  const nights = Math.max(1, Number(form.nights) || 1);
  const departureDate = addDays(form.arrivalDate, nights);
  const canSubmit = guest && form.arrivalDate && nights > 0 && !busy;

  return (
    <Modal title="New reservation" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className={labelCls}>Guest</label>
          {guest ? (
            <div className="flex items-center justify-between rounded-md border px-2 py-1.5 text-xs">
              <span className="font-medium">
                {guest.firstName} {guest.lastName}
              </span>
              <button
                onClick={() => setGuest(null)}
                className="text-muted-foreground hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <GuestPicker onSelect={setGuest} />
          )}
        </div>
        {room && (
          <div className="text-xs text-muted-foreground">
            Room <span className="font-medium text-foreground">{room.number}</span> ·{' '}
            {room.roomType.name}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Arrival</label>
            <input
              type="date"
              className={inputCls}
              value={form.arrivalDate}
              onChange={(e) => setForm({ ...form, arrivalDate: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Nights</label>
            <input
              type="number"
              min={1}
              className={inputCls}
              value={form.nights}
              onChange={(e) => setForm({ ...form, nights: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Rate / night ({property.currency})</label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Source</label>
            <select
              className={inputCls}
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              {['walkin', 'direct', 'phone', 'email', 'bookingcom', 'expedia', 'other'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Adults</label>
            <input
              type="number"
              min={1}
              className={inputCls}
              value={form.adults}
              onChange={(e) => setForm({ ...form, adults: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Children</label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={form.children}
              onChange={(e) => setForm({ ...form, children: e.target.value })}
            />
          </div>
        </div>
        <div className="rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">
          Departure {departureDate} · {nights} night{nights > 1 ? 's' : ''} · total{' '}
          {formatMoney((Number(form.rate) || 0) * nights, property.currency)}
        </div>
        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            className={inputCls}
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <button
          disabled={!canSubmit}
          onClick={() =>
            onSubmit({
              propertyId: property.id,
              guestId: guest.id,
              arrivalDate: form.arrivalDate,
              departureDate,
              nights,
              rate: Number(form.rate) || 0,
              adults: Number(form.adults) || 1,
              children: Number(form.children) || 0,
              roomTypeId: room?.roomTypeId,
              roomId: room?.id,
              source: form.source,
              notes: form.notes || undefined,
            })
          }
          className="w-full rounded-md bg-primary py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          Create reservation
        </button>
      </div>
    </Modal>
  );
}

function EditReservationModal({ property, reservation: r, onClose, onSubmit, busy }) {
  const [form, setForm] = useState({
    arrivalDate: r.arrivalDate,
    departureDate: r.departureDate,
    adults: r.adults,
    children: r.children,
    eta: r.eta ?? '',
    marketSegment: r.marketSegment ?? '',
    specialRequests: r.specialRequests ?? '',
    guaranteed: r.guaranteed,
    doNotMove: r.doNotMove,
    fixedRoom: r.fixedRoom,
  });
  const depositPaid = Number(r.depositPaid) > 0;
  return (
    <Modal title={`${r.guestName} · ${r.confirmationNumber}`} onClose={onClose} wide>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-md border p-2">
            <div className="text-muted-foreground">Status</div>
            <div className="font-semibold">{STATUS_META[r.status]?.label ?? r.status}</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="text-muted-foreground">Balance</div>
            <div
              className={cn('font-semibold', r.balance > 0 ? 'text-rose-600' : 'text-emerald-600')}
            >
              {formatMoney(r.balance, property.currency)}
            </div>
          </div>
          <div className="rounded-md border p-2">
            <div className="text-muted-foreground">Deposit</div>
            <div className="font-semibold">
              {depositPaid ? formatMoney(r.depositPaid, property.currency) : 'Not paid'}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Arrival</label>
            <input
              type="date"
              className={inputCls}
              value={form.arrivalDate}
              onChange={(e) => setForm({ ...form, arrivalDate: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Departure</label>
            <input
              type="date"
              className={inputCls}
              value={form.departureDate}
              onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Adults</label>
            <input
              type="number"
              min={1}
              className={inputCls}
              value={form.adults}
              onChange={(e) => setForm({ ...form, adults: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Children</label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={form.children}
              onChange={(e) => setForm({ ...form, children: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>ETA</label>
            <input
              className={inputCls}
              placeholder="e.g. 14:30"
              value={form.eta}
              onChange={(e) => setForm({ ...form, eta: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Market segment</label>
            <select
              className={inputCls}
              value={form.marketSegment}
              onChange={(e) => setForm({ ...form, marketSegment: e.target.value })}
            >
              <option value="">—</option>
              {['leisure', 'corporate', 'group', 'walkin', 'other'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Special requests</label>
          <textarea
            className={inputCls}
            rows={2}
            value={form.specialRequests}
            onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          {[
            ['guaranteed', 'Guaranteed'],
            ['doNotMove', 'Do not move'],
            ['fixedRoom', 'Fixed room'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
        {(r.openTraces > 0 || r.companionsCount > 0 || r.pendingTasks > 0) && (
          <div className="flex flex-wrap gap-2 text-[11px]">
            {r.openTraces > 0 && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                {r.openTraces} open trace{r.openTraces > 1 ? 's' : ''}
              </span>
            )}
            {r.companionsCount > 0 && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                {r.companionsCount} companion{r.companionsCount > 1 ? 's' : ''}
              </span>
            )}
            {r.pendingTasks > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                {r.pendingTasks} pending task{r.pendingTasks > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
        <button
          disabled={busy}
          onClick={() =>
            onSubmit(r.id, {
              arrivalDate: form.arrivalDate,
              departureDate: form.departureDate,
              adults: Number(form.adults),
              children: Number(form.children),
              eta: form.eta || undefined,
              marketSegment: form.marketSegment || undefined,
              specialRequests: form.specialRequests || undefined,
              guaranteed: form.guaranteed,
              doNotMove: form.doNotMove,
              fixedRoom: form.fixedRoom,
            })
          }
          className="w-full rounded-md bg-primary py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          Save changes
        </button>
      </div>
    </Modal>
  );
}

function AssignRoomModal({
  property,
  reservation: r,
  rooms,
  roomTypes,
  stayMap,
  from,
  to,
  onClose,
  onAssign,
  busy,
}) {
  const candidates = rooms.filter((room) => !r.roomTypeId || room.roomTypeId === r.roomTypeId);
  const nights = dayKeysBetween(
    r.arrivalDate > from ? r.arrivalDate : from,
    r.departureDate < to ? r.departureDate : to
  );
  return (
    <Modal title={`Assign room — ${r.guestName}`} onClose={onClose}>
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">
          {r.arrivalDate} → {r.departureDate} ·{' '}
          {roomTypes.find((t) => t.id === r.roomTypeId)?.name ?? 'Any type'}
        </div>
        <div className="max-h-72 overflow-y-auto rounded-md border">
          {candidates.map((room) => {
            const conflict = nights.some((d) => {
              const ids = stayMap.get(`${room.id}|${d}`);
              return ids && ids.some((id) => id !== r.id);
            });
            const sameRoom = room.id === r.roomId;
            return (
              <button
                key={room.id}
                disabled={conflict || sameRoom || busy}
                onClick={() => onAssign(room.id)}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40'
                )}
              >
                <span>
                  <span className="font-medium">{room.number}</span>
                  <span className="ml-2 text-muted-foreground">
                    {room.roomType.name} ·{' '}
                    {HK_META[room.housekeepingStatus]?.label ?? room.housekeepingStatus}
                  </span>
                </span>
                {conflict && <span className="text-rose-600">Occupied</span>}
                {sameRoom && <span className="text-emerald-600">Current</span>}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

function BlockRoomModal({ property, rooms, roomId, startDate, onClose, onSubmit, busy }) {
  const [form, setForm] = useState({
    roomId: roomId ?? '',
    type: 'ooo',
    startDate: startDate ?? todayKey(),
    endDate: addDays(startDate ?? todayKey(), 1),
    reason: '',
  });
  return (
    <Modal title="Block room" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className={labelCls}>Room</label>
          <select
            className={inputCls}
            value={form.roomId}
            onChange={(e) => setForm({ ...form, roomId: e.target.value })}
          >
            <option value="">Select a room…</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.number} · {r.roomType.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <select
            className={inputCls}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="ooo">Out of order (maintenance)</option>
            <option value="oos">Out of service</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>From</label>
            <input
              type="date"
              className={inputCls}
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>To</label>
            <input
              type="date"
              className={inputCls}
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Reason</label>
          <input
            className={inputCls}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </div>
        <button
          disabled={!form.roomId || !form.startDate || !form.endDate || busy}
          onClick={() =>
            onSubmit({
              roomId: form.roomId,
              type: form.type,
              startDate: form.startDate,
              endDate: form.endDate,
              reason: form.reason || undefined,
            })
          }
          className="w-full rounded-md bg-primary py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          Block room
        </button>
      </div>
    </Modal>
  );
}
