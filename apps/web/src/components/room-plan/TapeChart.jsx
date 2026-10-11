import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, differenceInDays, startOfDay, isSameDay, parseISO } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Edit3,
  Save,
  User,
  Calendar,
  DollarSign,
  BedDouble,
  Phone,
  Mail,
  MessageSquare,
  CreditCard,
  LogIn,
  LogOut,
  Eye,
  Trash2,
  Check,
  Filter,
  GripVertical,
  Layers,
  CheckSquare,
  Square,
  XCircle,
  Wrench,
  RefreshCw,
  Percent,
  LogIn as ArrivalsIcon,
  LogOut as DeparturesIcon,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  useUpdateReservation,
  useAssignRoom,
  useCheckIn,
  useCheckOut,
  useCancelReservation,
  useCreateReservation,
} from '../../hooks/useReservations';
import { useRoomMutations } from '../../hooks/useRooms';
import { useGuestsList, useCreateGuest } from '../../hooks/useGuests';
import { useToast } from '../../hooks/use-toast';

/* ─────────────────────────────────────────
   CONSTANTS
   ───────────────────────────────────────── */

const VIEW_MODES = [
  { id: '7', label: '7 Days', days: 7 },
  { id: '14', label: '14 Days', days: 14 },
  { id: '30', label: '30 Days', days: 30 },
  { id: '90', label: '90 Days', days: 90 },
];

const STATUS_META = {
  confirmed: {
    label: 'Confirmed',
    color: 'bg-accent',
    text: 'text-accent',
    border: 'border-accent/30',
    bgSoft: 'bg-accent/10',
  },
  checked_in: {
    label: 'Checked In',
    color: 'bg-secondary',
    text: 'text-secondary',
    border: 'border-secondary/30',
    bgSoft: 'bg-secondary/10',
  },
  checked_out: {
    label: 'Checked Out',
    color: 'bg-neutral',
    text: 'text-text-muted',
    border: 'border-border',
    bgSoft: 'bg-surface',
  },
  no_show: {
    label: 'No-Show',
    color: 'bg-danger',
    text: 'text-danger',
    border: 'border-danger/30',
    bgSoft: 'bg-danger/10',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-danger',
    text: 'text-danger',
    border: 'border-danger/30',
    bgSoft: 'bg-danger/10',
  },
};

const ROOM_STATUS_META = {
  clean: { label: 'Clean', dot: 'bg-accent', text: 'text-accent' },
  dirty: { label: 'Dirty', dot: 'bg-warning', text: 'text-warning' },
  inspected: { label: 'Inspected', dot: 'bg-secondary', text: 'text-secondary' },
  maintenance: { label: 'Out of Order', dot: 'bg-danger', text: 'text-danger' },
};

const ACTIVE_STATUSES = ['confirmed', 'checked_in'];
const toDateStr = (d) => (typeof d === 'string' ? d.slice(0, 10) : format(d, 'yyyy-MM-dd'));

/* ─────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────── */

function getDatesForRange(start, days) {
  const dates = [];
  for (let i = 0; i < days; i++) dates.push(addDays(start, i));
  return dates;
}

function getNights(start, end) {
  return differenceInDays(parseISO(toDateStr(end)), parseISO(toDateStr(start)));
}

function formatMoney(amount) {
  const n = Number(amount ?? 0);
  return `$${n.toFixed(2)}`;
}

/** Map an API reservation (with stays) to the flat shape the tape grid uses. */
function toTapeReservation(r) {
  return {
    id: r.id,
    confirmationNumber: r.confirmationNumber,
    guest: r.guestName || 'Unknown Guest',
    guestId: r.guestId,
    email: r.guestEmail ?? r.guest?.email ?? '',
    phone: r.guestPhone ?? r.guest?.phone ?? '',
    roomId: r.roomId ?? r.stays?.[0]?.roomId ?? null,
    roomNumber: r.roomNumber ?? r.stays?.[0]?.room?.number ?? null,
    roomTypeName: r.roomTypeName ?? null,
    startDate: toDateStr(r.arrivalDate),
    endDate: toDateStr(r.departureDate),
    status: r.status,
    source: r.source,
    rate: Number(r.rate ?? 0),
    adults: r.adults ?? 1,
    children: r.children ?? 0,
    balance: Number(r.balance ?? 0),
    totalAmount: Number(r.totalAmount ?? 0),
    notes: r.notes ?? '',
  };
}

/** Map an API room (with roomType include) to the flat shape the tape grid uses. */
function toTapeRoom(room, roomTypes) {
  const typeName =
    room.roomType?.name ?? roomTypes?.find((t) => t.id === room.roomTypeId)?.name ?? '';
  const floor = room.floor != null && room.floor !== '' ? Number(room.floor) : null;
  return {
    id: room.id,
    number: room.number,
    label: room.number,
    floor: Number.isNaN(floor) ? null : floor,
    type: typeName || 'Room',
    status: room.status || 'clean',
    housekeepingStatus: room.housekeepingStatus || 'ready',
  };
}

function errorMessage(err) {
  return err?.response?.data?.message || err?.message || 'Something went wrong';
}

/* ═════════════════════════════════════════
   STATS BAR
   ═════════════════════════════════════════ */

function StatsBar({ rooms, reservations, dates }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const occupiedTonight = useMemo(() => {
    const ids = new Set(
      reservations
        .filter((r) => ACTIVE_STATUSES.includes(r.status) && r.roomId)
        .filter((r) => r.startDate <= todayStr && r.endDate > todayStr)
        .map((r) => r.roomId)
    );
    return ids.size;
  }, [reservations, todayStr]);

  const arrivalsToday = reservations.filter(
    (r) => r.status === 'confirmed' && r.startDate === todayStr
  ).length;
  const departuresToday = reservations.filter(
    (r) => ACTIVE_STATUSES.includes(r.status) && r.endDate === todayStr
  ).length;
  const outOfOrder = rooms.filter((r) => r.status === 'maintenance').length;
  const sellable = rooms.length - outOfOrder;
  const occupancy = sellable > 0 ? Math.round((occupiedTonight / sellable) * 100) : 0;

  const stats = [
    { icon: Percent, label: 'Occupancy Tonight', value: `${occupancy}%`, tone: 'text-secondary' },
    {
      icon: BedDouble,
      label: 'Occupied',
      value: `${occupiedTonight} / ${sellable}`,
      tone: 'text-text-primary',
    },
    { icon: ArrivalsIcon, label: 'Arrivals Today', value: arrivalsToday, tone: 'text-accent' },
    {
      icon: DeparturesIcon,
      label: 'Departures Today',
      value: departuresToday,
      tone: 'text-warning',
    },
    {
      icon: Wrench,
      label: 'Out of Order',
      value: outOfOrder,
      tone: outOfOrder > 0 ? 'text-danger' : 'text-text-muted',
    },
  ];

  return (
    <div className="flex items-center gap-6 border-b border-border bg-surface px-4 py-2.5 overflow-x-auto">
      {stats.map(({ icon: Icon, label, value, tone }) => (
        <div key={label} className="flex items-center gap-2 shrink-0">
          <Icon className={cn('h-4 w-4', tone)} />
          <div className="leading-tight">
            <div className={cn('text-sm font-semibold', tone)}>{value}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-wide">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════
   FILTER BAR
   ═════════════════════════════════════════ */

function FilterBar({ filters, onChange, roomTypes, floors, activeCount, totalCount }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-background/50">
      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <Filter className="h-3.5 w-3.5" />
        <span className="font-medium">Filters</span>
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-1.5">
        <Layers className="h-3.5 w-3.5 text-text-muted" />
        <select
          value={filters.floor}
          onChange={(e) => onChange({ ...filters, floor: e.target.value })}
          className="h-7 rounded-md border border-border bg-surface px-2 text-xs text-text-primary"
        >
          <option value="all">All Floors</option>
          {floors.map((f) => (
            <option key={f} value={String(f)}>
              Floor {f}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <BedDouble className="h-3.5 w-3.5 text-text-muted" />
        <select
          value={filters.type}
          onChange={(e) => onChange({ ...filters, type: e.target.value })}
          className="h-7 rounded-md border border-border bg-surface px-2 text-xs text-text-primary"
        >
          <option value="all">All Types</option>
          {roomTypes.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <CheckSquare className="h-3.5 w-3.5 text-text-muted" />
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          className="h-7 rounded-md border border-border bg-surface px-2 text-xs text-text-primary"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_META).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <Wrench className="h-3.5 w-3.5 text-text-muted" />
        <select
          value={filters.roomStatus}
          onChange={(e) => onChange({ ...filters, roomStatus: e.target.value })}
          className="h-7 rounded-md border border-border bg-surface px-2 text-xs text-text-primary"
        >
          <option value="all">All Room States</option>
          {Object.entries(ROOM_STATUS_META).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
      </div>

      <div className="ml-auto text-xs text-text-muted">
        Showing <span className="font-medium text-text-primary">{activeCount}</span> of {totalCount}{' '}
        rooms
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════
   UNASSIGNED ARRIVALS STRIP
   ═════════════════════════════════════════ */

function UnassignedStrip({ reservations, onSelect }) {
  const unassigned = reservations.filter((r) => !r.roomId && r.status === 'confirmed');
  if (unassigned.length === 0) return null;

  return (
    <div className="flex items-center gap-2 border-b border-border bg-warning/5 px-4 py-2 overflow-x-auto">
      <span className="flex items-center gap-1.5 text-xs font-medium text-warning shrink-0">
        <AlertCircle className="h-3.5 w-3.5" />
        Unassigned ({unassigned.length})
      </span>
      {unassigned.slice(0, 12).map((r) => (
        <button
          key={r.id}
          onClick={() => onSelect(r)}
          className="shrink-0 rounded-full border border-warning/30 bg-surface px-3 py-1 text-xs text-text-primary hover:bg-surface-elevated"
          title={`${r.confirmationNumber} — arriving ${r.startDate}`}
        >
          {r.guest} · {format(parseISO(r.startDate), 'MMM dd')}
        </button>
      ))}
      {unassigned.length > 12 && (
        <span className="text-xs text-text-muted shrink-0">+{unassigned.length - 12} more</span>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════
   CONTEXT MENU
   ═════════════════════════════════════════ */

function ContextMenu({ menu, rooms, onClose, onQuickCreate, onEdit, onCancel, onToggleRoomBlock }) {
  if (!menu.visible) return null;
  const room = menu.roomId ? rooms.find((r) => r.id === menu.roomId) : null;

  return (
    <div
      className="fixed z-50 w-52 rounded-lg border border-border bg-surface shadow-lg py-1"
      style={{ top: menu.y, left: menu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {menu.type === 'cell' && (
        <>
          <button
            onClick={() => {
              onQuickCreate(menu.roomId, menu.date);
              onClose();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-elevated"
          >
            <Plus className="h-4 w-4 text-secondary" /> New Reservation
          </button>
          <div className="my-1 border-t border-border" />
          {room?.status === 'maintenance' ? (
            <button
              onClick={() => {
                onToggleRoomBlock(room, false);
                onClose();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-accent hover:bg-surface-elevated"
            >
              <Check className="h-4 w-4" /> Return to Service
            </button>
          ) : (
            <button
              onClick={() => {
                onToggleRoomBlock(room, true);
                onClose();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5"
            >
              <Wrench className="h-4 w-4" /> Block Room (OOO)
            </button>
          )}
        </>
      )}
      {menu.type === 'reservation' && (
        <>
          <button
            onClick={() => {
              onEdit(menu.reservation);
              onClose();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-elevated"
          >
            <Edit3 className="h-4 w-4 text-secondary" /> Edit / View
          </button>
          <button
            onClick={() => {
              onCancel(menu.reservation);
              onClose();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5"
          >
            <XCircle className="h-4 w-4" /> Cancel Reservation
          </button>
        </>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════
   BULK ACTION BAR
   ═════════════════════════════════════════ */

function BulkActionBar({ selectedIds, reservations, onClear, onCheckIn, onCheckOut, onCancel }) {
  if (selectedIds.length === 0) return null;

  const selectedReservations = reservations.filter((r) => selectedIds.includes(r.id));
  const hasCheckedIn = selectedReservations.some((r) => r.status === 'checked_in');
  const hasConfirmed = selectedReservations.some((r) => r.status === 'confirmed');

  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-full border border-border bg-surface px-5 py-2.5 shadow-xl">
        <div className="flex items-center gap-2 pr-3 border-r border-border">
          <CheckSquare className="h-4 w-4 text-secondary" />
          <span className="text-sm font-medium text-text-primary">
            {selectedIds.length} selected
          </span>
        </div>

        {hasConfirmed && (
          <button
            onClick={() => onCheckIn(selectedIds)}
            className="flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary hover:bg-secondary/20"
          >
            <LogIn className="h-3.5 w-3.5" /> Check In
          </button>
        )}

        {hasCheckedIn && (
          <button
            onClick={() => onCheckOut(selectedIds)}
            className="flex items-center gap-1.5 rounded-full bg-neutral/10 px-3 py-1 text-xs font-medium text-text-muted hover:bg-neutral/20"
          >
            <LogOut className="h-3.5 w-3.5" /> Check Out
          </button>
        )}

        <button
          onClick={() => onCancel(selectedIds)}
          className="flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-medium text-danger hover:bg-danger/20"
        >
          <XCircle className="h-3.5 w-3.5" /> Cancel
        </button>

        <button
          onClick={onClear}
          className="ml-1 flex h-6 w-6 items-center justify-center rounded-full hover:bg-surface-elevated"
        >
          <X className="h-3.5 w-3.5 text-text-muted" />
        </button>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════
   GUEST PICKER (search existing / create new)
   ═════════════════════════════════════════ */

function GuestPicker({ value, onChange }) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [mode, setMode] = useState('search'); // 'search' | 'create'
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: guestsData } = useGuestsList(
    debounced.length >= 2 ? { search: debounced, pageSize: 8 } : undefined
  );
  const createGuest = useCreateGuest();

  const guests = guestsData?.data ?? [];

  const handleCreate = async () => {
    if (!createForm.firstName.trim() || !createForm.lastName.trim()) return;
    const guest = await createGuest.mutateAsync({
      firstName: createForm.firstName.trim(),
      lastName: createForm.lastName.trim(),
      email: createForm.email || undefined,
      phone: createForm.phone || undefined,
    });
    onChange({ id: guest.id, name: `${guest.firstName} ${guest.lastName}` });
  };

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
        <div className="flex items-center gap-2 text-sm text-text-primary">
          <User className="h-4 w-4 text-secondary" />
          {value.name}
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-text-muted hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('search')}
          className={cn(
            'flex-1 rounded-md border px-3 py-1.5 text-xs font-medium',
            mode === 'search'
              ? 'border-secondary bg-secondary/10 text-secondary'
              : 'border-border text-text-secondary'
          )}
        >
          Existing Guest
        </button>
        <button
          type="button"
          onClick={() => setMode('create')}
          className={cn(
            'flex-1 rounded-md border px-3 py-1.5 text-xs font-medium',
            mode === 'create'
              ? 'border-secondary bg-secondary/10 text-secondary'
              : 'border-border text-text-secondary'
          )}
        >
          New Guest
        </button>
      </div>

      {mode === 'search' ? (
        <>
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {guests.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-md border border-border">
              {guests.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onChange({ id: g.id, name: `${g.firstName} ${g.lastName}` })}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-elevated"
                >
                  <span>
                    {g.firstName} {g.lastName}
                  </span>
                  {g.email && (
                    <span className="text-xs text-text-muted truncate ml-2">{g.email}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="First name"
              value={createForm.firstName}
              onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
            />
            <Input
              placeholder="Last name"
              value={createForm.lastName}
              onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
            />
          </div>
          <Input
            placeholder="Email (optional)"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
          />
          <Input
            placeholder="Phone (optional)"
            value={createForm.phone}
            onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={
              !createForm.firstName.trim() || !createForm.lastName.trim() || createGuest.isPending
            }
            onClick={handleCreate}
          >
            {createGuest.isPending ? 'Creating…' : 'Create Guest'}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════
   QUICK CREATE MODAL
   ═════════════════════════════════════════ */

function buildQuickCreateData(defaultRoomId, defaultDate, fallbackRate) {
  const start = defaultDate || format(new Date(), 'yyyy-MM-dd');
  return {
    guest: null,
    roomId: defaultRoomId || '',
    startDate: start,
    endDate: format(addDays(parseISO(start), 1), 'yyyy-MM-dd'),
    rate: fallbackRate || '',
    adults: '2',
    children: '0',
    source: 'walkin',
  };
}

function QuickCreateModal({ isOpen, onClose, rooms, propertyId, defaultRoomId, defaultDate }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createReservation = useCreateReservation();
  const [data, setData] = useState(() => buildQuickCreateData(defaultRoomId, defaultDate));

  const resetKey = `${isOpen}|${defaultRoomId}|${defaultDate}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    if (isOpen) setData(buildQuickCreateData(defaultRoomId, defaultDate));
  }

  if (!isOpen) return null;

  const selectedRoom = rooms.find((r) => r.id === data.roomId);
  const nights = getNights(data.startDate, data.endDate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.guest || !propertyId) return;
    try {
      const result = await createReservation.mutateAsync({
        propertyId,
        guestId: data.guest.id,
        roomId: data.roomId || undefined,
        arrivalDate: data.startDate,
        departureDate: data.endDate,
        nights: Math.max(nights, 1),
        rate: data.rate !== '' ? Number(data.rate) : undefined,
        adults: Number(data.adults),
        children: Number(data.children),
        source: data.source,
      });
      toast({
        title: 'Reservation created',
        description: result.data?.confirmationNumber || '',
        variant: 'success',
      });
      onClose();
      navigate(`/app/reservations/${result.data?.id ?? ''}`);
    } catch (err) {
      toast({
        title: 'Could not create reservation',
        description: errorMessage(err),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">New Reservation</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">Guest</label>
            <GuestPicker value={data.guest} onChange={(guest) => setData({ ...data, guest })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Room</label>
              <select
                value={data.roomId}
                onChange={(e) => setData({ ...data, roomId: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
              >
                <option value="">Unassigned</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label} — {r.type}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Rate ($/night)"
              type="number"
              min="0"
              step="0.01"
              placeholder={selectedRoom ? 'Room default' : '0'}
              value={data.rate}
              onChange={(e) => setData({ ...data, rate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Arrival</label>
              <input
                type="date"
                required
                value={data.startDate}
                onChange={(e) => setData({ ...data, startDate: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Departure</label>
              <input
                type="date"
                required
                value={data.endDate}
                onChange={(e) => setData({ ...data, endDate: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Adults"
              type="number"
              min="1"
              value={data.adults}
              onChange={(e) => setData({ ...data, adults: e.target.value })}
            />
            <Input
              label="Children"
              type="number"
              min="0"
              value={data.children}
              onChange={(e) => setData({ ...data, children: e.target.value })}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Source</label>
              <select
                value={data.source}
                onChange={(e) => setData({ ...data, source: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
              >
                <option value="walkin">Walk-In</option>
                <option value="direct">Direct</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="bookingcom">Booking.com</option>
                <option value="expedia">Expedia</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 text-sm text-text-secondary">
            <span>
              {Math.max(nights, 0)} night{Math.abs(nights) === 1 ? '' : 's'}
            </span>
            {data.rate !== '' && nights > 0 && (
              <span className="font-medium text-text-primary">
                Est. total {formatMoney(Number(data.rate) * nights)}
              </span>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!data.guest || createReservation.isPending}>
              <Plus className="mr-1.5 h-4 w-4" />
              {createReservation.isPending ? 'Creating…' : 'Create Reservation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════
   RESERVATION DETAIL DRAWER
   ═════════════════════════════════════════ */

function ReservationDrawer({ reservation, rooms, isOpen, onClose }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const updateReservation = useUpdateReservation();
  const assignRoom = useAssignRoom();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const cancelReservation = useCancelReservation();

  const [prevReservation, setPrevReservation] = useState(null);
  if (reservation !== prevReservation) {
    setPrevReservation(reservation);
    if (reservation) {
      setEditData({ ...reservation });
      setIsEditing(false);
      setShowNoteInput(false);
      setNoteText('');
    }
  }

  if (!isOpen || !reservation || !editData) return null;

  const meta = STATUS_META[reservation.status] || STATUS_META.confirmed;
  const nights = getNights(reservation.startDate, reservation.endDate);
  const isActive = ACTIVE_STATUSES.includes(reservation.status);
  const roomChanged = (editData.roomId || null) !== (reservation.roomId || null);
  const isPending =
    updateReservation.isPending ||
    assignRoom.isPending ||
    checkIn.isPending ||
    checkOut.isPending ||
    cancelReservation.isPending;

  const handleSave = async () => {
    try {
      // Room assignment goes through the dedicated assign-room endpoint —
      // it exists on both the old and new backend and rebuilds stay rows.
      if (roomChanged && editData.roomId) {
        await assignRoom.mutateAsync({
          id: reservation.id,
          input: { roomId: editData.roomId, rate: Number(editData.rate) },
        });
      }
      await updateReservation.mutateAsync({
        id: reservation.id,
        input: {
          arrivalDate: editData.startDate,
          departureDate: editData.endDate,
          rate: Number(editData.rate),
          adults: Number(editData.adults),
          children: Number(editData.children),
        },
      });
      setIsEditing(false);
      toast({ title: 'Reservation updated', variant: 'success' });
    } catch (err) {
      toast({ title: 'Update failed', description: errorMessage(err), variant: 'destructive' });
    }
  };

  const handleCheckIn = async () => {
    try {
      await checkIn.mutateAsync(reservation.id);
      toast({ title: `${reservation.guest} checked in`, variant: 'success' });
    } catch (err) {
      toast({ title: 'Check-in failed', description: errorMessage(err), variant: 'destructive' });
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut.mutateAsync(reservation.id);
      toast({ title: `${reservation.guest} checked out`, variant: 'success' });
    } catch (err) {
      toast({ title: 'Check-out failed', description: errorMessage(err), variant: 'destructive' });
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(`Cancel reservation ${reservation.confirmationNumber}?`)) return;
    try {
      await cancelReservation.mutateAsync({ id: reservation.id });
      toast({ title: 'Reservation cancelled', variant: 'success' });
      onClose();
    } catch (err) {
      toast({ title: 'Cancel failed', description: errorMessage(err), variant: 'destructive' });
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await updateReservation.mutateAsync({
        id: reservation.id,
        input: {
          notes: reservation.notes ? `${reservation.notes}\n${noteText.trim()}` : noteText.trim(),
        },
      });
      setNoteText('');
      setShowNoteInput(false);
      toast({ title: 'Note added', variant: 'success' });
    } catch (err) {
      toast({
        title: 'Could not add note',
        description: errorMessage(err),
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-text-primary">
              {isEditing
                ? 'Edit Reservation'
                : reservation.confirmationNumber || reservation.id.toUpperCase()}
            </h2>
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                meta.bgSoft,
                meta.text,
                meta.border
              )}
            >
              {meta.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && isActive && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-text-secondary hover:bg-surface-elevated"
                title="Edit"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-text-secondary hover:bg-surface-elevated"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Guest Card */}
          <div className="space-y-3 rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-sm font-bold text-secondary">
                {reservation.guest
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-text-primary">{reservation.guest}</h3>
                <p className="text-xs text-text-muted">
                  {nights} night{nights === 1 ? '' : 's'} ·{' '}
                  {reservation.roomTypeName ||
                    rooms.find((r) => r.id === reservation.roomId)?.type ||
                    'Unassigned'}
                </p>
              </div>
            </div>

            {(reservation.phone || reservation.email) && (
              <div className="grid grid-cols-2 gap-2 border-t border-border pt-2">
                {reservation.phone && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Phone className="h-3.5 w-3.5 text-text-muted" /> {reservation.phone}
                  </div>
                )}
                {reservation.email && (
                  <div className="flex items-center gap-2 truncate text-xs text-text-secondary">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-text-muted" /> {reservation.email}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stay Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Stay Details
            </h4>
            <div className="space-y-3 rounded-xl border border-border bg-background p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-muted">Arrival</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editData.startDate}
                      onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                      className="mt-1 h-8 w-full rounded-md border border-border bg-surface px-2 text-sm text-text-primary"
                    />
                  ) : (
                    <p className="flex items-center gap-2 text-sm font-medium text-text-primary">
                      <Calendar className="h-3.5 w-3.5 text-secondary" />
                      {format(parseISO(reservation.startDate), 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-text-muted">Departure</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editData.endDate}
                      onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                      className="mt-1 h-8 w-full rounded-md border border-border bg-surface px-2 text-sm text-text-primary"
                    />
                  ) : (
                    <p className="flex items-center gap-2 text-sm font-medium text-text-primary">
                      <Calendar className="h-3.5 w-3.5 text-secondary" />
                      {format(parseISO(reservation.endDate), 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-text-muted">Room</label>
                  {isEditing ? (
                    <select
                      value={editData.roomId || ''}
                      onChange={(e) => setEditData({ ...editData, roomId: e.target.value })}
                      className="mt-1 h-8 w-full rounded-md border border-border bg-surface px-2 text-sm text-text-primary"
                    >
                      <option value="">Unassigned</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label} — {r.type}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="flex items-center gap-2 text-sm font-medium text-text-primary">
                      <BedDouble className="h-3.5 w-3.5 text-secondary" />
                      {reservation.roomNumber ||
                        rooms.find((r) => r.id === reservation.roomId)?.label ||
                        'Unassigned'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-text-muted">Rate</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editData.rate}
                      onChange={(e) => setEditData({ ...editData, rate: e.target.value })}
                      className="mt-1 h-8 text-sm"
                    />
                  ) : (
                    <p className="flex items-center gap-2 text-sm font-medium text-text-primary">
                      <DollarSign className="h-3.5 w-3.5 text-secondary" />
                      {formatMoney(reservation.rate)}/night
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-muted">Adults</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="1"
                      value={editData.adults}
                      onChange={(e) => setEditData({ ...editData, adults: e.target.value })}
                      className="mt-1 h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm text-text-primary">{reservation.adults}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-text-muted">Children</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="0"
                      value={editData.children}
                      onChange={(e) => setEditData({ ...editData, children: e.target.value })}
                      className="mt-1 h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm text-text-primary">{reservation.children}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Folio Preview */}
          {!isEditing && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Folio Preview
              </h4>
              <div className="space-y-2 rounded-xl border border-border bg-background p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Room Charges</span>
                  <span className="font-mono text-text-primary">
                    {formatMoney(reservation.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold">
                  <span className="text-text-primary">Total</span>
                  <span className="font-mono text-text-primary">
                    {formatMoney(reservation.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 text-sm">
                  <span className="text-text-secondary">Balance</span>
                  <span
                    className={cn(
                      'font-mono font-medium',
                      reservation.balance > 0 ? 'text-danger' : 'text-accent'
                    )}
                  >
                    {formatMoney(reservation.balance)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {!isEditing && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Notes
              </h4>
              {reservation.notes ? (
                <p className="whitespace-pre-line rounded-xl border border-border bg-background p-3 text-sm text-text-secondary">
                  {reservation.notes}
                </p>
              ) : (
                <p className="text-xs italic text-text-muted">No notes</p>
              )}
              {showNoteInput ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a note…"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!noteText.trim() || updateReservation.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setShowNoteInput(true)}>
                  <MessageSquare className="mr-1.5 h-4 w-4" /> Add Note
                </Button>
              )}
            </div>
          )}

          {/* Quick Actions */}
          {!isEditing && (
            <div className="space-y-2">
              {reservation.status === 'confirmed' &&
                (reservation.roomId ? (
                  <Button className="w-full" onClick={handleCheckIn} disabled={checkIn.isPending}>
                    <LogIn className="mr-1.5 h-4 w-4" />
                    {checkIn.isPending ? 'Checking in…' : 'Check In'}
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex w-full items-center gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-left text-xs text-warning hover:bg-warning/10"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    No room assigned — tap to edit, assign a room, then check in.
                  </button>
                ))}
              {reservation.status === 'checked_in' && (
                <Button className="w-full" onClick={handleCheckOut} disabled={checkOut.isPending}>
                  <LogOut className="mr-1.5 h-4 w-4" />
                  {checkOut.isPending ? 'Checking out…' : 'Check Out'}
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/app/reservations/${reservation.id}`)}
              >
                <CreditCard className="mr-1.5 h-4 w-4" /> Post Payment / Folio
              </Button>
              {isActive && (
                <Button
                  variant="outline"
                  className="w-full text-danger hover:bg-danger/5"
                  onClick={handleCancel}
                  disabled={cancelReservation.isPending}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" /> Cancel Reservation
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setEditData({ ...reservation });
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={isPending}>
                <Save className="mr-1.5 h-4 w-4" />
                {updateReservation.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/app/reservations/${reservation.id}`)}
            >
              <Eye className="mr-1.5 h-4 w-4" /> Open Full Details
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

/* ═════════════════════════════════════════
   MAIN TAPE CHART COMPONENT
   ═════════════════════════════════════════ */

export default function TapeChart({
  rooms: apiRooms,
  roomTypes,
  reservations: apiReservations,
  isFetching,
}) {
  const gridRef = useRef(null);
  const { toast } = useToast();

  const rooms = useMemo(
    () => (apiRooms ?? []).map((r) => toTapeRoom(r, roomTypes)),
    [apiRooms, roomTypes]
  );
  const propertyId = apiRooms?.[0]?.propertyId ?? null;

  const reservations = useMemo(
    () => (apiReservations ?? []).map(toTapeReservation),
    [apiReservations]
  );

  /* ── UI State ── */
  const [viewMode, setViewMode] = useState('7');
  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    type: null,
    reservation: null,
    roomId: null,
    date: null,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateDefaults, setQuickCreateDefaults] = useState({ roomId: null, date: null });
  const [filters, setFilters] = useState({
    floor: 'all',
    type: 'all',
    status: 'all',
    roomStatus: 'all',
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastSelectedId, setLastSelectedId] = useState(null);
  const [resizeState, setResizeState] = useState(null);
  const [dragState, setDragState] = useState(null);

  /* ── Mutations ── */
  const updateReservation = useUpdateReservation();
  const assignRoom = useAssignRoom();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const cancelReservation = useCancelReservation();
  const roomMutations = useRoomMutations();

  /* ── Commit helpers ── */
  const commitDateChange = useCallback(
    async (reservation, newStart, newEnd) => {
      try {
        await updateReservation.mutateAsync({
          id: reservation.id,
          input: { arrivalDate: newStart, departureDate: newEnd },
        });
        toast({ title: 'Stay dates updated', variant: 'success' });
      } catch (err) {
        toast({
          title: 'Could not move reservation',
          description: errorMessage(err),
          variant: 'destructive',
        });
      }
    },
    [updateReservation, toast]
  );

  /* ── Ref bridge: latest resizeState for stable global listeners ── */
  const resizeRef = useRef(null);
  useEffect(() => {
    resizeRef.current = resizeState;
  }, [resizeState]);

  const days = VIEW_MODES.find((v) => v.id === viewMode)?.days || 7;
  const dates = useMemo(() => getDatesForRange(startDate, days), [startDate, days]);

  /* ── Derived: Filtered Rooms ── */
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (filters.floor !== 'all' && String(room.floor) !== filters.floor) return false;
      if (filters.type !== 'all' && room.type !== filters.type) return false;
      if (filters.roomStatus !== 'all' && room.status !== filters.roomStatus) return false;
      return true;
    });
  }, [filters.floor, filters.type, filters.roomStatus, rooms]);

  /* ── Derived: Filtered Reservations for Display ── */
  const visibleReservations = useMemo(() => {
    if (filters.status === 'all') return reservations;
    return reservations.filter((r) => r.status === filters.status);
  }, [reservations, filters.status]);

  const floors = useMemo(
    () => [...new Set(rooms.map((r) => r.floor).filter((f) => f != null))].sort((a, b) => a - b),
    [rooms]
  );

  /* ── Global click to close context menu ── */
  useEffect(() => {
    const handleClick = () => setContextMenu((m) => ({ ...m, visible: false }));
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  /* ── Global mouse up for resize ── */
  useEffect(() => {
    const handleMouseUp = () => {
      const state = resizeRef.current;
      if (state) {
        const { reservation, pendingStart, pendingEnd } = state;
        if (
          pendingStart &&
          pendingEnd &&
          (pendingStart !== reservation.startDate || pendingEnd !== reservation.endDate)
        ) {
          commitDateChange(reservation, pendingStart, pendingEnd);
        }
        setResizeState(null);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [commitDateChange]);

  /* ── Resize cursor while dragging ── */
  useEffect(() => {
    if (!resizeState) return;
    document.body.style.cursor = resizeState.edge === 'left' ? 'w-resize' : 'e-resize';
    document.body.style.userSelect = 'none';
  }, [resizeState]);

  /* ── Global mouse move for resize ── */
  useEffect(() => {
    const handleMouseMove = (e) => {
      const state = resizeRef.current;
      if (!state) return;
      const { edge, startX, cellWidth, startDate: origStart, endDate: origEnd } = state;

      const deltaPixels = e.clientX - startX;
      const deltaDays = Math.round(deltaPixels / cellWidth);

      let newStart = origStart;
      let newEnd = origEnd;

      if (edge === 'left') {
        newStart = format(addDays(parseISO(origStart), deltaDays), 'yyyy-MM-dd');
        if (differenceInDays(parseISO(origEnd), parseISO(newStart)) < 1) {
          newStart = format(addDays(parseISO(origEnd), -1), 'yyyy-MM-dd');
        }
      } else {
        newEnd = format(addDays(parseISO(origEnd), deltaDays), 'yyyy-MM-dd');
        if (differenceInDays(parseISO(newEnd), parseISO(origStart)) < 1) {
          newEnd = format(addDays(parseISO(origStart), 1), 'yyyy-MM-dd');
        }
      }

      setResizeState((prev) =>
        prev ? { ...prev, pendingStart: newStart, pendingEnd: newEnd } : null
      );
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const commitRoomMove = useCallback(
    async (reservation, targetRoomId, targetDate) => {
      const nights = getNights(reservation.startDate, reservation.endDate);
      const newStart = format(targetDate, 'yyyy-MM-dd');
      const newEnd = format(addDays(targetDate, nights), 'yyyy-MM-dd');
      try {
        await assignRoom.mutateAsync({
          id: reservation.id,
          input: { roomId: targetRoomId },
        });
        await updateReservation.mutateAsync({
          id: reservation.id,
          input: { arrivalDate: newStart, departureDate: newEnd },
        });
        toast({ title: 'Reservation moved', variant: 'success' });
      } catch (err) {
        toast({
          title: 'Could not move reservation',
          description: errorMessage(err),
          variant: 'destructive',
        });
      }
    },
    [assignRoom, updateReservation, toast]
  );

  /* ── Navigation ── */
  const handlePrev = () => setStartDate((d) => addDays(d, -days));
  const handleNext = () => setStartDate((d) => addDays(d, days));
  const handleToday = () => setStartDate(startOfDay(new Date()));

  /* ── Reservation Lookup ── */
  const getReservationForRoomAndDate = useCallback(
    (roomId, date) => {
      const d = format(date, 'yyyy-MM-dd');
      return visibleReservations.find(
        (r) => r.roomId === roomId && d >= r.startDate && d < r.endDate
      );
    },
    [visibleReservations]
  );

  /* ── Right-Click Handler ── */
  const handleCellContextMenu = (e, roomId, date) => {
    e.preventDefault();
    e.stopPropagation();
    const existing = getReservationForRoomAndDate(roomId, date);
    if (existing) {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        type: 'reservation',
        reservation: existing,
        roomId,
        date,
      });
    } else {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        type: 'cell',
        roomId,
        date: format(date, 'yyyy-MM-dd'),
      });
    }
  };

  /* ── Drawer ── */
  const handleReservationClick = (reservation, e) => {
    if (e) {
      if (e.shiftKey) {
        e.stopPropagation();
        handleShiftSelect(reservation.id);
        return;
      }
      e.stopPropagation();
    }
    setSelectedReservation(reservation);
    setDrawerOpen(true);
    setSelectedIds([]);
  };

  /* ── Multi-Select ── */
  const handleShiftSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((sid) => sid !== id);
      }
      return [...prev, id];
    });
    setLastSelectedId(id);
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setLastSelectedId(null);
  };

  /* ── Bulk actions ── */
  const handleBulkCheckIn = async (ids) => {
    const ready = ids.filter((id) => reservations.find((r) => r.id === id)?.roomId);
    const skipped = ids.length - ready.length;
    if (skipped > 0) {
      toast({
        title: `${skipped} reservation${skipped === 1 ? '' : 's'} skipped`,
        description: 'Assign a room before check-in.',
        variant: 'destructive',
      });
    }
    for (const id of ready) {
      try {
        await checkIn.mutateAsync(id);
      } catch (err) {
        toast({ title: 'Check-in failed', description: errorMessage(err), variant: 'destructive' });
      }
    }
    clearSelection();
  };

  const handleBulkCheckOut = async (ids) => {
    for (const id of ids) {
      try {
        await checkOut.mutateAsync(id);
      } catch (err) {
        toast({
          title: 'Check-out failed',
          description: errorMessage(err),
          variant: 'destructive',
        });
      }
    }
    clearSelection();
  };

  const handleBulkCancel = async (ids) => {
    if (!window.confirm(`Cancel ${ids.length} reservation${ids.length === 1 ? '' : 's'}?`)) return;
    for (const id of ids) {
      try {
        await cancelReservation.mutateAsync({ id });
      } catch (err) {
        toast({ title: 'Cancel failed', description: errorMessage(err), variant: 'destructive' });
      }
    }
    clearSelection();
  };

  /* ── Resize Handlers ── */
  const handleResizeStart = (e, reservation, edge) => {
    e.stopPropagation();
    e.preventDefault();

    const grid = gridRef.current;
    if (!grid) return;
    const firstDataCell = grid.querySelector('[data-cell-idx="0"]');
    const cellWidth = firstDataCell ? firstDataCell.offsetWidth : 100;

    setResizeState({
      reservation,
      edge,
      startX: e.clientX,
      cellWidth,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      pendingStart: reservation.startDate,
      pendingEnd: reservation.endDate,
    });
  };

  /* ── Drag-to-Move Handlers ── */
  const handleDragStart = (e, reservation) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ reservationId: reservation.id }));
    e.dataTransfer.effectAllowed = 'move';
    setDragState({ reservationId: reservation.id });
  };

  const handleDragEnd = () => {
    setDragState(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetRoomId, targetDate) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    const { reservationId } = JSON.parse(data);
    const reservation = reservations.find((r) => r.id === reservationId);
    if (!reservation) return;
    if (targetRoomId && targetRoomId !== reservation.roomId) {
      commitRoomMove(reservation, targetRoomId, targetDate);
    } else {
      // Same room — just shift dates
      commitDateChange(
        reservation,
        format(targetDate, 'yyyy-MM-dd'),
        format(
          addDays(targetDate, getNights(reservation.startDate, reservation.endDate)),
          'yyyy-MM-dd'
        )
      );
    }
    setDragState(null);
  };

  /* ── Quick Create ── */
  const handleQuickCreate = (roomId, date) => {
    setQuickCreateDefaults({ roomId, date });
    setQuickCreateOpen(true);
  };

  /* ── Room block (OOO) ── */
  const handleToggleRoomBlock = async (room, block) => {
    try {
      await roomMutations.update.mutateAsync({
        id: room.id,
        input: { status: block ? 'maintenance' : 'clean' },
      });
      toast({
        title: block ? `Room ${room.label} blocked` : `Room ${room.label} returned to service`,
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Could not update room',
        description: errorMessage(err),
        variant: 'destructive',
      });
    }
  };

  /* ── Cancel single ── */
  const handleCancelReservation = async (res) => {
    if (!window.confirm(`Cancel reservation ${res.confirmationNumber}?`)) return;
    try {
      await cancelReservation.mutateAsync({ id: res.id });
      toast({ title: 'Reservation cancelled', variant: 'success' });
      if (selectedReservation?.id === res.id) {
        setDrawerOpen(false);
        setSelectedReservation(null);
      }
    } catch (err) {
      toast({ title: 'Cancel failed', description: errorMessage(err), variant: 'destructive' });
    }
  };

  // Effective dates for the currently-resizing reservation (for live visual feedback)
  const resizingId = resizeState?.reservation?.id;
  const effectiveReservations = useMemo(() => {
    if (!resizeState || !resizingId) return visibleReservations;
    return visibleReservations.map((r) =>
      r.id === resizingId
        ? {
            ...r,
            startDate: resizeState.pendingStart ?? r.startDate,
            endDate: resizeState.pendingEnd ?? r.endDate,
          }
        : r
    );
  }, [visibleReservations, resizeState, resizingId]);

  const effectiveLookup = useCallback(
    (roomId, date) => {
      const d = format(date, 'yyyy-MM-dd');
      return effectiveReservations.find(
        (r) => r.roomId === roomId && d >= r.startDate && d < r.endDate
      );
    },
    [effectiveReservations]
  );

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-background p-1">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  viewMode === mode.id
                    ? 'bg-secondary text-white'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-border mx-1" />
          <button
            onClick={handlePrev}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background hover:bg-surface-elevated"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleToday}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-elevated"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background hover:bg-surface-elevated"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-text-primary ml-2">
            {format(dates[0], 'MMM dd')} — {format(dates[dates.length - 1], 'MMM dd, yyyy')}
          </span>
          {isFetching && <RefreshCw className="ml-2 h-3.5 w-3.5 animate-spin text-text-muted" />}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={cn('h-2.5 w-2.5 rounded-sm', meta.color)} />
              <span className="text-xs text-text-secondary">{meta.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <StatsBar rooms={rooms} reservations={reservations} dates={dates} />

      {/* Unassigned arrivals */}
      <UnassignedStrip reservations={reservations} onSelect={(r) => handleReservationClick(r)} />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        roomTypes={roomTypes ?? []}
        floors={floors}
        activeCount={filteredRooms.length}
        totalCount={rooms.length}
      />

      {/* Grid */}
      <div className="flex-1 overflow-auto" ref={gridRef}>
        <div className="min-w-max">
          {/* Date Header */}
          <div
            className="sticky top-0 z-10 grid border-b border-border bg-surface"
            style={{ gridTemplateColumns: `110px repeat(${days}, minmax(100px, 1fr))` }}
          >
            <div className="border-r border-border px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center">
              Room
            </div>
            {dates.map((date, idx) => (
              <div
                key={date.toISOString()}
                data-cell-idx={idx}
                className={cn(
                  'border-r border-border px-2 py-2 text-center text-xs font-medium',
                  isSameDay(date, new Date())
                    ? 'bg-secondary/5 text-secondary'
                    : 'text-text-secondary'
                )}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, null, date)}
              >
                <div>{format(date, 'EEE')}</div>
                <div className={cn('text-sm', isSameDay(date, new Date()) && 'font-bold')}>
                  {format(date, 'dd')}
                </div>
              </div>
            ))}
          </div>

          {/* Room Rows */}
          {filteredRooms.map((room) => {
            const roomStatus = ROOM_STATUS_META[room.status] || ROOM_STATUS_META.clean;
            const isOOO = room.status === 'maintenance';
            return (
              <div
                key={room.id}
                className={cn(
                  'grid border-b border-border transition-colors',
                  isOOO ? 'bg-danger/[0.03]' : 'hover:bg-surface/50'
                )}
                style={{ gridTemplateColumns: `110px repeat(${days}, minmax(100px, 1fr))` }}
              >
                {/* Room Label */}
                <div className="flex flex-col justify-center border-r border-border bg-surface px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full shrink-0', roomStatus.dot)} />
                    <span className="text-sm font-bold text-text-primary">{room.label}</span>
                  </div>
                  <span className="text-[10px] text-text-muted truncate">{room.type}</span>
                </div>

                {/* Cells */}
                {dates.map((date, idx) => {
                  const reservation = effectiveLookup(room.id, date);
                  const isStart = reservation && isSameDay(date, parseISO(reservation.startDate));
                  const isToday = isSameDay(date, new Date());
                  const isSelected = reservation && selectedIds.includes(reservation.id);
                  const isDragging = dragState?.reservationId === reservation?.id;

                  return (
                    <div
                      key={date.toISOString()}
                      data-cell-idx={idx}
                      onContextMenu={(e) => handleCellContextMenu(e, room.id, date)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, room.id, date)}
                      className={cn(
                        'relative border-r border-border h-14 transition-colors',
                        isToday && !reservation && 'bg-secondary/5',
                        !reservation && !isOOO && 'hover:bg-surface-elevated/50',
                        isOOO && 'bg-danger/[0.02]',
                        isDragging && 'bg-secondary/10'
                      )}
                    >
                      {isOOO && !reservation && (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-danger/40">
                            OOO
                          </span>
                        </div>
                      )}
                      {reservation && isStart && (
                        <div
                          draggable={ACTIVE_STATUSES.includes(reservation.status)}
                          onDragStart={(e) => handleDragStart(e, reservation)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => handleReservationClick(reservation, e)}
                          onContextMenu={(e) => {
                            e.stopPropagation();
                            handleCellContextMenu(e, room.id, date);
                          }}
                          className={cn(
                            'absolute inset-y-1 left-1 z-10 cursor-pointer rounded-md border px-2 py-1 text-left shadow-sm transition-all hover:shadow-md hover:brightness-95 group',
                            STATUS_META[reservation.status]?.bgSoft,
                            STATUS_META[reservation.status]?.border,
                            isSelected && 'ring-2 ring-secondary ring-offset-1'
                          )}
                          style={{
                            width: `calc(${getNights(reservation.startDate, reservation.endDate) * 100}% + ${(getNights(reservation.startDate, reservation.endDate) - 1) * 1}px)`,
                          }}
                        >
                          {/* Drag Handle */}
                          <div className="absolute left-0 top-0 bottom-0 flex w-4 cursor-move items-center justify-center opacity-0 group-hover:opacity-50">
                            <GripVertical className="h-3 w-3 text-text-muted" />
                          </div>

                          {/* Resize Handles */}
                          {ACTIVE_STATUSES.includes(reservation.status) && (
                            <>
                              <div
                                className="absolute left-0 top-0 bottom-0 w-3 cursor-w-resize rounded-l-md opacity-0 hover:bg-secondary/20 group-hover:opacity-100"
                                onMouseDown={(e) => handleResizeStart(e, reservation, 'left')}
                                title="Drag to change arrival"
                              />
                              <div
                                className="absolute right-0 top-0 bottom-0 w-3 cursor-e-resize rounded-r-md opacity-0 hover:bg-secondary/20 group-hover:opacity-100"
                                onMouseDown={(e) => handleResizeStart(e, reservation, 'right')}
                                title="Drag to change departure"
                              />
                            </>
                          )}

                          <div className="flex items-center gap-1.5 overflow-hidden pl-3">
                            <div
                              className={cn(
                                'h-2 w-2 shrink-0 rounded-full',
                                STATUS_META[reservation.status]?.color
                              )}
                            />
                            <span className="truncate text-xs font-medium text-text-primary">
                              {reservation.guest}
                            </span>
                          </div>
                          <div className="truncate pl-3 text-[10px] text-text-muted">
                            {formatMoney(reservation.rate)}
                            {reservation.balance > 0 && (
                              <span className="ml-1 text-danger">
                                · bal {formatMoney(reservation.balance)}
                              </span>
                            )}
                          </div>

                          {/* Multi-select checkbox on hover */}
                          <div
                            className="absolute right-1 top-1 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShiftSelect(reservation.id);
                            }}
                          >
                            {isSelected ? (
                              <CheckSquare className="h-3.5 w-3.5 text-secondary" />
                            ) : (
                              <Square className="h-3.5 w-3.5 text-text-muted" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {filteredRooms.length === 0 && (
            <div className="flex h-32 items-center justify-center text-sm text-text-muted">
              No rooms match the current filters.
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu
        menu={contextMenu}
        rooms={rooms}
        onClose={() => setContextMenu((m) => ({ ...m, visible: false }))}
        onQuickCreate={handleQuickCreate}
        onEdit={handleReservationClick}
        onCancel={handleCancelReservation}
        onToggleRoomBlock={handleToggleRoomBlock}
      />

      {/* Detail Drawer */}
      <ReservationDrawer
        reservation={selectedReservation}
        rooms={rooms}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Quick Create Modal */}
      <QuickCreateModal
        isOpen={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        rooms={rooms}
        propertyId={propertyId}
        defaultRoomId={quickCreateDefaults.roomId}
        defaultDate={quickCreateDefaults.date}
      />

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        reservations={reservations}
        onClear={clearSelection}
        onCheckIn={handleBulkCheckIn}
        onCheckOut={handleBulkCheckOut}
        onCancel={handleBulkCancel}
      />
    </div>
  );
}
