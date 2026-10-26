/* apps/web/src/app/app/dashboard/components.jsx */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  BedDouble,
  Bell,
  CalendarCheck,
  CheckCircle2,
  DollarSign,
  Info,
  LogIn,
  Minus,
  MoonStar,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn, formatCurrency } from '../../../lib/utils';
import { activityTarget, LINKS, reservationUrl } from './dashLinks';

// ─── KPI Card ─────────────────────────────────────────────────────────────────

// D1.1 — `to` makes the whole card navigate; D3 — `delta` shows trend vs yesterday.
export function KpiCard({ label, value, sub, icon: Icon, iconClass, loading, to, delta }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-20 rounded bg-surface-elevated" />
          <div className="h-7 w-24 rounded bg-surface-elevated" />
          <div className="h-3 w-16 rounded bg-surface-elevated" />
        </div>
      </div>
    );
  }
  const DeltaIcon =
    delta?.trend === 'up' ? TrendingUp : delta?.trend === 'down' ? TrendingDown : Minus;
  const card = (
    <div className="rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
          <p className="mt-1.5 truncate text-2xl font-bold text-text-primary">{value}</p>
          {delta && (
            <p
              className={cn(
                'mt-1 flex items-center gap-1 text-xs font-medium',
                delta.trend === 'flat'
                  ? 'text-text-muted'
                  : delta.good
                    ? 'text-accent'
                    : 'text-danger'
              )}
            >
              <DeltaIcon className="h-3 w-3" />
              {delta.text}
            </p>
          )}
          {sub && <p className="mt-1 truncate text-xs text-text-secondary">{sub}</p>}
        </div>
        {Icon && (
          <div className="rounded-lg bg-surface-elevated p-2.5">
            <Icon className={cn('h-5 w-5', iconClass ?? 'text-secondary')} />
          </div>
        )}
      </div>
    </div>
  );
  if (!to) return card;
  return (
    <Link
      to={to}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
    >
      {card}
    </Link>
  );
}

// ─── Revenue chart ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-lg">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm font-semibold text-text-primary">
        {formatCurrency(payload[0].value, currency)}
      </p>
    </div>
  );
}

export function RevenueChart({ data, currency, loading }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Revenue — Last 14 Days</h3>
          <p className="text-xs text-text-muted">Folio charges posted per day</p>
        </div>
        <TrendingUp className="h-4 w-4 text-accent" />
      </div>
      <div className="h-56">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-full w-full animate-pulse rounded-lg bg-surface-elevated" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => d.slice(5)}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) =>
                  formatCurrency(v, currency, { maximumFractionDigits: 0, notation: 'compact' })
                }
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--accent)"
                strokeWidth={2}
                fill="url(#revGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ─── Alerts panel ─────────────────────────────────────────────────────────────

const severityMeta = {
  critical: { icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10', dot: 'bg-danger' },
  warning: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10', dot: 'bg-warning' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10', dot: 'bg-info' },
  success: { icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent/10', dot: 'bg-accent' },
};

// Dismissal persistence is owned by page.jsx (per business date, localStorage);
// this panel keeps its original props contract.
export function AlertsPanel({ alerts, loading, onDismiss, onDismissAll }) {
  const [open, setOpen] = useState(true);
  const active = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">Alerts</h3>
          {active.length > 0 && (
            <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
              {active.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {active.length > 0 && (
            <button
              onClick={onDismissAll}
              className="rounded-md px-2 py-1 text-xs text-text-muted hover:bg-surface-elevated hover:text-text-primary"
            >
              Dismiss all
            </button>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="rounded-md p-1 text-text-muted hover:bg-surface-elevated hover:text-text-primary"
            aria-label={open ? 'Collapse alerts' : 'Expand alerts'}
          >
            {open ? <X className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="max-h-80 flex-1 overflow-auto">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-elevated" />
              ))}
            </div>
          ) : active.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-accent" />
              <p className="text-sm text-text-muted">All clear — no active alerts</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {active.map((alert) => {
                const meta = severityMeta[alert.severity] ?? severityMeta.info;
                const Icon = meta.icon;
                return (
                  <div key={alert.id} className={cn('relative px-4 py-3', meta.bg)}>
                    <div className="flex items-start gap-3">
                      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', meta.color)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                          <p className="text-sm font-medium text-text-primary">{alert.title}</p>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                          {alert.message}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3">
                          <span className="text-[10px] text-text-muted">
                            {formatDistanceToNow(parseISO(alert.timestamp), { addSuffix: true })}
                          </span>
                          {alert.actionUrl && (
                            <Link
                              to={alert.actionUrl}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-secondary hover:underline"
                            >
                              Resolve <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => onDismiss(alert.id)}
                        className="shrink-0 rounded-md p-1 text-text-muted hover:bg-background hover:text-text-primary"
                        aria-label="Dismiss alert"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Arrivals / Departures ────────────────────────────────────────────────────

// D1.1 — the whole row is a door into the reservation.
function GuestMovementRow({ item, type, currency }) {
  return (
    <Link
      to={reservationUrl(item.id)}
      className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 transition-colors hover:border-secondary/40"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">{item.guestName}</p>
        <p className="text-xs text-text-secondary">
          {item.confirmationNumber}
          {item.roomNumber ? ` · Room ${item.roomNumber}` : ' · No room assigned'}
          {item.roomType ? ` · ${item.roomType}` : ''}
        </p>
      </div>
      <div className="ml-3 shrink-0 text-right">
        {item.balance > 0 && (
          <p className="text-xs font-medium text-warning">
            {formatCurrency(item.balance, currency)} due
          </p>
        )}
        <p
          className={cn(
            'text-[11px] font-medium',
            item.status === 'checked_in' || item.status === 'checked_out'
              ? 'text-accent'
              : 'text-text-muted'
          )}
        >
          {item.status.replace('_', ' ')}
        </p>
      </div>
    </Link>
  );
}

export function MovementsPanel({ title, icon: Icon, items, type, currency, loading, viewAllTo }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {!loading && (
            <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
              {items.length}
            </span>
          )}
        </div>
        <Link
          to={viewAllTo}
          className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
        >
          Open <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-elevated" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center">
          <Icon className="mx-auto mb-2 h-7 w-7 text-text-muted" />
          <p className="text-sm text-text-muted">None scheduled today</p>
        </div>
      ) : (
        <div className="max-h-72 space-y-2 overflow-auto pr-1">
          {items.map((item) => (
            <GuestMovementRow key={item.id} item={item} type={type} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Room board ───────────────────────────────────────────────────────────────

const roomStateStyles = {
  occupied: 'bg-secondary/15 border-secondary/40 text-secondary',
  dirty: 'bg-warning/15 border-warning/40 text-warning',
  out_of_order: 'bg-danger/15 border-danger/40 text-danger',
  ready: 'bg-accent/10 border-accent/30 text-accent',
};

export function roomState(room) {
  if (room.status === 'out_of_order' || room.status === 'maintenance') return 'out_of_order';
  if (room.currentReservation) return 'occupied';
  if (['dirty', 'cleaning', 'inspected'].includes(room.housekeepingStatus)) return 'dirty';
  return 'ready';
}

const roomFilters = [
  ['all', 'All'],
  ['occupied', 'Occupied'],
  ['dirty', 'Dirty'],
  ['ready', 'Ready'],
  ['out_of_order', 'Out of order'],
];

// D3 — floor-grouped, click-to-filter room board. Cells keep their D1 links.
export function RoomBoard({ rooms, loading }) {
  const [filter, setFilter] = useState('all');

  const counts = rooms.reduce(
    (acc, r) => {
      const s = roomState(r);
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    { occupied: 0, dirty: 0, ready: 0, out_of_order: 0 }
  );

  const floors = useMemo(() => {
    const sorted = [...rooms].sort(
      (a, b) =>
        String(a.floor ?? '').localeCompare(String(b.floor ?? ''), undefined, { numeric: true }) ||
        a.number.localeCompare(b.number, undefined, { numeric: true })
    );
    const map = new Map();
    for (const r of sorted) {
      const f = r.floor ? `Floor ${r.floor}` : 'Unassigned';
      if (!map.has(f)) map.set(f, []);
      map.get(f).push(r);
    }
    return [...map.entries()];
  }, [rooms]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="h-48 animate-pulse rounded-lg bg-surface-elevated" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BedDouble className="h-4 w-4 text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">Room Board</h3>
        </div>
        <Link
          to={LINKS.roomPlan}
          className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
        >
          Tape chart <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {roomFilters.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
              filter === key
                ? 'border-secondary/50 bg-secondary/10 text-secondary'
                : 'border-border text-text-secondary hover:bg-surface-elevated'
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full border',
                roomStateStyles[key] ?? 'border-border bg-surface-elevated'
              )}
            />
            {label}
            <span className="text-text-muted">
              ({key === 'all' ? rooms.length : (counts[key] ?? 0)})
            </span>
          </button>
        ))}
      </div>

      <div className="max-h-72 space-y-4 overflow-auto pr-1">
        {floors.map(([floor, floorRooms]) => {
          const visible = floorRooms.filter((r) => filter === 'all' || roomState(r) === filter);
          if (visible.length === 0) return null;
          return (
            <div key={floor}>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  {floor}
                </p>
                <p className="text-[10px] text-text-muted">
                  {visible.filter((r) => roomState(r) === 'occupied').length} occ ·{' '}
                  {visible.filter((r) => roomState(r) === 'dirty').length} dirty ·{' '}
                  {visible.filter((r) => roomState(r) === 'ready').length} ready
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                {visible.map((room) => {
                  const state = roomState(room);
                  const cellTo = room.currentReservation
                    ? reservationUrl(room.currentReservation.id)
                    : LINKS.housekeeping;
                  return (
                    <Link
                      key={room.id}
                      to={cellTo}
                      title={
                        room.currentGuest
                          ? `Room ${room.number} — ${room.currentGuest.firstName} ${room.currentGuest.lastName}`
                          : `Room ${room.number} — ${state.replace('_', ' ')}`
                      }
                      className={cn(
                        'flex h-11 items-center justify-center rounded-lg border text-xs font-semibold capitalize transition-opacity hover:opacity-75',
                        roomStateStyles[state]
                      )}
                    >
                      {room.number}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Activity feed ────────────────────────────────────────────────────────────

const entityIcons = {
  reservation: CalendarCheck,
  guest: Users,
  folio: DollarSign,
  room: BedDouble,
  housekeeping: BedDouble,
  night_audit: MoonStar,
};

// D1.1 — feed rows deep-link via dashLinks.activityTarget (entity + entityId
// from the API). Unmapped entities render non-clickable, never a dead link.
export function ActivityFeed({ items, loading }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">Recent Activity</h3>
        </div>
        <Link
          to={LINKS.auditTrail}
          className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-surface-elevated" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">No activity yet today</p>
      ) : (
        <div className="max-h-72 space-y-1 overflow-auto pr-1">
          {items.map((item) => {
            const Icon = entityIcons[item.entity] ?? Info;
            const to = activityTarget(item);
            let time;
            try {
              time = formatDistanceToNow(parseISO(item.time), { addSuffix: true });
            } catch {
              time = item.time;
            }
            const row = (
              <div className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-background">
                <div className="rounded-md bg-surface-elevated p-1.5">
                  <Icon className="h-3.5 w-3.5 text-text-secondary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text-primary">
                    <span className="font-medium capitalize">
                      {item.action.replace(/[._]/g, ' ')}
                    </span>
                    {' · '}
                    <span className="text-text-secondary">{item.entity.replace(/[._]/g, ' ')}</span>
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {item.user ? `${item.user} · ` : ''}
                    {time}
                  </p>
                </div>
              </div>
            );
            return to ? (
              <Link
                key={item.id}
                to={to}
                className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
              >
                {row}
              </Link>
            ) : (
              <div key={item.id}>{row}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Recent reservations ──────────────────────────────────────────────────────

const reservationStatusStyles = {
  confirmed: 'bg-info/10 text-info',
  checked_in: 'bg-accent/10 text-accent',
  checked_out: 'bg-muted text-text-secondary',
  cancelled: 'bg-danger/10 text-danger',
  no_show: 'bg-warning/10 text-warning',
};

// D1.1 — rows open the reservation detail.
export function RecentReservations({ reservations, currency, loading }) {
  const navigate = useNavigate();
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Latest Reservations</h3>
        <Link
          to={LINKS.reservations}
          className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-surface-elevated" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">No reservations yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-text-muted">
                <th className="pb-2 pr-4 font-medium">Guest</th>
                <th className="pb-2 pr-4 font-medium">Conf. #</th>
                <th className="pb-2 pr-4 font-medium">Stay</th>
                <th className="pb-2 pr-4 font-medium">Room</th>
                <th className="pb-2 pr-4 font-medium">Value</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reservations.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(reservationUrl(r.id))}
                  className="cursor-pointer hover:bg-background"
                >
                  <td className="py-2.5 pr-4 font-medium text-text-primary">{r.guestName}</td>
                  <td className="py-2.5 pr-4 text-text-secondary">{r.confirmationNumber}</td>
                  <td className="py-2.5 pr-4 text-text-secondary">
                    {r.arrivalDate.slice(5)} → {r.departureDate.slice(5)}
                  </td>
                  <td className="py-2.5 pr-4 text-text-secondary">{r.roomNumber ?? '—'}</td>
                  <td className="py-2.5 pr-4 text-text-secondary">
                    {formatCurrency(r.totalAmount, currency, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-2.5">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
                        reservationStatusStyles[r.status] ?? 'bg-muted text-text-secondary'
                      )}
                    >
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Quick actions FAB (mobile-only — D3 moved quick actions to the header) ──

const quickActions = [
  { label: 'New Reservation', icon: CalendarCheck, to: '/app/reservations/new' },
  { label: 'Walk-In Check-in', icon: LogIn, to: '/app/reservations/front-desk' },
  { label: 'Post Charge', icon: DollarSign, to: '/app/billing' },
  { label: 'Night Audit', icon: MoonStar, to: '/app/night-audit' },
];

export function QuickActionsFab() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 md:hidden">
      {open && (
        <div className="mb-2 flex flex-col items-end gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary shadow-lg transition-colors hover:bg-surface-elevated"
            >
              <action.icon className="h-4 w-4 text-secondary" />
              {action.label}
            </Link>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close quick actions' : 'Open quick actions'}
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-200 hover:scale-105',
          open ? 'rotate-45 bg-danger' : 'bg-secondary'
        )}
      >
        <Plus className="h-6 w-6 text-white" />
      </button>
    </div>
  );
}

// ─── Header bits ──────────────────────────────────────────────────────────────

export function NightAuditChip({ nightAudit, businessDate }) {
  const done = nightAudit?.status === 'completed';
  return (
    <Link
      to="/app/night-audit"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        done
          ? 'border-accent/30 bg-accent/10 text-accent hover:bg-accent/20'
          : 'border-warning/30 bg-warning/10 text-warning hover:bg-warning/20'
      )}
    >
      <MoonStar className="h-3.5 w-3.5" />
      {done ? `Night audit closed · ${businessDate}` : `Night audit pending · ${businessDate}`}
    </Link>
  );
}
