/* src/app/app/parking/spots/page.jsx */
import { useState, useMemo } from 'react';
import {
  Car,
  MapPin,
  Search,
  Plus,
  LayoutGrid,
  List,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Ban,
  Shield,
  Zap,
  KeyRound,
  User,
  Calendar,
  DollarSign,
  ChevronRight,
  Pencil,
  Trash2,
  Download,
  QrCode,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';

/* ─── Mock Data ─── */
const initialSpots = [
  {
    id: 'P1-A01',
    zone: 'A',
    type: 'standard',
    status: 'occupied',
    rate: 35,
    evCapable: false,
    accessible: false,
    vehicle: 'Tesla Model 3',
    plate: 'ABC-1234',
    guest: 'John Smith',
    room: '204',
    checkOut: '2026-08-15',
  },
  {
    id: 'P1-A02',
    zone: 'A',
    type: 'compact',
    status: 'available',
    rate: 25,
    evCapable: false,
    accessible: false,
  },
  {
    id: 'P1-A03',
    zone: 'A',
    type: 'standard',
    status: 'available',
    rate: 35,
    evCapable: false,
    accessible: false,
  },
  {
    id: 'P1-A04',
    zone: 'A',
    type: 'oversized',
    status: 'occupied',
    rate: 45,
    evCapable: false,
    accessible: false,
    vehicle: 'Ford F-150',
    plate: 'TRK-9012',
    guest: 'Mike Brown',
    room: '105',
    checkOut: '2026-08-20',
  },
  {
    id: 'P1-A05',
    zone: 'A',
    type: 'accessible',
    status: 'available',
    rate: 35,
    evCapable: false,
    accessible: true,
  },
  {
    id: 'P1-B01',
    zone: 'B',
    type: 'ev',
    status: 'occupied',
    rate: 45,
    evCapable: true,
    accessible: false,
    vehicle: 'BMW iX',
    plate: 'EV-2026',
    guest: 'Emily Davis',
    room: '401',
    checkOut: '2026-08-13',
  },
  {
    id: 'P1-B02',
    zone: 'B',
    type: 'ev',
    status: 'available',
    rate: 45,
    evCapable: true,
    accessible: false,
  },
  {
    id: 'P1-B03',
    zone: 'B',
    type: 'standard',
    status: 'maintenance',
    rate: 35,
    evCapable: false,
    accessible: false,
    note: 'Line painting — blocked until 3 PM',
  },
  {
    id: 'P1-B04',
    zone: 'B',
    type: 'compact',
    status: 'reserved',
    rate: 25,
    evCapable: false,
    accessible: false,
    guest: 'Robert Chen',
    room: '118',
    checkOut: '2026-08-12',
  },
  {
    id: 'P2-C01',
    zone: 'C',
    type: 'standard',
    status: 'occupied',
    rate: 35,
    evCapable: false,
    accessible: false,
    vehicle: 'Toyota Camry',
    plate: 'CAM-3344',
    guest: 'Lisa Wong',
    room: '310',
    checkOut: '2026-08-16',
  },
  {
    id: 'P2-C02',
    zone: 'C',
    type: 'oversized',
    status: 'available',
    rate: 45,
    evCapable: false,
    accessible: false,
  },
  {
    id: 'P2-C03',
    zone: 'C',
    type: 'accessible',
    status: 'occupied',
    rate: 35,
    evCapable: false,
    accessible: true,
    vehicle: 'Mercedes Sprinter',
    plate: 'SPR-5566',
    guest: 'State Youth Soccer',
    room: 'Group',
    checkOut: '2026-08-16',
  },
  {
    id: 'P2-D01',
    zone: 'D',
    type: 'valet',
    status: 'occupied',
    rate: 55,
    evCapable: false,
    accessible: false,
    vehicle: 'Porsche 911',
    plate: 'VAL-001',
    guest: 'Michael Chen',
    room: 'VIP',
    checkOut: '2026-08-18',
  },
  {
    id: 'P2-D02',
    zone: 'D',
    type: 'valet',
    status: 'out-of-service',
    rate: 55,
    evCapable: false,
    accessible: false,
    note: 'Awaiting repaving',
  },
];

/* ─── Helpers ─── */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZAR' }).format(amount);
}

const statusMeta = {
  available: {
    label: 'Available',
    dot: 'bg-accent',
    class: 'bg-accent/10 text-accent border-accent/20',
  },
  occupied: {
    label: 'Occupied',
    dot: 'bg-secondary',
    class: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  reserved: { label: 'Reserved', dot: 'bg-info', class: 'bg-info/10 text-info border-info/20' },
  maintenance: {
    label: 'Maintenance',
    dot: 'bg-warning',
    class: 'bg-warning/10 text-warning border-warning/20',
  },
  'out-of-service': {
    label: 'Out of Service',
    dot: 'bg-neutral',
    class: 'bg-neutral/10 text-neutral border-neutral/20',
  },
};

const typeMeta = {
  standard: { label: 'Standard', icon: Car, defaultRate: 35 },
  compact: { label: 'Compact', icon: Car, defaultRate: 25 },
  oversized: { label: 'Oversized', icon: Car, defaultRate: 45 },
  accessible: { label: 'Accessible', icon: Shield, defaultRate: 35 },
  ev: { label: 'EV Charging', icon: Zap, defaultRate: 45 },
  valet: { label: 'Valet', icon: KeyRound, defaultRate: 55 },
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
        <div
          className={cn(
            'rounded-lg p-2.5',
            color
              .replace('text-', 'bg-')
              .replace('danger', 'danger/10')
              .replace('accent', 'accent/10')
              .replace('warning', 'warning/10')
              .replace('info', 'info/10')
              .replace('secondary', 'secondary/10')
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

function SpotCard({ spot, onClick }) {
  const meta = statusMeta[spot.status];
  const type = typeMeta[spot.type];
  const TypeIcon = type.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative rounded-xl border p-4 text-left transition-all hover:shadow-md w-full',
        spot.status === 'maintenance' || spot.status === 'out-of-service'
          ? 'border-warning/30 bg-warning/5 opacity-70'
          : spot.status === 'occupied'
            ? 'border-secondary/30 bg-secondary/5'
            : spot.status === 'reserved'
              ? 'border-info/30 bg-info/5'
              : 'border-border bg-surface hover:border-accent/50'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-bold text-text-muted">{spot.id}</span>
        <span className={cn('h-2.5 w-2.5 rounded-full', meta.dot)} />
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <TypeIcon
          className={cn('h-3.5 w-3.5', spot.type === 'ev' ? 'text-emerald-500' : 'text-text-muted')}
        />
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
          {type.label}
        </span>
        <span className="ml-auto text-[10px] font-mono text-text-muted">
          {formatCurrency(spot.rate)}
        </span>
      </div>

      {spot.vehicle || spot.guest ? (
        <div className="space-y-1">
          {spot.vehicle && (
            <p className="text-sm font-medium text-text-primary truncate">{spot.vehicle}</p>
          )}
          {spot.plate && <p className="text-xs font-mono text-text-secondary">{spot.plate}</p>}
          {spot.guest && (
            <div className="flex items-center gap-1.5 text-[10px] text-text-muted mt-1">
              <User className="h-3 w-3" />
              <span className="truncate">{spot.guest}</span>
              {spot.room && <span className="text-text-secondary">· {spot.room}</span>}
            </div>
          )}
        </div>
      ) : (
        <div className="py-2 text-center">
          <p className="text-xs text-text-muted">{meta.label}</p>
          {spot.note && <p className="text-[10px] text-warning mt-1">{spot.note}</p>}
        </div>
      )}
    </button>
  );
}

/* ─── Spot Form Modal (Add / Edit) ─── */
function SpotFormModal({ spot, existingIds, onClose, onSave }) {
  const isEdit = Boolean(spot);
  const [form, setForm] = useState({
    id: spot?.id || '',
    zone: spot?.zone || 'A',
    type: spot?.type || 'standard',
    rate: spot?.rate ?? typeMeta.standard.defaultRate,
    evCapable: spot?.evCapable || false,
    accessible: spot?.accessible || false,
  });
  const [idError, setIdError] = useState('');

  const handleTypeChange = (type) => {
    setForm((f) => ({
      ...f,
      type,
      rate: typeMeta[type].defaultRate,
      evCapable: type === 'ev' ? true : f.evCapable,
      accessible: type === 'accessible' ? true : f.accessible,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isEdit && existingIds.includes(form.id.toUpperCase())) {
      setIdError('A spot with this ID already exists.');
      return;
    }
    onSave({ ...form, id: form.id.toUpperCase(), rate: Number(form.rate) }, isEdit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">
            {isEdit ? 'Edit Spot' : 'Add Spot'}
          </h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Spot ID
              </label>
              <input
                type="text"
                required
                disabled={isEdit}
                value={form.id}
                onChange={(e) => {
                  setForm({ ...form, id: e.target.value.toUpperCase() });
                  setIdError('');
                }}
                placeholder="P1-A06"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              />
              {idError && <p className="mt-1 text-xs text-danger">{idError}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Zone
              </label>
              <input
                type="text"
                required
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value.toUpperCase() })}
                placeholder="A"
                maxLength={2}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.entries(typeMeta).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Rate / Night
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={form.evCapable}
                onChange={(e) => setForm({ ...form, evCapable: e.target.checked })}
                className="h-4 w-4 rounded border-border accent-secondary"
              />
              EV capable
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={form.accessible}
                onChange={(e) => setForm({ ...form, accessible: e.target.checked })}
                className="h-4 w-4 rounded border-border accent-secondary"
              />
              Accessible
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" size="sm">
              {isEdit ? (
                <>
                  <Pencil className="mr-1.5 h-4 w-4" /> Save Changes
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Spot
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Assign Vehicle Modal ─── */
function AssignVehicleModal({ spot, onClose, onAssign }) {
  const [form, setForm] = useState({ vehicle: '', plate: '', guest: '', room: '', checkOut: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign(spot.id, { ...form, checkIn: new Date().toISOString().split('T')[0] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Assign to {spot.id}</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Vehicle
              </label>
              <input
                type="text"
                required
                value={form.vehicle}
                onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                placeholder="Make & Model"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                License Plate
              </label>
              <input
                type="text"
                required
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
                placeholder="ABC-1234"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Guest Name
              </label>
              <input
                type="text"
                value={form.guest}
                onChange={(e) => setForm({ ...form, guest: e.target.value })}
                placeholder="Optional"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Room #
              </label>
              <input
                type="text"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="Optional"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Checkout Date
            </label>
            <input
              type="date"
              required
              value={form.checkOut}
              onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Assign
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Spot Detail Modal ─── */
function SpotDetailModal({
  spot,
  onClose,
  onUpdateStatus,
  onEdit,
  onDelete,
  onOpenAssign,
  onRelease,
}) {
  const meta = statusMeta[spot.status];
  const type = typeMeta[spot.type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
        <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary">Spot {spot.id}</h3>
            <p className="text-xs text-text-muted">
              {type.label} · Zone {spot.zone} · {formatCurrency(spot.rate)}/night
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className={cn('rounded-lg border p-3', meta.class)}>
            <div className="flex items-center gap-2">
              <span className={cn('h-2.5 w-2.5 rounded-full', meta.dot)} />
              <span className="text-sm font-semibold">{meta.label}</span>
            </div>
            {spot.note && <p className="mt-1.5 text-xs">{spot.note}</p>}
          </div>

          {/* Config */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Configuration
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <type.icon className="h-4 w-4 text-text-muted" />
                <span className="text-text-primary">{type.label}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <DollarSign className="h-4 w-4 text-text-muted" />
                <span className="font-mono text-text-primary">
                  {formatCurrency(spot.rate)}/night
                </span>
              </div>
              {spot.evCapable && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Zap className="h-4 w-4 text-emerald-500" />
                  <span className="text-text-primary">EV capable</span>
                </div>
              )}
              {spot.accessible && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Shield className="h-4 w-4 text-text-muted" />
                  <span className="text-text-primary">Accessible</span>
                </div>
              )}
            </div>
          </div>

          {/* Assignment */}
          {spot.vehicle || spot.guest ? (
            <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Current Assignment
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {spot.vehicle && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Car className="h-4 w-4 text-text-muted" />
                    <span className="text-text-primary font-medium">{spot.vehicle}</span>
                  </div>
                )}
                {spot.plate && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <QrCode className="h-4 w-4 text-text-muted" />
                    <span className="font-mono text-text-primary">{spot.plate}</span>
                  </div>
                )}
                {spot.guest && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <User className="h-4 w-4 text-text-muted" />
                    <span className="text-text-primary">{spot.guest}</span>
                  </div>
                )}
                {spot.room && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <MapPin className="h-4 w-4 text-text-muted" />
                    <span className="text-text-primary">Room {spot.room}</span>
                  </div>
                )}
                {spot.checkOut && (
                  <div className="flex items-center gap-2 text-text-secondary col-span-2">
                    <Calendar className="h-4 w-4 text-text-muted" />
                    <span>Checkout {spot.checkOut}</span>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => onRelease(spot.id)}
              >
                Release Spot
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <Car className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-text-muted mb-3">No vehicle assigned to this spot</p>
              {spot.status === 'available' && (
                <Button variant="secondary" size="sm" onClick={() => onOpenAssign(spot)}>
                  <Plus className="mr-1.5 h-4 w-4" /> Assign Vehicle
                </Button>
              )}
            </div>
          )}

          {/* Status Actions */}
          <div>
            <label className="mb-2 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Change Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(statusMeta).map(([key, sm]) => (
                <button
                  key={key}
                  onClick={() => onUpdateStatus(spot.id, key)}
                  className={cn(
                    'rounded-md border px-3 py-2 text-xs font-medium transition-colors',
                    spot.status === key
                      ? sm.class
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {sm.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between gap-2 pt-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                onDelete(spot.id);
                onClose();
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(spot)}>
                <Pencil className="mr-1.5 h-4 w-4" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function SpotManagementPage() {
  const [spots, setSpots] = useState(initialSpots);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [formSpot, setFormSpot] = useState(undefined); // undefined = closed, null = add, object = edit
  const [assignTarget, setAssignTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  /* ─── Computed ─── */
  const stats = useMemo(() => {
    const total = spots.length;
    const available = spots.filter((s) => s.status === 'available').length;
    const occupied = spots.filter((s) => s.status === 'occupied').length;
    const outOfService = spots.filter(
      (s) => s.status === 'maintenance' || s.status === 'out-of-service'
    ).length;
    return { total, available, occupied, outOfService };
  }, [spots]);

  const zones = [...new Set(spots.map((s) => s.zone))].sort();

  const filteredSpots = useMemo(() => {
    const q = search.trim().toLowerCase();
    return spots.filter((s) => {
      const matchesSearch =
        !q ||
        s.id.toLowerCase().includes(q) ||
        (s.vehicle && s.vehicle.toLowerCase().includes(q)) ||
        (s.plate && s.plate.toLowerCase().includes(q)) ||
        (s.guest && s.guest.toLowerCase().includes(q));
      const matchesZone = zoneFilter === 'all' || s.zone === zoneFilter;
      const matchesType = typeFilter === 'all' || s.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesZone && matchesType && matchesStatus;
    });
  }, [spots, search, zoneFilter, typeFilter, statusFilter]);

  /* ─── Handlers ─── */
  const handleSaveSpot = (spotData, isEdit) => {
    if (isEdit) {
      setSpots((prev) => prev.map((s) => (s.id === spotData.id ? { ...s, ...spotData } : s)));
      setSelectedSpot((prev) =>
        prev && prev.id === spotData.id ? { ...prev, ...spotData } : prev
      );
    } else {
      setSpots((prev) => [...prev, { ...spotData, status: 'available' }]);
    }
  };

  const handleDeleteSpot = (spotId) => {
    setSpots((prev) => prev.filter((s) => s.id !== spotId));
    setSelectedSpot((prev) => (prev && prev.id === spotId ? null : prev));
  };

  const handleUpdateStatus = (spotId, status) => {
    setSpots((prev) => prev.map((s) => (s.id === spotId ? { ...s, status } : s)));
    setSelectedSpot((prev) => (prev && prev.id === spotId ? { ...prev, status } : prev));
  };

  const handleAssign = (spotId, assignment) => {
    setSpots((prev) =>
      prev.map((s) => (s.id === spotId ? { ...s, ...assignment, status: 'occupied' } : s))
    );
    setSelectedSpot((prev) =>
      prev && prev.id === spotId ? { ...prev, ...assignment, status: 'occupied' } : prev
    );
  };

  const handleRelease = (spotId) => {
    setSpots((prev) =>
      prev.map((s) =>
        s.id === spotId
          ? {
              ...s,
              status: 'available',
              vehicle: undefined,
              plate: undefined,
              guest: undefined,
              room: undefined,
              checkOut: undefined,
            }
          : s
      )
    );
    setSelectedSpot(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Spot Management</h1>
          <p className="text-sm text-text-secondary">
            Configure zones, types, rates, and live assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={() => setFormSpot(null)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Spot
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Spots"
          value={stats.total}
          icon={MapPin}
          color="text-text-primary"
          subtext="All zones"
        />
        <StatCard
          label="Available"
          value={stats.available}
          icon={CheckCircle2}
          color="text-accent"
        />
        <StatCard
          label="Occupied"
          value={stats.occupied}
          icon={Car}
          color="text-secondary"
          subtext={`${Math.round((stats.occupied / stats.total) * 100)}% occupancy`}
        />
        <StatCard
          label="Out of Service"
          value={stats.outOfService}
          icon={Wrench}
          color="text-warning"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Input
            icon={Search}
            placeholder="Search spot, vehicle, plate, guest…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Zones</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                Zone {z}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Types</option>
            {Object.entries(typeMeta).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            {Object.entries(statusMeta).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
          <div className="flex rounded-md border border-border bg-surface p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded transition-colors',
                viewMode === 'grid'
                  ? 'bg-secondary text-white'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded transition-colors',
                viewMode === 'list'
                  ? 'bg-secondary text-white'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          {zones.map((zone) => {
            const zoneSpots = filteredSpots.filter((s) => s.zone === zone);
            if (zoneSpots.length === 0) return null;
            return (
              <div key={zone}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
                  Zone {zone}
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {zoneSpots.map((spot) => (
                    <SpotCard key={spot.id} spot={spot} onClick={() => setSelectedSpot(spot)} />
                  ))}
                </div>
              </div>
            );
          })}
          {filteredSpots.length === 0 && (
            <div className="rounded-xl border border-border bg-surface p-12 text-center">
              <Car className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-text-muted">No spots match your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    Spot
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    Assignment
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                    Rate
                  </th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSpots.map((spot) => (
                  <tr
                    key={spot.id}
                    className="hover:bg-background/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedSpot(spot)}
                  >
                    <td className="px-4 py-3 font-mono text-text-primary">{spot.id}</td>
                    <td className="px-4 py-3 text-text-secondary">{typeMeta[spot.type].label}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                          statusMeta[spot.status].class
                        )}
                      >
                        <span
                          className={cn('h-1.5 w-1.5 rounded-full', statusMeta[spot.status].dot)}
                        />
                        {statusMeta[spot.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {spot.vehicle ? (
                        <div>
                          <p className="text-sm text-text-primary">{spot.vehicle}</p>
                          <p className="text-xs font-mono text-text-muted">{spot.plate}</p>
                        </div>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text-primary">
                      {formatCurrency(spot.rate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormSpot(spot);
                          }}
                          className="rounded-md p-1.5 text-text-muted hover:bg-surface-elevated hover:text-text-primary"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-text-muted" />
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSpots.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                      No spots match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedSpot && (
        <SpotDetailModal
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
          onUpdateStatus={handleUpdateStatus}
          onEdit={(s) => setFormSpot(s)}
          onDelete={handleDeleteSpot}
          onOpenAssign={(s) => setAssignTarget(s)}
          onRelease={handleRelease}
        />
      )}
      {formSpot !== undefined && (
        <SpotFormModal
          spot={formSpot}
          existingIds={spots.map((s) => s.id)}
          onClose={() => setFormSpot(undefined)}
          onSave={handleSaveSpot}
        />
      )}
      {assignTarget && (
        <AssignVehicleModal
          spot={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
}
