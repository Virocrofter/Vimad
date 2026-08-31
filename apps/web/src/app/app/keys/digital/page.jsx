/* src/app/app/keys/digital/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  KeyRound,
  Smartphone,
  Nfc,
  Bluetooth,
  QrCode,
  Clock,
  Search,
  Filter,
  Plus,
  X,
  MoreHorizontal,
  ArrowRightLeft,
  History,
  User,
  DoorOpen,
  Lock,
  Unlock,
  Shield,
  TrendingUp,
  AlertCircle,
  Calendar,
  MapPin,
  Tag,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Send,
  RotateCcw,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Wifi,
  WifiOff,
  Ban,
  Play,
  Pause,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';

/* ─── Mock Data ─── */
const digitalKeys = [
  {
    id: 'DK-2026-001',
    type: 'mobile',
    protocol: 'nfc',
    label: 'Room 204 — John Smith',
    room: '204',
    roomType: 'Deluxe King',
    guest: 'John Smith',
    guestId: 'G-1001',
    email: 'john.smith@email.com',
    phone: '+1 555-0101',
    status: 'active',
    issuedAt: '2026-08-12 15:30',
    expiresAt: '2026-08-15 11:00',
    lastUsed: '2026-08-15 08:45',
    useCount: 24,
    deviceName: 'iPhone 14 Pro',
    deviceOS: 'iOS 17.5',
    deviceId: 'AP-9X2K-M4L7',
    batteryLevel: 78,
    offlineAccess: true,
    pinFallback: true,
    biometricsRequired: false,
    location: 'On-property',
    notes: 'Anniversary stay. Late checkout approved.',
    history: [
      {
        action: 'issued',
        by: 'Sarah J.',
        time: '2026-08-12 15:30',
        note: 'Check-in — mobile key activated',
      },
      { action: 'used', by: 'System', time: '2026-08-12 15:35', note: 'First unlock — Room 204' },
      { action: 'used', by: 'System', time: '2026-08-15 08:45', note: 'Unlock — Room 204' },
    ],
  },
  {
    id: 'DK-2026-002',
    type: 'mobile',
    protocol: 'bluetooth',
    label: 'Room 205 — Amanda Wilson',
    room: '205',
    roomType: 'Suite',
    guest: 'Amanda Wilson',
    guestId: 'G-1008',
    email: 'amanda.w@email.com',
    phone: '+1 555-0108',
    status: 'active',
    issuedAt: '2026-08-13 14:00',
    expiresAt: '2026-08-15 12:00',
    lastUsed: '2026-08-15 09:12',
    useCount: 18,
    deviceName: 'Samsung Galaxy S24',
    deviceOS: 'Android 14',
    deviceId: 'SG-7P3Q-R9T2',
    batteryLevel: 45,
    offlineAccess: true,
    pinFallback: true,
    biometricsRequired: true,
    location: 'On-property',
    notes: 'Lifetime Platinum. VIP amenities.',
    history: [
      {
        action: 'issued',
        by: 'Sarah J.',
        time: '2026-08-13 14:00',
        note: 'Check-in — Bluetooth key issued',
      },
      { action: 'used', by: 'System', time: '2026-08-13 14:05', note: 'First unlock — Room 205' },
      { action: 'used', by: 'System', time: '2026-08-15 09:12', note: 'Unlock — Room 205' },
    ],
  },
  {
    id: 'DK-2026-003',
    type: 'mobile',
    protocol: 'nfc',
    label: 'Room 302 — Emily Davis',
    room: '302',
    roomType: 'Deluxe King',
    guest: 'Emily Davis',
    guestId: 'G-1004',
    email: 'emily.davis@email.com',
    phone: '+1 555-0104',
    status: 'expired',
    issuedAt: '2026-08-10 16:00',
    expiresAt: '2026-08-12 11:00',
    lastUsed: '2026-08-12 10:30',
    useCount: 8,
    deviceName: 'Google Pixel 8',
    deviceOS: 'Android 14',
    deviceId: 'GP-2M5N-K8L1',
    batteryLevel: 0,
    offlineAccess: false,
    pinFallback: true,
    biometricsRequired: false,
    location: 'Off-property',
    notes: 'Short stay. Key expired on checkout.',
    history: [
      {
        action: 'issued',
        by: 'Mike C.',
        time: '2026-08-10 16:00',
        note: 'Check-in — NFC key issued',
      },
      { action: 'used', by: 'System', time: '2026-08-10 16:05', note: 'First unlock — Room 302' },
      {
        action: 'expired',
        by: 'System',
        time: '2026-08-12 11:00',
        note: 'Key expired — checkout time',
      },
    ],
  },
  {
    id: 'DK-2026-004',
    type: 'mobile',
    protocol: 'qr',
    label: 'Room 118 — Robert Chen',
    room: '118',
    roomType: 'Standard Queen',
    guest: 'Robert Chen',
    guestId: 'G-1005',
    email: 'robert.chen@email.com',
    phone: '+1 555-0105',
    status: 'revoked',
    issuedAt: '2026-08-10 15:00',
    expiresAt: '2026-08-12 11:00',
    lastUsed: '2026-08-11 22:00',
    useCount: 5,
    deviceName: 'iPhone 13',
    deviceOS: 'iOS 16.7',
    deviceId: 'AP-3B7C-D5E9',
    batteryLevel: 0,
    offlineAccess: false,
    pinFallback: false,
    biometricsRequired: false,
    location: 'Unknown',
    notes: 'No-show. Key revoked after 24h.',
    history: [
      {
        action: 'issued',
        by: 'Sarah J.',
        time: '2026-08-10 15:00',
        note: 'Check-in — QR code key issued',
      },
      { action: 'used', by: 'System', time: '2026-08-10 15:05', note: 'First unlock — Room 118' },
      {
        action: 'revoked',
        by: 'Sarah J.',
        time: '2026-08-11 15:00',
        note: 'No-show — key revoked after 24h',
      },
    ],
  },
  {
    id: 'DK-2026-005',
    type: 'mobile',
    protocol: 'nfc',
    label: 'Room 310 — Lisa Wong',
    room: '310',
    roomType: 'Deluxe King',
    guest: 'Lisa Wong',
    guestId: 'G-1006',
    email: 'lisa.wong@email.com',
    phone: '+1 555-0106',
    status: 'pending',
    issuedAt: null,
    expiresAt: '2026-08-16 11:00',
    lastUsed: null,
    useCount: 0,
    deviceName: null,
    deviceOS: null,
    deviceId: null,
    batteryLevel: null,
    offlineAccess: true,
    pinFallback: true,
    biometricsRequired: false,
    location: 'Not activated',
    notes: 'Influencer partner. Room photo-ready.',
    history: [
      {
        action: 'created',
        by: 'Manager',
        time: '2026-08-12 10:00',
        note: 'Key pre-issued — awaiting guest activation',
      },
    ],
  },
  {
    id: 'DK-2026-006',
    type: 'mobile',
    protocol: 'bluetooth',
    label: 'Room 201 — David Miller',
    room: '201',
    roomType: 'Standard Twin',
    guest: 'David Miller',
    guestId: 'G-1007',
    email: 'david.miller@email.com',
    phone: '+1 555-0107',
    status: 'active',
    issuedAt: '2026-08-18 14:30',
    expiresAt: '2026-08-22 11:00',
    lastUsed: '2026-08-18 20:00',
    useCount: 3,
    deviceName: 'iPhone 15',
    deviceOS: 'iOS 17.4',
    deviceId: 'AP-5F8G-H2J4',
    batteryLevel: 92,
    offlineAccess: true,
    pinFallback: true,
    biometricsRequired: true,
    location: 'On-property',
    notes: 'Waitlist upgrade. Early check-in.',
    history: [
      {
        action: 'issued',
        by: 'Sarah J.',
        time: '2026-08-18 14:30',
        note: 'Check-in — Bluetooth key issued',
      },
      { action: 'used', by: 'System', time: '2026-08-18 20:00', note: 'First unlock — Room 201' },
    ],
  },
  {
    id: 'DK-2026-007',
    type: 'staff',
    protocol: 'nfc',
    label: 'Master — Housekeeping',
    room: 'ALL',
    roomType: 'Master Key',
    guest: 'Maria G.',
    guestId: 'STAFF-003',
    email: 'maria.g@hotel.com',
    phone: '+1 555-0301',
    status: 'active',
    issuedAt: '2026-08-15 07:00',
    expiresAt: '2026-08-15 15:00',
    lastUsed: '2026-08-15 14:30',
    useCount: 47,
    deviceName: 'Samsung A54',
    deviceOS: 'Android 13',
    deviceId: 'SA-1X2Y-Z3W4',
    batteryLevel: 62,
    offlineAccess: true,
    pinFallback: false,
    biometricsRequired: false,
    location: 'On-property',
    notes: 'Housekeeping master — Floor 1-3 access.',
    history: [
      {
        action: 'issued',
        by: 'James L.',
        time: '2026-08-15 07:00',
        note: 'Shift start — master key activated',
      },
      { action: 'used', by: 'System', time: '2026-08-15 07:05', note: 'Unlock — Room 101' },
      { action: 'used', by: 'System', time: '2026-08-15 14:30', note: 'Unlock — Room 305' },
    ],
  },
  {
    id: 'DK-2026-008',
    type: 'staff',
    protocol: 'bluetooth',
    label: 'Engineering — Maintenance',
    room: 'ALL',
    roomType: 'Service Key',
    guest: 'James L.',
    guestId: 'STAFF-002',
    email: 'james.l@hotel.com',
    phone: '+1 555-0302',
    status: 'active',
    issuedAt: '2026-08-15 08:00',
    expiresAt: '2026-08-15 16:00',
    lastUsed: '2026-08-15 11:00',
    useCount: 12,
    deviceName: 'iPhone 12',
    deviceOS: 'iOS 16.6',
    deviceId: 'AP-6H7J-K8L9',
    batteryLevel: 34,
    offlineAccess: true,
    pinFallback: false,
    biometricsRequired: false,
    location: 'On-property',
    notes: 'Maintenance access — all service areas.',
    history: [
      {
        action: 'issued',
        by: 'Manager',
        time: '2026-08-15 08:00',
        note: 'Shift start — service key activated',
      },
      { action: 'used', by: 'System', time: '2026-08-15 11:00', note: 'Unlock — HVAC room' },
    ],
  },
];

/* ─── Helpers ─── */
function timeUntilExpiry(expiresAt) {
  if (!expiresAt) return null;
  const expiry = new Date(expiresAt);
  const now = new Date('2026-08-15 15:00');
  const diffMs = expiry - now;
  const diffHrs = Math.ceil(diffMs / (1000 * 60 * 60));
  if (diffHrs < 0) return { text: `${Math.abs(diffHrs)}h expired`, urgent: true, expired: true };
  if (diffHrs <= 4) return { text: `${diffHrs}h left`, urgent: true, expired: false };
  if (diffHrs <= 24) return { text: `${diffHrs}h left`, urgent: false, expired: false };
  const diffDays = Math.ceil(diffHrs / 24);
  return { text: `${diffDays}d left`, urgent: false, expired: false };
}

function formatDateTime(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ─── Status & Protocol Metadata ─── */
const statusMeta = {
  active: {
    label: 'Active',
    class: 'bg-accent/10 text-accent border-accent/20',
    dot: 'bg-accent',
    icon: CheckCircle2,
  },
  expired: {
    label: 'Expired',
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-text-muted',
    icon: Clock,
  },
  revoked: {
    label: 'Revoked',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
    icon: Ban,
  },
  pending: {
    label: 'Pending',
    class: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
    icon: Clock,
  },
  suspended: {
    label: 'Suspended',
    class: 'bg-info/10 text-info border-info/20',
    dot: 'bg-info',
    icon: Pause,
  },
};

const protocolMeta = {
  nfc: { label: 'NFC', icon: Nfc, class: 'bg-info/10 text-info border-info/20' },
  bluetooth: {
    label: 'Bluetooth',
    icon: Bluetooth,
    class: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  qr: { label: 'QR Code', icon: QrCode, class: 'bg-warning/10 text-warning border-warning/20' },
};

const typeMeta = {
  mobile: { label: 'Guest', class: 'bg-accent/10 text-accent border-accent/20' },
  staff: { label: 'Staff', class: 'bg-secondary/10 text-secondary border-secondary/20' },
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

function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.active;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.class
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

function ProtocolBadge({ protocol }) {
  const meta = protocolMeta[protocol] || protocolMeta.nfc;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
        meta.class
      )}
    >
      <Icon className="h-3 w-3" /> {meta.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const meta = typeMeta[type] || typeMeta.mobile;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
        meta.class
      )}
    >
      {meta.label}
    </span>
  );
}

function BatteryIndicator({ level }) {
  if (level === null || level === undefined)
    return <span className="text-xs text-text-muted">—</span>;
  const Icon = level <= 20 ? BatteryLow : level <= 50 ? BatteryMedium : BatteryFull;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        level <= 20 ? 'text-danger' : level <= 50 ? 'text-warning' : 'text-accent'
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {level}%
    </span>
  );
}

/* ─── Issue Key Modal ─── */
function IssueKeyModal({ onClose, onIssue }) {
  const [form, setForm] = useState({
    guestName: '',
    email: '',
    phone: '',
    room: '',
    protocol: 'nfc',
    keyType: 'mobile',
    expiresAt: '',
    offlineAccess: true,
    pinFallback: true,
    biometricsRequired: false,
    notes: '',
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onIssue({
      ...form,
      id: `DK-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
      issuedAt: new Date().toISOString(),
      status: 'active',
      useCount: 0,
      lastUsed: null,
      deviceName: null,
      deviceOS: null,
      deviceId: null,
      batteryLevel: null,
      location: 'Pending activation',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl max-h-[90vh] overflow-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary">Issue Digital Key</h3>
            <p className="text-xs text-text-muted">
              Create and send a new mobile key to a guest or staff member
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Guest / Staff Name
              </label>
              <input
                type="text"
                required
                value={form.guestName}
                onChange={(e) => update('guestName', e.target.value)}
                placeholder="e.g. John Smith"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Room
              </label>
              <input
                type="text"
                required
                value={form.room}
                onChange={(e) => update('room', e.target.value)}
                placeholder="e.g. 204"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="guest@email.com"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="+1 555-0000"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Key Type
              </label>
              <select
                value={form.keyType}
                onChange={(e) => update('keyType', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="mobile">Guest Mobile Key</option>
                <option value="staff">Staff Key</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Protocol
              </label>
              <select
                value={form.protocol}
                onChange={(e) => update('protocol', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="nfc">NFC</option>
                <option value="bluetooth">Bluetooth</option>
                <option value="qr">QR Code</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Expiry Date & Time
            </label>
            <input
              type="datetime-local"
              required
              value={form.expiresAt}
              onChange={(e) => update('expiresAt', e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Security Options
            </p>
            <label className="flex items-center justify-between text-sm text-text-primary cursor-pointer">
              <span className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-text-muted" /> Offline Access
              </span>
              <input
                type="checkbox"
                checked={form.offlineAccess}
                onChange={(e) => update('offlineAccess', e.target.checked)}
                className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
              />
            </label>
            <label className="flex items-center justify-between text-sm text-text-primary cursor-pointer">
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-text-muted" /> PIN Fallback
              </span>
              <input
                type="checkbox"
                checked={form.pinFallback}
                onChange={(e) => update('pinFallback', e.target.checked)}
                className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
              />
            </label>
            <label className="flex items-center justify-between text-sm text-text-primary cursor-pointer">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-text-muted" /> Require Biometrics
              </span>
              <input
                type="checkbox"
                checked={form.biometricsRequired}
                onChange={(e) => update('biometricsRequired', e.target.checked)}
                className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
              />
            </label>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={2}
              placeholder="Special instructions..."
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary">
              <Send className="mr-1.5 h-4 w-4" /> Issue & Send Key
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Key Detail Drawer ─── */
function KeyDetailDrawer({ keyItem, onClose, onUpdateStatus }) {
  const [activeTab, setActiveTab] = useState('details');
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  if (!keyItem) return null;

  const expiryInfo = timeUntilExpiry(keyItem.expiresAt);

  const tabs = [
    { id: 'details', label: 'Details', icon: KeyRound },
    { id: 'history', label: 'History', icon: History },
  ];

  const handleRevoke = () => {
    onUpdateStatus(keyItem.id, 'revoked');
    setShowRevokeConfirm(false);
  };

  const handleExtend = () => {
    onUpdateStatus(keyItem.id, 'extended');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg border',
                  keyItem.status === 'active'
                    ? 'bg-accent/10 border-accent/30'
                    : keyItem.status === 'expired'
                      ? 'bg-neutral/10 border-neutral/30'
                      : keyItem.status === 'revoked'
                        ? 'bg-danger/10 border-danger/30'
                        : 'bg-warning/10 border-warning/30'
                )}
              >
                <KeyRound
                  className={cn(
                    'h-5 w-5',
                    keyItem.status === 'active'
                      ? 'text-accent'
                      : keyItem.status === 'expired'
                        ? 'text-text-muted'
                        : keyItem.status === 'revoked'
                          ? 'text-danger'
                          : 'text-warning'
                  )}
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">{keyItem.label}</h2>
                <p className="text-xs text-text-muted">
                  {keyItem.id} · <ProtocolBadge protocol={keyItem.protocol} /> ·{' '}
                  <TypeBadge type={keyItem.type} />
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <StatusBadge status={keyItem.status} />
            {expiryInfo && (
              <span
                className={cn(
                  'text-xs font-medium',
                  expiryInfo.urgent ? 'text-danger' : 'text-text-muted'
                )}
              >
                {expiryInfo.text}
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 border-b border-border">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px',
                    active
                      ? 'border-secondary text-secondary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-surface p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Use Count</p>
                  <p className="mt-1 text-lg font-bold font-mono text-text-primary">
                    {keyItem.useCount}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Last Used</p>
                  <p className="mt-1 text-sm font-medium text-text-primary">
                    {formatDateTime(keyItem.lastUsed)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Issued</p>
                  <p className="mt-1 text-sm font-medium text-text-primary">
                    {formatDateTime(keyItem.issuedAt)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Expires</p>
                  <p
                    className={cn(
                      'mt-1 text-sm font-medium',
                      expiryInfo?.urgent ? 'text-danger' : 'text-text-primary'
                    )}
                  >
                    {formatDateTime(keyItem.expiresAt)}
                  </p>
                </div>
              </div>

              {/* Device Info */}
              {keyItem.deviceName && (
                <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                    Device Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Smartphone className="h-4 w-4 text-text-muted" />
                      {keyItem.deviceName}
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Tag className="h-4 w-4 text-text-muted" />
                      {keyItem.deviceOS}
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <KeyRound className="h-4 w-4 text-text-muted" />
                      {keyItem.deviceId}
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <BatteryMedium className="h-4 w-4 text-text-muted" />
                      <BatteryIndicator level={keyItem.batteryLevel} />
                    </div>
                  </div>
                </div>
              )}

              {/* Room Info */}
              <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                  Access Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <DoorOpen className="h-4 w-4 text-text-muted" />
                    Room {keyItem.room}
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <MapPin className="h-4 w-4 text-text-muted" />
                    {keyItem.location}
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <User className="h-4 w-4 text-text-muted" />
                    {keyItem.guest}
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Mail className="h-4 w-4 text-text-muted" />
                    <span className="truncate">{keyItem.email}</span>
                  </div>
                </div>
              </div>

              {/* Security Features */}
              <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                  Security Features
                </h3>
                <div className="space-y-2">
                  {[
                    { label: 'Offline Access', enabled: keyItem.offlineAccess, icon: Wifi },
                    { label: 'PIN Fallback', enabled: keyItem.pinFallback, icon: Lock },
                    {
                      label: 'Biometrics Required',
                      enabled: keyItem.biometricsRequired,
                      icon: Shield,
                    },
                  ].map((feat) => (
                    <div key={feat.label} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-text-secondary">
                        <feat.icon className="h-4 w-4 text-text-muted" /> {feat.label}
                      </span>
                      {feat.enabled ? (
                        <Check className="h-4 w-4 text-accent" />
                      ) : (
                        <X className="h-4 w-4 text-text-muted" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {keyItem.notes && (
                <div className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-secondary" />
                    <h3 className="text-sm font-semibold text-text-primary">Notes</h3>
                  </div>
                  <p className="text-sm text-text-secondary">{keyItem.notes}</p>
                </div>
              )}

              {/* Actions */}
              {keyItem.status === 'active' && (
                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" onClick={handleExtend}>
                    <Calendar className="mr-1.5 h-4 w-4" /> Extend Expiry
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-danger border-danger/30 hover:bg-danger/10"
                    onClick={() => setShowRevokeConfirm(true)}
                  >
                    <Ban className="mr-1.5 h-4 w-4" /> Revoke Key
                  </Button>
                </div>
              )}

              {keyItem.status === 'pending' && (
                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  <Button variant="secondary" size="sm">
                    <Mail className="mr-1.5 h-4 w-4" /> Resend Activation Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-danger border-danger/30 hover:bg-danger/10"
                    onClick={() => setShowRevokeConfirm(true)}
                  >
                    <Ban className="mr-1.5 h-4 w-4" /> Cancel Key
                  </Button>
                </div>
              )}

              {(keyItem.status === 'expired' || keyItem.status === 'revoked') && (
                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" onClick={handleExtend}>
                    <RotateCcw className="mr-1.5 h-4 w-4" /> Reactivate Key
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {keyItem.history.map((entry, i) => (
                <div key={i} className="flex gap-3 rounded-lg border border-border bg-surface p-3">
                  <div
                    className={cn(
                      'mt-0.5 h-2 w-2 rounded-full shrink-0',
                      entry.action === 'issued' || entry.action === 'created'
                        ? 'bg-accent'
                        : entry.action === 'used'
                          ? 'bg-secondary'
                          : entry.action === 'expired'
                            ? 'bg-text-muted'
                            : entry.action === 'revoked'
                              ? 'bg-danger'
                              : 'bg-info'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-text-primary capitalize">
                        {entry.action.replace('_', ' ')}
                      </p>
                      <span className="text-xs text-text-muted">{entry.time}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{entry.note}</p>
                    <p className="text-xs text-text-muted mt-0.5">by {entry.by}</p>
                  </div>
                </div>
              ))}
              {keyItem.history.length === 0 && (
                <div className="text-center py-8 text-text-muted text-sm">
                  No history available.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Revoke Confirmation */}
      {showRevokeConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowRevokeConfirm(false)}
          />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl">
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
                <Ban className="h-6 w-6 text-danger" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Revoke Key</h3>
              <p className="text-sm text-text-secondary">
                This will immediately disable {keyItem.guest}'s access to Room {keyItem.room}. This
                action cannot be undone.
              </p>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowRevokeConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 text-danger border-danger/30 hover:bg-danger/10"
                  onClick={handleRevoke}
                >
                  <Ban className="mr-1.5 h-4 w-4" /> Revoke
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function DigitalKeysPage() {
  const navigate = useNavigate();
  const [keys, setKeys] = useState(digitalKeys);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [protocolFilter, setProtocolFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedKey, setSelectedKey] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  /* ─── Computed Data ─── */
  const filteredKeys = useMemo(() => {
    return keys.filter((k) => {
      const matchesQuery =
        !query ||
        k.label.toLowerCase().includes(query.toLowerCase()) ||
        k.id.toLowerCase().includes(query.toLowerCase()) ||
        k.guest.toLowerCase().includes(query.toLowerCase()) ||
        k.room.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || k.status === statusFilter;
      const matchesProtocol = protocolFilter === 'all' || k.protocol === protocolFilter;
      const matchesType = typeFilter === 'all' || k.type === typeFilter;
      return matchesQuery && matchesStatus && matchesProtocol && matchesType;
    });
  }, [keys, query, statusFilter, protocolFilter, typeFilter]);

  const stats = useMemo(() => {
    const active = keys.filter((k) => k.status === 'active').length;
    const expired = keys.filter((k) => k.status === 'expired').length;
    const revoked = keys.filter((k) => k.status === 'revoked').length;
    const pending = keys.filter((k) => k.status === 'pending').length;
    const nfc = keys.filter((k) => k.protocol === 'nfc').length;
    const bluetooth = keys.filter((k) => k.protocol === 'bluetooth').length;
    const qr = keys.filter((k) => k.protocol === 'qr').length;
    const totalUses = keys.reduce((s, k) => s + k.useCount, 0);
    return { active, expired, revoked, pending, nfc, bluetooth, qr, totalUses };
  }, [keys]);

  /* ─── Handlers ─── */
  const handleIssue = (newKey) => {
    setKeys((prev) => [newKey, ...prev]);
  };

  const handleUpdateStatus = (id, action) => {
    setKeys((prev) =>
      prev.map((k) => {
        if (k.id !== id) return k;
        if (action === 'revoked') {
          return {
            ...k,
            status: 'revoked',
            history: [
              ...k.history,
              {
                action: 'revoked',
                by: 'You',
                time: new Date().toISOString(),
                note: 'Key manually revoked',
              },
            ],
          };
        }
        if (action === 'extended') {
          const newExpiry = new Date(k.expiresAt);
          newExpiry.setDate(newExpiry.getDate() + 1);
          return {
            ...k,
            status: 'active',
            expiresAt: newExpiry.toISOString(),
            history: [
              ...k.history,
              {
                action: 'extended',
                by: 'You',
                time: new Date().toISOString(),
                note: 'Expiry extended by 24 hours',
              },
            ],
          };
        }
        return k;
      })
    );
  };

  /* ─── Render ─── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Digital Keys</h1>
          <p className="text-sm text-text-secondary">
            Mobile key issuance, NFC/Bluetooth access, and expiry management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowIssueModal(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Issue Key
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Active Keys"
          value={stats.active}
          icon={KeyRound}
          color="text-accent"
          subtext={`${stats.pending} pending`}
        />
        <StatCard
          label="Expired Today"
          value={stats.expired}
          icon={Clock}
          color="text-warning"
          subtext={`${stats.revoked} revoked`}
        />
        <StatCard
          label="Total Unlocks"
          value={stats.totalUses}
          icon={Unlock}
          color="text-secondary"
          subtext="This week"
          trend={12}
        />
        <StatCard
          label="NFC / Bluetooth"
          value={`${stats.nfc} / ${stats.bluetooth}`}
          icon={Nfc}
          color="text-info"
          subtext={`${stats.qr} QR keys`}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search keys by guest, room, ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors',
              showFilters
                ? 'border-secondary bg-secondary/10 text-secondary'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
            )}
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Protocol</label>
              <select
                value={protocolFilter}
                onChange={(e) => setProtocolFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Protocols</option>
                <option value="nfc">NFC</option>
                <option value="bluetooth">Bluetooth</option>
                <option value="qr">QR Code</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Key Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Types</option>
                <option value="mobile">Guest Mobile</option>
                <option value="staff">Staff Key</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setProtocolFilter('all');
                  setTypeFilter('all');
                  setQuery('');
                }}
                className="h-10 rounded-md border border-border bg-background px-4 text-sm font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-text-muted">
        Showing <span className="font-medium text-text-primary">{filteredKeys.length}</span> of{' '}
        {keys.length} digital keys
      </p>

      {/* Keys Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Key
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Protocol
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Guest / Staff
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Uses
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Device
                </th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredKeys.map((keyItem) => {
                const expiryInfo = timeUntilExpiry(keyItem.expiresAt);
                return (
                  <tr
                    key={keyItem.id}
                    onClick={() => setSelectedKey(keyItem)}
                    className="hover:bg-background/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg border',
                            keyItem.status === 'active'
                              ? 'bg-accent/10 border-accent/30'
                              : keyItem.status === 'pending'
                                ? 'bg-warning/10 border-warning/30'
                                : keyItem.status === 'expired'
                                  ? 'bg-neutral/10 border-neutral/30'
                                  : 'bg-danger/10 border-danger/30'
                          )}
                        >
                          <KeyRound
                            className={cn(
                              'h-4 w-4',
                              keyItem.status === 'active'
                                ? 'text-accent'
                                : keyItem.status === 'pending'
                                  ? 'text-warning'
                                  : keyItem.status === 'expired'
                                    ? 'text-text-muted'
                                    : 'text-danger'
                            )}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary group-hover:text-secondary transition-colors">
                            {keyItem.label}
                          </p>
                          <p className="text-xs text-text-muted">{keyItem.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ProtocolBadge protocol={keyItem.protocol} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={keyItem.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-text-secondary text-xs">{keyItem.guest}</div>
                      <div className="text-text-muted text-[10px]">{keyItem.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {expiryInfo ? (
                        <span
                          className={cn(
                            'text-xs font-medium',
                            expiryInfo.urgent ? 'text-danger' : 'text-text-muted'
                          )}
                        >
                          {expiryInfo.text}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text-primary">
                      {keyItem.useCount}
                    </td>
                    <td className="px-4 py-3">
                      {keyItem.deviceName ? (
                        <div className="text-xs text-text-secondary">
                          <div className="flex items-center gap-1">
                            <Smartphone className="h-3 w-3 text-text-muted" />
                            {keyItem.deviceName}
                          </div>
                          <div className="text-text-muted text-[10px] mt-0.5">
                            <BatteryIndicator level={keyItem.batteryLevel} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">Not activated</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredKeys.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                    <KeyRound className="mx-auto h-10 w-10 mb-3" />
                    <p>No keys match your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modals ─── */}
      {showIssueModal && (
        <IssueKeyModal onClose={() => setShowIssueModal(false)} onIssue={handleIssue} />
      )}

      {selectedKey && (
        <KeyDetailDrawer
          keyItem={selectedKey}
          onClose={() => setSelectedKey(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}
