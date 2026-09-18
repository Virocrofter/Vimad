import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format,
  addDays,
  differenceInDays,
  startOfDay,
  isSameDay,
  parseISO,
  subDays,
} from 'date-fns';
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
  Move,
  ArrowLeftRight,
  GripVertical,
  Layers,
  CheckSquare,
  Square,
  XCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

/* ─────────────────────────────────────────
   CONSTANTS & MOCK DATA
   ───────────────────────────────────────── */

const VIEW_MODES = [
  { id: '7', label: '7 Days', days: 7 },
  { id: '30', label: '30 Days', days: 30 },
  { id: '90', label: '90 Days', days: 90 },
];

const ROOMS = [
  { id: '101', floor: 1, type: 'Standard King', status: 'clean' },
  { id: '102', floor: 1, type: 'Standard King', status: 'occupied' },
  { id: '103', floor: 1, type: 'Standard Twin', status: 'dirty' },
  { id: '104', floor: 1, type: 'Deluxe King', status: 'inspected' },
  { id: '105', floor: 1, type: 'Suite', status: 'clean' },
  { id: '201', floor: 2, type: 'Standard King', status: 'clean' },
  { id: '202', floor: 2, type: 'Standard Twin', status: 'occupied' },
  { id: '203', floor: 2, type: 'Deluxe King', status: 'clean' },
  { id: '204', floor: 2, type: 'Deluxe King', status: 'occupied' },
  { id: '205', floor: 2, type: 'Suite', status: 'dirty' },
  { id: '301', floor: 3, type: 'Standard King', status: 'clean' },
  { id: '302', floor: 3, type: 'Deluxe King', status: 'inspected' },
  { id: '303', floor: 3, type: 'Suite', status: 'clean' },
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

const generateMockReservations = () => {
  const today = startOfDay(new Date());
  return [
    {
      id: 'r1',
      guest: 'John Smith',
      roomId: '102',
      startDate: format(today, 'yyyy-MM-dd'),
      endDate: format(addDays(today, 3), 'yyyy-MM-dd'),
      status: 'checked_in',
      rate: 189,
      adults: 2,
      children: 0,
      phone: '+1 555-0101',
      email: 'john@email.com',
      balance: 45.5,
    },
    {
      id: 'r2',
      guest: 'Sarah Johnson',
      roomId: '204',
      startDate: format(addDays(today, -1), 'yyyy-MM-dd'),
      endDate: format(addDays(today, 2), 'yyyy-MM-dd'),
      status: 'confirmed',
      rate: 189,
      adults: 2,
      children: 1,
      phone: '+1 555-0102',
      email: 'sarah@email.com',
      balance: 0,
    },
    {
      id: 'r3',
      guest: 'Michael Brown',
      roomId: '301',
      startDate: format(addDays(today, 2), 'yyyy-MM-dd'),
      endDate: format(addDays(today, 5), 'yyyy-MM-dd'),
      status: 'confirmed',
      rate: 145,
      adults: 1,
      children: 0,
      phone: '+1 555-0103',
      email: 'mbrown@email.com',
      balance: 435,
    },
    {
      id: 'r4',
      guest: 'Emily Davis',
      roomId: '105',
      startDate: format(addDays(today, 1), 'yyyy-MM-dd'),
      endDate: format(addDays(today, 4), 'yyyy-MM-dd'),
      status: 'confirmed',
      rate: 320,
      adults: 2,
      children: 0,
      phone: '+1 555-0104',
      email: 'emily@email.com',
      balance: 960,
    },
    {
      id: 'r5',
      guest: 'Robert Chen',
      roomId: '202',
      startDate: format(addDays(today, -2), 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd'),
      status: 'checked_out',
      rate: 145,
      adults: 2,
      children: 0,
      phone: '+1 555-0105',
      email: 'robert@email.com',
      balance: 0,
    },
    {
      id: 'r6',
      guest: 'Lisa Wong',
      roomId: '104',
      startDate: format(addDays(today, 4), 'yyyy-MM-dd'),
      endDate: format(addDays(today, 7), 'yyyy-MM-dd'),
      status: 'confirmed',
      rate: 189,
      adults: 2,
      children: 0,
      phone: '+1 555-0106',
      email: 'lisa@email.com',
      balance: 567,
    },
  ];
};

/* ─────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────── */

function getDatesForRange(start, days) {
  const dates = [];
  for (let i = 0; i < days; i++) dates.push(addDays(start, i));
  return dates;
}

function getNights(start, end) {
  return differenceInDays(parseISO(end), parseISO(start));
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/* ═════════════════════════════════════════
   BATCH 3 — SUB-COMPONENTS
   ═════════════════════════════════════════ */

/* ─── Reservation Detail Drawer (Right Slide) ─── */
function ReservationDrawer({ reservation, room, isOpen, onClose, onSave, onCheckIn, onCheckOut }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  // Populate edit state when the selected reservation changes
  const [prevReservation, setPrevReservation] = useState(null);
  if (reservation !== prevReservation) {
    setPrevReservation(reservation);
    if (reservation) {
      setEditData({ ...reservation });
      setIsEditing(false);
    }
  }

  if (!isOpen || !reservation || !editData) return null;

  const meta = STATUS_META[reservation.status] || STATUS_META.confirmed;
  const nights = getNights(reservation.startDate, reservation.endDate);
  const total = nights * reservation.rate;

  const handleSave = () => {
    onSave(editData);
    setIsEditing(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-surface shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-text-primary">
              {isEditing ? 'Edit Reservation' : reservation.id.toUpperCase()}
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
            {!isEditing && (
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Guest Card */}
          <div className="rounded-xl border border-border bg-background p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-sm font-bold text-secondary">
                {reservation.guest
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <Input
                    value={editData.guest}
                    onChange={(e) => setEditData({ ...editData, guest: e.target.value })}
                    className="h-8 text-sm"
                  />
                ) : (
                  <h3 className="font-semibold text-text-primary truncate">{reservation.guest}</h3>
                )}
                <p className="text-xs text-text-muted">
                  {nights} nights · {room?.type}
                </p>
              </div>
            </div>

            {!isEditing && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Phone className="h-3.5 w-3.5 text-text-muted" /> {reservation.phone}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary truncate">
                  <Mail className="h-3.5 w-3.5 text-text-muted shrink-0" /> {reservation.email}
                </div>
              </div>
            )}
          </div>

          {/* Stay Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Stay Details
            </h4>
            <div className="rounded-xl border border-border bg-background p-4 space-y-3">
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
                    <p className="text-sm font-medium text-text-primary flex items-center gap-2">
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
                    <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-secondary" />
                      {format(parseISO(reservation.endDate), 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-text-muted">Room</label>
                  {isEditing ? (
                    <select
                      value={editData.roomId}
                      onChange={(e) => setEditData({ ...editData, roomId: e.target.value })}
                      className="mt-1 h-8 w-full rounded-md border border-border bg-surface px-2 text-sm text-text-primary"
                    >
                      {ROOMS.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.id} — {r.type}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                      <BedDouble className="h-3.5 w-3.5 text-secondary" />
                      {room?.id} — {room?.type}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-text-muted">Rate</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editData.rate}
                      onChange={(e) => setEditData({ ...editData, rate: Number(e.target.value) })}
                      className="mt-1 h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 text-secondary" />${reservation.rate}/night
                    </p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div>
                  <label className="text-xs text-text-muted">Status</label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="mt-1 h-8 w-full rounded-md border border-border bg-surface px-2 text-sm text-text-primary"
                  >
                    {Object.entries(STATUS_META).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Folio Preview (View Mode Only) */}
          {!isEditing && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Folio Preview
              </h4>
              <div className="rounded-xl border border-border bg-background p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Room Charges</span>
                  <span className="font-mono text-text-primary">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Taxes & Fees</span>
                  <span className="font-mono text-text-primary">${(total * 0.15).toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span className="text-text-primary">Total</span>
                  <span className="font-mono text-text-primary">${(total * 1.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-text-secondary">Balance</span>
                  <span
                    className={cn(
                      'font-mono font-medium',
                      reservation.balance > 0 ? 'text-danger' : 'text-accent'
                    )}
                  >
                    ${reservation.balance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions (View Mode) */}
          {!isEditing && (
            <div className="space-y-2">
              {reservation.status === 'confirmed' && (
                <Button className="w-full" onClick={onCheckIn}>
                  <LogIn className="mr-1.5 h-4 w-4" /> Check In
                </Button>
              )}
              {reservation.status === 'checked_in' && (
                <Button className="w-full" onClick={onCheckOut}>
                  <LogOut className="mr-1.5 h-4 w-4" /> Check Out
                </Button>
              )}
              <Button variant="outline" className="w-full">
                <CreditCard className="mr-1.5 h-4 w-4" /> Post Payment
              </Button>
              <Button variant="outline" className="w-full">
                <MessageSquare className="mr-1.5 h-4 w-4" /> Add Note
              </Button>
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
              <Button className="flex-1" onClick={handleSave}>
                <Save className="mr-1.5 h-4 w-4" /> Save Changes
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                /* Wire to /app/reservations/:id */
              }}
            >
              <Eye className="mr-1.5 h-4 w-4" /> Open Full Details
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Quick Create Modal ─── */
function buildQuickCreateData(defaultRoomId, defaultDate, today) {
  const start = defaultDate || today;
  return {
    guest: '',
    email: '',
    phone: '',
    roomId: defaultRoomId || ROOMS[0].id,
    startDate: start,
    endDate: format(addDays(parseISO(start), 1), 'yyyy-MM-dd'),
    rate: 189,
    adults: '2',
    children: '0',
    status: 'confirmed',
  };
}

function QuickCreateModal({ isOpen, onClose, onCreate, defaultRoomId, defaultDate }) {
  const [today] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [data, setData] = useState(() => buildQuickCreateData(defaultRoomId, defaultDate, today));

  // Reset the form whenever the modal opens or its defaults change
  const [prevResetKey, setPrevResetKey] = useState(null);
  const resetKey = `${isOpen}|${defaultRoomId}|${defaultDate}`;
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    if (isOpen) {
      setData(buildQuickCreateData(defaultRoomId, defaultDate, today));
    }
  }

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      ...data,
      id: `r${Date.now()}`,
      rate: Number(data.rate),
      adults: Number(data.adults),
      children: Number(data.children),
      balance: 0,
    });
    onClose();
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Guest Name"
              placeholder="John Doe"
              required
              value={data.guest}
              onChange={(e) => setData({ ...data, guest: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              placeholder="john@email.com"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Room</label>
              <select
                value={data.roomId}
                onChange={(e) => setData({ ...data, roomId: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
              >
                {ROOMS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} — {r.type}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Rate ($)"
              type="number"
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
              <label className="text-sm font-medium text-text-primary">Status</label>
              <select
                value={data.status}
                onChange={(e) => setData({ ...data, status: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
              >
                {Object.entries(STATUS_META).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="mr-1.5 h-4 w-4" /> Create Reservation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Context Menu ─── */
function ContextMenu({ menu, onClose, onQuickCreate, onEdit, onDelete }) {
  if (!menu.visible) return null;
  return (
    <div
      className="fixed z-50 w-48 rounded-lg border border-border bg-surface shadow-lg py-1"
      style={{ top: menu.y, left: menu.x }}
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
          <button
            onClick={() => onClose()}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-elevated"
          >
            <BedDouble className="h-4 w-4 text-warning" /> Block Room
          </button>
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
              onDelete(menu.reservation);
              onClose();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5"
          >
            <Trash2 className="h-4 w-4" /> Cancel Reservation
          </button>
        </>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════
   BATCH 4 — NEW FEATURES
   ═════════════════════════════════════════ */

/* ─── Filter Bar ─── */
function FilterBar({ filters, onChange, roomTypes, floors, activeCount, totalCount }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-background/50">
      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <Filter className="h-3.5 w-3.5" />
        <span className="font-medium">Filters</span>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Floor Filter */}
      <div className="flex items-center gap-1.5">
        <Layers className="h-3.5 w-3.5 text-text-muted" />
        <select
          value={filters.floor}
          onChange={(e) => onChange({ ...filters, floor: e.target.value })}
          className="h-7 rounded-md border border-border bg-surface px-2 text-xs text-text-primary"
        >
          <option value="all">All Floors</option>
          {floors.map((f) => (
            <option key={f} value={f}>
              Floor {f}
            </option>
          ))}
        </select>
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-1.5">
        <BedDouble className="h-3.5 w-3.5 text-text-muted" />
        <select
          value={filters.type}
          onChange={(e) => onChange({ ...filters, type: e.target.value })}
          className="h-7 rounded-md border border-border bg-surface px-2 text-xs text-text-primary"
        >
          <option value="all">All Types</option>
          {roomTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
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

      <div className="ml-auto text-xs text-text-muted">
        Showing <span className="font-medium text-text-primary">{activeCount}</span> of {totalCount}{' '}
        rooms
      </div>
    </div>
  );
}

/* ─── Bulk Action Bar ─── */
function BulkActionBar({ selectedIds, reservations, onClear, onDelete, onChangeStatus }) {
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
            onClick={() => onChangeStatus('checked_in')}
            className="flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary hover:bg-secondary/20"
          >
            <LogIn className="h-3.5 w-3.5" /> Check In
          </button>
        )}

        {hasCheckedIn && (
          <button
            onClick={() => onChangeStatus('checked_out')}
            className="flex items-center gap-1.5 rounded-full bg-neutral/10 px-3 py-1 text-xs font-medium text-text-muted hover:bg-neutral/20"
          >
            <LogOut className="h-3.5 w-3.5" /> Check Out
          </button>
        )}

        <button
          onClick={() => onChangeStatus('cancelled')}
          className="flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-medium text-danger hover:bg-danger/20"
        >
          <XCircle className="h-3.5 w-3.5" /> Cancel
        </button>

        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-medium text-danger hover:bg-danger/20"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
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
   MAIN TAPE CHART COMPONENT
   ═════════════════════════════════════════ */

export default function TapeChart({ rooms: propRooms, reservations: propReservations }) {
  const gridRef = useRef(null);

  const rooms = propRooms != null ? propRooms : ROOMS;

  /* ── Batch 1: Core State ── */
  const [viewMode, setViewMode] = useState('7');
  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const [reservations, setReservations] = useState(() =>
    propReservations != null ? propReservations : generateMockReservations()
  );

  // Adopt externally supplied reservations when they change
  const [prevPropReservations, setPrevPropReservations] = useState(propReservations);
  if (propReservations !== prevPropReservations) {
    setPrevPropReservations(propReservations);
    if (propReservations != null) {
      setReservations(propReservations);
    }
  }

  /* ── Batch 2: Context Menu State ── */
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    type: null,
    reservation: null,
    roomId: null,
    date: null,
  });

  /* ── Batch 3: Drawer & Quick-Create State ── */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateDefaults, setQuickCreateDefaults] = useState({ roomId: null, date: null });

  /* ── Batch 4: Filter State ── */
  const [filters, setFilters] = useState({ floor: 'all', type: 'all', status: 'all' });

  /* ── Batch 4: Multi-Select State ── */
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastSelectedId, setLastSelectedId] = useState(null);

  /* ── Batch 4: Resize State ── */
  const [resizeState, setResizeState] = useState(null);

  /* ── Batch 4: Drag State ── */
  const [dragState, setDragState] = useState(null);

  const days = VIEW_MODES.find((v) => v.id === viewMode)?.days || 7;
  const dates = useMemo(() => getDatesForRange(startDate, days), [startDate, days]);

  /* ── Derived: Filtered Rooms ── */
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (filters.floor !== 'all' && String(room.floor) !== filters.floor) return false;
      if (filters.type !== 'all' && room.type !== filters.type) return false;
      return true;
    });
  }, [filters.floor, filters.type, rooms]);

  /* ── Derived: Filtered Reservations for Display ── */
  const visibleReservations = useMemo(() => {
    if (filters.status === 'all') return reservations;
    return reservations.filter((r) => r.status === filters.status);
  }, [reservations, filters.status]);

  const roomTypes = useMemo(() => [...new Set(rooms.map((r) => r.type))], [rooms]);
  const floors = useMemo(
    () => [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b),
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
      if (resizeState) {
        setResizeState(null);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [resizeState]);

  /* ── Resize cursor while dragging ── */
  useEffect(() => {
    if (!resizeState) return;
    document.body.style.cursor = resizeState.edge === 'left' ? 'w-resize' : 'e-resize';
    document.body.style.userSelect = 'none';
  }, [resizeState]);

  /* ── Global mouse move for resize ── */
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizeState) return;
      const {
        reservation,
        edge,
        startX,
        cellWidth,
        startDate: origStart,
        endDate: origEnd,
      } = resizeState;

      const deltaPixels = e.clientX - startX;
      const deltaDays = Math.round(deltaPixels / cellWidth);

      if (deltaDays === 0) return;

      let newStart = origStart;
      let newEnd = origEnd;

      if (edge === 'left') {
        newStart = format(addDays(parseISO(origStart), deltaDays), 'yyyy-MM-dd');
        // Prevent start from passing end
        if (differenceInDays(parseISO(origEnd), parseISO(newStart)) < 1) {
          newStart = format(subDays(parseISO(origEnd), 1), 'yyyy-MM-dd');
        }
      } else {
        newEnd = format(addDays(parseISO(origEnd), deltaDays), 'yyyy-MM-dd');
        // Prevent end from passing start
        if (differenceInDays(parseISO(newEnd), parseISO(origStart)) < 1) {
          newEnd = format(addDays(parseISO(origStart), 1), 'yyyy-MM-dd');
        }
      }

      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservation.id ? { ...r, startDate: newStart, endDate: newEnd } : r
        )
      );
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [resizeState]);

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

  /* ── Batch 2: Right-Click Handler ── */
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

  /* ── Batch 3: Open Drawer ── */
  const handleReservationClick = (reservation, e) => {
    if (e) {
      // If shift-clicking, handle multi-select instead
      if (e.shiftKey) {
        e.stopPropagation();
        handleShiftSelect(reservation.id);
        return;
      }
      e.stopPropagation();
    }
    setSelectedReservation(reservation);
    setDrawerOpen(true);
    setSelectedIds([]); // Clear multi-select on single click
  };

  /* ── Batch 4: Multi-Select ── */
  const handleShiftSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((sid) => sid !== id);
      }
      return [...prev, id];
    });
    setLastSelectedId(id);
  };

  const handleRangeSelect = (id) => {
    if (!lastSelectedId) {
      handleShiftSelect(id);
      return;
    }
    // Find all visible reservation IDs in order
    const allIds = visibleReservations.map((r) => r.id);
    const startIdx = allIds.indexOf(lastSelectedId);
    const endIdx = allIds.indexOf(id);
    if (startIdx === -1 || endIdx === -1) {
      handleShiftSelect(id);
      return;
    }
    const [min, max] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
    const rangeIds = allIds.slice(min, max + 1);
    setSelectedIds((prev) => {
      const newSet = new Set([...prev, ...rangeIds]);
      return Array.from(newSet);
    });
    setLastSelectedId(id);
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setLastSelectedId(null);
  };

  const handleBulkDelete = () => {
    setReservations((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
    clearSelection();
  };

  const handleBulkChangeStatus = (status) => {
    setReservations((prev) => prev.map((r) => (selectedIds.includes(r.id) ? { ...r, status } : r)));
    clearSelection();
  };

  /* ── Batch 4: Resize Handlers ── */
  const handleResizeStart = (e, reservation, edge) => {
    e.stopPropagation();
    e.preventDefault();

    // Calculate cell width from the grid
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
    });
  };

  /* ── Batch 4: Drag-to-Move Handlers ── */
  const handleDragStart = (e, reservation) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        reservationId: reservation.id,
        startDate: reservation.startDate,
        endDate: reservation.endDate,
      })
    );
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
    const { reservationId, startDate: origStart, endDate: origEnd } = JSON.parse(data);

    const nights = differenceInDays(parseISO(origEnd), parseISO(origStart));
    const newStart = format(targetDate, 'yyyy-MM-dd');
    const newEnd = format(addDays(targetDate, nights), 'yyyy-MM-dd');

    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId
          ? { ...r, roomId: targetRoomId, startDate: newStart, endDate: newEnd }
          : r
      )
    );
    setDragState(null);
  };

  /* ── Batch 3: Save Inline Edit ── */
  const handleSaveReservation = (updated) => {
    setReservations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelectedReservation(updated);
  };

  /* ── Batch 3: Quick Create ── */
  const handleQuickCreate = (roomId, date) => {
    setQuickCreateDefaults({ roomId, date });
    setQuickCreateOpen(true);
  };

  const handleCreateReservation = (newRes) => {
    setReservations((prev) => [...prev, newRes]);
  };

  /* ── Batch 3: Delete ── */
  const handleDeleteReservation = (res) => {
    setReservations((prev) => prev.filter((r) => r.id !== res.id));
    if (selectedReservation?.id === res.id) {
      setDrawerOpen(false);
      setSelectedReservation(null);
    }
  };

  /* ── Batch 3: Check-in / Check-out ── */
  const handleCheckIn = () => {
    if (!selectedReservation) return;
    const updated = { ...selectedReservation, status: 'checked_in' };
    handleSaveReservation(updated);
  };
  const handleCheckOut = () => {
    if (!selectedReservation) return;
    const updated = { ...selectedReservation, status: 'checked_out' };
    handleSaveReservation(updated);
  };

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
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center gap-3">
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={cn('h-2.5 w-2.5 rounded-sm', meta.color)} />
              <span className="text-xs text-text-secondary">{meta.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Batch 4: Filter Bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        roomTypes={roomTypes}
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
            style={{ gridTemplateColumns: `80px repeat(${days}, minmax(100px, 1fr))` }}
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
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="grid border-b border-border hover:bg-surface/50 transition-colors"
              style={{ gridTemplateColumns: `80px repeat(${days}, minmax(100px, 1fr))` }}
            >
              {/* Room Label */}
              <div className="border-r border-border bg-surface px-3 py-3 flex flex-col justify-center">
                <span className="text-sm font-bold text-text-primary">{room.id}</span>
                <span className="text-[10px] text-text-muted">{room.type}</span>
              </div>

              {/* Cells */}
              {dates.map((date, idx) => {
                const reservation = getReservationForRoomAndDate(room.id, date);
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
                      !reservation && 'hover:bg-surface-elevated/50',
                      isDragging && 'bg-secondary/10'
                    )}
                  >
                    {reservation && isStart && (
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, reservation)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => handleReservationClick(reservation, e)}
                        onContextMenu={(e) => {
                          e.stopPropagation();
                          handleCellContextMenu(e, room.id, date);
                        }}
                        className={cn(
                          'absolute inset-y-1 left-1 rounded-md border px-2 py-1 text-left shadow-sm transition-all hover:shadow-md hover:brightness-95 z-10 group cursor-pointer',
                          STATUS_META[reservation.status]?.bgSoft,
                          STATUS_META[reservation.status]?.border,
                          isSelected && 'ring-2 ring-secondary ring-offset-1'
                        )}
                        style={{
                          width: `calc(${getNights(reservation.startDate, reservation.endDate) * 100}% + ${(getNights(reservation.startDate, reservation.endDate) - 1) * 1}px)`,
                        }}
                      >
                        {/* Drag Handle */}
                        <div className="absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center opacity-0 group-hover:opacity-50 cursor-move">
                          <GripVertical className="h-3 w-3 text-text-muted" />
                        </div>

                        {/* Left Resize Handle */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-3 cursor-w-resize opacity-0 group-hover:opacity-100 hover:bg-secondary/20 rounded-l-md"
                          onMouseDown={(e) => handleResizeStart(e, reservation, 'left')}
                          title="Drag to change arrival"
                        />

                        {/* Right Resize Handle */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-3 cursor-e-resize opacity-0 group-hover:opacity-100 hover:bg-secondary/20 rounded-r-md"
                          onMouseDown={(e) => handleResizeStart(e, reservation, 'right')}
                          title="Drag to change departure"
                        />

                        <div className="flex items-center gap-1.5 overflow-hidden pl-3">
                          <div
                            className={cn(
                              'h-2 w-2 rounded-full shrink-0',
                              STATUS_META[reservation.status]?.color
                            )}
                          />
                          <span className="truncate text-xs font-medium text-text-primary">
                            {reservation.guest}
                          </span>
                        </div>
                        <div className="text-[10px] text-text-muted truncate pl-3">
                          ${reservation.rate}
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
          ))}
        </div>
      </div>

      {/* Batch 2: Context Menu */}
      <ContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu((m) => ({ ...m, visible: false }))}
        onQuickCreate={handleQuickCreate}
        onEdit={handleReservationClick}
        onDelete={handleDeleteReservation}
      />

      {/* Batch 3: Detail Drawer */}
      <ReservationDrawer
        reservation={selectedReservation}
        room={selectedReservation ? rooms.find((r) => r.id === selectedReservation.roomId) : null}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSaveReservation}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
      />

      {/* Batch 3: Quick Create Modal */}
      <QuickCreateModal
        isOpen={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onCreate={handleCreateReservation}
        defaultRoomId={quickCreateDefaults.roomId}
        defaultDate={quickCreateDefaults.date}
      />

      {/* Batch 4: Bulk Action Bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        reservations={reservations}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        onChangeStatus={handleBulkChangeStatus}
      />
    </div>
  );
}
