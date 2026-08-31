/* src/app/app/users/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Shield, ShieldCheck, Search, Filter, Plus, ChevronDown, ChevronUp,
  LayoutGrid, List, Eye, Edit3, UserX, UserCheck, Key, Lock, Unlock,
  Activity, FileText, AlertTriangle, Check, X, MoreHorizontal,
  Download, RefreshCw, Clock, Mail, Phone, Building2, Crown
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useUserStore } from './store';
import { departments, userStatusMeta, timeAgo } from './data';
import {
  UserStatusBadge,
  RoleBadge,
  DepartmentBadge,
  MfaBadge,
  SessionBadge,
  UserAvatar,
  StatCard,
} from './components';

export default function UsersPage() {
  const navigate = useNavigate();
  const users = useUserStore((s) => s.users);
  const roles = useUserStore((s) => s.roles);
  const deactivateUser = useUserStore((s) => s.deactivateUser);
  const reactivateUser = useUserStore((s) => s.reactivateUser);
  const currentUser = useUserStore((s) => s.getCurrentUser());

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [sortConfig, setSortConfig] = useState({ key: 'lastLogin', dir: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirmSuspend, setShowConfirmSuspend] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'active').length;
    const suspended = users.filter((u) => u.status === 'suspended').length;
    const onLeave = users.filter((u) => u.status === 'on-leave').length;
    const mfaEnabled = users.filter((u) => u.mfaEnabled).length;
    const onlineNow = users.filter((u) => u.sessionExpiry && new Date(u.sessionExpiry) > new Date()).length;
    const adminCount = users.filter((u) => {
      const r = roles.find((rl) => rl.id === u.roleId);
      return r?.level >= 80;
    }).length;
    return { total, active, suspended, onLeave, mfaEnabled, onlineNow, adminCount };
  }, [users, roles]);

  /* ─── Filtered & Sorted ─── */
  const filtered = useMemo(() => {
    let data = users.filter((u) => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      const matchesQuery =
        !query ||
        fullName.includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase()) ||
        u.id.toLowerCase().includes(query.toLowerCase()) ||
        u.phone.includes(query);
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchesRole = roleFilter === 'all' || u.roleId === roleFilter;
      const matchesDept = deptFilter === 'all' || u.departmentId === deptFilter;
      return matchesQuery && matchesStatus && matchesRole && matchesDept;
    });

    data.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'name') {
        aVal = `${a.firstName} ${a.lastName}`;
        bVal = `${b.firstName} ${b.lastName}`;
      }
      if (sortConfig.key === 'role') {
        const rA = roles.find((r) => r.id === a.roleId);
        const rB = roles.find((r) => r.id === b.roleId);
        aVal = rA?.level || 0;
        bVal = rB?.level || 0;
      }
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (aVal < bVal) return sortConfig.dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.dir === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [users, query, statusFilter, roleFilter, deptFilter, sortConfig, roles]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSuspend = () => {
    if (selectedUser && suspendReason.trim()) {
      deactivateUser(selectedUser.id, suspendReason.trim(), currentUser?.id);
      setShowConfirmSuspend(false);
      setSuspendReason('');
      setSelectedUser(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Users & RBAC</h1>
          <p className="text-sm text-text-secondary">
            Manage staff accounts, roles, permissions, and access control
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={() => navigate('/app/users/new')}>
            <Plus className="mr-1.5 h-4 w-4" /> Add User
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Total Users" value={stats.total} icon={Users} color="text-text-primary" />
        <StatCard label="Active" value={stats.active} icon={UserCheck} color="text-accent" />
        <StatCard label="Online Now" value={stats.onlineNow} icon={Activity} color="text-secondary" />
        <StatCard label="Admins" value={stats.adminCount} icon={Crown} color="text-warning" />
        <StatCard label="Suspended" value={stats.suspended} icon={UserX} color="text-danger" />
        <StatCard label="On Leave" value={stats.onLeave} icon={Clock} color="text-info" />
        <StatCard label="MFA Enabled" value={`${Math.round((stats.mfaEnabled / stats.total) * 100)}%`} icon={ShieldCheck} color="text-accent" />
      </div>

      {/* Security Alert Banner */}
      {stats.suspended > 0 && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-primary">
              {stats.suspended} suspended account{stats.suspended > 1 ? 's' : ''} require attention
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Review suspended accounts for security incidents or reactivation.
            </p>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, email, ID, phone..."
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
                viewMode === 'table' ? 'bg-background shadow-sm text-text-primary' : 'text-text-muted hover:text-text-primary'
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors',
                viewMode === 'grid' ? 'bg-background shadow-sm text-text-primary' : 'text-text-muted hover:text-text-primary'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="on-leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Department</label>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setRoleFilter('all');
                  setDeptFilter('all');
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
        Showing <span className="font-medium text-text-primary">{filtered.length}</span> of {users.length} users
      </p>

      {/* ─── Table View ─── */}
      {viewMode === 'table' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  {[
                    { key: 'name', label: 'User' },
                    { key: 'role', label: 'Role & Dept' },
                    { key: 'status', label: 'Status' },
                    { key: 'lastLogin', label: 'Last Active' },
                    { key: 'loginCount', label: 'Logins' },
                    { key: 'mfaEnabled', label: 'Security' },
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
                  <tr
                    key={user.id}
                    className="hover:bg-background/50 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} size="md" />
                        <div>
                          <p className="font-medium text-text-primary">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-text-muted">{user.id}</p>
                          <p className="text-xs text-text-secondary">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <RoleBadge roleId={user.roleId} />
                        <DepartmentBadge departmentId={user.departmentId} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <UserStatusBadge status={user.status} />
                      {user.status === 'suspended' && user.suspensionReason && (
                        <p className="mt-1 text-[10px] text-danger max-w-[200px] truncate">
                          {user.suspensionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-text-secondary text-xs">
                        {user.lastLogin ? timeAgo(user.lastLogin) : 'Never'}
                      </div>
                      <SessionBadge expiry={user.sessionExpiry} />
                    </td>
                    <td className="px-4 py-3 text-text-primary font-mono">
                      {user.loginCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <MfaBadge enabled={user.mfaEnabled} />
                        <p className="text-[10px] text-text-muted">
                          PW: {timeAgo(user.passwordChangedAt + 'T00:00:00')}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/app/users/detail?id=${user.id}`)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/app/users/detail?id=${user.id}&edit=true`)}
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
                        ) : user.status === 'suspended' ? (
                          <button
                            onClick={() => reactivateUser(user.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-accent/10 hover:text-accent"
                            title="Reactivate"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
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

      {/* ─── Grid View ─── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((user) => (
            <div
              key={user.id}
              onClick={() => navigate(`/app/users/detail?id=${user.id}`)}
              className="group rounded-xl border border-border bg-surface p-5 cursor-pointer transition-all hover:border-secondary/50 hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <UserAvatar user={user} size="lg" />
                <div className="flex flex-col items-end gap-1.5">
                  <UserStatusBadge status={user.status} />
                  <MfaBadge enabled={user.mfaEnabled} />
                </div>
              </div>

              <h3 className="text-base font-semibold text-text-primary group-hover:text-secondary transition-colors">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-xs text-text-muted">{user.id}</p>
              <p className="text-xs text-text-secondary mt-0.5">{user.email}</p>

              <div className="mt-3 space-y-2">
                <RoleBadge roleId={user.roleId} />
                <DepartmentBadge departmentId={user.departmentId} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Last Login</p>
                  <p className="text-xs font-medium text-text-primary">
                    {user.lastLogin ? timeAgo(user.lastLogin) : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Logins</p>
                  <p className="text-xs font-medium text-text-primary">{user.loginCount.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <SessionBadge expiry={user.sessionExpiry} />
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-text-muted">No users match your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Suspend Confirmation Modal ─── */}
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
                  {selectedUser.firstName} {selectedUser.lastName} · {selectedUser.id}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary">
                  Suspending will immediately terminate all active sessions and revoke access.
                  The user will be unable to log in until reactivated.
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
                placeholder="e.g. Security incident, policy violation, offboarding..."
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
    </div>
  );
}