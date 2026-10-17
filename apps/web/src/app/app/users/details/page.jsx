/* src/app/app/users/details/page.jsx — democked against /v1/users */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  User,
  X,
  Edit3,
  Mail,
  Phone,
  Shield,
  Calendar,
  ChevronLeft,
  Check,
  Key,
  Lock,
  Activity,
  FileText,
  Globe,
  Ban,
  CheckCircle2,
  History,
  Save,
  Trash2,
  Monitor,
  AlertTriangle,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { usersApi } from '../../../../api/users';
import { apiClient } from '../../../../api/client';

/* rbacApi adapter — the ONLY place /v1/rbac shapes live. */
const rbacApi = {
  listRoles: () => apiClient.get('/v1/rbac/roles').then((r) => r.data?.data ?? r.data ?? []),
};

const timeAgo = (iso) => {
  if (!iso) return 'Never';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
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

function StatusBadge({ status }) {
  const meta = {
    active: {
      label: 'Active',
      class: 'bg-accent/10 text-accent border-accent/20',
      dot: 'bg-accent',
    },
    inactive: {
      label: 'Inactive',
      class: 'bg-neutral/10 text-text-muted border-border',
      dot: 'bg-text-muted',
    },
    suspended: {
      label: 'Suspended',
      class: 'bg-danger/10 text-danger border-danger/20',
      dot: 'bg-danger',
    },
  }[status] || {
    label: status,
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-text-muted',
  };
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

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        'inline-flex h-6 w-10 items-center rounded-full transition-colors',
        enabled ? 'bg-secondary' : 'bg-border'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
          enabled ? 'translate-x-5' : 'translate-x-1'
        )}
      />
    </button>
  );
}

export default function UserDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');
  const startEdit = searchParams.get('edit') === 'true';

  const [user, setUser] = useState(null);
  const [activity, setActivity] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const [isEditing, setIsEditing] = useState(startEdit);
  const [activeTab, setActiveTab] = useState('overview');
  const [edited, setEdited] = useState(null);
  const [assignedRoleIds, setAssignedRoleIds] = useState([]);
  const [dirtyRoles, setDirtyRoles] = useState(false);
  const [resetUrl, setResetUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [u, act, roles] = await Promise.all([
        usersApi.get(userId),
        usersApi.activity(userId, { page: 1, pageSize: 50 }),
        rbacApi.listRoles().catch(() => []),
      ]);
      setUser(u);
      setEdited(u);
      setActivity(act.data);
      setAssignedRoleIds((u.roles ?? []).map((r) => r.id));
      setAllRoles(roles);
      setNotFound(false);
    } catch (err) {
      if (err?.response?.status === 404) setNotFound(true);
      else setError(err?.response?.data?.error?.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await usersApi.update(userId, {
        firstName: edited.firstName,
        lastName: edited.lastName,
        email: edited.email,
        phone: edited.phone,
        role: edited.role,
      });
      setUser((p) => ({ ...p, ...updated }));
      setIsEditing(false);
      setNotice('Profile saved');
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveRoles = async () => {
    setSaving(true);
    setError(null);
    try {
      await usersApi.setRoles(userId, assignedRoleIds);
      setDirtyRoles(false);
      setNotice('Role assignments saved');
      await load();
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Role save failed');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (status) => {
    setError(null);
    try {
      const updated = await usersApi.setStatus(
        userId,
        status,
        status !== 'active' ? 'Changed from user detail page' : undefined
      );
      setUser((p) => ({ ...p, ...updated }));
      setNotice(`Account ${status}`);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Status change failed');
    }
  };

  const doResetPassword = async () => {
    setError(null);
    try {
      const { resetUrl: url } = await usersApi.resetPassword(userId);
      setResetUrl(url);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Reset failed');
    }
  };

  if (loading) return <div className="p-12 text-center text-text-muted">Loading user…</div>;

  if (notFound || !user) {
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

  const roleMeta = ROLE_META[user.role] || ROLE_META.staff;
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || '?';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'roles', label: 'Roles & Access', icon: Shield },
    { id: 'activity', label: 'Activity History', icon: History },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm text-accent flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            {notice}
          </span>
          <button onClick={() => setNotice(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/users')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-elevated text-text-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-lg font-bold text-secondary">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary">
                {user.firstName} {user.lastName}
              </h1>
              <StatusBadge status={user.status} />
            </div>
            <p className="text-sm text-text-muted">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEdited(user);
                }}
              >
                <X className="mr-1.5 h-4 w-4" /> Cancel
              </Button>
              <Button variant="secondary" size="sm" onClick={saveProfile} disabled={saving}>
                <Save className="mr-1.5 h-4 w-4" /> {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit3 className="mr-1.5 h-4 w-4" /> Edit Profile
            </Button>
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

      {/* ─── Overview ─── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                Profile Information
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { key: 'firstName', label: 'First Name' },
                  { key: 'lastName', label: 'Last Name' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                      {f.label}
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={edited[f.key] ?? ''}
                        onChange={(e) => setEdited({ ...edited, [f.key]: e.target.value })}
                        className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-text-primary">{user[f.key]}</p>
                    )}
                  </div>
                ))}
                <div>
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Email
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-text-muted" />
                    {isEditing ? (
                      <input
                        type="email"
                        value={edited.email ?? ''}
                        onChange={(e) => setEdited({ ...edited, email: e.target.value })}
                        className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-text-primary"
                      />
                    ) : (
                      <p className="text-sm text-text-primary">{user.email}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Phone
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-text-muted" />
                    {isEditing ? (
                      <input
                        type="tel"
                        value={edited.phone ?? ''}
                        onChange={(e) => setEdited({ ...edited, phone: e.target.value })}
                        className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-text-primary"
                      />
                    ) : (
                      <p className="text-sm text-text-primary">{user.phone || '—'}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Role
                  </label>
                  {isEditing ? (
                    <select
                      value={edited.role}
                      onChange={(e) => setEdited({ ...edited, role: e.target.value })}
                      className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
                    >
                      {Object.entries(ROLE_META).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-text-primary">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
                          roleMeta.class
                        )}
                      >
                        {roleMeta.label}
                      </span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Join Date
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-text-muted" />
                    <p className="text-sm text-text-primary">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent activity preview */}
            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                  Recent Activity
                </h3>
                <button
                  onClick={() => setActiveTab('activity')}
                  className="text-xs text-secondary hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="space-y-2">
                {activity.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                      <FileText className="h-4 w-4 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">
                        {a.action}
                        {a.entity ? ` · ${a.entity}${a.entityId ? ` ${a.entityId}` : ''}` : ''}
                      </p>
                      <p className="text-xs text-text-muted">
                        {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {activity.length === 0 && (
                  <p className="text-sm text-text-muted text-center py-4">
                    No recorded activity yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                Account Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Last Login</span>
                  <span className="text-sm font-medium text-text-primary">
                    {timeAgo(user.lastLoginAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Last IP</span>
                  <span className="text-sm font-mono text-text-primary">
                    {user.lastLoginIp || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Total Logins</span>
                  <span className="text-sm font-medium text-text-primary">
                    {(user.loginCount ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary flex items-center gap-1">
                    <Monitor className="h-3.5 w-3.5" /> Active Sessions
                  </span>
                  <span className="text-sm font-medium text-text-primary">
                    {user.activeSessions ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                Actions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={doResetPassword}
                >
                  <Key className="mr-2 h-4 w-4" /> Reset Password
                </Button>
                {resetUrl && (
                  <div className="rounded-md border border-border bg-background p-2 text-xs">
                    <p className="text-text-muted mb-1">
                      One-hour reset link (copy & send to user):
                    </p>
                    <div className="flex items-center gap-1">
                      <input
                        readOnly
                        value={resetUrl}
                        className="flex-1 min-w-0 rounded bg-surface px-2 py-1 font-mono text-[10px] text-text-primary"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(resetUrl)}
                        className="rounded p-1 hover:bg-surface-elevated text-text-muted"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
                {user.status === 'active' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-warning border-warning/30 hover:bg-warning/10"
                    onClick={() => setStatus('inactive')}
                  >
                    <Ban className="mr-2 h-4 w-4" /> Deactivate Account
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-accent border-accent/30 hover:bg-accent/10"
                    onClick={() => setStatus('active')}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Activate Account
                  </Button>
                )}
                {user.status !== 'suspended' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-danger border-danger/30 hover:bg-danger/10"
                    onClick={() => setStatus('suspended')}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" /> Suspend Account
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Roles & Access ─── */}
      {activeTab === 'roles' && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Assigned Roles</h3>
              <p className="text-xs text-text-muted mt-0.5">
                RBAC roles from /v1/rbac, on top of the base system role ({roleMeta.label}).
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={saveRoles}
              disabled={!dirtyRoles || saving}
            >
              <Save className="mr-1.5 h-4 w-4" /> {saving ? 'Saving…' : 'Save Assignments'}
            </Button>
          </div>
          {allRoles.length === 0 ? (
            <p className="text-sm text-text-muted py-6 text-center">
              Could not load roles from /v1/rbac (endpoint shape may differ — see Gate 3).
            </p>
          ) : (
            <div className="space-y-2">
              {allRoles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                      {role.name}
                      {role.isLocked && (
                        <span className="rounded-full bg-info/10 border border-info/20 px-2 py-0.5 text-[10px] font-semibold text-info">
                          System
                        </span>
                      )}
                    </p>
                    {role.description && (
                      <p className="text-xs text-text-muted">{role.description}</p>
                    )}
                  </div>
                  <Toggle
                    enabled={assignedRoleIds.includes(role.id)}
                    onChange={() => {
                      setAssignedRoleIds((prev) =>
                        prev.includes(role.id)
                          ? prev.filter((x) => x !== role.id)
                          : [...prev, role.id]
                      );
                      setDirtyRoles(true);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Activity ─── */}
      {activeTab === 'activity' && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
              Audit Trail
            </h3>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
          <div className="space-y-2">
            {activity.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3"
              >
                <Activity className="h-4 w-4 text-secondary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{a.action}</p>
                  <p className="text-xs text-text-muted">
                    {a.entity}
                    {a.entityId ? ` · ${a.entityId}` : ''} ·{' '}
                    {new Date(a.createdAt).toLocaleString()}
                    {a.ipAddress ? ` · ${a.ipAddress}` : ''}
                  </p>
                </div>
              </div>
            ))}
            {activity.length === 0 && (
              <p className="text-sm text-text-muted text-center py-8">
                No audit entries for this user.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ─── Security ─── */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
              Session & Login Facts
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Active Refresh Sessions</span>
                <span className="text-sm font-medium text-text-primary">
                  {user.activeSessions ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Last Login</span>
                <span className="text-sm font-medium text-text-primary">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Last Login IP</span>
                <span className="text-sm font-mono text-text-primary">
                  {user.lastLoginIp || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Failed-login lockout</span>
                <span className="text-sm text-text-muted">Handled by /auth rate limiting</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-danger/20 bg-danger/5 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-danger mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Danger Zone
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Suspending revokes all sessions immediately and blocks login. Deactivating is
              reversible; deletion is not offered here — anonymize via the GDPR data-export tools
              instead.
            </p>
            <div className="flex gap-2">
              {user.status !== 'suspended' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-danger border-danger/30 hover:bg-danger/10"
                  onClick={() => setStatus('suspended')}
                >
                  <Ban className="mr-1.5 h-4 w-4" /> Suspend
                </Button>
              )}
              {user.status !== 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-accent border-accent/30 hover:bg-accent/10"
                  onClick={() => setStatus('active')}
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Reactivate
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
