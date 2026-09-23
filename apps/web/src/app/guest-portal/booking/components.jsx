/* src/app/guest-portal/booking/components.jsx */
import { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Bed,
  Users,
  CreditCard,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Star,
  Wifi,
  Car,
  Utensils,
  Dumbbell,
  Waves,
  Sparkles,
  Phone,
  Mail,
  ArrowRight,
  ArrowLeft,
  Printer,
  Share2,
  Download,
  Receipt,
  Edit3,
  RotateCcw,
  QrCode,
  ClipboardList,
  Tag,
  ShieldCheck,
  Loader2,
  Minus,
  Plus,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  formatCurrency,
  formatDate,
  formatDateRange,
  stayStatusMeta,
  getStayPhase,
  getCancellationPolicy,
} from '../data';

/* ─── Booking List Item ─── */
export function BookingListItem({ stay, onClick, onAction }) {
  const phase = getStayPhase(stay);
  const statusMeta = stayStatusMeta[stay.status] || stayStatusMeta.confirmed;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden transition-all hover:shadow-md">
      <div className="p-4 cursor-pointer" onClick={() => onClick?.(stay)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-semibold text-text-primary">{stay.property.name}</h3>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                  statusMeta.bg,
                  statusMeta.color,
                  statusMeta.border
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', statusMeta.dot)} />
                {statusMeta.label}
              </span>
            </div>
            <p className="text-xs text-text-muted flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {stay.property.address.city}, {stay.property.address.state}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-text-muted" />
                {formatDateRange(stay.dates.arrival, stay.dates.departure)}
              </span>
              <span className="flex items-center gap-1">
                <Bed className="h-3 w-3 text-text-muted" />
                {stay.room.type}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-text-primary">
              {formatCurrency(stay.rate.total + stay.rate.taxes + stay.rate.fees)}
            </p>
            <p className="text-[10px] text-text-muted">{stay.dates.nights} nights</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="border-t border-border px-4 py-2 flex items-center gap-2">
        {phase === 'pre-arrival' && stay.status === 'confirmed' && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.('checkin', stay);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary hover:bg-secondary/20 transition-colors"
            >
              <CheckCircle2 className="h-3 w-3" />
              Check In
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.('modify', stay);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-background px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
            >
              <Edit3 className="h-3 w-3" />
              Modify
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.('cancel', stay);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-background px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger/5 transition-colors"
            >
              <XCircle className="h-3 w-3" />
              Cancel
            </button>
          </>
        )}
        {phase === 'in-stay' && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.('key', stay);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary hover:bg-secondary/20 transition-colors"
            >
              <QrCode className="h-3 w-3" />
              Key
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.('roomservice', stay);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-background px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
            >
              <Utensils className="h-3 w-3" />
              Room Service
            </button>
          </>
        )}
        {phase === 'post-stay' && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.('review', stay);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary hover:bg-secondary/20 transition-colors"
            >
              <Star className="h-3 w-3" />
              Review
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.('receipt', stay);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-background px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
            >
              <Receipt className="h-3 w-3" />
              Receipt
            </button>
          </>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="ml-auto inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Details
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border bg-background px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-text-muted">Confirmation</p>
              <p className="text-text-primary font-medium font-mono">{stay.confirmationNumber}</p>
            </div>
            <div>
              <p className="text-text-muted">Room</p>
              <p className="text-text-primary font-medium">
                {stay.room.number || 'TBD at check-in'}
              </p>
            </div>
            <div>
              <p className="text-text-muted">Check-in</p>
              <p className="text-text-primary font-medium">
                {formatDate(stay.dates.arrival)} at {stay.dates.arrivalTime}
              </p>
            </div>
            <div>
              <p className="text-text-muted">Check-out</p>
              <p className="text-text-primary font-medium">
                {formatDate(stay.dates.departure)} at {stay.dates.departureTime}
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-2">
            <p className="text-xs text-text-muted mb-1.5">Rate Breakdown</p>
            <div className="space-y-1">
              {stay.rate.breakdown.map((day) => (
                <div key={day.date} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{formatDate(day.date)}</span>
                  <span className="text-text-primary font-medium">{formatCurrency(day.rate)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                <span className="text-text-muted">Total</span>
                <span className="text-text-primary font-bold">
                  {formatCurrency(stay.rate.total + stay.rate.taxes + stay.rate.fees)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.('receipt', stay);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-background px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
            >
              <Printer className="h-3 w-3" />
              Print
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.('receipt', stay);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-background px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.('receipt', stay);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-background px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
            >
              <Share2 className="h-3 w-3" />
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Cancellation Policy Card ─── */
export function CancellationPolicyCard({ stay, showFee = true }) {
  const policy = getCancellationPolicy(stay);

  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        policy.type === 'free'
          ? 'border-accent/20 bg-accent/5'
          : policy.type === 'partial'
            ? 'border-warning/20 bg-warning/5'
            : 'border-danger/20 bg-danger/5'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {policy.type === 'free' ? (
          <CheckCircle2 className="h-5 w-5 text-accent" />
        ) : policy.type === 'partial' ? (
          <AlertTriangle className="h-5 w-5 text-warning" />
        ) : (
          <XCircle className="h-5 w-5 text-danger" />
        )}
        <h3 className="text-sm font-semibold text-text-primary">Cancellation Policy</h3>
      </div>
      <p
        className={cn(
          'text-sm font-medium mb-1',
          policy.type === 'free'
            ? 'text-accent'
            : policy.type === 'partial'
              ? 'text-warning'
              : 'text-danger'
        )}
      >
        {policy.label}
      </p>
      <p className="text-xs text-text-secondary">{policy.description}</p>
      {showFee && policy.fee > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Cancellation fee</span>
            <span className="font-bold text-danger">{formatCurrency(policy.fee)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Room Type Selector ─── */
export function RoomTypeSelector({ options, selected, onSelect }) {
  return (
    <div className="space-y-2">
      {options.map((room) => (
        <button
          key={room.id}
          onClick={() => onSelect?.(room.id)}
          className={cn(
            'w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
            selected === room.id
              ? 'border-secondary bg-secondary/5'
              : 'border-border bg-surface hover:bg-surface-elevated'
          )}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
            <Bed className="h-6 w-6 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-sm font-medium',
                selected === room.id ? 'text-secondary' : 'text-text-primary'
              )}
            >
              {room.name}
            </p>
            <p className="text-xs text-text-muted">{room.sqft} sq ft</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-text-primary">{formatCurrency(room.price)}</p>
            <p className="text-[10px] text-text-muted">per night</p>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ─── Date Range Picker ─── */
export function DateRangePicker({
  arrival,
  departure,
  onArrivalChange,
  onDepartureChange,
  minDate,
}) {
  const nights = Math.max(
    1,
    Math.ceil((new Date(departure) - new Date(arrival)) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1 block">
            Check-in
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="date"
              value={arrival}
              onChange={(e) => onArrivalChange?.(e.target.value)}
              min={minDate || new Date().toISOString().split('T')[0]}
              className="h-10 w-full rounded-md border border-border bg-background pl-10 pr-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1 block">
            Check-out
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="date"
              value={departure}
              onChange={(e) => onDepartureChange?.(e.target.value)}
              min={arrival}
              className="h-10 w-full rounded-md border border-border bg-background pl-10 pr-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {nights} night{nights !== 1 ? 's' : ''}
        </span>
        <span>
          {formatDate(arrival)} – {formatDate(departure)}
        </span>
      </div>
    </div>
  );
}

/* ─── Guest Counter ─── */
export function GuestCounter({ value, onChange, min = 1, max = 4, label }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-muted">Max {max}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange?.(Math.max(min, value - 1))}
          disabled={value <= min}
          className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-surface-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Minus className="h-4 w-4 text-text-secondary" />
        </button>
        <span className="text-sm font-medium text-text-primary w-6 text-center">{value}</span>
        <button
          onClick={() => onChange?.(Math.min(max, value + 1))}
          disabled={value >= max}
          className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-surface-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 text-text-secondary" />
        </button>
      </div>
    </div>
  );
}

/* ─── Price Summary ─── */
export function PriceSummary({ breakdown, total, taxes, fees, currency = 'USD' }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Price Summary</h3>
      {breakdown.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">{item.label}</span>
          <span className="text-text-primary">{formatCurrency(item.amount, currency)}</span>
        </div>
      ))}
      <div className="border-t border-border pt-2 mt-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Subtotal</span>
          <span className="text-text-primary font-medium">{formatCurrency(total, currency)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Taxes & Fees</span>
          <span className="text-text-primary">{formatCurrency(taxes + fees, currency)}</span>
        </div>
      </div>
      <div className="border-t border-border pt-2 flex items-center justify-between text-base font-bold">
        <span className="text-text-primary">Total</span>
        <span className="text-text-primary">{formatCurrency(total + taxes + fees, currency)}</span>
      </div>
    </div>
  );
}

/* ─── Confirmation Banner ─── */
export function ConfirmationBanner({ confirmationNumber, status, message }) {
  const statusMeta = stayStatusMeta[status] || stayStatusMeta.confirmed;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex items-center gap-3',
        statusMeta.bg,
        statusMeta.border
      )}
    >
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-full bg-white/20')}>
        <CheckCircle2 className={cn('h-5 w-5', statusMeta.color)} />
      </div>
      <div>
        <p className={cn('text-sm font-semibold', statusMeta.color)}>
          {message || 'Booking Confirmed'}
        </p>
        <p className="text-xs text-text-secondary">
          Confirmation: <span className="font-mono font-medium">{confirmationNumber}</span>
        </p>
      </div>
    </div>
  );
}

/* ─── Booking Filter Bar ─── */
export function BookingFilterBar({ filters, activeFilter, onFilterChange }) {
  return (
    <div className="flex items-center gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange?.(filter.id)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            activeFilter === filter.id
              ? 'bg-secondary text-white'
              : 'border border-border bg-surface text-text-secondary hover:bg-surface-elevated'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Stay Timeline ─── */
export function StayTimeline({ stay }) {
  const events = [
    { label: 'Booked', date: '2026-08-01', icon: CheckCircle2, color: 'text-accent' },
    { label: 'Pre-check-in', date: stay.dates.arrival, icon: Calendar, color: 'text-secondary' },
    { label: 'Check-in', date: stay.dates.arrival, icon: CheckCircle2, color: 'text-accent' },
    { label: 'Check-out', date: stay.dates.departure, icon: Calendar, color: 'text-text-muted' },
  ];

  const phase = getStayPhase(stay);
  const completedIndex = phase === 'pre-arrival' ? 0 : phase === 'in-stay' ? 2 : 3;

  return (
    <div className="space-y-0">
      {events.map((event, idx) => (
        <div key={idx} className="relative flex gap-4 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2',
                idx <= completedIndex ? 'border-accent bg-accent/10' : 'border-border bg-background'
              )}
            >
              <event.icon
                className={cn('h-4 w-4', idx <= completedIndex ? 'text-accent' : 'text-text-muted')}
              />
            </div>
            {idx < events.length - 1 && (
              <div
                className={cn('mt-1 h-full w-px', idx < completedIndex ? 'bg-accent' : 'bg-border')}
              />
            )}
          </div>
          <div className="pt-1">
            <p
              className={cn(
                'text-sm font-medium',
                idx <= completedIndex ? 'text-text-primary' : 'text-text-muted'
              )}
            >
              {event.label}
            </p>
            <p className="text-xs text-text-muted">{formatDate(event.date)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
