/* src/app/app/parking/vehicles/page.jsx */
import { useState, useMemo } from 'react';
import {
  Car, Search, Plus, User, MapPin, Calendar, ChevronRight, XCircle,
  CheckCircle2, AlertTriangle, ShieldAlert, ShieldOff, KeyRound, LogIn,
  LogOut, History, Download, QrCode, Building2, Briefcase, Truck,
  ArrowUpRight, Phone, Clock,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';

/* ─── Mock Data ─── */
const vehicleRegistry = [
  {
    id: 'VEH-1001', plate: 'ABC-1234', state: 'CA', make: 'Tesla', model: 'Model 3', color: 'White',
    type: 'guest', status: 'parked', guest: 'John Smith', room: '204', phone: '(555) 010-2231',
    currentSpot: 'P1-A01', registeredAt: '2026-08-12 10:15 AM', lastSeen: '2026-08-15 09:30 AM',
    flagged: false, flagReason: null, visits: 3,
    history: [
      { id: 1, date: '2026-08-12 10:15 AM', action: 'checkin', spot: 'P1-A01', by: 'Front Desk', note: 'Registered at check-in' },
      { id: 2, date: '2026-08-13 07:40 AM', action: 'note', spot: 'P1-A01', by: 'Valet', note: 'Guest requested extra towel — unrelated ping from folio' },
    ],
  },
  {
    id: 'VEH-1002', plate: 'XYZ-5678', state: 'CA', make: 'Honda', model: 'Civic', color: 'Silver',
    type: 'guest', status: 'parked', guest: 'Sarah Johnson', room: '312', phone: '(555) 010-9981',
    currentSpot: 'P1-A02', registeredAt: '2026-08-11 02:05 PM', lastSeen: '2026-08-14 06:12 PM',
    flagged: false, flagReason: null, visits: 1,
    history: [
      { id: 1, date: '2026-08-11 02:05 PM', action: 'checkin', spot: 'P1-A02', by: 'Front Desk', note: 'Registered at check-in' },
    ],
  },
  {
    id: 'VEH-1003', plate: 'TRK-9012', state: 'NV', make: 'Ford', model: 'F-150', color: 'Black',
    type: 'guest', status: 'parked', guest: 'Mike Brown', room: '105', phone: '(555) 010-4471',
    currentSpot: 'P1-A04', registeredAt: '2026-08-15 11:00 AM', lastSeen: '2026-08-15 11:00 AM',
    flagged: false, flagReason: null, visits: 1,
    history: [
      { id: 1, date: '2026-08-15 11:00 AM', action: 'checkin', spot: 'P1-A04', by: 'Front Desk', note: 'Registered at check-in — oversized surcharge applied' },
    ],
  },
  {
    id: 'VEH-1004', plate: 'EV-2026', state: 'CA', make: 'BMW', model: 'iX', color: 'Blue',
    type: 'guest', status: 'parked', guest: 'Emily Davis', room: '401', phone: '(555) 010-7723',
    currentSpot: 'P1-B01', registeredAt: '2026-08-12 09:00 AM', lastSeen: '2026-08-15 08:30 AM',
    flagged: false, flagReason: null, visits: 5,
    history: [
      { id: 1, date: '2026-08-12 09:00 AM', action: 'checkin', spot: 'P1-B01', by: 'Front Desk', note: 'Registered at check-in' },
      { id: 2, date: '2026-08-13 08:15 AM', action: 'valet-park', spot: 'P1-B01', by: 'Valet — Marcus', note: 'Repositioned for line painting' },
      { id: 3, date: '2026-08-15 08:30 AM', action: 'note', spot: 'P1-B01', by: 'System', note: 'EV charging session started' },
    ],
  },
  {
    id: 'VEH-1005', plate: 'RIV-8842', state: 'CA', make: 'Rivian', model: 'R1T', color: 'Green',
    type: 'guest', status: 'parked', guest: 'David Park', room: '502', phone: '(555) 010-3390',
    currentSpot: 'P1-B02', registeredAt: '2026-08-10 03:20 PM', lastSeen: '2026-08-15 01:00 PM',
    flagged: false, flagReason: null, visits: 2,
    history: [
      { id: 1, date: '2026-08-10 03:20 PM', action: 'checkin', spot: 'P1-B02', by: 'Front Desk', note: 'Registered at check-in' },
    ],
  },
  {
    id: 'VEH-1006', plate: 'CAM-3344', state: 'AZ', make: 'Toyota', model: 'Camry', color: 'Gray',
    type: 'guest', status: 'departed', guest: 'Lisa Wong', room: '310', phone: '(555) 010-6612',
    currentSpot: null, registeredAt: '2026-08-08 01:10 PM', lastSeen: '2026-08-12 10:45 AM',
    flagged: false, flagReason: null, visits: 4,
    history: [
      { id: 1, date: '2026-08-08 01:10 PM', action: 'checkin', spot: 'P2-C01', by: 'Front Desk', note: 'Registered at check-in' },
      { id: 2, date: '2026-08-12 10:45 AM', action: 'checkout', spot: 'P2-C01', by: 'Front Desk', note: 'Guest checked out, spot released' },
    ],
  },
  {
    id: 'VEH-1007', plate: 'VAL-001', state: 'CA', make: 'Porsche', model: '911', color: 'Red',
    type: 'guest', status: 'parked', guest: 'Michael Chen', room: 'VIP', phone: '(555) 010-1188',
    currentSpot: 'P2-D01', registeredAt: '2026-08-12 04:30 PM', lastSeen: '2026-08-15 12:30 PM',
    flagged: false, flagReason: null, visits: 8,
    history: [
      { id: 1, date: '2026-08-12 04:30 PM', action: 'checkin', spot: 'P2-D01', by: 'Valet — Marcus', note: 'VIP arrival, valet ticket V-1024 issued' },
      { id: 2, date: '2026-08-14 07:00 PM', action: 'valet-retrieve', spot: 'P2-D01', by: 'Valet — Marcus', note: 'Retrieved for dinner reservation' },
      { id: 3, date: '2026-08-14 09:45 PM', action: 'valet-park', spot: 'P2-D01', by: 'Valet — Marcus', note: 'Returned to valet zone' },
    ],
  },
  {
    id: 'VEH-1008', plate: 'STF-2210', state: 'CA', make: 'Toyota', model: 'Corolla', color: 'White',
    type: 'staff', status: 'parked', guest: 'James Okafor', room: 'Housekeeping', phone: '(555) 010-0021',
    currentSpot: 'P3-S01', registeredAt: '2026-01-05 08:00 AM', lastSeen: '2026-08-15 06:45 AM',
    flagged: false, flagReason: null, visits: 142,
    history: [
      { id: 1, date: '2026-01-05 08:00 AM', action: 'checkin', spot: 'P3-S01', by: 'HR / Security', note: 'Staff parking permit issued' },
      { id: 2, date: '2026-08-15 06:45 AM', action: 'note', spot: 'P3-S01', by: 'Security', note: 'Badge scan confirms daily shift arrival' },
    ],
  },
  {
    id: 'VEH-1009', plate: 'LNX-4487', state: 'NV', make: 'Chevrolet', model: 'Malibu', color: 'Black',
    type: 'vendor', status: 'flagged', guest: null, room: null, phone: '(555) 010-5540',
    currentSpot: null, registeredAt: '2026-08-14 05:15 AM', lastSeen: '2026-08-14 07:50 AM',
    flagged: true, flagReason: 'Overstayed loading dock window by 3+ hours; blocked delivery access', visits: 6,
    history: [
      { id: 1, date: '2026-08-14 05:15 AM', action: 'checkin', spot: 'Loading Dock', by: 'Security', note: 'Linen vendor, scheduled 30-min drop-off' },
      { id: 2, date: '2026-08-14 07:50 AM', action: 'flagged', spot: 'Loading Dock', by: 'Security — Dana', note: 'Overstayed loading dock window by 3+ hours; blocked delivery access' },
    ],
  },
  {
    id: 'VEH-1010', plate: 'MIN-7721', state: 'CA', make: 'Mini', model: 'Cooper', color: 'Yellow',
    type: 'guest', status: 'flagged', guest: 'Amanda Wilson', room: '205', phone: '(555) 010-8834',
    currentSpot: 'P2-C03', registeredAt: '2026-08-13 09:10 AM', lastSeen: '2026-08-14 11:20 PM',
    flagged: true, flagReason: 'Parked across two accessible spots overnight — second warning', visits: 1,
    history: [
      { id: 1, date: '2026-08-13 09:10 AM', action: 'checkin', spot: 'P2-C03', by: 'Front Desk', note: 'Registered at check-in' },
      { id: 2, date: '2026-08-14 11:20 PM', action: 'flagged', spot: 'P2-C03', by: 'Security — Dana', note: 'Parked across two accessible spots overnight — second warning' },
    ],
  },
];

/* ─── Helpers ─── */
function formatPlate(plate, state) {
  return state ? `${plate} · ${state}` : plate;
}

const typeMeta = {
  guest: { label: 'Guest', icon: User },
  staff: { label: 'Staff', icon: Briefcase },
  vendor: { label: 'Vendor', icon: Truck },
};

const statusMeta = {
  parked: { label: 'On Property', dot: 'bg-accent', class: 'bg-accent/10 text-accent border-accent/20' },
  departed: { label: 'Departed', dot: 'bg-neutral', class: 'bg-neutral/10 text-neutral border-neutral/20' },
  flagged: { label: 'Flagged', dot: 'bg-danger', class: 'bg-danger/10 text-danger border-danger/20' },
};

const historyMeta = {
  checkin: { label: 'Checked In', icon: LogIn, class: 'text-accent bg-accent/10' },
  checkout: { label: 'Checked Out', icon: LogOut, class: 'text-neutral bg-neutral/10' },
  'valet-park': { label: 'Valet Parked', icon: KeyRound, class: 'text-secondary bg-secondary/10' },
  'valet-retrieve': { label: 'Valet Retrieved', icon: KeyRound, class: 'text-secondary bg-secondary/10' },
  flagged: { label: 'Flagged', icon: ShieldAlert, class: 'text-danger bg-danger/10' },
  note: { label: 'Note', icon: History, class: 'text-text-muted bg-surface-elevated' },
};

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

/* ─── Vehicle Detail Modal ─── */
function VehicleDetailModal({ vehicle, onClose, onToggleFlag }) {
  const [flagReason, setFlagReason] = useState('');
  const TypeIcon = typeMeta[vehicle.type].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-background shadow-2xl">
        <div className="sticky top-0 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary font-mono">{formatPlate(vehicle.plate, vehicle.state)}</h3>
            <p className="text-xs text-text-muted">{vehicle.make} {vehicle.model} · {vehicle.color}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status Banner */}
          <div className={cn('rounded-lg border p-3', statusMeta[vehicle.status].class)}>
            <div className="flex items-center gap-2">
              <span className={cn('h-2.5 w-2.5 rounded-full', statusMeta[vehicle.status].dot)} />
              <span className="text-sm font-semibold">{statusMeta[vehicle.status].label}</span>
              {vehicle.currentSpot && <span className="text-xs opacity-80">· Spot {vehicle.currentSpot}</span>}
            </div>
            {vehicle.flagged && vehicle.flagReason && (
              <p className="mt-1.5 text-xs">{vehicle.flagReason}</p>
            )}
          </div>

          {/* Vehicle Details */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Vehicle Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Car className="h-4 w-4 text-text-muted" />
                <span className="text-text-primary font-medium">{vehicle.make} {vehicle.model}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <QrCode className="h-4 w-4 text-text-muted" />
                <span className="font-mono text-text-primary">{formatPlate(vehicle.plate, vehicle.state)}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <TypeIcon className="h-4 w-4 text-text-muted" />
                <span className="text-text-primary">{typeMeta[vehicle.type].label} vehicle</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <History className="h-4 w-4 text-text-muted" />
                <span className="text-text-primary">{vehicle.visits} visit{vehicle.visits === 1 ? '' : 's'} on file</span>
              </div>
            </div>
          </div>

          {/* Guest / Staff Linkage */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {vehicle.type === 'guest' ? 'Guest Linkage' : vehicle.type === 'staff' ? 'Staff Linkage' : 'Vendor Contact'}
            </h4>
            {vehicle.guest ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <User className="h-4 w-4 text-text-muted" />
                  <span className="text-text-primary">{vehicle.guest}</span>
                </div>
                {vehicle.room && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <MapPin className="h-4 w-4 text-text-muted" />
                    <span className="text-text-primary">{vehicle.type === 'guest' ? `Room ${vehicle.room}` : vehicle.room}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-text-secondary col-span-2">
                  <Phone className="h-4 w-4 text-text-muted" />
                  <span className="text-text-primary">{vehicle.phone}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Building2 className="h-4 w-4 text-text-muted" />
                <span>No guest on file · {vehicle.phone}</span>
              </div>
            )}
            {vehicle.type === 'guest' && vehicle.guest && (
              <Button variant="outline" size="sm" className="w-full justify-center">
                <ArrowUpRight className="mr-1.5 h-4 w-4" /> View Guest Profile
              </Button>
            )}
          </div>

          {/* History Timeline */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <History className="h-4 w-4" /> Parking History
            </h4>
            <div className="space-y-4">
              {vehicle.history.map((entry, idx) => {
                const meta = historyMeta[entry.action];
                const EntryIcon = meta.icon;
                return (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', meta.class)}>
                        <EntryIcon className="h-3.5 w-3.5" />
                      </div>
                      {idx < vehicle.history.length - 1 && <div className="mt-1 w-px flex-1 bg-border" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-text-primary">
                        {meta.label}{entry.spot && <span className="text-text-muted font-normal"> · {entry.spot}</span>}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">{entry.date} · {entry.by}</p>
                      {entry.note && <p className="text-xs text-text-secondary mt-1">{entry.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flag / Unflag */}
          {!vehicle.flagged ? (
            <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">Flag Vehicle</label>
              <input
                type="text"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Reason (e.g. overstay, blocked spot, complaint)"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                variant="danger"
                size="sm"
                className="w-full justify-center"
                disabled={!flagReason.trim()}
                onClick={() => onToggleFlag(vehicle.id, true, flagReason.trim())}
              >
                <ShieldAlert className="mr-1.5 h-4 w-4" /> Flag Vehicle
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center"
              onClick={() => onToggleFlag(vehicle.id, false, null)}
            >
              <ShieldOff className="mr-1.5 h-4 w-4" /> Clear Flag
            </Button>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Add Vehicle Modal ─── */
function AddVehicleModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    plate: '', state: '', make: '', model: '', color: '',
    type: 'guest', guest: '', room: '', phone: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Register Vehicle</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted"><XCircle className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">License Plate</label>
              <input
                type="text" required value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
                placeholder="ABC-1234"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">State</label>
              <input
                type="text" value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                placeholder="CA"
                maxLength={2}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Make</label>
              <input
                type="text" required value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
                placeholder="Tesla"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Model</label>
              <input
                type="text" required value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="Model 3"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.entries(typeMeta).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                {form.type === 'guest' ? 'Guest Name' : form.type === 'staff' ? 'Employee Name' : 'Contact Name'}
              </label>
              <input
                type="text" value={form.guest}
                onChange={(e) => setForm({ ...form, guest: e.target.value })}
                placeholder="Optional"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                {form.type === 'guest' ? 'Room #' : 'Department / Company'}
              </label>
              <input
                type="text" value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="Optional"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Phone</label>
            <input
              type="tel" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(555) 010-0000"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="secondary" size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Register Vehicle
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function VehicleRegistryPage() {
  const [vehicles, setVehicles] = useState(vehicleRegistry);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  /* ─── Computed ─── */
  const stats = useMemo(() => {
    const total = vehicles.length;
    const parked = vehicles.filter((v) => v.status === 'parked').length;
    const guestLinked = vehicles.filter((v) => v.type === 'guest' && v.guest).length;
    const flagged = vehicles.filter((v) => v.flagged).length;
    return { total, parked, guestLinked, flagged };
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vehicles.filter((v) => {
      const matchesSearch = !q ||
        v.plate.toLowerCase().includes(q) ||
        `${v.make} ${v.model}`.toLowerCase().includes(q) ||
        (v.guest && v.guest.toLowerCase().includes(q)) ||
        (v.room && v.room.toLowerCase().includes(q));
      const matchesType = typeFilter === 'all' || v.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [vehicles, search, typeFilter, statusFilter]);

  /* ─── Handlers ─── */
  const handleAddVehicle = (form) => {
    const now = new Date().toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    const newVehicle = {
      id: `VEH-${1000 + vehicles.length + 1}`,
      plate: form.plate, state: form.state, make: form.make, model: form.model, color: form.color,
      type: form.type, status: 'parked', guest: form.guest || null, room: form.room || null,
      phone: form.phone, currentSpot: null, registeredAt: now, lastSeen: now,
      flagged: false, flagReason: null, visits: 1,
      history: [
        { id: 1, date: now, action: 'checkin', spot: null, by: 'Front Desk', note: 'Registered in vehicle registry' },
      ],
    };
    setVehicles((prev) => [newVehicle, ...prev]);
  };

  const handleToggleFlag = (vehicleId, flagged, reason) => {
    const now = new Date().toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    setVehicles((prev) => prev.map((v) => {
      if (v.id !== vehicleId) return v;
      const entry = {
        id: v.history.length + 1,
        date: now,
        action: flagged ? 'flagged' : 'note',
        spot: v.currentSpot,
        by: 'Front Desk',
        note: flagged ? reason : 'Flag cleared',
      };
      return {
        ...v,
        flagged,
        flagReason: flagged ? reason : null,
        status: flagged ? 'flagged' : (v.currentSpot ? 'parked' : 'departed'),
        history: [...v.history, entry],
      };
    }));
    setSelectedVehicle((prev) => (prev && prev.id === vehicleId
      ? { ...prev, flagged, flagReason: flagged ? reason : null, status: flagged ? 'flagged' : (prev.currentSpot ? 'parked' : 'departed'), history: [...prev.history, { id: prev.history.length + 1, date: now, action: flagged ? 'flagged' : 'note', spot: prev.currentSpot, by: 'Front Desk', note: flagged ? reason : 'Flag cleared' }] }
      : prev));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Vehicle Registry</h1>
          <p className="text-sm text-text-secondary">License plates, guest linkage, and parking history</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Register Vehicle
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Vehicles" value={stats.total} icon={Car} color="text-text-primary" subtext="All records" />
        <StatCard label="On Property" value={stats.parked} icon={CheckCircle2} color="text-accent" />
        <StatCard label="Guest-Linked" value={stats.guestLinked} icon={User} color="text-secondary" />
        <StatCard label="Flagged" value={stats.flagged} icon={AlertTriangle} color="text-danger" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Input
            icon={Search}
            placeholder="Search plate, vehicle, guest, room…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Types</option>
            {Object.entries(typeMeta).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>
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
      </div>

      {/* Registry Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Plate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Guest / Room</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Spot</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Last Seen</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredVehicles.map((v) => {
                const TypeIcon = typeMeta[v.type].icon;
                return (
                  <tr key={v.id} className="hover:bg-background/50 transition-colors cursor-pointer" onClick={() => setSelectedVehicle(v)}>
                    <td className="px-4 py-3 font-mono text-text-primary">
                      {v.plate}
                      {v.state && <span className="text-text-muted"> · {v.state}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-text-primary">{v.make} {v.model}</p>
                      <p className="text-xs text-text-muted">{v.color}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-text-secondary">
                        <TypeIcon className="h-3.5 w-3.5 text-text-muted" /> {typeMeta[v.type].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {v.guest ? (
                        <>
                          <p className="text-text-primary">{v.guest}</p>
                          {v.room && <p className="text-xs text-text-muted">{v.type === 'guest' ? `Room ${v.room}` : v.room}</p>}
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium', statusMeta[v.status].class)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', statusMeta[v.status].dot)} />
                        {statusMeta[v.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-text-secondary">{v.currentSpot || '—'}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{v.lastSeen}</td>
                    <td className="px-4 py-3">
                      <ChevronRight className="h-4 w-4 text-text-muted" />
                    </td>
                  </tr>
                );
              })}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                    No vehicles match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedVehicle && (
        <VehicleDetailModal
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onToggleFlag={handleToggleFlag}
        />
      )}
      {showAdd && (
        <AddVehicleModal
          onClose={() => setShowAdd(false)}
          onAdd={handleAddVehicle}
        />
      )}
    </div>
  );
}