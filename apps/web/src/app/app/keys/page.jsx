/* src/app/app/keys/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Key,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
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
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '../../../components/ui/input';

/* ─── Mock Data ─── */
const keyRack = [
  {
    id: 'KEY-001',
    type: 'physical',
    label: 'Master Key — Front Desk',
    location: 'Front Desk Safe',
    status: 'available',
    assignedTo: null,
    assignedAt: null,
    dueBack: null,
    room: null,
    notes: 'Opens all guest rooms. Requires manager approval.',
    lastAudit: '2026-08-14 09:00 AM',
    auditBy: 'Sarah J.',
    history: [
      {
        action: 'checked_out',
        by: 'Sarah J.',
        to: 'Mike C.',
        time: '2026-08-14 08:30 AM',
        note: 'Morning shift handover',
      },
      {
        action: 'checked_in',
        by: 'Mike C.',
        to: 'Sarah J.',
        time: '2026-08-14 09:00 AM',
        note: 'Returned after shift',
      },
    ],
  },
  {
    id: 'KEY-002',
    type: 'physical',
    label: 'Floor 1 Master',
    location: 'Housekeeping Office',
    status: 'checked_out',
    assignedTo: 'Maria G.',
    assignedAt: '2026-08-15 07:00 AM',
    dueBack: '2026-08-15 15:00',
    room: null,
    notes: 'Opens all rooms on Floor 1',
    lastAudit: '2026-08-14 06:00 PM',
    auditBy: 'James L.',
    history: [
      {
        action: 'checked_out',
        by: 'James L.',
        to: 'Maria G.',
        time: '2026-08-15 07:00 AM',
        note: 'Morning cleaning round',
      },
    ],
  },
  {
    id: 'KEY-003',
    type: 'physical',
    label: 'Room 204 Key',
    location: 'Front Desk',
    status: 'checked_out',
    assignedTo: 'John Smith (Guest)',
    assignedAt: '2026-08-12 15:30',
    dueBack: '2026-08-15 11:00',
    room: '204',
    notes: 'Guest key — Deluxe King',
    lastAudit: '2026-08-12 15:30',
    auditBy: 'Sarah J.',
    history: [
      {
        action: 'checked_out',
        by: 'Sarah J.',
        to: 'John Smith',
        time: '2026-08-12 15:30',
        note: 'Check-in',
      },
    ],
  },
  {
    id: 'KEY-004',
    type: 'physical',
    label: 'Room 205 Key',
    location: 'Front Desk',
    status: 'available',
    assignedTo: null,
    assignedAt: null,
    dueBack: null,
    room: '205',
    notes: 'Spare key — Suite',
    lastAudit: '2026-08-14 09:00 AM',
    auditBy: 'Sarah J.',
    history: [],
  },
  {
    id: 'KEY-005',
    type: 'physical',
    label: 'Maintenance Master',
    location: 'Engineering Office',
    status: 'checked_out',
    assignedTo: 'David P.',
    assignedAt: '2026-08-15 08:00',
    dueBack: '2026-08-15 17:00',
    room: null,
    notes: 'Opens service areas, mechanical rooms',
    lastAudit: '2026-08-14 06:00 PM',
    auditBy: 'James L.',
    history: [
      {
        action: 'checked_out',
        by: 'James L.',
        to: 'David P.',
        time: '2026-08-15 08:00',
        note: 'HVAC repair on Floor 2',
      },
    ],
  },
  {
    id: 'KEY-006',
    type: 'digital',
    label: 'Digital Pass — Suite 301',
    location: 'Mobile App',
    status: 'active',
    assignedTo: 'Amanda Wilson',
    assignedAt: '2026-08-13 14:00',
    dueBack: '2026-08-16 11:00',
    room: '301',
    notes: 'Mobile key via guest app. Auto-expires on checkout.',
    lastAudit: '2026-08-13 14:00',
    auditBy: 'System',
    history: [
      {
        action: 'issued',
        by: 'System',
        to: 'Amanda Wilson',
        time: '2026-08-13 14:00',
        note: 'Mobile check-in',
      },
    ],
  },
  {
    id: 'KEY-007',
    type: 'digital',
    label: 'Digital Pass — Room 310',
    location: 'Mobile App',
    status: 'active',
    assignedTo: 'Lisa Wong',
    assignedAt: '2026-08-12 16:00',
    dueBack: '2026-08-16 11:00',
    room: '310',
    notes: 'Mobile key via guest app',
    lastAudit: '2026-08-12 16:00',
    auditBy: 'System',
    history: [
      {
        action: 'issued',
        by: 'System',
        to: 'Lisa Wong',
        time: '2026-08-12 16:00',
        note: 'Mobile check-in',
      },
    ],
  },
  {
    id: 'KEY-008',
    type: 'physical',
    label: 'Emergency Override Key',
    location: 'Manager Safe',
    status: 'available',
    assignedTo: null,
    assignedAt: null,
    dueBack: null,
    room: null,
    notes: 'Emergency use only. Requires GM approval. Logs all usage.',
    lastAudit: '2026-08-14 09:00 AM',
    auditBy: 'Sarah J.',
    history: [],
  },
  {
    id: 'KEY-009',
    type: 'physical',
    label: 'Room 103 Key',
    location: 'Front Desk',
    status: 'overdue',
    assignedTo: 'Robert Chen',
    assignedAt: '2026-08-10 15:00',
    dueBack: '2026-08-12 11:00',
    room: '103',
    notes: 'Guest checked out but key not returned',
    lastAudit: '2026-08-10 15:00',
    auditBy: 'Sarah J.',
    history: [
      {
        action: 'checked_out',
        by: 'Sarah J.',
        to: 'Robert Chen',
        time: '2026-08-10 15:00',
        note: 'Check-in',
      },
      {
        action: 'reminder_sent',
        by: 'System',
        to: 'Robert Chen',
        time: '2026-08-12 12:00',
        note: 'Overdue reminder email sent',
      },
    ],
  },
  {
    id: 'KEY-010',
    type: 'physical',
    label: 'Valet Key — Spot 12',
    location: 'Valet Stand',
    status: 'checked_out',
    assignedTo: 'Valet Team',
    assignedAt: '2026-08-15 09:00',
    dueBack: '2026-08-15 20:00',
    room: null,
    notes: 'Vehicle key for guest parking',
    lastAudit: '2026-08-15 09:00',
    auditBy: 'Valet Lead',
    history: [
      {
        action: 'checked_out',
        by: 'Valet Lead',
        to: 'Valet Team',
        time: '2026-08-15 09:00',
        note: 'Guest vehicle parked',
      },
    ],
  },
];

const alerts = [
  {
    id: 1,
    severity: 'danger',
    title: 'Key Overdue — Room 103',
    message: 'Robert Chen checked out Aug 12. Key not returned. 3 days overdue.',
    time: '3 days ago',
    keyId: 'KEY-009',
  },
  {
    id: 2,
    severity: 'warning',
    title: 'Floor 1 Master Due Soon',
    message: 'Maria G. must return Floor 1 Master by 3:00 PM today.',
    time: '2 hrs ago',
    keyId: 'KEY-002',
  },
  {
    id: 3,
    severity: 'warning',
    title: 'Maintenance Key Due Soon',
    message: 'David P. must return Maintenance Master by 5:00 PM today.',
    time: '30 min ago',
    keyId: 'KEY-005',
  },
  {
    id: 4,
    severity: 'info',
    title: 'Daily Key Audit Pending',
    message: 'Evening key audit not yet completed. 5 keys need verification.',
    time: '1 hr ago',
    keyId: null,
  },
  {
    id: 5,
    severity: 'info',
    title: 'Digital Pass Expiring',
    message: "Amanda Wilson's digital pass for Suite 301 expires tomorrow at 11:00 AM.",
    time: '3 hrs ago',
    keyId: 'KEY-006',
  },
];

/* ─── Status Helpers ─── */
const statusMeta = {
  available: {
    label: 'Available',
    class: 'bg-accent/10 text-accent border-accent/20',
    dot: 'bg-accent',
    icon: CheckCircle2,
  },
  checked_out: {
    label: 'Checked Out',
    class: 'bg-secondary/10 text-secondary border-secondary/20',
    dot: 'bg-secondary',
    icon: ArrowRightLeft,
  },
  overdue: {
    label: 'Overdue',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
    icon: AlertTriangle,
  },
  active: {
    label: 'Active',
    class: 'bg-info/10 text-info border-info/20',
    dot: 'bg-info',
    icon: KeyRound,
  },
  lost: {
    label: 'Lost',
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-text-muted',
    icon: AlertCircle,
  },
};

const severityMeta = {
  danger: {
    icon: AlertTriangle,
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
    dot: 'bg-danger',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    dot: 'bg-warning',
  },
  info: {
    icon: Key,
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/20',
    dot: 'bg-info',
  },
  success: {
    icon: CheckCircle2,
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
    dot: 'bg-accent',
  },
};

const typeMeta = {
  physical: { label: 'Physical', icon: Key, class: 'bg-surface text-text-secondary border-border' },
  digital: { label: 'Digital', icon: KeyRound, class: 'bg-info/10 text-info border-info/20' },
};

/* ─── Helpers ─── */
function timeUntil(dueBack) {
  if (!dueBack) return null;
  const due = new Date(dueBack);
  const now = new Date('2026-08-15 15:00');
  const diffMs = due - now;
  const diffHrs = Math.ceil(diffMs / (1000 * 60 * 60));
  if (diffHrs < 0) return { text: `${Math.abs(diffHrs)}h overdue`, urgent: true };
  if (diffHrs <= 2) return { text: `${diffHrs}h remaining`, urgent: true };
  return { text: `${diffHrs}h remaining`, urgent: false };
}

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
  const meta = statusMeta[status] || statusMeta.available;
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

function TypeBadge({ type }) {
  const meta = typeMeta[type] || typeMeta.physical;
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

/* ─── Key Detail Drawer ─── */
function KeyDetailDrawer({ keyItem, onClose, onUpdateStatus }) {
  const [activeTab, setActiveTab] = useState('details');
  const [newNote, setNewNote] = useState('');
  const [showCheckInOut, setShowCheckInOut] = useState(false);
  const [cioForm, setCioForm] = useState({ person: '', action: 'check_out', note: '' });

  if (!keyItem) return null;

  const timeInfo = timeUntil(keyItem.dueBack);

  const tabs = [
    { id: 'details', label: 'Details', icon: Key },
    { id: 'history', label: 'History', icon: History },
  ];

  const handleCioSubmit = (e) => {
    e.preventDefault();
    onUpdateStatus(keyItem.id, cioForm.action, cioForm.person, cioForm.note);
    setShowCheckInOut(false);
    setCioForm({ person: '', action: 'check_out', note: '' });
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
                  keyItem.type === 'digital'
                    ? 'bg-info/10 border-info/30'
                    : 'bg-secondary/10 border-secondary/30'
                )}
              >
                {keyItem.type === 'digital' ? (
                  <KeyRound className="h-5 w-5 text-info" />
                ) : (
                  <Key className="h-5 w-5 text-secondary" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">{keyItem.label}</h2>
                <p className="text-xs text-text-muted">
                  {keyItem.id} · <TypeBadge type={keyItem.type} />
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
            {timeInfo && (
              <span
                className={cn(
                  'text-xs font-medium',
                  timeInfo.urgent ? 'text-danger' : 'text-text-muted'
                )}
              >
                {timeInfo.text}
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
              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-surface p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Location</p>
                  <p className="mt-1 text-sm font-medium text-text-primary flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-text-muted" /> {keyItem.location}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Room</p>
                  <p className="mt-1 text-sm font-medium text-text-primary flex items-center gap-1.5">
                    <DoorOpen className="h-3.5 w-3.5 text-text-muted" /> {keyItem.room || 'N/A'}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">
                    Assigned To
                  </p>
                  <p className="mt-1 text-sm font-medium text-text-primary flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-text-muted" /> {keyItem.assignedTo || '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Last Audit</p>
                  <p className="mt-1 text-sm font-medium text-text-primary flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-text-muted" /> {keyItem.lastAudit}
                  </p>
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

              {/* Check In/Out Actions */}
              <div className="space-y-3">
                {!showCheckInOut ? (
                  <div className="flex gap-2">
                    {keyItem.status === 'available' && (
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          setCioForm({ ...cioForm, action: 'check_out' });
                          setShowCheckInOut(true);
                        }}
                      >
                        <ArrowRightLeft className="mr-1.5 h-4 w-4" /> Check Out
                      </Button>
                    )}
                    {(keyItem.status === 'checked_out' || keyItem.status === 'overdue') && (
                      <Button
                        variant="accent"
                        className="flex-1"
                        onClick={() => {
                          setCioForm({ ...cioForm, action: 'check_in' });
                          setShowCheckInOut(true);
                        }}
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" /> Check In
                      </Button>
                    )}
                    <Button variant="outline" className="flex-1">
                      <Edit3 className="mr-1.5 h-4 w-4" /> Edit
                    </Button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleCioSubmit}
                    className="rounded-xl border border-border bg-surface p-4 space-y-3"
                  >
                    <h4 className="text-sm font-semibold text-text-primary">
                      {cioForm.action === 'check_out' ? 'Check Out Key' : 'Check In Key'}
                    </h4>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Person
                      </label>
                      <input
                        type="text"
                        value={cioForm.person}
                        onChange={(e) => setCioForm({ ...cioForm, person: e.target.value })}
                        placeholder="Name of person receiving/returning key"
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Note
                      </label>
                      <input
                        type="text"
                        value={cioForm.note}
                        onChange={(e) => setCioForm({ ...cioForm, note: e.target.value })}
                        placeholder="Optional note..."
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowCheckInOut(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="secondary" className="flex-1">
                        <Check className="mr-1.5 h-4 w-4" /> Confirm
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {/* Digital Key Actions */}
              {keyItem.type === 'digital' && (
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="mr-1.5 h-4 w-4" /> Regenerate Pass
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-danger border-danger/30 hover:bg-danger/10"
                  >
                    <Lock className="mr-1.5 h-4 w-4" /> Revoke Access
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {keyItem.history.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-sm">No history yet.</div>
              ) : (
                keyItem.history.map((entry, i) => (
                  <div key={i} className="rounded-lg border border-border bg-surface p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          'text-xs font-semibold uppercase tracking-wider',
                          entry.action === 'checked_out'
                            ? 'text-secondary'
                            : entry.action === 'checked_in'
                              ? 'text-accent'
                              : entry.action === 'issued'
                                ? 'text-info'
                                : 'text-text-muted'
                        )}
                      >
                        {entry.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-text-muted">{entry.time}</span>
                    </div>
                    <p className="text-sm text-text-secondary">
                      <span className="font-medium text-text-primary">{entry.by}</span> →{' '}
                      <span className="font-medium text-text-primary">{entry.to}</span>
                    </p>
                    {entry.note && <p className="mt-1 text-xs text-text-muted">{entry.note}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function KeysPage() {
  const [keys, setKeys] = useState(keyRack);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedKey, setSelectedKey] = useState(null);
  const [showAlerts, setShowAlerts] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  /* ─── Computed Data ─── */
  const stats = useMemo(() => {
    const total = keys.length;
    const available = keys.filter((k) => k.status === 'available').length;
    const checkedOut = keys.filter(
      (k) => k.status === 'checked_out' || k.status === 'active'
    ).length;
    const overdue = keys.filter((k) => k.status === 'overdue').length;
    const digital = keys.filter((k) => k.type === 'digital').length;
    return { total, available, checkedOut, overdue, digital };
  }, [keys]);

  const activeAlerts = useMemo(() => {
    return alerts.filter((a) => !dismissedAlerts.includes(a.id));
  }, [dismissedAlerts]);

  const filteredKeys = useMemo(() => {
    return keys.filter((k) => {
      const matchesQuery =
        !query ||
        k.label.toLowerCase().includes(query.toLowerCase()) ||
        k.id.toLowerCase().includes(query.toLowerCase()) ||
        (k.assignedTo && k.assignedTo.toLowerCase().includes(query.toLowerCase())) ||
        (k.room && k.room.includes(query));
      const matchesStatus = statusFilter === 'all' || k.status === statusFilter;
      const matchesType = typeFilter === 'all' || k.type === typeFilter;
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [keys, query, statusFilter, typeFilter]);

  /* ─── Handlers ─── */
  const dismissAlert = (id) => {
    setDismissedAlerts((prev) => [...prev, id]);
  };

  const handleUpdateStatus = (keyId, action, person, note) => {
    setKeys((prev) =>
      prev.map((k) => {
        if (k.id !== keyId) return k;
        const newStatus = action === 'check_out' ? 'checked_out' : 'available';
        const newAssignedTo = action === 'check_out' ? person : null;
        const newAssignedAt = action === 'check_out' ? new Date().toISOString() : null;
        const newDueBack = action === 'check_out' ? '2026-08-15 23:59' : null;
        const historyEntry = {
          action,
          by: 'You',
          to: person,
          time: new Date().toISOString(),
          note: note || '',
        };
        return {
          ...k,
          status: newStatus,
          assignedTo: newAssignedTo,
          assignedAt: newAssignedAt,
          dueBack: newDueBack,
          history: [historyEntry, ...k.history],
        };
      })
    );
    setSelectedKey(null);
  };

  /* ─── Render ─── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Key Management</h1>
          <p className="text-sm text-text-secondary">
            Physical keys, digital passes, and access control
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Add Key
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total Keys"
          value={stats.total}
          icon={Key}
          color="text-text-primary"
          subtext="Physical + Digital"
        />
        <StatCard
          label="Available"
          value={stats.available}
          icon={Unlock}
          color="text-accent"
          subtext="Ready for use"
        />
        <StatCard
          label="Checked Out"
          value={stats.checkedOut}
          icon={Lock}
          color="text-secondary"
          subtext="Active assignments"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={AlertTriangle}
          color="text-danger"
          subtext="Require attention"
        />
        <StatCard
          label="Digital Passes"
          value={stats.digital}
          icon={KeyRound}
          color="text-info"
          subtext="Mobile keys active"
        />
      </div>

      {/* Alerts Banner */}
      {activeAlerts.length > 0 && (
        <div
          className={cn(
            'rounded-xl border border-border bg-surface overflow-hidden transition-all',
            showAlerts ? '' : 'opacity-90'
          )}
        >
          <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-danger" />
              <h3 className="text-sm font-semibold text-text-primary">Alerts</h3>
              <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                {activeAlerts.length}
              </span>
            </div>
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className="rounded-md p-1 text-text-muted hover:bg-surface-elevated hover:text-text-primary"
            >
              {showAlerts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {showAlerts && (
            <div className="divide-y divide-border">
              {activeAlerts.map((alert) => {
                const meta = severityMeta[alert.severity];
                const Icon = meta.icon;
                return (
                  <div key={alert.id} className={cn('px-4 py-3', meta.bg)}>
                    <div className="flex items-start gap-3">
                      <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', meta.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                          <p className="text-sm font-medium text-text-primary">{alert.title}</p>
                        </div>
                        <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">
                          {alert.message}
                        </p>
                        <p className="mt-1 text-[10px] text-text-muted">{alert.time}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {alert.keyId && (
                          <button
                            onClick={() => setSelectedKey(keys.find((k) => k.id === alert.keyId))}
                            className="rounded-md p-1 text-text-muted hover:bg-background hover:text-text-primary"
                            title="View Key"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="rounded-md p-1 text-text-muted hover:bg-background hover:text-text-primary"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search keys, rooms, assigned to..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="checked_out">Checked Out</option>
            <option value="overdue">Overdue</option>
            <option value="active">Active (Digital)</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Types</option>
            <option value="physical">Physical</option>
            <option value="digital">Digital</option>
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
              <Key className="h-4 w-4" />
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
              <Lock className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Key Rack — Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredKeys.map((keyItem) => {
            const timeInfo = timeUntil(keyItem.dueBack);
            return (
              <button
                key={keyItem.id}
                onClick={() => setSelectedKey(keyItem)}
                className={cn(
                  'group rounded-xl border bg-surface p-5 text-left transition-all hover:shadow-md hover:border-secondary/50',
                  keyItem.status === 'overdue' ? 'border-danger/30' : 'border-border'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg border',
                      keyItem.type === 'digital'
                        ? 'bg-info/10 border-info/30'
                        : 'bg-secondary/10 border-secondary/30'
                    )}
                  >
                    {keyItem.type === 'digital' ? (
                      <KeyRound className="h-5 w-5 text-info" />
                    ) : (
                      <Key className="h-5 w-5 text-secondary" />
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={keyItem.status} />
                    <TypeBadge type={keyItem.type} />
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-text-primary group-hover:text-secondary transition-colors">
                  {keyItem.label}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">{keyItem.id}</p>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <MapPin className="h-3.5 w-3.5 text-text-muted" />
                    {keyItem.location}
                  </div>
                  {keyItem.room && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <DoorOpen className="h-3.5 w-3.5 text-text-muted" />
                      Room {keyItem.room}
                    </div>
                  )}
                  {keyItem.assignedTo && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <User className="h-3.5 w-3.5 text-text-muted" />
                      {keyItem.assignedTo}
                    </div>
                  )}
                </div>

                {timeInfo && (
                  <div
                    className={cn(
                      'mt-3 flex items-center gap-1.5 text-xs font-medium',
                      timeInfo.urgent ? 'text-danger' : 'text-text-muted'
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {timeInfo.text}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
                  <span>Audit: {keyItem.lastAudit}</span>
                  <span>By: {keyItem.auditBy}</span>
                </div>
              </button>
            );
          })}
          {filteredKeys.length === 0 && (
            <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
              <Key className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-text-muted">No keys match your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Key Rack — List View */}
      {viewMode === 'list' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Due Back
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredKeys.map((keyItem) => {
                  const timeInfo = timeUntil(keyItem.dueBack);
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
                              keyItem.type === 'digital'
                                ? 'bg-info/10 border-info/30'
                                : 'bg-secondary/10 border-secondary/30'
                            )}
                          >
                            {keyItem.type === 'digital' ? (
                              <KeyRound className="h-4 w-4 text-info" />
                            ) : (
                              <Key className="h-4 w-4 text-secondary" />
                            )}
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
                        <TypeBadge type={keyItem.type} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={keyItem.status} />
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">
                        {keyItem.assignedTo || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {timeInfo ? (
                          <span
                            className={cn(
                              'text-xs font-medium',
                              timeInfo.urgent ? 'text-danger' : 'text-text-muted'
                            )}
                          >
                            {timeInfo.text}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{keyItem.location}</td>
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
                    <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                      <Key className="mx-auto h-10 w-10 mb-3" />
                      <p>No keys match your filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
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
