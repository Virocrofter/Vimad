'use client';

import { useState, useMemo } from 'react';
import {
  Shield,
  Key,
  Users,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Activity,
  FileText,
  Lock,
  Unlock,
  MoreHorizontal,
  Calendar,
  Building2,
  Fingerprint,
  Eye,
  EyeOff,
  History,
  UserCheck,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Printer,
  KeyRound,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Timer,
  MapPin,
  DoorOpen,
  Ban,
  RotateCcw,
  Archive,
  Trash2,
  Edit3,
  Plus,
  BadgeCheck,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  Minus,
  Circle,
} from 'lucide-react';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MASTER_KEYS = [
  {
    id: 'MK-001',
    name: 'Main Campus Master',
    type: 'skeleton',
    status: 'active',
    level: 'campus-wide',
    location: 'Main Campus',
    serialNumber: 'SK-2024-8891',
    manufacturer: 'Medeco',
    issueDate: '2024-01-15',
    expiryDate: '2025-01-15',
    lastAudit: '2024-12-01',
    nextAudit: '2025-01-01',
    authorizedHolders: 3,
    totalUsages: 1247,
    todayUsages: 12,
    alerts: 0,
    description: 'Primary skeleton key for all academic buildings on main campus',
    zones: ['A-Block', 'B-Block', 'C-Block', 'Library', 'Admin'],
  },
  {
    id: 'MK-002',
    name: 'Science Complex Master',
    type: 'master',
    status: 'active',
    level: 'building',
    location: 'Science Complex',
    serialNumber: 'MK-2024-4421',
    manufacturer: 'ASSA ABLOY',
    issueDate: '2024-03-10',
    expiryDate: '2025-03-10',
    lastAudit: '2024-11-20',
    nextAudit: '2024-12-20',
    authorizedHolders: 2,
    totalUsages: 892,
    todayUsages: 8,
    alerts: 1,
    description: 'Master key for Science Complex laboratories and offices',
    zones: ['Lab-1', 'Lab-2', 'Lab-3', 'Office Wing', 'Storage'],
  },
  {
    id: 'MK-003',
    name: 'Dormitory Master',
    type: 'master',
    status: 'suspended',
    level: 'building',
    location: 'Student Housing',
    serialNumber: 'MK-2024-1156',
    manufacturer: 'Yale',
    issueDate: '2024-02-01',
    expiryDate: '2025-02-01',
    lastAudit: '2024-10-15',
    nextAudit: '2024-11-15',
    authorizedHolders: 1,
    totalUsages: 2103,
    todayUsages: 0,
    alerts: 2,
    description: 'Master key for all dormitory buildings — SUSPENDED pending investigation',
    zones: ['North Hall', 'South Hall', 'East Wing', 'West Wing', 'Common Areas'],
  },
  {
    id: 'MK-004',
    name: 'Library After-Hours',
    type: 'sub-master',
    status: 'active',
    level: 'zone',
    location: 'Central Library',
    serialNumber: 'SM-2024-3321',
    manufacturer: 'Schlage',
    issueDate: '2024-06-01',
    expiryDate: '2025-06-01',
    lastAudit: '2024-11-28',
    nextAudit: '2024-12-28',
    authorizedHolders: 4,
    totalUsages: 456,
    todayUsages: 3,
    alerts: 0,
    description: 'Sub-master for library after-hours access (6PM–11PM)',
    zones: ['Reading Room', 'Study Pods', 'Archive', 'Computer Lab'],
  },
  {
    id: 'MK-005',
    name: 'Facilities Emergency',
    type: 'skeleton',
    status: 'active',
    level: 'campus-wide',
    location: 'All Campuses',
    serialNumber: 'SK-2024-9902',
    manufacturer: 'Medeco',
    issueDate: '2024-01-01',
    expiryDate: '2025-01-01',
    lastAudit: '2024-12-05',
    nextAudit: '2025-01-05',
    authorizedHolders: 2,
    totalUsages: 78,
    todayUsages: 1,
    alerts: 0,
    description: 'Emergency skeleton key for facilities team — restricted use',
    zones: ['All Buildings', 'Utility Rooms', 'Mechanical', 'Roof Access'],
  },
  {
    id: 'MK-006',
    name: 'Athletics Center',
    type: 'master',
    status: 'expired',
    level: 'building',
    location: 'Athletics Complex',
    serialNumber: 'MK-2023-7781',
    manufacturer: 'ASSA ABLOY',
    issueDate: '2023-09-01',
    expiryDate: '2024-09-01',
    lastAudit: '2024-08-20',
    nextAudit: '—',
    authorizedHolders: 0,
    totalUsages: 1567,
    todayUsages: 0,
    alerts: 1,
    description: 'EXPIRED — Athletics Center master key, renewal pending',
    zones: ['Gymnasium', 'Pool', 'Locker Rooms', 'Equipment Storage'],
  },
];

const HOLDERS = [
  {
    id: 'H-001',
    name: 'Dr. Sarah Chen',
    role: 'Chief Security Officer',
    department: 'Campus Security',
    keysHeld: ['MK-001', 'MK-005'],
    accessLevel: 'campus-wide',
    status: 'active',
    lastActivity: '2024-12-14 08:23',
    photo: 'SC',
    color: 'bg-emerald-500',
  },
  {
    id: 'H-002',
    name: 'James Rodriguez',
    role: 'Facilities Manager',
    department: 'Facilities',
    keysHeld: ['MK-001', 'MK-005'],
    accessLevel: 'campus-wide',
    status: 'active',
    lastActivity: '2024-12-14 09:15',
    photo: 'JR',
    color: 'bg-blue-500',
  },
  {
    id: 'H-003',
    name: 'Prof. Emily Watson',
    role: 'Science Dept. Head',
    department: 'Science',
    keysHeld: ['MK-002'],
    accessLevel: 'building',
    status: 'active',
    lastActivity: '2024-12-13 16:45',
    photo: 'EW',
    color: 'bg-violet-500',
  },
  {
    id: 'H-004',
    name: 'Michael Torres',
    role: 'Housing Supervisor',
    department: 'Student Housing',
    keysHeld: ['MK-003'],
    accessLevel: 'building',
    status: 'suspended',
    lastActivity: '2024-12-10 11:30',
    photo: 'MT',
    color: 'bg-amber-500',
  },
  {
    id: 'H-005',
    name: 'Lisa Park',
    role: 'Librarian',
    department: 'Library Services',
    keysHeld: ['MK-004'],
    accessLevel: 'zone',
    status: 'active',
    lastActivity: '2024-12-14 07:50',
    photo: 'LP',
    color: 'bg-rose-500',
  },
  {
    id: 'H-006',
    name: 'David Kim',
    role: 'Night Security',
    department: 'Campus Security',
    keysHeld: ['MK-004'],
    accessLevel: 'zone',
    status: 'active',
    lastActivity: '2024-12-14 06:00',
    photo: 'DK',
    color: 'bg-slate-500',
  },
  {
    id: 'H-007',
    name: 'Anna Schmidt',
    role: 'Library Director',
    department: 'Library Services',
    keysHeld: ['MK-004'],
    accessLevel: 'zone',
    status: 'active',
    lastActivity: '2024-12-13 18:20',
    photo: 'AS',
    color: 'bg-cyan-500',
  },
];

const USAGE_LOGS = [
  {
    id: 1,
    keyId: 'MK-001',
    holder: 'Dr. Sarah Chen',
    action: 'unlock',
    location: 'A-Block Main Entrance',
    timestamp: '2024-12-14 09:23:14',
    method: 'fingerprint',
    success: true,
  },
  {
    id: 2,
    keyId: 'MK-002',
    holder: 'Prof. Emily Watson',
    action: 'unlock',
    location: 'Lab-2 Secure Storage',
    timestamp: '2024-12-14 09:15:42',
    method: 'keycard',
    success: true,
  },
  {
    id: 3,
    keyId: 'MK-004',
    holder: 'Lisa Park',
    action: 'lock',
    location: 'Reading Room',
    timestamp: '2024-12-14 08:55:00',
    method: 'fingerprint',
    success: true,
  },
  {
    id: 4,
    keyId: 'MK-005',
    holder: 'James Rodriguez',
    action: 'unlock',
    location: 'Utility Room B-12',
    timestamp: '2024-12-14 08:30:22',
    method: 'keycard',
    success: true,
  },
  {
    id: 5,
    keyId: 'MK-001',
    holder: 'James Rodriguez',
    action: 'unlock',
    location: 'Admin Building',
    timestamp: '2024-12-14 08:15:10',
    method: 'fingerprint',
    success: true,
  },
  {
    id: 6,
    keyId: 'MK-004',
    holder: 'David Kim',
    action: 'unlock',
    location: 'Archive Section',
    timestamp: '2024-12-14 07:50:33',
    method: 'keycard',
    success: true,
  },
  {
    id: 7,
    keyId: 'MK-002',
    holder: 'Prof. Emily Watson',
    action: 'lock',
    location: 'Office Wing',
    timestamp: '2024-12-14 07:45:18',
    method: 'fingerprint',
    success: true,
  },
  {
    id: 8,
    keyId: 'MK-001',
    holder: 'Dr. Sarah Chen',
    action: 'unlock',
    location: 'Library Main Door',
    timestamp: '2024-12-14 07:30:05',
    method: 'fingerprint',
    success: true,
  },
  {
    id: 9,
    keyId: 'MK-003',
    holder: 'Michael Torres',
    action: 'unlock',
    location: 'North Hall',
    timestamp: '2024-12-10 11:30:00',
    method: 'keycard',
    success: false,
    reason: 'Key suspended — access denied',
  },
  {
    id: 10,
    keyId: 'MK-004',
    holder: 'Anna Schmidt',
    action: 'unlock',
    location: 'Computer Lab',
    timestamp: '2024-12-13 18:20:15',
    method: 'fingerprint',
    success: true,
  },
  {
    id: 11,
    keyId: 'MK-005',
    holder: 'James Rodriguez',
    action: 'lock',
    location: 'Mechanical Room A-3',
    timestamp: '2024-12-13 17:45:00',
    method: 'keycard',
    success: true,
  },
  {
    id: 12,
    keyId: 'MK-002',
    holder: 'Prof. Emily Watson',
    action: 'unlock',
    location: 'Lab-1',
    timestamp: '2024-12-13 16:45:22',
    method: 'fingerprint',
    success: true,
  },
  {
    id: 13,
    keyId: 'MK-001',
    holder: 'Dr. Sarah Chen',
    action: 'unlock',
    location: 'C-Block',
    timestamp: '2024-12-13 15:20:10',
    method: 'fingerprint',
    success: true,
  },
  {
    id: 14,
    keyId: 'MK-004',
    holder: 'Lisa Park',
    action: 'lock',
    location: 'Study Pods',
    timestamp: '2024-12-13 14:55:00',
    method: 'keycard',
    success: true,
  },
  {
    id: 15,
    keyId: 'MK-001',
    holder: 'James Rodriguez',
    action: 'unlock',
    location: 'B-Block',
    timestamp: '2024-12-13 14:30:45',
    method: 'fingerprint',
    success: true,
  },
];

const ALERTS = [
  {
    id: 1,
    type: 'suspicious',
    severity: 'high',
    keyId: 'MK-003',
    message: 'Key used outside authorized hours (2:47 AM)',
    timestamp: '2024-12-10 02:47:00',
    resolved: false,
  },
  {
    id: 2,
    type: 'expired',
    severity: 'medium',
    keyId: 'MK-006',
    message: 'Key expired 105 days ago — renewal pending',
    timestamp: '2024-09-01 00:00:00',
    resolved: false,
  },
  {
    id: 3,
    type: 'multiple-attempts',
    severity: 'medium',
    keyId: 'MK-003',
    message: '5 failed access attempts in 10 minutes',
    timestamp: '2024-12-10 11:25:00',
    resolved: false,
  },
  {
    id: 4,
    type: 'audit-overdue',
    severity: 'low',
    keyId: 'MK-003',
    message: 'Audit overdue by 29 days',
    timestamp: '2024-11-15 00:00:00',
    resolved: false,
  },
];

// ─── Components ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    suspended: 'bg-amber-50 text-amber-700 border-amber-200',
    expired: 'bg-red-50 text-red-700 border-red-200',
  };
  const icons = {
    active: CheckCircle2,
    suspended: AlertTriangle,
    expired: XCircle,
  };
  const Icon = icons[status] || Circle;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.active}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function KeyTypeBadge({ type }) {
  const styles = {
    skeleton: 'bg-violet-50 text-violet-700 border-violet-200',
    master: 'bg-blue-50 text-blue-700 border-blue-200',
    'sub-master': 'bg-slate-50 text-slate-700 border-slate-200',
  };
  const icons = {
    skeleton: Layers,
    master: Key,
    'sub-master': KeyRound,
  };
  const Icon = icons[type] || Key;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[type] || styles.master}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {type === 'sub-master' ? 'Sub-Master' : type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const styles = {
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[severity]}`}
    >
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    violet: 'bg-violet-50 text-violet-600',
    slate: 'bg-slate-50 text-slate-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 mt-3">
          {trend === 'up' ? (
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
          ) : trend === 'down' ? (
            <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
          ) : (
            <Minus className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span
            className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'}`}
          >
            {trendValue}
          </span>
          <span className="text-xs text-slate-400">vs last week</span>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-slate-900 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {count !== undefined && (
        <span
          className={`px-1.5 py-0.5 rounded-md text-xs ${active ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MasterKeyAuditPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedKey, setExpandedKey] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [showKeyDetail, setShowKeyDetail] = useState(false);
  const [logFilter, setLogFilter] = useState('all');

  const filteredKeys = useMemo(() => {
    return MASTER_KEYS.filter((key) => {
      const matchesSearch =
        searchQuery === '' ||
        key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || key.status === statusFilter;
      const matchesType = typeFilter === 'all' || key.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [searchQuery, statusFilter, typeFilter]);

  const filteredLogs = useMemo(() => {
    return USAGE_LOGS.filter((log) => {
      if (selectedKey && log.keyId !== selectedKey) return false;
      if (logFilter === 'success') return log.success;
      if (logFilter === 'failed') return !log.success;
      return true;
    });
  }, [selectedKey, logFilter]);

  const activeKeys = MASTER_KEYS.filter((k) => k.status === 'active').length;
  const suspendedKeys = MASTER_KEYS.filter((k) => k.status === 'suspended').length;
  const expiredKeys = MASTER_KEYS.filter((k) => k.status === 'expired').length;
  const totalHolders = HOLDERS.filter((h) => h.status === 'active').length;
  const totalUsages = MASTER_KEYS.reduce((sum, k) => sum + k.totalUsages, 0);
  const todayUsages = MASTER_KEYS.reduce((sum, k) => sum + k.todayUsages, 0);
  const openAlerts = ALERTS.filter((a) => !a.resolved).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-900 rounded-xl">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Master Key Audit</h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Skeleton & master key tracking, authorized holders, and usage logs
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
                <Plus className="w-4 h-4" />
                Add Key
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Active Keys"
            value={activeKeys}
            subtitle={`${MASTER_KEYS.length} total keys registered`}
            icon={ShieldCheck}
            trend="up"
            trendValue="+1"
            color="emerald"
          />
          <StatCard
            title="Authorized Holders"
            value={totalHolders}
            subtitle={`${HOLDERS.length} total registered`}
            icon={Users}
            trend="flat"
            trendValue="0"
            color="blue"
          />
          <StatCard
            title="Today’s Usage"
            value={todayUsages}
            subtitle={`${totalUsages.toLocaleString()} total accesses`}
            icon={Activity}
            trend="up"
            trendValue="+23%"
            color="violet"
          />
          <StatCard
            title="Open Alerts"
            value={openAlerts}
            subtitle={`${suspendedKeys} suspended, ${expiredKeys} expired`}
            icon={openAlerts > 0 ? ShieldAlert : ShieldCheck}
            trend={openAlerts > 0 ? 'up' : 'down'}
            trendValue={openAlerts > 0 ? `${openAlerts} new` : 'All clear'}
            color={openAlerts > 0 ? 'red' : 'emerald'}
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-200 mb-6 w-fit">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={Layers}
            label="Overview"
            count={MASTER_KEYS.length}
          />
          <TabButton
            active={activeTab === 'holders'}
            onClick={() => setActiveTab('holders')}
            icon={Users}
            label="Holders"
            count={HOLDERS.length}
          />
          <TabButton
            active={activeTab === 'logs'}
            onClick={() => setActiveTab('logs')}
            icon={History}
            label="Usage Logs"
            count={USAGE_LOGS.length}
          />
          <TabButton
            active={activeTab === 'alerts'}
            onClick={() => setActiveTab('alerts')}
            icon={AlertOctagon}
            label="Alerts"
            count={openAlerts}
          />
        </div>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search keys by name, ID, serial, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Types</option>
                <option value="skeleton">Skeleton</option>
                <option value="master">Master</option>
                <option value="sub-master">Sub-Master</option>
              </select>
            </div>

            {/* Keys Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                        Key
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                        Type
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                        Status
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                        Location
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                        Holders
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                        Usage
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                        Next Audit
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredKeys.map((key) => (
                      <>
                        <tr
                          key={key.id}
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                          onClick={() => setExpandedKey(expandedKey === key.id ? null : key.id)}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${key.type === 'skeleton' ? 'bg-violet-100 text-violet-600' : key.type === 'master' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}
                              >
                                {key.type === 'skeleton' ? (
                                  <Layers className="w-4 h-4" />
                                ) : (
                                  <Key className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{key.name}</p>
                                <p className="text-xs text-slate-400">
                                  {key.id} · {key.serialNumber}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <KeyTypeBadge type={key.type} />
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={key.status} />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {key.location}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-sm text-slate-600">
                                {key.authorizedHolders}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div>
                              <p className="text-sm text-slate-600">
                                {key.totalUsages.toLocaleString()}
                              </p>
                              <p className="text-xs text-slate-400">{key.todayUsages} today</p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span
                                className={`text-sm ${new Date(key.nextAudit) < new Date() ? 'text-red-600 font-medium' : 'text-slate-600'}`}
                              >
                                {key.nextAudit}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedKey(key.id);
                                  setShowKeyDetail(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedKey === key.id && (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-5 py-4 bg-slate-50/80 border-b border-slate-100"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                    Description
                                  </p>
                                  <p className="text-sm text-slate-600">{key.description}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                    Authorized Zones
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {key.zones.map((zone) => (
                                      <span
                                        key={zone}
                                        className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-xs text-slate-600"
                                      >
                                        {zone}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                    Key Details
                                  </p>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Manufacturer:</span>{' '}
                                      <span className="text-slate-600">{key.manufacturer}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Issued:</span>{' '}
                                      <span className="text-slate-600">{key.issueDate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Expires:</span>{' '}
                                      <span className="text-slate-600">{key.expiryDate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Last Audit:</span>{' '}
                                      <span className="text-slate-600">{key.lastAudit}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredKeys.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No keys match your filters</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── HOLDERS TAB ─── */}
        {activeTab === 'holders' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Authorized Key Holders</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                <UserCheck className="w-3.5 h-3.5" />
                Verify All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                      Holder
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                      Department
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                      Keys Held
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                      Access Level
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                      Last Activity
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {HOLDERS.map((holder) => (
                    <tr key={holder.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${holder.color} flex items-center justify-center text-white text-xs font-bold`}
                          >
                            {holder.photo}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{holder.name}</p>
                            <p className="text-xs text-slate-400">{holder.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-600">{holder.department}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {holder.keysHeld.map((keyId) => (
                            <span
                              key={keyId}
                              className="px-2 py-0.5 bg-slate-100 rounded-md text-xs text-slate-600 font-medium"
                            >
                              {keyId}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                            holder.accessLevel === 'campus-wide'
                              ? 'bg-violet-50 text-violet-700'
                              : holder.accessLevel === 'building'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-slate-50 text-slate-700'
                          }`}
                        >
                          {holder.accessLevel === 'campus-wide' && <Layers className="w-3 h-3" />}
                          {holder.accessLevel === 'building' && <Building2 className="w-3 h-3" />}
                          {holder.accessLevel === 'zone' && <MapPin className="w-3 h-3" />}
                          {holder.accessLevel.charAt(0).toUpperCase() + holder.accessLevel.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={holder.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          {holder.lastActivity}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {holder.status === 'active' ? (
                            <button
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Suspend"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Reactivate"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── LOGS TAB ─── */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search logs by holder, location, or key ID..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Events</option>
                <option value="success">Successful</option>
                <option value="failed">Failed</option>
              </select>
              {selectedKey && (
                <button
                  onClick={() => setSelectedKey(null)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Clear filter: {selectedKey}
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                        Time
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                        Key
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                        Holder
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                        Action
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                        Location
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                        Method
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                        Result
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {log.timestamp}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-medium text-slate-900">{log.keyId}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-slate-600">{log.holder}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                              log.action === 'unlock'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-50 text-slate-700'
                            }`}
                          >
                            {log.action === 'unlock' ? (
                              <Unlock className="w-3 h-3" />
                            ) : (
                              <Lock className="w-3 h-3" />
                            )}
                            {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {log.location}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {log.method === 'fingerprint' ? (
                              <Fingerprint className="w-3.5 h-3.5 text-violet-500" />
                            ) : (
                              <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                            )}
                            <span className="text-sm text-slate-600 capitalize">{log.method}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {log.success ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" />
                              Success
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700"
                              title={log.reason}
                            >
                              <XCircle className="w-3 h-3" />
                              Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── ALERTS TAB ─── */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {ALERTS.filter((a) => !a.resolved).map((alert) => {
              const key = MASTER_KEYS.find((k) => k.id === alert.keyId);
              return (
                <div
                  key={alert.id}
                  className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow ${
                    alert.severity === 'high'
                      ? 'border-red-200'
                      : alert.severity === 'medium'
                        ? 'border-amber-200'
                        : 'border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2.5 rounded-lg ${
                          alert.severity === 'high'
                            ? 'bg-red-50 text-red-600'
                            : alert.severity === 'medium'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {alert.type === 'suspicious' && <AlertTriangle className="w-5 h-5" />}
                        {alert.type === 'expired' && <Timer className="w-5 h-5" />}
                        {alert.type === 'multiple-attempts' && <ShieldAlert className="w-5 h-5" />}
                        {alert.type === 'audit-overdue' && <Calendar className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-slate-900">{alert.message}</h3>
                          <SeverityBadge severity={alert.severity} />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                          <span className="flex items-center gap-1">
                            <Key className="w-3 h-3" />
                            {alert.keyId} {key && `· ${key.name}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {alert.timestamp}
                          </span>
                          <span
                            className={`flex items-center gap-1 ${
                              alert.type === 'suspicious'
                                ? 'text-red-600'
                                : alert.type === 'expired'
                                  ? 'text-amber-600'
                                  : 'text-blue-600'
                            }`}
                          >
                            {alert.type === 'suspicious' && <AlertTriangle className="w-3 h-3" />}
                            {alert.type === 'expired' && <Timer className="w-3 h-3" />}
                            {alert.type === 'multiple-attempts' && (
                              <ShieldAlert className="w-3 h-3" />
                            )}
                            {alert.type === 'audit-overdue' && <Calendar className="w-3 h-3" />}
                            {alert.type
                              .split('-')
                              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                              .join(' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                        Investigate
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {ALERTS.filter((a) => !a.resolved).length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                <ShieldCheck className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-700">All Clear</h3>
                <p className="text-sm text-slate-400 mt-1">No open alerts at this time</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Key Detail Modal */}
      {showKeyDetail && selectedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            {(() => {
              const key = MASTER_KEYS.find((k) => k.id === selectedKey);
              if (!key) return null;
              const keyHolders = HOLDERS.filter((h) => h.keysHeld.includes(key.id));
              return (
                <>
                  <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${key.type === 'skeleton' ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'}`}
                      >
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">{key.name}</h2>
                        <p className="text-xs text-slate-400">
                          {key.id} · {key.serialNumber}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowKeyDetail(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                          Status
                        </p>
                        <div className="mt-2">
                          <StatusBadge status={key.status} />
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                          Type
                        </p>
                        <div className="mt-2">
                          <KeyTypeBadge type={key.type} />
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                          Location
                        </p>
                        <p className="text-sm font-medium text-slate-700 mt-2 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          {key.location}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                          Manufacturer
                        </p>
                        <p className="text-sm font-medium text-slate-700 mt-2">
                          {key.manufacturer}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-2">
                        Description
                      </p>
                      <p className="text-sm text-slate-600">{key.description}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-2">
                        Authorized Zones
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {key.zones.map((zone) => (
                          <span
                            key={zone}
                            className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-600 font-medium"
                          >
                            {zone}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                          Issue Date
                        </p>
                        <p className="text-sm font-medium text-slate-700 mt-2">{key.issueDate}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                          Expiry Date
                        </p>
                        <p
                          className={`text-sm font-medium mt-2 ${new Date(key.expiryDate) < new Date() ? 'text-red-600' : 'text-slate-700'}`}
                        >
                          {key.expiryDate}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                          Last Audit
                        </p>
                        <p className="text-sm font-medium text-slate-700 mt-2">{key.lastAudit}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                          Next Audit
                        </p>
                        <p
                          className={`text-sm font-medium mt-2 ${new Date(key.nextAudit) < new Date() ? 'text-red-600' : 'text-slate-700'}`}
                        >
                          {key.nextAudit}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3">
                        Authorized Holders ({keyHolders.length})
                      </p>
                      <div className="space-y-2">
                        {keyHolders.map((holder) => (
                          <div
                            key={holder.id}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full ${holder.color} flex items-center justify-center text-white text-xs font-bold`}
                              >
                                {holder.photo}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">{holder.name}</p>
                                <p className="text-xs text-slate-400">
                                  {holder.role} · {holder.department}
                                </p>
                              </div>
                            </div>
                            <StatusBadge status={holder.status} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
                        <FileText className="w-4 h-4" />
                        Full Audit Report
                      </button>
                      <button className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <Printer className="w-4 h-4" />
                        Print
                      </button>
                      <button className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <Archive className="w-4 h-4" />
                        Archive
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
