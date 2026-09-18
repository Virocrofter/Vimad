/* src/app/app/parking/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  MapPin,
  BatteryCharging,
  KeyRound,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  LayoutGrid,
  List,
  Download,
  QrCode,
  Phone,
  User,
  Calendar,
  ChevronRight,
  Wrench,
  Zap,
  Ban,
  Shield,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';

/* ─── Mock Data ─── */
const parkingSpots = [
  {
    id: 'P1-A01',
    zone: 'A',
    type: 'standard',
    status: 'occupied',
    vehicle: 'Tesla Model 3',
    plate: 'ABC-1234',
    guest: 'John Smith',
    room: '204',
    checkIn: '2026-08-12',
    checkOut: '2026-08-15',
    rate: 35,
    evCapable: false,
    valet: false,
  },
  {
    id: 'P1-A02',
    zone: 'A',
    type: 'compact',
    status: 'occupied',
    vehicle: 'Honda Civic',
    plate: 'XYZ-5678',
    guest: 'Sarah Johnson',
    room: '312',
    checkIn: '2026-08-11',
    checkOut: '2026-08-14',
    rate: 25,
    evCapable: false,
    valet: false,
  },
  {
    id: 'P1-A03',
    zone: 'A',
    type: 'standard',
    status: 'available',
    vehicle: null,
    plate: null,
    guest: null,
    room: null,
    checkIn: null,
    checkOut: null,
    rate: 35,
    evCapable: false,
    valet: false,
  },
  {
    id: 'P1-A04',
    zone: 'A',
    type: 'oversized',
    status: 'occupied',
    vehicle: 'Ford F-150',
    plate: 'TRK-9012',
    guest: 'Mike Brown',
    room: '105',
    checkIn: '2026-08-15',
    checkOut: '2026-08-20',
    rate: 45,
    evCapable: false,
    valet: false,
  },
  {
    id: 'P1-A05',
    zone: 'A',
    type: 'accessible',
    status: 'available',
    vehicle: null,
    plate: null,
    guest: null,
    room: null,
    checkIn: null,
    checkOut: null,
    rate: 35,
    evCapable: false,
    valet: false,
  },
  {
    id: 'P1-B01',
    zone: 'B',
    type: 'ev',
    status: 'occupied',
    vehicle: 'BMW iX',
    plate: 'EV-2026',
    guest: 'Emily Davis',
    room: '401',
    checkIn: '2026-08-12',
    checkOut: '2026-08-13',
    rate: 45,
    evCapable: true,
    charging: true,
    chargeStart: '08:30 AM',
    chargeLevel: 78,
    valet: false,
  },
  {
    id: 'P1-B02',
    zone: 'B',
    type: 'ev',
    status: 'occupied',
    vehicle: 'Rivian R1T',
    plate: 'RIV-8842',
    guest: 'David Park',
    room: '502',
    checkIn: '2026-08-10',
    checkOut: '2026-08-16',
    rate: 45,
    evCapable: true,
    charging: false,
    chargeLevel: 92,
    valet: false,
  },
  {
    id: 'P1-B03',
    zone: 'B',
    type: 'ev',
    status: 'available',
    vehicle: null,
    plate: null,
    guest: null,
    room: null,
    checkIn: null,
    checkOut: null,
    rate: 45,
    evCapable: true,
    charging: false,
    chargeLevel: 0,
    valet: false,
  },
  {
    id: 'P1-B04',
    zone: 'B',
    type: 'standard',
    status: 'maintenance',
    vehicle: null,
    plate: null,
    guest: null,
    room: null,
    checkIn: null,
    checkOut: null,
    rate: 35,
    evCapable: false,
    valet: false,
    note: 'Line painting — blocked until 3 PM',
  },
  {
    id: 'P1-B05',
    zone: 'B',
    type: 'compact',
    status: 'reserved',
    vehicle: null,
    plate: null,
    guest: 'Robert Chen',
    room: '118',
    checkIn: '2026-08-12',
    checkOut: '2026-08-12',
    rate: 25,
    evCapable: false,
    valet: true,
  },
  {
    id: 'P2-C01',
    zone: 'C',
    type: 'standard',
    status: 'occupied',
    vehicle: 'Toyota Camry',
    plate: 'CAM-3344',
    guest: 'Lisa Wong',
    room: '310',
    checkIn: '2026-08-12',
    checkOut: '2026-08-16',
    rate: 35,
    evCapable: false,
    valet: false,
  },
  {
    id: 'P2-C02',
    zone: 'C',
    type: 'standard',
    status: 'available',
    vehicle: null,
    plate: null,
    guest: null,
    room: null,
    checkIn: null,
    checkOut: null,
    rate: 35,
    evCapable: false,
    valet: false,
  },
  {
    id: 'P2-C03',
    zone: 'C',
    type: 'compact',
    status: 'occupied',
    vehicle: 'Mini Cooper',
    plate: 'MIN-7721',
    guest: 'Amanda Wilson',
    room: '205',
    checkIn: '2026-08-13',
    checkOut: '2026-08-15',
    rate: 25,
    evCapable: false,
    valet: false,
  },
  {
    id: 'P2-C04',
    zone: 'C',
    type: 'oversized',
    status: 'available',
    vehicle: null,
    plate: null,
    guest: null,
    room: null,
    checkIn: null,
    checkOut: null,
    rate: 45,
    evCapable: false,
    valet: false,
  },
  {
    id: 'P2-C05',
    zone: 'C',
    type: 'accessible',
    status: 'occupied',
    vehicle: 'Mercedes Sprinter',
    plate: 'SPR-5566',
    guest: 'State Youth Soccer',
    room: 'Group',
    checkIn: '2026-08-14',
    checkOut: '2026-08-16',
    rate: 35,
    evCapable: false,
    valet: false,
  },
  {
    id: 'P2-D01',
    zone: 'D',
    type: 'valet',
    status: 'occupied',
    vehicle: 'Porsche 911',
    plate: 'VAL-001',
    guest: 'Michael Chen',
    room: 'VIP',
    checkIn: '2026-08-12',
    checkOut: '2026-08-18',
    rate: 55,
    evCapable: false,
    valet: true,
    ticketId: 'V-1024',
  },
  {
    id: 'P2-D02',
    zone: 'D',
    type: 'valet',
    status: 'occupied',
    vehicle: 'Range Rover',
    plate: 'VAL-002',
    guest: 'Sarah Williams',
    room: 'Suite 501',
    checkIn: '2026-08-12',
    checkOut: '2026-08-14',
    rate: 55,
    evCapable: false,
    valet: true,
    ticketId: 'V-1025',
  },
  {
    id: 'P2-D03',
    zone: 'D',
    type: 'valet',
    status: 'requested',
    vehicle: null,
    plate: null,
    guest: 'Jane Smith',
    room: '204',
    checkIn: null,
    checkOut: null,
    rate: 55,
    evCapable: false,
    valet: true,
    ticketId: 'V-1026',
    requestTime: '12:45 PM',
    requestType: 'Retrieve',
  },
];

const valetQueue = [
  {
    id: 'V-1026',
    guest: 'Jane Smith',
    room: '204',
    type: 'Retrieve',
    status: 'pending',
    time: '12:45 PM',
    plate: 'ABC-1234',
    vehicle: 'Tesla Model 3',
    spot: 'P1-A01',
  },
  {
    id: 'V-1027',
    guest: 'Robert Chen',
    room: '118',
    type: 'Park',
    status: 'in-progress',
    time: '12:50 PM',
    plate: 'CHN-9901',
    vehicle: 'Audi A4',
    spot: 'P1-B05',
  },
  {
    id: 'V-1028',
    guest: 'David Park',
    room: '502',
    type: 'Retrieve',
    status: 'pending',
    time: '1:00 PM',
    plate: 'RIV-8842',
    vehicle: 'Rivian R1T',
    spot: 'P1-B02',
  },
];

const recentTransactions = [
  {
    id: 1,
    time: '12:30 PM',
    description: 'Parking — John Smith (P1-A01)',
    amount: 35,
    method: 'Room Charge',
    postedBy: 'System',
  },
  {
    id: 2,
    time: '12:15 PM',
    description: 'Valet — Robert Chen (V-1027)',
    amount: 55,
    method: 'Room Charge',
    postedBy: 'System',
  },
  {
    id: 3,
    time: '11:45 AM',
    description: 'EV Charging — Emily Davis (P1-B01)',
    amount: 12.5,
    method: 'Room Charge',
    postedBy: 'System',
  },
  {
    id: 4,
    time: '11:30 AM',
    description: 'Oversized Surcharge — Mike Brown',
    amount: 10,
    method: 'Room Charge',
    postedBy: 'Mike C.',
  },
  {
    id: 5,
    time: '10:00 AM',
    description: 'Day Pass — Visitor',
    amount: 25,
    method: 'Credit Card',
    postedBy: 'Sarah J.',
  },
];

/* ─── Helpers ─── */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
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
  requested: {
    label: 'Valet Req',
    dot: 'bg-danger',
    class: 'bg-danger/10 text-danger border-danger/20',
  },
};

const typeMeta = {
  standard: { label: 'Standard', icon: Car },
  compact: { label: 'Compact', icon: Car },
  oversized: { label: 'Oversized', icon: Car },
  accessible: { label: 'Accessible', icon: Shield },
  ev: { label: 'EV Charging', icon: Zap },
  valet: { label: 'Valet', icon: KeyRound },
};

/* ─── Components ─── */
function StatCard({ label, value, subtext, icon: Icon, color, trend }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend !== undefined && (
            <p
              className={cn('mt-1 text-xs font-medium', trend >= 0 ? 'text-accent' : 'text-danger')}
            >
              {trend >= 0 ? '+' : ''}
              {trend}% vs last week
            </p>
          )}
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
        spot.status === 'maintenance'
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
      </div>

      {spot.vehicle ? (
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-primary truncate">{spot.vehicle}</p>
          <p className="text-xs font-mono text-text-secondary">{spot.plate}</p>
          {spot.guest && (
            <div className="flex items-center gap-1.5 text-[10px] text-text-muted mt-1">
              <User className="h-3 w-3" />
              <span className="truncate">{spot.guest}</span>
              {spot.room && <span className="text-text-secondary">· {spot.room}</span>}
            </div>
          )}
          {spot.evCapable && spot.charging && (
            <div className="mt-2 flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-1">
              <Zap className="h-3 w-3 text-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-600">{spot.chargeLevel}%</span>
            </div>
          )}
          {spot.valet && spot.ticketId && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-secondary">
              <KeyRound className="h-3 w-3" />
              <span className="font-mono">{spot.ticketId}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="py-2 text-center">
          <p className="text-xs text-text-muted">{meta.label}</p>
          {spot.note && <p className="text-[10px] text-warning mt-1">{spot.note}</p>}
        </div>
      )}

      {spot.status === 'requested' && (
        <div className="mt-2 rounded-md bg-danger/10 border border-danger/20 px-2 py-1">
          <p className="text-[10px] font-medium text-danger">{spot.requestType} requested</p>
          <p className="text-[10px] text-text-muted">{spot.requestTime}</p>
        </div>
      )}
    </button>
  );
}

/* ─── Spot Detail Modal ─── */
function SpotDetailModal({ spot, onClose, onUpdateStatus }) {
  const [newStatus, setNewStatus] = useState(spot.status);

  const handleStatusChange = (status) => {
    setNewStatus(status);
    onUpdateStatus(spot.id, status);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
        <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary">Spot {spot.id}</h3>
            <p className="text-xs text-text-muted">
              {typeMeta[spot.type].label} · Zone {spot.zone}
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
          {/* Status Banner */}
          <div className={cn('rounded-lg border p-3', statusMeta[newStatus || spot.status].class)}>
            <div className="flex items-center gap-2">
              <span
                className={cn('h-2.5 w-2.5 rounded-full', statusMeta[newStatus || spot.status].dot)}
              />
              <span className="text-sm font-semibold">
                {statusMeta[newStatus || spot.status].label}
              </span>
            </div>
          </div>

          {spot.vehicle ? (
            <>
              {/* Vehicle Info */}
              <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Vehicle Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Car className="h-4 w-4 text-text-muted" />
                    <span className="text-text-primary font-medium">{spot.vehicle}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <QrCode className="h-4 w-4 text-text-muted" />
                    <span className="font-mono text-text-primary">{spot.plate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <User className="h-4 w-4 text-text-muted" />
                    <span className="text-text-primary">{spot.guest}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <MapPin className="h-4 w-4 text-text-muted" />
                    <span className="text-text-primary">Room {spot.room}</span>
                  </div>
                </div>
              </div>

              {/* Stay Info */}
              <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Parking Stay
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Calendar className="h-4 w-4 text-text-muted" />
                    <span>
                      {spot.checkIn} → {spot.checkOut}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <DollarSign className="h-4 w-4 text-text-muted" />
                    <span className="font-mono">{formatCurrency(spot.rate)}/night</span>
                  </div>
                </div>
              </div>

              {/* EV Status */}
              {spot.evCapable && (
                <div className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
                      <Zap className="h-4 w-4 text-emerald-500" /> EV Charging
                    </h4>
                    <span
                      className={cn(
                        'text-sm font-bold font-mono',
                        spot.charging ? 'text-emerald-500' : 'text-text-muted'
                      )}
                    >
                      {spot.chargeLevel}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        spot.charging ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'
                      )}
                      style={{ width: `${spot.chargeLevel}%` }}
                    />
                  </div>
                  {spot.charging && (
                    <p className="mt-1 text-[10px] text-text-muted">
                      Started at {spot.chargeStart}
                    </p>
                  )}
                </div>
              )}

              {/* Valet Info */}
              {spot.valet && (
                <div className="rounded-xl border border-border bg-surface p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-secondary" /> Valet Service
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="font-mono text-text-primary">
                      {spot.ticketId || 'No ticket'}
                    </span>
                    <span>· {formatCurrency(spot.rate)}/night</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <Car className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-text-muted">No vehicle assigned to this spot</p>
            </div>
          )}

          {/* Status Actions */}
          <div>
            <label className="mb-2 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Change Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(statusMeta).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  className={cn(
                    'rounded-md border px-3 py-2 text-xs font-medium transition-colors',
                    (newStatus || spot.status) === key
                      ? meta.class
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {spot.vehicle && (
              <Button variant="secondary" size="sm">
                <ArrowUpRight className="mr-1.5 h-4 w-4" /> View Guest Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Assign Spot Modal ─── */
function AssignSpotModal({ availableSpots, onClose, onAssign }) {
  const [form, setForm] = useState({
    spotId: availableSpots[0]?.id || '',
    vehicle: '',
    plate: '',
    guest: '',
    room: '',
    checkOut: '',
    type: 'standard',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign({ ...form, status: 'occupied', checkIn: new Date().toISOString().split('T')[0] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Assign Parking Spot</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Spot
            </label>
            <select
              value={form.spotId}
              onChange={(e) => setForm({ ...form, spotId: e.target.value })}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {availableSpots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {typeMeta[s.type].label} ({s.zone})
                </option>
              ))}
            </select>
          </div>
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
              <Plus className="mr-1.5 h-4 w-4" /> Assign Spot
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ParkingDashboardPage() {
  const [spots, setSpots] = useState(parkingSpots);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [zoneFilter, setZoneFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  /* ─── Computed ─── */
  const stats = useMemo(() => {
    const total = spots.length;
    const occupied = spots.filter((s) => s.status === 'occupied').length;
    const available = spots.filter((s) => s.status === 'available').length;
    const evCharging = spots.filter((s) => s.evCapable && s.charging).length;
    const valetActive = spots.filter((s) => s.valet && s.status === 'occupied').length;
    const revenue = spots
      .filter((s) => s.status === 'occupied')
      .reduce((sum, s) => sum + s.rate, 0);
    return { total, occupied, available, evCharging, valetActive, revenue };
  }, [spots]);

  const filteredSpots = useMemo(() => {
    return spots.filter((s) => {
      const matchesZone = zoneFilter === 'all' || s.zone === zoneFilter;
      const matchesType = typeFilter === 'all' || s.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesZone && matchesType && matchesStatus;
    });
  }, [spots, zoneFilter, typeFilter, statusFilter]);

  const availableSpots = spots.filter((s) => s.status === 'available');

  const zones = [...new Set(spots.map((s) => s.zone))];

  /* ─── Handlers ─── */
  const handleUpdateStatus = (spotId, status) => {
    setSpots((prev) => prev.map((s) => (s.id === spotId ? { ...s, status } : s)));
  };

  const handleAssign = (form) => {
    setSpots((prev) =>
      prev.map((s) => {
        if (s.id !== form.spotId) return s;
        return {
          ...s,
          status: 'occupied',
          vehicle: form.vehicle,
          plate: form.plate,
          guest: form.guest,
          room: form.room,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Parking Management</h1>
          <p className="text-sm text-text-secondary">
            Spot assignment, valet queue, and EV tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowAssign(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Assign Spot
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total Spots"
          value={stats.total}
          icon={MapPin}
          color="text-text-primary"
          subtext="All zones"
        />
        <StatCard
          label="Occupied"
          value={stats.occupied}
          icon={Car}
          color="text-secondary"
          subtext={`${Math.round((stats.occupied / stats.total) * 100)}% occupancy`}
        />
        <StatCard
          label="Available"
          value={stats.available}
          icon={CheckCircle2}
          color="text-accent"
        />
        <StatCard
          label="EV Charging"
          value={stats.evCharging}
          icon={Zap}
          color="text-emerald-500"
          subtext="Active sessions"
        />
        <StatCard
          label="Valet Active"
          value={stats.valetActive}
          icon={KeyRound}
          color="text-warning"
        />
        <StatCard
          label="Today's Revenue"
          value={formatCurrency(stats.revenue)}
          icon={DollarSign}
          color="text-info"
          trend={8}
        />
      </div>

      {/* Valet Queue Alert */}
      {valetQueue.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border bg-background px-6 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-secondary" /> Valet Queue
            </h3>
            <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white">
              {valetQueue.filter((v) => v.status === 'pending').length} pending
            </span>
          </div>
          <div className="divide-y divide-border">
            {valetQueue.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between px-6 py-3 hover:bg-background/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg',
                      ticket.status === 'pending' ? 'bg-danger/10' : 'bg-secondary/10'
                    )}
                  >
                    <KeyRound
                      className={cn(
                        'h-4 w-4',
                        ticket.status === 'pending' ? 'text-danger' : 'text-secondary'
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {ticket.type} — {ticket.vehicle}
                    </p>
                    <p className="text-xs text-text-muted">
                      {ticket.guest} · Room {ticket.room} ·{' '}
                      <span className="font-mono">{ticket.plate}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-mono text-text-secondary">{ticket.id}</p>
                    <p className="text-[10px] text-text-muted">{ticket.time}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={
                      ticket.status === 'pending'
                        ? 'border-secondary text-secondary hover:bg-secondary/10'
                        : ''
                    }
                  >
                    {ticket.status === 'pending' ? 'Start' : 'In Progress'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        </div>
        <div className="flex items-center gap-2">
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
                    Vehicle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    Guest
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                    Rate
                  </th>
                  <th className="px-4 py-3 w-16"></th>
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
                    <td className="px-4 py-3 text-text-secondary">{spot.guest || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-text-primary">
                      {formatCurrency(spot.rate)}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="h-4 w-4 text-text-muted" />
                    </td>
                  </tr>
                ))}
                {filteredSpots.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                      No spots match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border bg-background px-6 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-secondary" /> Recent Transactions
          </h3>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Method
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3 text-text-secondary text-xs">{tx.time}</td>
                  <td className="px-4 py-3 text-text-primary">{tx.description}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{tx.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedSpot && (
        <SpotDetailModal
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
      {showAssign && (
        <AssignSpotModal
          availableSpots={availableSpots}
          onClose={() => setShowAssign(false)}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
}
