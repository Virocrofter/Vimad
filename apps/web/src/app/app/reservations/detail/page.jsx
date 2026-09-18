import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
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
  Check,
  LogIn,
  LogOut,
  Printer,
  Edit3,
  Phone,
  Mail,
  MapPin,
  Star,
  Send,
} from 'lucide-react';

/* ─── Mock Data ─── */
const mockReservation = {
  id: '4021',
  guest: 'John Smith',
  email: 'john@email.com',
  phone: '+1 555-0101',
  address: '123 Maple Ave, Boston, MA',
  room: '204',
  roomType: 'Deluxe King',
  arrival: '2026-08-12',
  departure: '2026-08-15',
  nights: 3,
  status: 'checked_in',
  rate: 189,
  tax: 28.35,
  balance: 45.5,
  source: 'Direct',
  adults: 2,
  children: 0,
  specialRequests: 'High floor, away from elevator. Extra pillows.',
  createdAt: '2026-08-01T10:30:00Z',
  checkedInAt: '2026-08-12T14:15:00Z',
  confirmationCode: 'UNF-8X2K9M',
};

const folioTransactions = [
  {
    id: 1,
    date: '2026-08-12',
    description: 'Room Charge — Deluxe King (1/3 nights)',
    charge: 189.0,
    payment: 0,
    type: 'charge',
  },
  {
    id: 2,
    date: '2026-08-12',
    description: 'Resort Fee',
    charge: 35.0,
    payment: 0,
    type: 'charge',
  },
  {
    id: 3,
    date: '2026-08-12',
    description: 'Payment — Visa •••• 4242',
    charge: 0,
    payment: 178.5,
    type: 'payment',
  },
  {
    id: 4,
    date: '2026-08-13',
    description: 'Room Charge — Deluxe King (2/3 nights)',
    charge: 189.0,
    payment: 0,
    type: 'charge',
  },
  {
    id: 5,
    date: '2026-08-13',
    description: 'Room Service — Dinner',
    charge: 67.0,
    payment: 0,
    type: 'charge',
  },
];

const historyEvents = [
  {
    id: 1,
    time: '2026-08-01T10:30:00Z',
    user: 'System',
    action: 'Reservation created',
    detail: 'Source: Direct • Confirmation: UNF-8X2K9M',
  },
  {
    id: 2,
    time: '2026-08-10T09:15:00Z',
    user: 'Sarah Johnson',
    action: 'Pre-checkin email sent',
    detail: 'Guest prompted for arrival time',
  },
  {
    id: 3,
    time: '2026-08-12T14:15:00Z',
    user: 'Sarah Johnson',
    action: 'Guest checked in',
    detail: 'Room 204 assigned • Key cards: 2',
  },
  {
    id: 4,
    time: '2026-08-13T08:45:00Z',
    user: 'System',
    action: 'Night audit posted',
    detail: 'Room charge $189.00 posted to folio',
  },
];

const stayHistory = [
  { date: '2026-03-15', nights: 2, room: '312', revenue: 378, status: 'completed' },
  { date: '2025-11-22', nights: 4, room: '204', revenue: 756, status: 'completed' },
];

const statusMeta = {
  confirmed: { label: 'Confirmed', class: 'bg-accent/10 text-accent border-accent/20' },
  checked_in: { label: 'Checked In', class: 'bg-secondary/10 text-secondary border-secondary/20' },
  checked_out: { label: 'Checked Out', class: 'bg-neutral/10 text-text-muted border-border' },
  cancelled: { label: 'Cancelled', class: 'bg-danger/10 text-danger border-danger/20' },
};

const tabs = [
  { id: 'details', label: 'Details', icon: FileText },
  { id: 'folio', label: 'Folio', icon: CreditCard },
  { id: 'guest', label: 'Guest', icon: User },
  { id: 'history', label: 'History', icon: History },
  { id: 'notes', label: 'Notes', icon: MessageSquare },
];

/* ─── Components ─── */
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
        <p className="text-xs text-text-secondary">{event.detail}</p>
        <p className="mt-1 text-xs text-text-muted">
          {new Date(event.time).toLocaleString()} • {event.user}
        </p>
      </div>
    </div>
  );
}

export default function ReservationDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('details');
  const [notes, setNotes] = useState([
    {
      id: 1,
      author: 'Sarah Johnson',
      time: '2026-08-12T09:00:00Z',
      content: 'Guest prefers extra pillows. VIP status noted.',
    },
    {
      id: 2,
      author: 'Mike Chen',
      time: '2026-08-13T11:30:00Z',
      content: 'Called guest about late checkout request. Approved until 1 PM.',
    },
  ]);
  const [newNote, setNewNote] = useState('');

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes([
      { id: Date.now(), author: 'You', time: new Date().toISOString(), content: newNote.trim() },
      ...notes,
    ]);
    setNewNote('');
  };

  const folioBalance = folioTransactions.reduce((acc, t) => acc + t.charge - t.payment, 0);

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
                      <Calendar className="h-4 w-4 text-secondary" /> {mockReservation.arrival}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Departure</label>
                    <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-secondary" /> {mockReservation.departure}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Nights</label>
                    <p className="text-sm font-medium text-text-primary">
                      {mockReservation.nights}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Guests</label>
                    <p className="text-sm font-medium text-text-primary">
                      {mockReservation.adults} Adults{' '}
                      {mockReservation.children > 0 && `• ${mockReservation.children} Children`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Room</label>
                    <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-secondary" /> {mockReservation.room} —{' '}
                      {mockReservation.roomType}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Rate</label>
                    <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-secondary" /> ${mockReservation.rate}
                      /night
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <label className="text-xs text-text-muted">Special Requests</label>
                  <p className="mt-1 text-sm text-text-secondary">
                    {mockReservation.specialRequests}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                  Booking Details
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Confirmation #</label>
                    <p className="text-sm font-mono font-medium text-text-primary">
                      {mockReservation.confirmationCode}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Source</label>
                    <p className="text-sm font-medium text-text-primary">
                      {mockReservation.source}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Created</label>
                    <p className="text-sm text-text-secondary">
                      {new Date(mockReservation.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Checked In</label>
                    <p className="text-sm text-text-secondary">
                      {mockReservation.checkedInAt
                        ? new Date(mockReservation.checkedInAt).toLocaleString()
                        : '—'}
                    </p>
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
                  <Button className="w-full" size="sm">
                    <Edit3 className="mr-1.5 h-4 w-4" /> Edit Reservation
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    <Printer className="mr-1.5 h-4 w-4" /> Print Confirmation
                  </Button>
                  {mockReservation.status === 'confirmed' && (
                    <Button variant="outline" className="w-full" size="sm">
                      <LogIn className="mr-1.5 h-4 w-4" /> Check In
                    </Button>
                  )}
                  {mockReservation.status === 'checked_in' && (
                    <Button variant="outline" className="w-full" size="sm">
                      <LogOut className="mr-1.5 h-4 w-4" /> Check Out
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                  Balance
                </h3>
                <p
                  className={cn(
                    'text-3xl font-bold',
                    folioBalance > 0 ? 'text-danger' : 'text-accent'
                  )}
                >
                  ${folioBalance.toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {folioBalance > 0 ? 'Outstanding balance' : 'Fully paid'}
                </p>
              </div>
            </div>
          </div>
        );

      case 'folio':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Folio Window 1</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Printer className="mr-1.5 h-4 w-4" /> Print
                </Button>
                <Button variant="outline" size="sm">
                  <DollarSign className="mr-1.5 h-4 w-4" /> Post Charge
                </Button>
              </div>
            </div>
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
                  {folioTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3 text-text-secondary">{t.date}</td>
                      <td className="px-4 py-3 text-text-primary">{t.description}</td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">
                        {t.charge > 0 ? `$${t.charge.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-accent">
                        {t.payment > 0 ? `$${t.payment.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-background font-semibold">
                    <td className="px-4 py-3 text-text-primary" colSpan={2}>
                      Balance
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text-primary" colSpan={2}>
                      <span className={folioBalance > 0 ? 'text-danger' : 'text-accent'}>
                        ${folioBalance.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'guest':
        return (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-border bg-surface p-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10 text-2xl font-bold text-secondary">
                  {mockReservation.guest
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-text-primary">
                  {mockReservation.guest}
                </h3>
                <p className="text-sm text-text-secondary">Returning Guest • VIP</p>
                <div className="mt-4 flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-border bg-surface p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <Mail className="h-4 w-4 text-text-muted" /> {mockReservation.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <Phone className="h-4 w-4 text-text-muted" /> {mockReservation.phone}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <MapPin className="h-4 w-4 text-text-muted" /> {mockReservation.address}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                  Stay History
                </h3>
                <div className="space-y-3">
                  {stayHistory.map((stay, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {stay.nights} nights • Room {stay.room}
                        </p>
                        <p className="text-xs text-text-muted">{stay.date}</p>
                      </div>
                      <span className="text-sm font-mono font-medium text-text-primary">
                        ${stay.revenue}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-6">
              Activity Timeline
            </h3>
            <div>
              {historyEvents.map((event, i) => (
                <TimelineItem
                  key={event.id}
                  event={event}
                  isLast={i === historyEvents.length - 1}
                />
              ))}
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                Add Note
              </h3>
              <div className="flex gap-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Write an internal note..."
                  rows={3}
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button onClick={addNote} className="self-end">
                  <Send className="mr-1.5 h-4 w-4" /> Add
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">{note.author}</span>
                    <span className="text-xs text-text-muted">
                      {new Date(note.time).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{note.content}</p>
                </div>
              ))}
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
              <h1 className="text-2xl font-bold text-text-primary">Reservation #{id}</h1>
              <StatusBadge status={mockReservation.status} />
            </div>
            <p className="text-sm text-text-secondary">
              {mockReservation.guest} • {mockReservation.roomType}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" size="sm">
            <Edit3 className="mr-1.5 h-4 w-4" /> Edit
          </Button>
          {mockReservation.status === 'confirmed' && (
            <Button size="sm">
              <LogIn className="mr-1.5 h-4 w-4" /> Check In
            </Button>
          )}
          {mockReservation.status === 'checked_in' && (
            <Button size="sm">
              <LogOut className="mr-1.5 h-4 w-4" /> Check Out
            </Button>
          )}
        </div>
      </div>

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
    </div>
  );
}
