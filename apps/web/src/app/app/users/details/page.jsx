/* src/app/app/users/detail/page.jsx */
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  User, X, Edit3, Mail, Phone, Shield, Calendar, Clock,
  ChevronLeft, Check, AlertTriangle, Key, Lock, Unlock,
  Activity, FileText, Globe, Monitor, Smartphone, Ban,
  CheckCircle2, XCircle, History, Save, Trash2, Eye,
  MoreHorizontal, Building2, Briefcase, MapPin, CreditCard
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';

/* ─── Mock Data ─── */
const userProfiles = {
  'U-101': {
    id: 'U-101',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@grandhotel.com',
    phone: '+1 555-1001',
    role: 'Front Desk Manager',
    department: 'Front Office',
    status: 'active',
    avatar: 'SJ',
    joinDate: '2024-03-15',
    lastLogin: '2026-08-15 14:32:18',
    lastIp: '192.168.1.45',
    twoFactorEnabled: true,
    passwordLastChanged: '2026-07-01',
    loginAttempts: 0,
    sessions: [
      { id: 'sess_8f3a2b1c', device: 'Windows Desktop', browser: 'Chrome 128', ip: '192.168.1.45', location: 'Boston, MA', started: '2026-08-15 14:30:00', active: true },
      { id: 'sess_7e2d1c0b', device: 'iPhone 15', browser: 'Safari', ip: '192.168.1.67', location: 'Boston, MA', started: '2026-08-15 09:15:00', active: false },
    ],
    permissions: [
      { module: 'Reservations', read: true, write: true, delete: false, approve: true },
      { module: 'Billing', read: true, write: true, delete: false, approve: false },
      { module: 'Housekeeping', read: true, write: true, delete: false, approve: false },
      { module: 'Rates', read: true, write: false, delete: false, approve: false },
      { module: 'Reports', read: true, write: false, delete: false, approve: false },
      { module: 'Users', read: true, write: false, delete: false, approve: false },
      { module: 'Settings', read: true, write: false, delete: false, approve: false },
      { module: 'Audit Logs', read: true, write: false, delete: false, approve: false },
    ],
    activityHistory: [
      { id: 1, timestamp: '2026-08-15 14:32:18', action: 'Modified reservation R-4021', type: 'reservation', severity: 'info' },
      { id: 2, timestamp: '2026-08-15 14:28:05', action: 'Posted payment $567.00 to folio F-2041', type: 'billing', severity: 'info' },
      { id: 3, timestamp: '2026-08-15 13:45:22', action: 'Checked in guest — Room 312', type: 'guest', severity: 'info' },
      { id: 4, timestamp: '2026-08-15 11:20:00', action: 'Approved rate override for RP-DEL-001', type: 'rates', severity: 'warning' },
      { id: 5, timestamp: '2026-08-15 09:00:00', action: 'Logged in from 192.168.1.45', type: 'security', severity: 'info' },
      { id: 6, timestamp: '2026-08-14 18:30:00', action: 'Exported monthly revenue report', type: 'reports', severity: 'info' },
      { id: 7, timestamp: '2026-08-14 16:15:00', action: 'Created group block GRP-1007', type: 'groups', severity: 'info' },
      { id: 8, timestamp: '2026-08-14 10:00:00', action: 'Failed login attempt from 203.0.113.45', type: 'security', severity: 'danger' },
    ],
  },
  'U-102': {
    id: 'U-102',
    firstName: 'Mike',
    lastName: 'Chen',
    email: 'mike.chen@grandhotel.com',
    phone: '+1 555-1002',
    role: 'Night Auditor',
    department: 'Front Office',
    status: 'active',
    avatar: 'MC',
    joinDate: '2025-01-10',
    lastLogin: '2026-08-15 22:00:00',
    lastIp: '192.168.1.12',
    twoFactorEnabled: false,
    passwordLastChanged: '2026-06-15',
    loginAttempts: 0,
    sessions: [
      { id: 'sess_9e4d5f6a', device: 'MacBook Pro', browser: 'Chrome 127', ip: '192.168.1.12', location: 'Boston, MA', started: '2026-08-15 22:00:00', active: true },
    ],
    permissions: [
      { module: 'Reservations', read: true, write: true, delete: false, approve: false },
      { module: 'Billing', read: true, write: true, delete: false, approve: false },
      { module: 'Housekeeping', read: true, write: false, delete: false, approve: false },
      { module: 'Rates', read: true, write: false, delete: false, approve: false },
      { module: 'Reports', read: true, write: false, delete: false, approve: false },
      { module: 'Users', read: false, write: false, delete: false, approve: false },
      { module: 'Settings', read: false, write: false, delete: false, approve: false },
      { module: 'Audit Logs', read: false, write: false, delete: false, approve: false },
    ],
    activityHistory: [
      { id: 1, timestamp: '2026-08-15 22:00:00', action: 'Started night audit shift', type: 'system', severity: 'info' },
      { id: 2, timestamp: '2026-08-15 23:30:00', action: 'Posted room charges for 142 rooms', type: 'billing', severity: 'info' },
      { id: 3, timestamp: '2026-08-16 01:00:00', action: 'Completed night audit — date rolled to Aug 16', type: 'system', severity: 'info' },
    ],
  },
  'U-103': {
    id: 'U-103',
    firstName: 'David',
    lastName: 'Park',
    email: 'david.park@grandhotel.com',
    phone: '+1 555-1003',
    role: 'Revenue Manager',
    department: 'Revenue',
    status: 'active',
    avatar: 'DP',
    joinDate: '2024-06-01',
    lastLogin: '2026-08-15 12:15:00',
    lastIp: '192.168.1.78',
    twoFactorEnabled: true,
    passwordLastChanged: '2026-08-01',
    loginAttempts: 0,
    sessions: [
      { id: 'sess_2a7b8c9d', device: 'Windows Desktop', browser: 'Edge 126', ip: '192.168.1.78', location: 'Boston, MA', started: '2026-08-15 12:15:00', active: true },
    ],
    permissions: [
      { module: 'Reservations', read: true, write: false, delete: false, approve: false },
      { module: 'Billing', read: true, write: false, delete: false, approve: false },
      { module: 'Housekeeping', read: true, write: false, delete: false, approve: false },
      { module: 'Rates', read: true, write: true, delete: false, approve: true },
      { module: 'Reports', read: true, write: true, delete: false, approve: false },
      { module: 'Users', read: false, write: false, delete: false, approve: false },
      { module: 'Settings', read: true, write: false, delete: false, approve: false },
      { module: 'Audit Logs', read: true, write: false, delete: false, approve: false },
    ],
    activityHistory: [
      { id: 1, timestamp: '2026-08-15 12:15:00', action: 'Overrode rate plan RP-DEL-001 — $189 → $249', type: 'rates', severity: 'warning' },
      { id: 2, timestamp: '2026-08-15 10:30:00', action: 'Updated channel manager rates for Booking.com', type: 'rates', severity: 'info' },
      { id: 3, timestamp: '2026-08-14 16:00:00', action: 'Generated revenue forecast report', type: 'reports', severity: 'info' },
    ],
  },
  'U-104': {
    id: 'U-104',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@grandhotel.com',
    phone: '+1 555-1004',
    role: 'Front Desk Agent',
    department: 'Front Office',
    status: 'inactive',
    avatar: 'ED',
    joinDate: '2025-09-01',
    lastLogin: '2026-08-10 08:00:00',
    lastIp: '192.168.1.33',
    twoFactorEnabled: false,
    passwordLastChanged: '2026-05-20',
    loginAttempts: 3,
    sessions: [],
    permissions: [
      { module: 'Reservations', read: true, write: true, delete: false, approve: false },
      { module: 'Billing', read: true, write: true, delete: false, approve: false },
      { module: 'Housekeeping', read: true, write: false, delete: false, approve: false },
      { module: 'Rates', read: true, write: false, delete: false, approve: false },
      { module: 'Reports', read: false, write: false, delete: false, approve: false },
      { module: 'Users', read: false, write: false, delete: false, approve: false },
      { module: 'Settings', read: false, write: false, delete: false, approve: false },
      { module: 'Audit Logs', read: false, write: false, delete: false, approve: false },
    ],
    activityHistory: [
      { id: 1, timestamp: '2026-08-10 08:00:00', action: 'Logged in from 192.168.1.33', type: 'security', severity: 'info' },
      { id: 2, timestamp: '2026-08-10 08:15:00', action: 'Checked in guest — Room 204', type: 'guest', severity: 'info' },
      { id: 3, timestamp: '2026-08-10 09:30:00', action: 'Account deactivated by admin', type: 'security', severity: 'danger' },
    ],
  },
};

const activityTypeMeta = {
  reservation: { label: 'Reservation', icon: FileText, color: 'text-secondary', bg: 'bg-secondary/10' },
  billing: { label: 'Billing', icon: CreditCard, color: 'text-accent', bg: 'bg-accent/10' },
  guest: { label: 'Guest', icon: User, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  rates: { label: 'Rates', icon: Activity, color: 'text-warning', bg: 'bg-warning/10' },
  reports: { label: 'Reports', icon: FileText, color: 'text-teal-500', bg: 'bg-teal-500/10' },
  groups: { label: 'Groups', icon: Briefcase, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  security: { label: 'Security', icon: Shield, color: 'text-danger', bg: 'bg-danger/10' },
  system: { label: 'System', icon: Monitor, color: 'text-text-muted', bg: 'bg-surface-elevated' },
};

const severityMeta = {
  info: { dot: 'bg-accent', class: 'text-accent' },
  warning: { dot: 'bg-warning', class: 'text-warning' },
  danger: { dot: 'bg-danger', class: 'text-danger' },
};

/* ─── Components ─── */
function StatusBadge({ status }) {
  const meta = {
    active: { label: 'Active', class: 'bg-accent/10 text-accent border-accent/20' },
    inactive: { label: 'Inactive', class: 'bg-neutral/10 text-text-muted border-border' },
    suspended: { label: 'Suspended', class: 'bg-danger/10 text-danger border-danger/20' },
    pending: { label: 'Pending', class: 'bg-warning/10 text-warning border-warning/20' },
  }[status] || meta.active;

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', meta.class)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', status === 'active' ? 'bg-accent' : status === 'inactive' ? 'bg-text-muted' : status === 'suspended' ? 'bg-danger' : 'bg-warning')} />
      {meta.label}
    </span>
  );
}

function PermissionToggle({ enabled, onChange, label }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        'inline-flex h-6 w-10 items-center rounded-full transition-colors',
        enabled ? 'bg-secondary' : 'bg-border'
      )}
      title={label}
    >
      <span className={cn(
        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
        enabled ? 'translate-x-5' : 'translate-x-1'
      )} />
    </button>
  );
}

/* ─── Session Management Modal ─── */
function SessionModal({ sessions, onClose, onTerminate }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
        <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-bold text-text-primary">Active Sessions</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface-elevated text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-3 max-h-96 overflow-auto">
          {sessions.map((session) => (
            <div key={session.id} className={cn(
              'rounded-lg border p-4',
              session.active ? 'border-accent/30 bg-accent/5' : 'border-border bg-surface'
            )}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
                    {session.device.includes('iPhone') || session.device.includes('Mobile')
                      ? <Smartphone className="h-4 w-4 text-secondary" />
                      : <Monitor className="h-4 w-4 text-secondary" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{session.device}</p>
                    <p className="text-xs text-text-muted">{session.browser} · {session.location}</p>
                  </div>
                </div>
                {session.active && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> Current
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
                <span className="font-mono">{session.ip}</span>
                <span>Started: {session.started}</span>
              </div>
              {session.active && (
                <div className="mt-3 pt-3 border-t border-border">
                  <Button variant="outline" size="sm" className="text-danger border-danger/30 hover:bg-danger/10" onClick={() => onTerminate(session.id)}>
                    <Ban className="mr-1.5 h-3.5 w-3.5" /> Terminate Session
                  </Button>
                </div>
              )}
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-center py-8 text-text-muted">
              <Monitor className="mx-auto h-8 w-8 mb-2" />
              <p>No active sessions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function UserDetailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get('id');
  const user = userProfiles[userId];

  const [isEditing, setIsEditing] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editedUser, setEditedUser] = useState(user);
  const [permissions, setPermissions] = useState(user?.permissions || []);

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <User className="mx-auto h-10 w-10 text-text-muted mb-3" />
          <p className="text-text-muted">User not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/app/users')}>
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    setIsEditing(false);
    // In real app: API call to update user
  };

  const handlePermissionToggle = (moduleIndex, permKey) => {
    setPermissions(prev => prev.map((perm, i) =>
      i === moduleIndex ? { ...perm, [permKey]: !perm[permKey] } : perm
    ));
  };

  const handleTerminateSession = (sessionId) => {
    // In real app: API call to terminate session
    console.log('Terminate session:', sessionId);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'permissions', label: 'Permissions', icon: Shield },
    { id: 'activity', label: 'Activity History', icon: History },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/users')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-elevated text-text-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-lg font-bold text-secondary">
              {user.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-text-primary">{user.firstName} {user.lastName}</h1>
                <StatusBadge status={user.status} />
              </div>
              <p className="text-sm text-text-muted">{user.id} · {user.role} · {user.department}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setEditedUser(user); }}>
                <X className="mr-1.5 h-4 w-4" /> Cancel
              </Button>
              <Button variant="secondary" size="sm" onClick={handleSave}>
                <Save className="mr-1.5 h-4 w-4" /> Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowSessions(true)}>
                <Monitor className="mr-1.5 h-4 w-4" /> Sessions ({user.sessions.filter(s => s.active).length})
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit3 className="mr-1.5 h-4 w-4" /> Edit Profile
              </Button>
            </>
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
                  'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors -mb-px',
                  active ? 'border-secondary text-secondary' : 'border-transparent text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Overview Tab ─── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedUser.firstName}
                      onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value })}
                      className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-text-primary">{user.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedUser.lastName}
                      onChange={(e) => setEditedUser({ ...editedUser, lastName: e.target.value })}
                      className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-text-primary">{user.lastName}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Email</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-text-muted" />
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedUser.email}
                        onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                        className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    ) : (
                      <p className="text-sm text-text-primary">{user.email}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Phone</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-text-muted" />
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedUser.phone}
                        onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                        className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    ) : (
                      <p className="text-sm text-text-primary">{user.phone}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Role</label>
                  {isEditing ? (
                    <select
                      value={editedUser.role}
                      onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value })}
                      className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option>Front Desk Manager</option>
                      <option>Front Desk Agent</option>
                      <option>Night Auditor</option>
                      <option>Revenue Manager</option>
                      <option>Housekeeping Supervisor</option>
                      <option>General Manager</option>
                      <option>IT Admin</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-text-primary">{user.role}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Department</label>
                  {isEditing ? (
                    <select
                      value={editedUser.department}
                      onChange={(e) => setEditedUser({ ...editedUser, department: e.target.value })}
                      className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option>Front Office</option>
                      <option>Revenue</option>
                      <option>Housekeeping</option>
                      <option>F&B</option>
                      <option>IT</option>
                      <option>Management</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-text-primary">{user.department}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Status</label>
                  {isEditing ? (
                    <select
                      value={editedUser.status}
                      onChange={(e) => setEditedUser({ ...editedUser, status: e.target.value })}
                      className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  ) : (
                    <div className="mt-1"><StatusBadge status={user.status} /></div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Join Date</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-text-muted" />
                    <p className="text-sm text-text-primary">{new Date(user.joinDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Preview */}
            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Recent Activity</h3>
                <button onClick={() => setActiveTab('activity')} className="text-xs text-secondary hover:underline">View All</button>
              </div>
              <div className="space-y-2">
                {user.activityHistory.slice(0, 5).map((activity) => {
                  const meta = activityTypeMeta[activity.type] || activityTypeMeta.system;
                  const Icon = meta.icon;
                  const sev = severityMeta[activity.severity];
                  return (
                    <div key={activity.id} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', meta.bg)}>
                        <Icon className={cn('h-4 w-4', meta.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{activity.action}</p>
                        <p className="text-xs text-text-muted">{activity.timestamp}</p>
                      </div>
                      <span className={cn('h-2 w-2 rounded-full shrink-0', sev.dot)} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Account Stats */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">Account Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Last Login</span>
                  <span className="text-sm font-medium text-text-primary">{user.lastLogin}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Last IP</span>
                  <span className="text-sm font-mono text-text-primary">{user.lastIp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">2FA Status</span>
                  <span className={cn('text-sm font-medium', user.twoFactorEnabled ? 'text-accent' : 'text-text-muted')}>
                    {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Password Changed</span>
                  <span className="text-sm text-text-primary">{user.passwordLastChanged}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Failed Logins</span>
                  <span className={cn('text-sm font-medium', user.loginAttempts > 0 ? 'text-danger' : 'text-accent')}>
                    {user.loginAttempts}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Key className="mr-2 h-4 w-4" /> Reset Password
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Mail className="mr-2 h-4 w-4" /> Send Welcome Email
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Shield className="mr-2 h-4 w-4" /> {user.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
                </Button>
                {user.status === 'active' ? (
                  <Button variant="outline" size="sm" className="w-full justify-start text-warning border-warning/30 hover:bg-warning/10">
                    <Ban className="mr-2 h-4 w-4" /> Deactivate Account
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="w-full justify-start text-accent border-accent/30 hover:bg-accent/10">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Activate Account
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="w-full justify-start text-danger hover:bg-danger/10">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Permissions Tab ─── */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Permission Matrix</h3>
                <p className="text-xs text-text-muted mt-0.5">Granular access control for {user.firstName} {user.lastName}</p>
              </div>
              {isEditing && (
                <Button variant="secondary" size="sm" onClick={handleSave}>
                  <Save className="mr-1.5 h-4 w-4" /> Save Permissions
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Module</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">Read</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">Write</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">Delete</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">Approve</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {permissions.map((perm, index) => (
                    <tr key={perm.module} className="hover:bg-background/50">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-text-primary">{perm.module}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <PermissionToggle
                            enabled={perm.read}
                            onChange={() => handlePermissionToggle(index, 'read')}
                            label="Read"
                          />
                        ) : (
                          perm.read ? <Check className="h-4 w-4 text-accent mx-auto" /> : <X className="h-4 w-4 text-text-muted mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <PermissionToggle
                            enabled={perm.write}
                            onChange={() => handlePermissionToggle(index, 'write')}
                            label="Write"
                          />
                        ) : (
                          perm.write ? <Check className="h-4 w-4 text-accent mx-auto" /> : <X className="h-4 w-4 text-text-muted mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <PermissionToggle
                            enabled={perm.delete}
                            onChange={() => handlePermissionToggle(index, 'delete')}
                            label="Delete"
                          />
                        ) : (
                          perm.delete ? <Check className="h-4 w-4 text-accent mx-auto" /> : <X className="h-4 w-4 text-text-muted mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <PermissionToggle
                            enabled={perm.approve}
                            onChange={() => handlePermissionToggle(index, 'approve')}
                            label="Approve"
                          />
                        ) : (
                          perm.approve ? <Check className="h-4 w-4 text-accent mx-auto" /> : <X className="h-4 w-4 text-text-muted mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Permission Summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Read Access', count: permissions.filter(p => p.read).length, total: permissions.length, color: 'text-accent' },
              { label: 'Write Access', count: permissions.filter(p => p.write).length, total: permissions.length, color: 'text-secondary' },
              { label: 'Delete Access', count: permissions.filter(p => p.delete).length, total: permissions.length, color: 'text-danger' },
              { label: 'Approve Access', count: permissions.filter(p => p.approve).length, total: permissions.length, color: 'text-warning' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider">{stat.label}</p>
                <p className={cn('mt-1 text-2xl font-bold', stat.color)}>
                  {stat.count}<span className="text-sm text-text-muted font-normal">/{stat.total}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Activity Tab ─── */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">Complete Activity History</h3>
            <div className="space-y-2">
              {user.activityHistory.map((activity) => {
                const meta = activityTypeMeta[activity.type] || activityTypeMeta.system;
                const Icon = meta.icon;
                const sev = severityMeta[activity.severity];
                return (
                  <div key={activity.id} className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-3 hover:bg-surface/50 transition-colors">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', meta.bg)}>
                      <Icon className={cn('h-5 w-5', meta.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary">{activity.action}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn('text-xs font-medium capitalize', meta.color)}>{meta.label}</span>
                        <span className="text-xs text-text-muted">·</span>
                        <span className="text-xs text-text-muted">{activity.timestamp}</span>
                      </div>
                    </div>
                    <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', sev.dot)} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Security Tab ─── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Authentication */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">Authentication</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                    <Key className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Password</p>
                    <p className="text-xs text-text-muted">Last changed: {user.passwordLastChanged}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Key className="mr-1.5 h-4 w-4" /> Change
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <Shield className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Two-Factor Authentication</p>
                    <p className="text-xs text-text-muted">{user.twoFactorEnabled ? 'Enabled via authenticator app' : 'Not configured'}</p>
                  </div>
                </div>
                <Button variant={user.twoFactorEnabled ? 'outline' : 'secondary'} size="sm">
                  {user.twoFactorEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>
          </div>

          {/* Login History */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">Login History</h3>
            <div className="space-y-2">
              {user.sessions.map((session) => (
                <div key={session.id} className={cn(
                  'flex items-center justify-between rounded-lg border p-4',
                  session.active ? 'border-accent/30 bg-accent/5' : 'border-border bg-background'
                )}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
                      {session.device.includes('iPhone') || session.device.includes('Mobile')
                        ? <Smartphone className="h-4 w-4 text-secondary" />
                        : <Monitor className="h-4 w-4 text-secondary" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{session.device}</p>
                      <p className="text-xs text-text-muted">{session.browser} · {session.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted">{session.started}</p>
                    <p className="text-xs font-mono text-text-secondary">{session.ip}</p>
                  </div>
                </div>
              ))}
              {user.sessions.length === 0 && (
                <div className="text-center py-6 text-text-muted text-sm">
                  <Monitor className="mx-auto h-8 w-8 mb-2" />
                  <p>No recent login history</p>
                </div>
              )}
            </div>
          </div>

          {/* Security Alerts */}
          {user.loginAttempts > 0 && (
            <div className="rounded-lg border border-danger/20 bg-danger/5 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-danger">Failed Login Attempts Detected</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {user.loginAttempts} failed attempts recorded. Consider resetting the password or reviewing access logs.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session Modal */}
      {showSessions && (
        <SessionModal
          sessions={user.sessions}
          onClose={() => setShowSessions(false)}
          onTerminate={handleTerminateSession}
        />
      )}
    </div>
  );
}
