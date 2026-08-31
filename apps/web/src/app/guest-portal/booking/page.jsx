/* src/app/guest-portal/booking/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Bed, Users, CreditCard, ChevronRight,
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Info, Printer,
  Download, Share2, Edit3, RotateCcw, FileText, Receipt, Hotel,
  Star, Wifi, Car, Utensils, Dumbbell, Waves, Sparkles, Phone,
  Mail, Navigation, QrCode, ClipboardList, Tag, ShieldCheck
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { guestStays, formatCurrency, formatDate, formatDateRange, getStayPhase, stayStatusMeta, getCancellationPolicy } from '../data';
import { GuestBookingCard, SectionHeader, InfoRow, EmptyState } from '../components';

export default function GuestBookingPage() {
  const navigate = useNavigate();
  const [selectedStay, setSelectedStay] = useState(null);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled

  const filteredStays = useMemo(() => {
    let result = [...guestStays];
    if (filter === 'upcoming') {
      result = result.filter(s => ['confirmed', 'checked_in'].includes(s.status));
    } else if (filter === 'past') {
      result = result.filter(s => s.status === 'checked_out');
    } else if (filter === 'cancelled') {
      result = result.filter(s => s.status === 'cancelled');
    }
    return result.sort((a, b) => new Date(b.dates.arrival) - new Date(a.dates.arrival));
  }, [filter]);

  const handleAction = (action, stay) => {
    switch (action) {
      case 'checkin':
        navigate(`/guest-portal/check-in?stay=${stay.id}`);
        break;
      case 'modify':
        navigate(`/guest-portal/booking/modify?stay=${stay.id}`);
        break;
      case 'cancel':
        navigate(`/guest-portal/booking/cancel?stay=${stay.id}`);
        break;
      case 'key':
        navigate(`/guest-portal/keys`);
        break;
      case 'roomservice':
        navigate(`/guest-portal/stay/room-service`);
        break;
      case 'services':
        navigate(`/guest-portal/stay`);
        break;
      case 'review':
        navigate(`/guest-portal/reviews?stay=${stay.id}`);
        break;
      case 'rebook':
        navigate(`/booking?property=${stay.property.id}`);
        break;
      case 'receipt':
        navigate(`/guest-portal/billing/invoice?stay=${stay.id}`);
        break;
      default:
        break;
    }
  };

  if (selectedStay) {
    return <BookingDetail stay={selectedStay} onBack={() => setSelectedStay(null)} onAction={handleAction} />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="My Reservations"
        subtitle="Manage your bookings and upcoming stays"
      />

      {/* Filters */}
      <div className="flex items-center gap-2">
        {[
          { id: 'all', label: 'All' },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'past', label: 'Past' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f.id
                ? 'bg-secondary text-white'
                : 'border border-border bg-surface text-text-secondary hover:bg-surface-elevated'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Stays List */}
      {filteredStays.length > 0 ? (
        <div className="space-y-4">
          {filteredStays.map((stay) => (
            <div
              key={stay.id}
              onClick={() => setSelectedStay(stay)}
              className="cursor-pointer"
            >
              <GuestBookingCard stay={stay} onAction={handleAction} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No reservations found"
          description={`You don't have any ${filter !== 'all' ? filter : ''} reservations at the moment.`}
          action={
            <Button size="sm" onClick={() => navigate('/booking')}>
              Book a Room
            </Button>
          }
        />
      )}
    </div>
  );
}

/* ─── Booking Detail View ─── */
function BookingDetail({ stay, onBack, onAction }) {
  const phase = getStayPhase(stay);
  const statusMeta = stayStatusMeta[stay.status] || stayStatusMeta.confirmed;
  const policy = getCancellationPolicy(stay);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Reservation Details</h1>
          <p className="text-xs text-text-muted">Confirmation: {stay.confirmationNumber}</p>
        </div>
      </div>

      {/* Status Banner */}
      <div className={cn(
        'rounded-xl border p-4 flex items-center gap-3',
        statusMeta.bg, statusMeta.border
      )}>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-full bg-white/20')}>
          {stay.status === 'confirmed' ? <CheckCircle2 className={cn('h-5 w-5', statusMeta.color)} /> :
           stay.status === 'checked_in' ? <Hotel className={cn('h-5 w-5', statusMeta.color)} /> :
           stay.status === 'checked_out' ? <CheckCircle2 className={cn('h-5 w-5', statusMeta.color)} /> :
           <XCircle className={cn('h-5 w-5', statusMeta.color)} />}
        </div>
        <div>
          <p className={cn('text-sm font-semibold', statusMeta.color)}>{statusMeta.label}</p>
          <p className="text-xs text-text-secondary">
            {phase === 'pre-arrival' && `Check-in available ${stay.dates.arrivalTime} on ${formatDate(stay.dates.arrival)}`}
            {phase === 'in-stay' && `Checked in since ${formatDate(stay.dates.arrival)}`}
            {phase === 'post-stay' && `Stay completed on ${formatDate(stay.dates.departure)}`}
          </p>
        </div>
      </div>

      {/* Property Card */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="h-48 bg-background relative">
          <img
            src={stay.property.images[0]}
            alt={stay.property.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-white font-semibold text-xl">{stay.property.name}</h2>
            <p className="text-white/80 text-xs flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {stay.property.address.street}, {stay.property.address.city}, {stay.property.address.state} {stay.property.address.zip}
            </p>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-text-muted" />
              <span className="text-text-secondary">{stay.property.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-text-muted" />
              <span className="text-text-secondary">{stay.property.email}</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {stay.property.amenities.map((amenity) => (
              <span key={amenity} className="inline-flex items-center gap-1 rounded-full bg-background border border-border px-2 py-0.5 text-[10px] text-text-secondary capitalize">
                {amenity === 'spa' && <Sparkles className="h-3 w-3" />}
                {amenity === 'gym' && <Dumbbell className="h-3 w-3" />}
                {amenity === 'pool' && <Waves className="h-3 w-3" />}
                {amenity === 'restaurant' && <Utensils className="h-3 w-3" />}
                {amenity === 'valet' && <Car className="h-3 w-3" />}
                {amenity === 'wifi' && <Wifi className="h-3 w-3" />}
                {amenity}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Room Details */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Room Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-muted">Room Type</p>
            <p className="text-sm font-medium text-text-primary">{stay.room.type}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Room Number</p>
            <p className="text-sm font-medium text-text-primary">{stay.room.number || 'TBD at check-in'}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Bed</p>
            <p className="text-sm font-medium text-text-primary">{stay.room.bedType} · {stay.room.bedCount} {stay.room.bedCount > 1 ? 'beds' : 'bed'}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">View</p>
            <p className="text-sm font-medium text-text-primary capitalize">{stay.room.view}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Floor</p>
            <p className="text-sm font-medium text-text-primary">{stay.room.floor}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Size</p>
            <p className="text-sm font-medium text-text-primary">{stay.room.sqft} sq ft</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {stay.room.features.map((feature) => (
            <span key={feature} className="inline-flex items-center gap-1 rounded-full bg-secondary/5 border border-secondary/10 px-2 py-0.5 text-[10px] text-secondary capitalize">
              <CheckCircle2 className="h-3 w-3" />
              {feature.replace('-', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Stay Dates</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 text-center">
            <p className="text-xs text-text-muted">Check-in</p>
            <p className="text-lg font-bold text-text-primary">{new Date(stay.dates.arrival).getDate()}</p>
            <p className="text-xs text-text-secondary">{new Date(stay.dates.arrival).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
            <p className="text-xs text-text-muted mt-1">{stay.dates.arrivalTime}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-px w-16 bg-border" />
            <span className="text-xs text-text-muted my-1">{stay.dates.nights} nights</span>
            <div className="h-px w-16 bg-border" />
          </div>
          <div className="flex-1 text-center">
            <p className="text-xs text-text-muted">Check-out</p>
            <p className="text-lg font-bold text-text-primary">{new Date(stay.dates.departure).getDate()}</p>
            <p className="text-xs text-text-secondary">{new Date(stay.dates.departure).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
            <p className="text-xs text-text-muted mt-1">{stay.dates.departureTime}</p>
          </div>
        </div>
      </div>

      {/* Rate Breakdown */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Rate Breakdown</h3>
        <div className="space-y-2">
          {stay.rate.breakdown.map((day) => (
            <div key={day.date} className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{formatDate(day.date)}</span>
              <span className="font-medium text-text-primary">{formatCurrency(day.rate, stay.rate.currency)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 mt-2 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Subtotal</span>
              <span className="font-medium text-text-primary">{formatCurrency(stay.rate.total, stay.rate.currency)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Taxes & Fees</span>
              <span className="font-medium text-text-primary">{formatCurrency(stay.rate.taxes + stay.rate.fees, stay.rate.currency)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold pt-1">
              <span className="text-text-primary">Total</span>
              <span className="text-text-primary">{formatCurrency(stay.rate.total + stay.rate.taxes + stay.rate.fees, stay.rate.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Policy */}
      {phase === 'pre-arrival' && stay.status !== 'cancelled' && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-info" />
            <h3 className="text-sm font-semibold text-text-primary">Cancellation Policy</h3>
          </div>
          <div className={cn(
            'rounded-lg p-3',
            policy.type === 'free' ? 'bg-accent/5 border border-accent/10' :
            policy.type === 'partial' ? 'bg-warning/5 border border-warning/10' :
            'bg-danger/5 border border-danger/10'
          )}>
            <p className={cn('text-sm font-medium',
              policy.type === 'free' ? 'text-accent' :
              policy.type === 'partial' ? 'text-warning' :
              'text-danger'
            )}>
              {policy.label}
            </p>
            <p className="text-xs text-text-secondary mt-1">{policy.description}</p>
            {policy.fee > 0 && (
              <p className="text-xs text-text-muted mt-1">
                Cancellation fee: {formatCurrency(policy.fee, stay.rate.currency)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {phase === 'pre-arrival' && stay.status === 'confirmed' && (
          <>
            <Button
              size="lg"
              className="w-full"
              onClick={() => onAction('checkin', stay)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Start Check-In
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => onAction('modify', stay)}>
                <Edit3 className="mr-2 h-4 w-4" />
                Modify
              </Button>
              <Button variant="outline" className="text-danger border-danger/30 hover:bg-danger/10" onClick={() => onAction('cancel', stay)}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </>
        )}
        {phase === 'in-stay' && (
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => onAction('key', stay)}>
              <QrCode className="mr-2 h-4 w-4" />
              Digital Key
            </Button>
            <Button variant="outline" onClick={() => onAction('roomservice', stay)}>
              <Utensils className="mr-2 h-4 w-4" />
              Room Service
            </Button>
          </div>
        )}
        {phase === 'post-stay' && !stay.review?.submitted && (
          <Button onClick={() => onAction('review', stay)}>
            <Star className="mr-2 h-4 w-4" />
            Leave Review
          </Button>
        )}
        <Button variant="outline" onClick={() => onAction('receipt', stay)}>
          <Receipt className="mr-2 h-4 w-4" />
          View Receipt
        </Button>
      </div>
    </div>
  );
}
