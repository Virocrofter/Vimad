/* src/app/app/users/page.jsx — democked: real /v1/users data */
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  Crown,
  Search,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Eye,
  Edit3,
  Activity,
  AlertTriangle,
  Download,
  X,
  Lock,
  Mail,
  Phone,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { usersApi } from '../../../api/users';

/* ─── Helpers ─── */
const timeAgo = (iso) => {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const ROLE_META = {
  owner: { label: 'Owner', class: 'bg-danger/10 text-danger border-danger/20' },
  admin: { label: 'Admin', class: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  manager: { label: 'Manager', class: 'bg-warning/10 text-warning border-warning/20' },
  staff: { label: 'Staff', class: 'bg-secondary/10 text-secondary border-secondary/20' },
  housekeeper: { label: 'Housekeeper', class: 'bg-accent/10 text-accent border-accent/20' },
};

const STATUS_META = {
  active: { label: 'Active', class: 'bg-accent/10 text-accent border-accent/20', dot: 'bg-accent' },
  suspended: {
    label: 'Suspended',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
  },
  inactive: {
    label: 'Inactive',
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-text-muted',
  },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.inactive;
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

function RoleBadge({ role }) {
  const meta = ROLE_META[role] || ROLE_META.staff;
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

function Avatar({ firstName, lastName, size = 'md' }) {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-lg' };
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-secondary/10 font-semibold text-secondary',
        sizes[size]
      )}
    >
      {initials}
    </div>
  );
}

/* ─── Add User Modal ─── */
function AddUserModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'staff',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const user = await usersApi.create(form);
      onCreated(user);
      setForm({ firstName: '', lastName: '', email: '', phone: '', role: 'staff', password: '' });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-background shadow-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Add User</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-surface-elevated text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="First name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
            />
            <input
              required
              placeholder="Last name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
            />
          </div>
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
          />
          <input
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
            >
              {Object.entries(ROLE_META).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            <input
              required
              type="password"
              minLength={8}
              placeholder="Temp password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
            />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={saving}>
              {saving ? 'Creating…' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [sortConfig, setSortConfig] = useState({ key: 'lastLoginAt', dir: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirmSuspend, setShowConfirmSuspend] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [actionError, setActionError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.list({ page: 1, pageSize: 500 });
      setUsers(res.data);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return {
      total: users.length,
      active: users.filter((u) => u.status === 'active').length,
      suspended: users.filter((u) => u.status === 'suspended').length,
      inactive: users.filter((u) => u.status === 'inactive').length,
      admins: users.filter((u) => u.role === 'owner' || u.role === 'admin').length,
      onlineNow: users.filter((u) => u.lastLoginAt && (u.activeSessions ?? 0) > 0).length,
      recentLogins: users.filter(
        (u) => u.lastLoginAt && new Date(u.lastLoginAt).getTime() >= dayAgo
      ).length,
    };
  }, [users]);

  const filtered = useMemo(() => {
    let data = users.filter((u) => {
      const fullName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase();
      const matchesQuery =
        !query ||
        fullName.includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesQuery && matchesStatus && matchesRole;
    });
    data = [...data].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'name') {
        aVal = `${a.firstName} ${a.lastName}`;
        bVal = `${b.firstName} ${b.lastName}`;
      }
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return sortConfig.dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [users, query, statusFilter, roleFilter, sortConfig]);

  const handleSort = (key) =>
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));

  const handleSuspend = async () => {
    if (!selectedUser || !suspendReason.trim()) return;
    try {
      const updated = await usersApi.setStatus(selectedUser.id, 'suspended', suspendReason.trim());
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
      setShowConfirmSuspend(false);
      setSuspendReason('');
      setSelectedUser(null);
      setActionError(null);
    } catch (err) {
      setActionError(err?.response?.data?.error?.message || 'Suspend failed');
    }
  };

  const handleReactivate = async (user) => {
    try {
      const updated = await usersApi.setStatus(user.id, 'active');
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
      setActionError(null);
    } catch (err) {
      setActionError(err?.response?.data?.error?.message || 'Reactivation failed');
    }
  };

  const exportCsv = () => {
    const header = 'Name,Email,Phone,Role,Status,Last Login,Logins,Created';
    const rows = filtered.map((u) =>
      [
        `${u.firstName ?? ''} ${u.lastName ?? ''}`,
        u.email,
        u.phone ?? '',
        u.role,
        u.status,
        u.lastLoginAt ?? '',
        u.loginCount ?? 0,
        (u.createdAt ?? '').slice(0, 10),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Users & Access</h1>
          <p className="text-sm text-text-secondary">
            Manage staff accounts, roles, and access control
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'text-text-primary' },
          { label: 'Active', value: stats.active, icon: UserCheck, color: 'text-accent' },
          {
            label: 'Logins (24h)',
            value: stats.recentLogins,
            icon: Activity,
            color: 'text-secondary',
          },
          { label: 'Admins', value: stats.admins, icon: Crown, color: 'text-warning' },
          { label: 'Suspended', value: stats.suspended, icon: UserX, color: 'text-danger' },
          { label: 'Inactive', value: stats.inactive, icon: Lock, color: 'text-text-muted' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  {s.label}
                </p>
                <p className={cn('mt-1 text-2xl font-bold', s.color)}>{s.value}</p>
              </div>
              <s.icon className={cn('h-5 w-5', s.color)} />
            </div>
          </div>
        ))}
      </div>

      {stats.suspended > 0 && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-primary">
              {stats.suspended} suspended account{stats.suspended > 1 ? 's' : ''} require attention
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Suspended users cannot log in. Review for reactivation.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </div>
      )}
      {actionError && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
          {actionError}
        </div>
      )}

      {/* Search & filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name or email…"
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
          <div className="flex rounded-md border border-border bg-surface p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors',
                viewMode === 'table'
                  ? 'bg-background shadow-sm text-text-primary'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors',
                viewMode === 'grid'
                  ? 'bg-background shadow-sm text-text-primary'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
              >
                <option value="all">All Roles</option>
                {Object.entries(ROLE_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setRoleFilter('all');
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

      <p className="text-sm text-text-muted">
        Showing <span className="font-medium text-text-primary">{filtered.length}</span> of{' '}
        {users.length} users
        {loading && ' · loading…'}
      </p>

      {/* Table view */}
      {viewMode === 'table' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  {[
                    { key: 'name', label: 'User' },
                    { key: 'role', label: 'Role' },
                    { key: 'status', label: 'Status' },
                    { key: 'lastLoginAt', label: 'Last Active' },
                    { key: 'loginCount', label: 'Logins' },
                    { key: 'createdAt', label: 'Created' },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortConfig.key === col.key &&
                          (sortConfig.dir === 'asc' ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-background/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar firstName={user.firstName} lastName={user.lastName} size="md" />
                        <div>
                          <p className="font-medium text-text-primary">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-text-secondary flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </p>
                          {user.phone && (
                            <p className="text-xs text-text-muted flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <RoleBadge role={user.role} />
                        {user.roles?.length > 0 && (
                          <p className="text-[10px] text-text-muted">
                            {user.roles.map((r) => r.name).join(', ')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {timeAgo(user.lastLoginAt)}
                    </td>
                    <td className="px-4 py-3 text-text-primary font-mono">
                      {(user.loginCount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/app/users/details?id=${user.id}`)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/app/users/details?id=${user.id}&edit=true`)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {user.status === 'active' ? (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowConfirmSuspend(true);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger"
                            title="Suspend"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(user)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-accent/10 hover:text-accent"
                            title="Reactivate"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                      <Users className="mx-auto h-10 w-10 mb-3" />
                      <p>No users match your filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid view */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((user) => (
            <div
              key={user.id}
              onClick={() => navigate(`/app/users/details?id=${user.id}`)}
              className="group rounded-xl border border-border bg-surface p-5 cursor-pointer transition-all hover:border-secondary/50 hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <Avatar firstName={user.firstName} lastName={user.lastName} size="lg" />
                <StatusBadge status={user.status} />
              </div>
              <h3 className="text-base font-semibold text-text-primary group-hover:text-secondary transition-colors">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5 truncate">{user.email}</p>
              <div className="mt-3">
                <RoleBadge role={user.role} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Last Login</p>
                  <p className="text-xs font-medium text-text-primary">
                    {timeAgo(user.lastLoginAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Logins</p>
                  <p className="text-xs font-medium text-text-primary">
                    {(user.loginCount ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-text-muted">No users match your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Suspend modal */}
      {showConfirmSuspend && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowConfirmSuspend(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-background shadow-2xl p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
                <UserX className="h-5 w-5 text-danger" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Suspend User</h3>
                <p className="text-xs text-text-muted">
                  {selectedUser.firstName} {selectedUser.lastName} · {selectedUser.email}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary">
                  Suspending immediately revokes all active sessions. The user cannot log in until
                  reactivated.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Reason for Suspension
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
                placeholder="e.g. Security incident, policy violation, offboarding…"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfirmSuspend(false)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                className="text-danger border-danger/30 hover:bg-danger/10"
                onClick={handleSuspend}
                disabled={!suspendReason.trim()}
              >
                <UserX className="mr-1.5 h-4 w-4" /> Suspend User
              </Button>
            </div>
          </div>
        </div>
      )}

      <AddUserModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={(u) => setUsers((p) => [u, ...p])}
      />
    </div>
  );
}
