import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import {
  ArrowLeft,
  Calendar,
  User,
  BedDouble,
  DollarSign,
  Clock,
  MessageSquare,
  FileText,
  History,
  CreditCard,
  LogIn,
  LogOut,
  Printer,
  Edit3,
  Phone,
  Mail,
  MapPin,
  Send,
  X,
  UserPlus,
} from 'lucide-react';
import {
  useReservation,
  useCheckIn,
  useCheckOut,
  useCancelReservation,
  useAssignRoom,
  useUpdateReservation,
} from '../../../../hooks/useReservations';
import { useRooms } from '../../../../hooks/useRooms';
import PaymentRequestsPanel from '../components/PaymentRequestsPanel';
import { communicationsApi } from '../../../../api/communications';

const statusMeta = {
  confirmed: { label: 'Confirmed', class: 'bg-accent/10 text-accent border-accent/20' },
  checked_in: { label: 'Checked In', class: 'bg-secondary/10 text-secondary border-secondary/20' },
  checked_out: { label: 'Checked Out', class: 'bg-neutral/10 text-text-muted border-border' },
  cancelled: { label: 'Cancelled', class: 'bg-danger/10 text-danger border-danger/20' },
  no_show: { label: 'No-Show', class: 'bg-danger/10 text-danger border-danger/20' },
};

const tabs = [
  { id: 'details', label: 'Details', icon: FileText },
  { id: 'folio', label: 'Folio', icon: CreditCard },
  { id: 'guest', label: 'Guest', icon: User },
  { id: 'history', label: 'History', icon: History },
  { id: 'notes', label: 'Notes', icon: MessageSquare },
];

function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.confirmed;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.class
      )}
    >
      {meta.label}
    </span>
  );
}

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '—');
const fmtDay = (iso) => (iso ?? '').slice(0, 10);
const money = (v) => `$${Number(v ?? 0).toFixed(2)}`;

function TimelineItem({ event, isLast }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
          <Clock className="h-4 w-4 text-secondary" />
        </div>
        {!isLast && <div className="mt-2 h-full w-px bg-border" />}
      </div>
      <div className={cn('pb-6', isLast && 'pb-0')}>
        <p className="text-sm font-medium text-text-primary">{event.action}</p>
        {event.detail && <p className="text-xs text-text-secondary">{event.detail}</p>}
        <p className="mt-1 text-xs text-text-muted">{fmt(event.time)}</p>
      </div>
    </div>
  );
}

export default function ReservationDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('details');
  const [actionError, setActionError] = useState(null);
  const [emailNotice, setEmailNotice] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignRoomId, setAssignRoomId] = useState('');
  const [notesDraft, setNotesDraft] = useState(null);

  const { reservation: r, isLoading, error, refetch } = useReservation(id);
  const { rooms } = useRooms();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const cancel = useCancelReservation();
  const assignRoom = useAssignRoom();
  const update = useUpdateReservation();

  const mutationPending =
    checkIn.isPending ||
    checkOut.isPending ||
    cancel.isPending ||
    assignRoom.isPending ||
    update.isPending;

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-sm text-text-muted">Loading reservation...</p>
      </div>
    );
  }

  if (error || !r) {
    return (
      <div className="space-y-4 p-6">
        <button
          onClick={() => navigate('/app/reservations')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-elevated"
        >
          <ArrowLeft className="h-4 w-4 text-text-secondary" />
        </button>
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-8 text-center">
          <p className="text-sm font-medium text-danger">
            {error ? 'Failed to load reservation' : 'Reservation not found'}
          </p>
          {error && <p className="mt-1 text-xs text-text-muted">{error.message}</p>}
          <Button onClick={() => refetch()} className="mt-4" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const guest = r.guest ?? {};
  const guestName =
    r.guestName || `${guest.firstName ?? ''} ${guest.lastName ?? ''}`.trim() || 'Unnamed Guest';
  const folio = r.folio;
  const folioItems = folio?.items ?? [];
  const balance = folio ? Number(folio.balance) : Number(r.balance ?? 0);
  const stays = r.stays ?? [];
  const roomNumber = r.roomNumber ?? stays[0]?.room?.number ?? null;
  const roomTypeName = r.roomTypeName ?? stays[0]?.room?.roomType?.name ?? null;

  const doCheckIn = () => {
    setActionError(null);
    checkIn.mutate(r.id, { onError: (e) => setActionError(e.message) });
  };
  const doCheckOut = () => {
    setActionError(null);
    checkOut.mutate(r.id, { onError: (e) => setActionError(e.message) });
  };
  const doCancel = () => {
    if (!window.confirm(`Cancel reservation ${r.confirmationNumber}?`)) return;
    setActionError(null);
    cancel.mutate({ id: r.id }, { onError: (e) => setActionError(e.message) });
  };
  const doAssign = () => {
    if (!assignRoomId) return;
    setActionError(null);
    assignRoom.mutate(
      { id: r.id, input: { roomId: assignRoomId } },
      {
        onSuccess: () => setAssignOpen(false),
        onError: (e) => setActionError(e.message),
      }
    );
  };

  const emailFolio = async () => {
    setActionError(null);
    setEmailNotice(null);
    try {
      await communicationsApi.sendFolio(r.id);
      setEmailNotice('Folio email queued — check the Email Center or MailHog.');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to send folio email');
    }
  };
  const saveNotes = () => {
    setActionError(null);
    update.mutate(
      { id: r.id, input: { notes: notesDraft } },
      { onError: (e) => setActionError(e.message) }
    );
  };

  /* Derive a timeline from real data */
  const historyEvents = [
    {
      id: 'created',
      time: r.createdAt,
      action: 'Reservation created',
      detail: `Source: ${r.source}`,
    },
    ...(stays.length
      ? [{ id: 'room', time: r.updatedAt, action: 'Room assigned', detail: `Room ${roomNumber}` }]
      : []),
    ...folioItems.slice(0, 10).map((item) => ({
      id: item.id,
      time: item.postedAt,
      action: `Folio ${item.type}: ${item.description}`,
      detail: money(item.amount),
    })),
  ]
    .filter((e) => e.time)
    .sort((a, b) => new Date(b.time) - new Date(a.time));

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-border bg-surface p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                  Stay Information
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Arrival</label>
                    <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-secondary" /> {fmtDay(r.arrivalDate)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Departure</label>
                    <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-secondary" /> {fmtDay(r.departureDate)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Nights</label>
                    <p className="text-sm font-medium text-text-primary">{r.nights}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Guests</label>
                    <p className="text-sm font-medium text-text-primary">
                      {r.adults} Adults {r.children > 0 && `• ${r.children} Children`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Room</label>
                    <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-secondary" />
                      {roomNumber
                        ? `${roomNumber}${roomTypeName ? ` — ${roomTypeName}` : ''}`
                        : 'Unassigned'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Rate</label>
                    <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-secondary" />
                      {r.rate != null ? `${money(r.rate)}/night` : 'Rate plan default'}
                    </p>
                  </div>
                </div>
                {r.notes && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <label className="text-xs text-text-muted">Notes</label>
                    <p className="mt-1 text-sm text-text-secondary">{r.notes}</p>
                  </div>
                )}
              </div>

              {stays.length > 0 && (
                <div className="rounded-xl border border-border bg-surface p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                    Room Stays ({stays.length} nights)
                  </h3>
                  <div className="space-y-2">
                    {stays.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-2.5"
                      >
                        <span className="text-sm text-text-primary">
                          {fmtDay(s.date)} — Room {s.room?.number ?? '—'}
                        </span>
                        <span className="text-sm font-mono text-text-secondary">
                          {money(s.rate)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border bg-surface p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                  Booking Details
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Confirmation #</label>
                    <p className="text-sm font-mono font-medium text-text-primary">
                      {r.confirmationNumber}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Source</label>
                    <p className="text-sm font-medium text-text-primary">{r.source}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Created</label>
                    <p className="text-sm text-text-secondary">{fmt(r.createdAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Last Updated</label>
                    <p className="text-sm text-text-secondary">{fmt(r.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-surface p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  {!roomNumber && r.status === 'confirmed' && (
                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      onClick={() => setAssignOpen(true)}
                      disabled={mutationPending}
                    >
                      <UserPlus className="mr-1.5 h-4 w-4" /> Assign Room
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    onClick={() => window.print()}
                  >
                    <Printer className="mr-1.5 h-4 w-4" /> Print Confirmation
                  </Button>
                  {r.status === 'confirmed' && (
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={doCheckIn}
                      disabled={mutationPending}
                    >
                      <LogIn className="mr-1.5 h-4 w-4" /> Check In
                    </Button>
                  )}
                  {r.status === 'checked_in' && (
                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      onClick={doCheckOut}
                      disabled={mutationPending}
                    >
                      <LogOut className="mr-1.5 h-4 w-4" /> Check Out
                    </Button>
                  )}
                  {(r.status === 'confirmed' || r.status === 'checked_in') && (
                    <Button
                      variant="danger"
                      className="w-full"
                      size="sm"
                      onClick={doCancel}
                      disabled={mutationPending}
                    >
                      Cancel Reservation
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                  Balance
                </h3>
                <p
                  className={cn('text-3xl font-bold', balance > 0 ? 'text-danger' : 'text-accent')}
                >
                  {money(balance)}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {balance > 0 ? 'Outstanding balance' : 'Fully paid'}
                </p>
              </div>
            </div>
          </div>
        );

      case 'folio':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">
                Folio {folio?.status ? `(${folio.status})` : ''}
              </h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={emailFolio}>
                  <Mail className="mr-1.5 h-4 w-4" /> Email Folio
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="mr-1.5 h-4 w-4" /> Print
                </Button>
              </div>
            </div>
            {folioItems.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-10 text-center">
                <p className="text-sm text-text-muted">
                  No folio activity yet. Charges post automatically at night audit.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-background border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-text-secondary">
                        Charges
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-text-secondary">
                        Payments
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {folioItems.map((t) => (
                      <tr key={t.id} className="hover:bg-background/50 transition-colors">
                        <td className="px-4 py-3 text-text-secondary">{fmtDay(t.postedAt)}</td>
                        <td className="px-4 py-3 text-text-primary">{t.description}</td>
                        <td className="px-4 py-3 text-right font-mono text-text-primary">
                          {t.type === 'charge' ? money(t.amount) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-accent">
                          {t.type === 'payment' ? money(t.amount) : '—'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-background font-semibold">
                      <td className="px-4 py-3 text-text-primary" colSpan={2}>
                        Balance
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary" colSpan={2}>
                        <span className={balance > 0 ? 'text-danger' : 'text-accent'}>
                          {money(balance)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Deposit requests — emailed pay-now links, reminders, auto-cancel status */}
            <PaymentRequestsPanel reservationId={r.id} />
          </div>
        );

      case 'guest':
        return (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-border bg-surface p-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10 text-2xl font-bold text-secondary">
                  {guestName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-text-primary">{guestName}</h3>
                {guest.vipStatus && (
                  <p className="text-sm text-text-secondary">{guest.vipStatus}</p>
                )}
              </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-border bg-surface p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <Mail className="h-4 w-4 text-text-muted" /> {guest.email ?? '—'}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <Phone className="h-4 w-4 text-text-muted" /> {guest.phone ?? '—'}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <MapPin className="h-4 w-4 text-text-muted" />
                    {[guest.address, guest.city, guest.country].filter(Boolean).join(', ') || '—'}
                  </div>
                </div>
              </div>
              {(guest.nationality || guest.passportNumber) && (
                <div className="rounded-xl border border-border bg-surface p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                    Travel Documents
                  </h3>
                  <div className="space-y-2 text-sm text-text-primary">
                    {guest.nationality && <p>Nationality: {guest.nationality}</p>}
                    {guest.passportNumber && <p>Passport: {guest.passportNumber}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-6">
              Activity Timeline
            </h3>
            {historyEvents.length === 0 ? (
              <p className="text-sm text-text-muted">No activity recorded yet.</p>
            ) : (
              <div>
                {historyEvents.map((event, i) => (
                  <TimelineItem
                    key={event.id}
                    event={event}
                    isLast={i === historyEvents.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                Reservation Notes
              </h3>
              <textarea
                value={notesDraft ?? r.notes ?? ''}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Internal notes about this reservation..."
                rows={4}
                className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  onClick={saveNotes}
                  disabled={
                    mutationPending || notesDraft === null || notesDraft === (r.notes ?? '')
                  }
                >
                  <Send className="mr-1.5 h-4 w-4" /> Save Notes
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/reservations')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-elevated"
          >
            <ArrowLeft className="h-4 w-4 text-text-secondary" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{r.confirmationNumber}</h1>
              <StatusBadge status={r.status} />
            </div>
            <p className="text-sm text-text-secondary">
              {guestName}
              {roomTypeName ? ` • ${roomTypeName}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
          {!roomNumber && r.status === 'confirmed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignOpen(true)}
              disabled={mutationPending}
            >
              <UserPlus className="mr-1.5 h-4 w-4" /> Assign
            </Button>
          )}
          {r.status === 'confirmed' && (
            <Button size="sm" onClick={doCheckIn} disabled={mutationPending}>
              <LogIn className="mr-1.5 h-4 w-4" /> Check In
            </Button>
          )}
          {r.status === 'checked_in' && (
            <Button size="sm" onClick={doCheckOut} disabled={mutationPending}>
              <LogOut className="mr-1.5 h-4 w-4" /> Check Out
            </Button>
          )}
        </div>
      </div>
      {/* Email notice */}
      {emailNotice && (
        <div className="flex items-center justify-between rounded-lg border border-accent/20 bg-accent/5 px-4 py-2.5">
          <p className="text-sm text-accent">{emailNotice}</p>
          <button
            onClick={() => setEmailNotice(null)}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Action error */}
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

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div>{renderTabContent()}</div>

      {/* Assign room modal */}
      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Assign Room</h3>
              <button
                onClick={() => setAssignOpen(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>
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
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAssignOpen(false)}>
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
