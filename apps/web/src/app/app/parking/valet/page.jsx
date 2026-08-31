/* src/app/app/parking/valet/page.jsx */
import { useState, useMemo } from 'react';
import {
  Car, KeyRound, Clock, User, UserCircle, MapPin, ShieldAlert, ShieldCheck,
  XCircle, CheckCircle2, AlertTriangle, ChevronRight, Plus, Search, Download,
  ClipboardCheck, ArrowRight, QrCode,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';

/* ─── Mock Data ─── */
const damageZones = ['Front Bumper', 'Rear Bumper', 'Left Side', 'Right Side', 'Roof', 'Interior'];
const attendants = ['Marcus T.', 'Dana R.', 'Priya K.'];

function cleanZones() {
  return damageZones.reduce((acc, z) => ({ ...acc, [z]: { condition: 'ok', note: '' } }), {});
}

const initialTickets = [
  {
    id: 'V-1024', plate: 'VAL-001', vehicle: 'Porsche 911', color: 'Red', guest: 'Michael Chen', room: 'VIP',
    status: 'parked', spot: 'P2-D01', attendant: 'Marcus T.', requestedAt: '08/12 4:30 PM', updatedAt: '08/12 4:38 PM',
    intake: { zones: cleanZones(), checkedBy: 'Marcus T.', checkedAt: '08/12 4:30 PM' },
    flaggedDamage: null,
  },
  {
    id: 'V-1025', plate: 'VAL-002', vehicle: 'Range Rover', color: 'Black', guest: 'Sarah Williams', room: 'Suite 501',
    status: 'parked', spot: 'P2-D02', attendant: 'Dana R.', requestedAt: '08/12 5:05 PM', updatedAt: '08/12 5:12 PM',
    intake: { zones: cleanZones(), checkedBy: 'Dana R.', checkedAt: '08/12 5:05 PM' },
    flaggedDamage: null,
  },
  {
    id: 'V-1026', plate: 'ABC-1234', vehicle: 'Tesla Model 3', color: 'White', guest: 'Jane Smith', room: '204',
    status: 'queued-retrieve', spot: 'P1-A01', attendant: null, requestedAt: '12:45 PM', updatedAt: '12:45 PM',
    intake: { zones: cleanZones(), checkedBy: 'Front Desk', checkedAt: '08/12 10:15 AM' },
    flaggedDamage: null,
  },
  {
    id: 'V-1027', plate: 'CHN-9901', vehicle: 'Audi A4', color: 'Gray', guest: 'Robert Chen', room: '118',
    status: 'parking', spot: null, attendant: 'Marcus T.', requestedAt: '12:50 PM', updatedAt: '12:52 PM',
    intake: { zones: cleanZones(), checkedBy: 'Marcus T.', checkedAt: '12:50 PM' },
    flaggedDamage: null,
  },
  {
    id: 'V-1028', plate: 'RIV-8842', vehicle: 'Rivian R1T', color: 'Green', guest: 'David Park', room: '502',
    status: 'retrieving', spot: 'P1-B02', attendant: 'Priya K.', requestedAt: '1:00 PM', updatedAt: '1:03 PM',
    intake: { zones: cleanZones(), checkedBy: 'Priya K.', checkedAt: '08/10 3:20 PM' },
    flaggedDamage: null,
  },
  {
    id: 'V-1029', plate: 'BMW-2201', vehicle: 'BMW X5', color: 'Blue', guest: 'Karen Lee', room: '220',
    status: 'queued-park', spot: null, attendant: null, requestedAt: '1:10 PM', updatedAt: '1:10 PM',
    intake: { zones: cleanZones(), checkedBy: 'Dana R.', checkedAt: '1:10 PM' },
    flaggedDamage: null,
  },
  {
    id: 'V-1030', plate: 'MAL-5541', vehicle: 'Chevrolet Malibu', color: 'Silver', guest: 'Anna Reyes', room: '150',
    status: 'damage-hold', spot: 'P1-A03', attendant: 'Priya K.', requestedAt: '08/13 9:00 AM', updatedAt: '08/14 6:40 PM',
    intake: { zones: cleanZones(), checkedBy: 'Priya K.', checkedAt: '08/13 9:00 AM' },
    flaggedDamage: { zone: 'Rear Bumper', note: 'Fresh scratch noticed during retrieval — not present at intake', reportedBy: 'Priya K.', reportedAt: '08/14 6:40 PM' },
  },
  {
    id: 'V-1031', plate: 'HON-7712', vehicle: 'Honda Accord', color: 'White', guest: 'Tom Baker', room: '312',
    status: 'delivered', spot: null, attendant: 'Marcus T.', requestedAt: '08/15 9:00 AM', updatedAt: '08/15 9:14 AM',
    intake: { zones: cleanZones(), checkedBy: 'Marcus T.', checkedAt: '08/12 8:00 AM' },
    flaggedDamage: null,
  },
];

/* ─── Helpers ─── */
const statusMeta = {
  'queued-park': { label: 'Awaiting Park', icon: Clock, dot: 'bg-warning', class: 'bg-warning/10 text-warning border-warning/20' },
  parking: { label: 'Parking', icon: KeyRound, dot: 'bg-secondary', class: 'bg-secondary/10 text-secondary border-secondary/20' },
  parked: { label: 'Parked', icon: CheckCircle2, dot: 'bg-accent', class: 'bg-accent/10 text-accent border-accent/20' },
  'queued-retrieve': { label: 'Retrieve Requested', icon: AlertTriangle, dot: 'bg-danger', class: 'bg-danger/10 text-danger border-danger/20' },
  retrieving: { label: 'Retrieving', icon: KeyRound, dot: 'bg-secondary', class: 'bg-secondary/10 text-secondary border-secondary/20' },
  delivered: { label: 'Delivered', icon: ShieldCheck, dot: 'bg-neutral', class: 'bg-neutral/10 text-neutral border-neutral/20' },
  'damage-hold': { label: 'Damage Hold', icon: ShieldAlert, dot: 'bg-danger', class: 'bg-danger/10 text-danger border-danger/20' },
};

const queueOrder = ['queued-retrieve', 'queued-park', 'retrieving', 'parking'];

/* ─── Components ─── */
function StatCard({ label, value, subtext, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
        </div>
        <div className={cn('rounded-lg p-2.5', color.replace('text-', 'bg-').replace('danger', 'danger/10').replace('accent', 'accent/10').replace('warning', 'warning/10').replace('info', 'info/10').replace('secondary', 'secondary/10'))}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

function DamageZoneGrid({ zones, onChange, readOnly }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {damageZones.map((zone) => {
        const z = zones[zone];
        const flagged = z.condition === 'damage';
        return (
          <div key={zone} className={cn('rounded-lg border p-2.5', flagged ? 'border-danger/30 bg-danger/5' : 'border-border bg-surface')}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-primary">{zone}</span>
              {!readOnly ? (
                <button
                  type="button"
                  onClick={() => onChange(zone, flagged ? 'ok' : 'damage')}
                  className={cn(
                    'rounded px-2 py-0.5 text-[10px] font-medium border transition-colors',
                    flagged ? 'bg-danger text-white border-danger' : 'border-border text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {flagged ? 'Damage' : 'OK'}
                </button>
              ) : (
                <span className={cn('rounded px-2 py-0.5 text-[10px] font-medium', flagged ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent')}>
                  {flagged ? 'Damage' : 'OK'}
                </span>
              )}
            </div>
            {flagged && !readOnly && (
              <input
                type="text"
                value={z.note}
                onChange={(e) => onChange(zone, 'damage', e.target.value)}
                placeholder="Describe the damage…"
                className="mt-1.5 h-8 w-full rounded border border-border bg-background px-2 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            )}
            {flagged && readOnly && z.note && <p className="mt-1 text-[10px] text-text-muted">{z.note}</p>}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Intake / New Ticket Modal ─── */
function IntakeModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ plate: '', vehicle: '', color: '', guest: '', room: '', attendant: attendants[0] });
  const [zones, setZones] = useState(cleanZones());

  const handleZoneChange = (zone, condition, note) => {
    setZones((prev) => ({ ...prev, [zone]: { condition, note: note !== undefined ? note : prev[zone].note } }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ ...form, zones });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary">New Valet Ticket</h3>
            <p className="text-xs text-text-muted">Intake condition check is required before the vehicle is taken</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted"><XCircle className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Vehicle</label>
              <input
                type="text" required value={form.vehicle}
                onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                placeholder="Make & Model"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">License Plate</label>
              <input
                type="text" required value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
                placeholder="ABC-1234"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Color</label>
              <input
                type="text" value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="White"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Guest</label>
              <input
                type="text" required value={form.guest}
                onChange={(e) => setForm({ ...form, guest: e.target.value })}
                placeholder="Guest name"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Room</label>
              <input
                type="text" value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="204"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Attendant</label>
            <select
              value={form.attendant}
              onChange={(e) => setForm({ ...form, attendant: e.target.value })}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {attendants.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-text-secondary uppercase tracking-wider">
              <ClipboardCheck className="h-3.5 w-3.5" /> Condition Check
            </label>
            <DamageZoneGrid zones={zones} onChange={handleZoneChange} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="secondary" size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Create Ticket
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Report Damage Modal (mid-lifecycle flag) ─── */
function ReportDamageModal({ ticket, onClose, onReport }) {
  const [zone, setZone] = useState(damageZones[0]);
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onReport(ticket.id, { zone, note });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Report Damage — {ticket.id}</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted"><XCircle className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Affected Area</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {damageZones.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Description</label>
            <textarea
              required value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="What was observed, and when"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
          <p className="text-xs text-text-muted">This places the ticket on damage hold until a manager clears it.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="danger" size="sm">
              <ShieldAlert className="mr-1.5 h-4 w-4" /> Flag Damage
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Ticket Detail Modal ─── */
function TicketDetailModal({ ticket, onClose, onAdvance, onAssign, onReportDamage, onResolveHold }) {
  const meta = statusMeta[ticket.status];
  const StatusIcon = meta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-background shadow-2xl">
        <div className="sticky top-0 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary font-mono">{ticket.id}</h3>
            <p className="text-xs text-text-muted">{ticket.vehicle} · {ticket.color}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className={cn('rounded-lg border p-3', meta.class)}>
            <div className="flex items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              <span className="text-sm font-semibold">{meta.label}</span>
              {ticket.spot && <span className="text-xs opacity-80">· Spot {ticket.spot}</span>}
            </div>
            {ticket.flaggedDamage && (
              <p className="mt-1.5 text-xs">{ticket.flaggedDamage.zone}: {ticket.flaggedDamage.note}</p>
            )}
          </div>

          {/* Vehicle & Guest */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Vehicle & Guest</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Car className="h-4 w-4 text-text-muted" />
                <span className="text-text-primary">{ticket.vehicle}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <QrCode className="h-4 w-4 text-text-muted" />
                <span className="font-mono text-text-primary">{ticket.plate}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <User className="h-4 w-4 text-text-muted" />
                <span className="text-text-primary">{ticket.guest}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <MapPin className="h-4 w-4 text-text-muted" />
                <span className="text-text-primary">Room {ticket.room}</span>
              </div>
            </div>
          </div>

          {/* Attendant */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Attendant</h4>
            <select
              value={ticket.attendant || ''}
              onChange={(e) => onAssign(ticket.id, e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Unassigned</option>
              {attendants.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Intake Condition */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Intake Condition
            </h4>
            <DamageZoneGrid zones={ticket.intake.zones} readOnly />
            <p className="mt-2 text-[10px] text-text-muted">Checked by {ticket.intake.checkedBy} · {ticket.intake.checkedAt}</p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {ticket.status === 'queued-park' && (
              <Button variant="secondary" size="sm" className="w-full justify-center" onClick={() => onAdvance(ticket.id, 'parking')}>
                <ArrowRight className="mr-1.5 h-4 w-4" /> Start Parking
              </Button>
            )}
            {ticket.status === 'parking' && (
              <Button variant="secondary" size="sm" className="w-full justify-center" onClick={() => onAdvance(ticket.id, 'parked')}>
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Mark Parked
              </Button>
            )}
            {ticket.status === 'parked' && (
              <Button variant="outline" size="sm" className="w-full justify-center" onClick={() => onAdvance(ticket.id, 'queued-retrieve')}>
                <Clock className="mr-1.5 h-4 w-4" /> Request Retrieval
              </Button>
            )}
            {ticket.status === 'queued-retrieve' && (
              <Button variant="secondary" size="sm" className="w-full justify-center" onClick={() => onAdvance(ticket.id, 'retrieving')}>
                <ArrowRight className="mr-1.5 h-4 w-4" /> Start Retrieval
              </Button>
            )}
            {ticket.status === 'retrieving' && (
              <Button variant="secondary" size="sm" className="w-full justify-center" onClick={() => onAdvance(ticket.id, 'delivered')}>
                <ShieldCheck className="mr-1.5 h-4 w-4" /> Mark Delivered
              </Button>
            )}
            {ticket.status === 'damage-hold' ? (
              <Button variant="outline" size="sm" className="w-full justify-center" onClick={() => onResolveHold(ticket.id)}>
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Clear Hold
              </Button>
            ) : ticket.status !== 'delivered' && (
              <Button variant="danger" size="sm" className="w-full justify-center" onClick={() => onReportDamage(ticket)}>
                <ShieldAlert className="mr-1.5 h-4 w-4" /> Report Damage
              </Button>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ValetOperationsPage() {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showIntake, setShowIntake] = useState(false);
  const [damageTarget, setDamageTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  /* ─── Computed ─── */
  const stats = useMemo(() => {
    const active = tickets.filter((t) => t.status !== 'delivered').length;
    const queuePending = tickets.filter((t) => t.status === 'queued-park' || t.status === 'queued-retrieve').length;
    const damageHolds = tickets.filter((t) => t.status === 'damage-hold').length;
    return { active, queuePending, damageHolds };
  }, [tickets]);

  const activeQueue = useMemo(() => {
    return tickets
      .filter((t) => queueOrder.includes(t.status))
      .sort((a, b) => queueOrder.indexOf(a.status) - queueOrder.indexOf(b.status));
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      const matchesSearch = !q ||
        t.id.toLowerCase().includes(q) ||
        t.plate.toLowerCase().includes(q) ||
        t.vehicle.toLowerCase().includes(q) ||
        t.guest.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, search, statusFilter]);

  /* ─── Handlers ─── */
  const handleCreateTicket = (form) => {
    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const newTicket = {
      id: `V-${1024 + tickets.length}`,
      plate: form.plate, vehicle: form.vehicle, color: form.color, guest: form.guest, room: form.room,
      status: 'queued-park', spot: null, attendant: form.attendant, requestedAt: now, updatedAt: now,
      intake: { zones: form.zones, checkedBy: form.attendant, checkedAt: now },
      flaggedDamage: null,
    };
    setTickets((prev) => [newTicket, ...prev]);
  };

  const handleAdvance = (ticketId, status) => {
    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status, updatedAt: now } : t)));
    setSelectedTicket((prev) => (prev && prev.id === ticketId ? { ...prev, status, updatedAt: now } : prev));
  };

  const handleAssign = (ticketId, attendant) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, attendant: attendant || null } : t)));
    setSelectedTicket((prev) => (prev && prev.id === ticketId ? { ...prev, attendant: attendant || null } : prev));
  };

  const handleReportDamage = (ticketId, damage) => {
    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    setTickets((prev) => prev.map((t) => (t.id === ticketId
      ? { ...t, status: 'damage-hold', updatedAt: now, flaggedDamage: { ...damage, reportedBy: t.attendant || 'Front Desk', reportedAt: now } }
      : t)));
    setSelectedTicket(null);
  };

  const handleResolveHold = (ticketId) => {
    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    setTickets((prev) => prev.map((t) => (t.id === ticketId
      ? { ...t, status: t.spot ? 'parked' : 'queued-park', updatedAt: now, flaggedDamage: null }
      : t)));
    setSelectedTicket(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Valet Operations</h1>
          <p className="text-sm text-text-secondary">Tickets, live queue, and vehicle condition checks</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowIntake(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Ticket
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Active Tickets" value={stats.active} icon={KeyRound} color="text-text-primary" subtext="Not yet delivered" />
        <StatCard label="Queue Pending" value={stats.queuePending} icon={Clock} color="text-warning" subtext="Awaiting action" />
        <StatCard label="Damage Holds" value={stats.damageHolds} icon={ShieldAlert} color="text-danger" />
      </div>

      {/* Active Queue */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border bg-background px-6 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-secondary" /> Active Queue
          </h3>
          <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white">
            {tickets.filter((t) => t.status === 'queued-retrieve').length} urgent
          </span>
        </div>
        {activeQueue.length > 0 ? (
          <div className="divide-y divide-border">
            {activeQueue.map((ticket) => {
              const meta = statusMeta[ticket.status];
              const StatusIcon = meta.icon;
              return (
                <div key={ticket.id} className="flex flex-col gap-3 px-6 py-3 hover:bg-background/50 transition-colors sm:flex-row sm:items-center sm:justify-between">
                  <button className="flex items-center gap-4 text-left" onClick={() => setSelectedTicket(ticket)}>
                    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', meta.class)}>
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {meta.label} — {ticket.vehicle}
                      </p>
                      <p className="text-xs text-text-muted">
                        {ticket.guest} · Room {ticket.room} · <span className="font-mono">{ticket.plate}</span>
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-3 pl-13 sm:pl-0">
                    <div className="text-right">
                      <p className="text-xs font-mono text-text-secondary">{ticket.id}</p>
                      <p className="text-[10px] text-text-muted">{ticket.requestedAt}{ticket.attendant ? ` · ${ticket.attendant}` : ''}</p>
                    </div>
                    {ticket.status === 'queued-park' && (
                      <Button variant="outline" size="sm" className="border-warning text-warning hover:bg-warning/10" onClick={() => handleAdvance(ticket.id, 'parking')}>Start</Button>
                    )}
                    {ticket.status === 'queued-retrieve' && (
                      <Button variant="outline" size="sm" className="border-danger text-danger hover:bg-danger/10" onClick={() => handleAdvance(ticket.id, 'retrieving')}>Start</Button>
                    )}
                    {ticket.status === 'parking' && (
                      <Button variant="outline" size="sm" className="border-secondary text-secondary hover:bg-secondary/10" onClick={() => handleAdvance(ticket.id, 'parked')}>Complete</Button>
                    )}
                    {ticket.status === 'retrieving' && (
                      <Button variant="outline" size="sm" className="border-secondary text-secondary hover:bg-secondary/10" onClick={() => handleAdvance(ticket.id, 'delivered')}>Complete</Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-text-muted text-sm">Queue is clear.</div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Input
            icon={Search}
            placeholder="Search ticket, plate, guest…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All Statuses</option>
          {Object.entries(statusMeta).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
      </div>

      {/* Tickets Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Ticket</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Guest</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Attendant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Updated</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-background/50 transition-colors cursor-pointer" onClick={() => setSelectedTicket(t)}>
                  <td className="px-4 py-3 font-mono text-text-primary">{t.id}</td>
                  <td className="px-4 py-3">
                    <p className="text-text-primary">{t.vehicle}</p>
                    <p className="text-xs font-mono text-text-muted">{t.plate}</p>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {t.guest}
                    {t.room && <span className="text-text-muted"> · {t.room}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium', statusMeta[t.status].class)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', statusMeta[t.status].dot)} />
                      {statusMeta[t.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {t.attendant ? (
                      <span className="inline-flex items-center gap-1.5"><UserCircle className="h-3.5 w-3.5 text-text-muted" /> {t.attendant}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{t.updatedAt}</td>
                  <td className="px-4 py-3">
                    <ChevronRight className="h-4 w-4 text-text-muted" />
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                    No tickets match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onAdvance={handleAdvance}
          onAssign={handleAssign}
          onReportDamage={(t) => setDamageTarget(t)}
          onResolveHold={handleResolveHold}
        />
      )}
      {showIntake && (
        <IntakeModal onClose={() => setShowIntake(false)} onCreate={handleCreateTicket} />
      )}
      {damageTarget && (
        <ReportDamageModal
          ticket={damageTarget}
          onClose={() => setDamageTarget(null)}
          onReport={handleReportDamage}
        />
      )}
    </div>
  );
}