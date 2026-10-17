/* src/app/app/users/roles/page.jsx — democked against /v1/rbac */
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Shield,
  Plus,
  Search,
  X,
  Edit3,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Users,
  Lock,
  Unlock,
  Save,
  Ban,
  CheckCircle2,
  Eye,
  FileText,
  DollarSign,
  Sparkles,
  TrendingUp,
  Settings,
  ClipboardList,
  User,
  Monitor,
  Briefcase,
  Database,
  Globe,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { apiClient } from '../../../../api/client';
import { usersApi } from '../../../../api/users';

/* ─── rbacApi adapter: the ONLY place /v1/rbac endpoint shapes live ─── */
const rbacApi = {
  listRoles: () =>
    apiClient.get('/v1/rbac/roles').then((r) => {
      const payload = r.data?.data ?? r.data ?? [];
      return Array.isArray(payload) ? payload : (payload.roles ?? []);
    }),
  listPermissions: () =>
    apiClient.get('/v1/rbac/permissions').then((r) => {
      const payload = r.data?.data ?? r.data ?? [];
      return Array.isArray(payload) ? payload : (payload.permissions ?? []);
    }),
  createRole: (body) => apiClient.post('/v1/rbac/roles', body).then((r) => r.data?.data ?? r.data),
  updateRole: (id, body) =>
    apiClient.put(`/v1/rbac/roles/${id}`, body).then((r) => r.data?.data ?? r.data),
  deleteRole: (id) => apiClient.delete(`/v1/rbac/roles/${id}`),
  setPermissions: (id, permissionIds) =>
    apiClient.put(`/v1/rbac/roles/${id}/permissions`, { permissionIds }).then((r) => r.data),
};

/* Map backend Permission { resource, action } rows onto the UI matrix modules. */
const RESOURCE_TO_MODULE = {
  reservation: 'reservations',
  folio: 'billing',
  billing: 'billing',
  housekeeping: 'housekeeping',
  rate_plan: 'rates',
  rates: 'rates',
  report: 'reports',
  reports: 'reports',
  user: 'users',
  users: 'users',
  setting: 'settings',
  settings: 'settings',
  audit: 'auditLogs',
  audit_log: 'auditLogs',
  inventory: 'inventory',
  room: 'inventory',
  channel: 'channelManager',
  channel_manager: 'channelManager',
  sms: 'marketing',
  notification: 'marketing',
  loyalty: 'marketing',
  guest: 'marketing',
  task: 'operations',
  task_rule: 'operations',
  property: 'settings',
  api_key: 'settings',
  night_audit: 'operations',
  sms_template: 'marketing',
};
const ACTION_TO_PERM = {
  read: 'read',
  view: 'read',
  list: 'read',
  create: 'write',
  update: 'write',
  edit: 'write',
  manage: 'write',
  send: 'write',
  run: 'write',
  sync: 'write',
  assign: 'write',
  enroll: 'write',
  post: 'write',
  delete: 'delete',
  export: 'approve',
  payment: 'approve',
  refund: 'approve',
  checkin: 'approve',
  checkout: 'approve',
  override: 'approve',
  inspect: 'approve',
};

const moduleMeta = {
  reservations: {
    label: 'Reservations',
    icon: FileText,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  billing: { label: 'Billing', icon: DollarSign, color: 'text-accent', bg: 'bg-accent/10' },
  housekeeping: { label: 'Housekeeping', icon: Sparkles, color: 'text-info', bg: 'bg-info/10' },
  rates: { label: 'Rates', icon: TrendingUp, color: 'text-warning', bg: 'bg-warning/10' },
  reports: { label: 'Reports', icon: ClipboardList, color: 'text-teal-500', bg: 'bg-teal-500/10' },
  users: { label: 'Users', icon: User, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  settings: { label: 'Settings', icon: Settings, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  auditLogs: { label: 'Audit Logs', icon: Shield, color: 'text-danger', bg: 'bg-danger/10' },
  groups: { label: 'Groups', icon: Briefcase, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  inventory: {
    label: 'Inventory',
    icon: Database,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
  },
  channelManager: {
    label: 'Channel Manager',
    icon: Globe,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  marketing: {
    label: 'Marketing & CRM',
    icon: Monitor,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  operations: {
    label: 'Operations & Tasks',
    icon: ClipboardList,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
};

const permLabels = {
  read: { label: 'Read', short: 'R', color: 'text-accent', bg: 'bg-accent/10' },
  write: { label: 'Write', short: 'W', color: 'text-secondary', bg: 'bg-secondary/10' },
  delete: { label: 'Delete', short: 'D', color: 'text-danger', bg: 'bg-danger/10' },
  approve: { label: 'Approve', short: 'A', color: 'text-warning', bg: 'bg-warning/10' },
};

const emptyMatrix = () =>
  Object.fromEntries(
    Object.keys(moduleMeta).map((k) => [
      k,
      { read: false, write: false, delete: false, approve: false },
    ])
  );

/** permission rows → UI matrix */
function toMatrix(permissions) {
  const matrix = emptyMatrix();
  for (const p of permissions ?? []) {
    const mod = RESOURCE_TO_MODULE[p.resource];
    const perm = ACTION_TO_PERM[p.action];
    if (mod && perm && matrix[mod]) matrix[mod][perm] = true;
  }
  return matrix;
}

/** UI matrix → permission id list (diff against full permission catalogue) */
function toPermissionIds(matrix, allPermissions) {
  const wanted = new Set();
  for (const [modKey, perms] of Object.entries(matrix)) {
    for (const [permKey, enabled] of Object.entries(perms)) {
      if (!enabled) continue;
      for (const p of allPermissions) {
        if (RESOURCE_TO_MODULE[p.resource] === modKey && ACTION_TO_PERM[p.action] === permKey)
          wanted.add(p.id);
      }
    }
  }
  return [...wanted];
}

function PermissionCell({ enabled, onToggle, label, disabled = false }) {
  const meta = permLabels[label];
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-md border text-xs font-bold transition-all',
        enabled
          ? cn(meta.bg, meta.color, 'border-current/30')
          : 'bg-background text-text-muted border-border',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
      title={meta.label}
    >
      {meta.short}
    </button>
  );
}

function RoleCard({ role, isSelected, onSelect, onEdit, onDelete, onDuplicate }) {
  const totalPerms = Object.values(role.permissions).reduce(
    (s, m) => s + Object.values(m).filter(Boolean).length,
    0
  );
  const maxPerms = Object.keys(role.permissions).length * 4;
  const coverage = Math.round((totalPerms / maxPerms) * 100);
  return (
    <div
      onClick={onSelect}
      className={cn(
        'group rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md',
        isSelected
          ? 'border-secondary bg-secondary/5 ring-1 ring-secondary/20'
          : 'border-border bg-surface hover:border-secondary/30'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
            <Shield className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{role.name}</h3>
            <p className="text-xs text-text-muted">{role.userCount ?? 0} users</p>
          </div>
        </div>
        {role.isLocked && (
          <span className="inline-flex items-center rounded-full bg-info/10 border border-info/20 px-2 py-0.5 text-[10px] font-semibold text-info">
            System
          </span>
        )}
      </div>
      <p className="text-xs text-text-secondary line-clamp-2 mb-3">{role.description}</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Permission Coverage</span>
          <span
            className={cn(
              'font-bold',
              coverage > 75 ? 'text-danger' : coverage > 40 ? 'text-warning' : 'text-accent'
            )}
          >
            {coverage}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              coverage > 75 ? 'bg-danger' : coverage > 40 ? 'bg-warning' : 'bg-accent'
            )}
            style={{ width: `${coverage}%` }}
          />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Users className="h-3.5 w-3.5 text-text-muted" />
          {role.userCount ?? 0} users
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(role);
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            title="Edit"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(role);
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            title="Duplicate"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          {!role.isLocked && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(role);
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RoleEditorModal({ role, allPermissions, locked, onClose, onSave, isNew = false }) {
  const [form, setForm] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions || emptyMatrix(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handlePermToggle = (module, perm) =>
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: { ...prev.permissions[module], [perm]: !prev.permissions[module][perm] },
      },
    }));
  const handleSetAll = (module, value) =>
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: { read: value, write: value, delete: value, approve: value },
      },
    }));
  const setAllModules = (fn) =>
    setForm((prev) => ({
      ...prev,
      permissions: Object.fromEntries(Object.keys(moduleMeta).map((k) => [k, fn()])),
    }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const permissionIds = toPermissionIds(form.permissions, allPermissions);
      const saved = role?.id
        ? await rbacApi.updateRole(role.id, { name: form.name, description: form.description })
        : await rbacApi.createRole({
            name: form.name,
            description: form.description,
            type: 'custom',
          });
      const roleId = saved?.id ?? role?.id;
      if (roleId && !locked) await rbacApi.setPermissions(roleId, permissionIds);
      onSave();
    } catch (err) {
      setError(
        err?.response?.data?.error?.message || 'Save failed (check /v1/rbac shapes — Gate 3)'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-bold text-text-primary">
              {isNew ? 'Create Role' : `Edit Role: ${role?.name}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Role Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-text-primary">Permission Matrix</h4>
              <div className="flex items-center gap-3 text-xs">
                {Object.entries(permLabels).map(([key, meta]) => (
                  <span key={key} className="flex items-center gap-1">
                    <span
                      className={cn(
                        'inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold',
                        meta.bg,
                        meta.color,
                        'border-current/30'
                      )}
                    >
                      {meta.short}
                    </span>
                    <span className="text-text-muted">{meta.label}</span>
                  </span>
                ))}
              </div>
            </div>
            {locked && (
              <p className="mb-3 text-xs text-warning flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> System role — permissions are locked;
                name/description only.
              </p>
            )}
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Module
                    </th>
                    {['read', 'write', 'delete', 'approve'].map((p) => (
                      <th
                        key={p}
                        className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider w-16"
                      >
                        {permLabels[p].label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider w-28">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(form.permissions).map(([moduleKey, perms]) => {
                    const meta = moduleMeta[moduleKey];
                    const Icon = meta.icon;
                    return (
                      <tr key={moduleKey} className="hover:bg-background/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-lg',
                                meta.bg
                              )}
                            >
                              <Icon className={cn('h-4 w-4', meta.color)} />
                            </div>
                            <span className="text-sm font-medium text-text-primary">
                              {meta.label}
                            </span>
                          </div>
                        </td>
                        {['read', 'write', 'delete', 'approve'].map((permKey) => (
                          <td key={permKey} className="px-4 py-3 text-center">
                            <PermissionCell
                              enabled={perms[permKey]}
                              disabled={locked}
                              onToggle={() => handlePermToggle(moduleKey, permKey)}
                              label={permKey}
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleSetAll(moduleKey, true)}
                              className="text-[10px] font-medium text-secondary hover:underline"
                            >
                              All
                            </button>
                            <span className="text-text-muted">·</span>
                            <button
                              type="button"
                              onClick={() => handleSetAll(moduleKey, false)}
                              className="text-[10px] font-medium text-text-muted hover:underline"
                            >
                              None
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              Quick Presets
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setAllModules(() => ({ read: true, write: true, delete: true, approve: true }))
                }
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Grant All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setAllModules(() => ({ read: true, write: false, delete: false, approve: false }))
                }
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" /> Read-Only All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setAllModules(() => ({
                    read: false,
                    write: false,
                    delete: false,
                    approve: false,
                  }))
                }
              >
                <Ban className="mr-1.5 h-3.5 w-3.5" /> Revoke All
              </Button>
            </div>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={saving}>
              <Save className="mr-1.5 h-4 w-4" />{' '}
              {saving ? 'Saving…' : isNew ? 'Create Role' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [expandedModules, setExpandedModules] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [rawRoles, perms, usersRes] = await Promise.all([
        rbacApi.listRoles(),
        rbacApi.listPermissions().catch(() => []),
        usersApi.list({ page: 1, pageSize: 500 }).catch(() => ({ data: [] })),
      ]);
      setAllPermissions(perms);
      // userCount per role from role assignments in the users list
      const countByRole = {};
      for (const u of usersRes.data ?? []) {
        for (const r of u.roles ?? []) countByRole[r.id] = (countByRole[r.id] ?? 0) + 1;
      }
      const shaped = rawRoles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        isLocked: Boolean(r.isLocked),
        userCount: countByRole[r.id] ?? 0,
        permissions: toMatrix(r.permissions ?? r.rolePermissions?.map((rp) => rp.permission) ?? []),
      }));
      setRoles(shaped);
      setSelectedRole((prev) => shaped.find((r) => r.id === prev?.id) ?? null);
    } catch (err) {
      setLoadError(
        err?.response?.data?.error?.message ||
          'Failed to load roles — check /v1/rbac shapes (Gate 3)'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRoles = useMemo(
    () =>
      roles.filter(
        (r) =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          (r.description ?? '').toLowerCase().includes(query.toLowerCase())
      ),
    [roles, query]
  );

  const handleDeleteRole = async (id) => {
    const role = roles.find((r) => r.id === id);
    if (role?.userCount > 0) {
      alert(`Cannot delete role with ${role.userCount} assigned users. Reassign users first.`);
      return;
    }
    if (!window.confirm(`Delete role "${role?.name}"?`)) return;
    try {
      await rbacApi.deleteRole(id);
      setRoles((prev) => prev.filter((r) => r.id !== id));
      if (selectedRole?.id === id) setSelectedRole(null);
    } catch (err) {
      alert(err?.response?.data?.error?.message || 'Delete failed');
    }
  };

  const handleDuplicateRole = (role) => {
    setEditingRole({
      ...role,
      id: null,
      name: `${role.name} (Copy)`,
      userCount: 0,
      isLocked: false,
    });
    setShowEditor(true);
  };

  const toggleModule = (moduleKey) =>
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleKey)) next.delete(moduleKey);
      else next.add(moduleKey);
      return next;
    });

  const stats = useMemo(
    () => ({
      total: roles.length,
      system: roles.filter((r) => r.isLocked).length,
      custom: roles.filter((r) => !r.isLocked).length,
      totalUsers: roles.reduce((s, r) => s + (r.userCount ?? 0), 0),
    }),
    [roles]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Role Management</h1>
          <p className="text-sm text-text-secondary">
            Create and manage user roles with granular permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
          </Button>
          <Button
            onClick={() => {
              setEditingRole(null);
              setShowEditor(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Create Role
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Roles', value: stats.total, icon: Shield, color: 'text-secondary' },
          { label: 'System Roles', value: stats.system, icon: Lock, color: 'text-info' },
          { label: 'Custom Roles', value: stats.custom, icon: Unlock, color: 'text-accent' },
          { label: 'Assigned Users', value: stats.totalUsers, icon: Users, color: 'text-warning' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  {s.label}
                </p>
                <p className={cn('mt-1 text-2xl font-bold', s.color)}>{s.value}</p>
              </div>
              <s.icon className={cn('h-6 w-6', s.color)} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search roles…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-3">
            {loading && <p className="text-sm text-text-muted text-center py-8">Loading roles…</p>}
            {!loading &&
              filteredRoles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  isSelected={selectedRole?.id === role.id}
                  onSelect={() => setSelectedRole(role)}
                  onEdit={(r) => {
                    setEditingRole(r);
                    setShowEditor(true);
                  }}
                  onDelete={handleDeleteRole}
                  onDuplicate={handleDuplicateRole}
                />
              ))}
            {!loading && filteredRoles.length === 0 && (
              <div className="rounded-xl border border-border bg-surface p-8 text-center">
                <Shield className="mx-auto h-8 w-8 text-text-muted mb-2" />
                <p className="text-text-muted text-sm">No roles match your search.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedRole ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-surface p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                      <Shield className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-text-primary">{selectedRole.name}</h2>
                        {selectedRole.isLocked && (
                          <span className="inline-flex items-center rounded-full bg-info/10 border border-info/20 px-2 py-0.5 text-[10px] font-semibold text-info">
                            System Role
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">
                        {selectedRole.userCount} users assigned
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateRole(selectedRole)}
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" /> Duplicate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingRole(selectedRole);
                        setShowEditor(true);
                      }}
                    >
                      <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
                    </Button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-text-secondary">{selectedRole.description}</p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                  Permission Breakdown
                </h3>
                <div className="space-y-2">
                  {Object.entries(selectedRole.permissions).map(([moduleKey, perms]) => {
                    const meta = moduleMeta[moduleKey];
                    const Icon = meta.icon;
                    const permCount = Object.values(perms).filter(Boolean).length;
                    const isExpanded = expandedModules.has(moduleKey);
                    return (
                      <div
                        key={moduleKey}
                        className="rounded-lg border border-border overflow-hidden"
                      >
                        <button
                          onClick={() => toggleModule(moduleKey)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-background/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-lg',
                                meta.bg
                              )}
                            >
                              <Icon className={cn('h-4 w-4', meta.color)} />
                            </div>
                            <span className="text-sm font-medium text-text-primary">
                              {meta.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {Object.entries(perms).map(([pk, pv]) => {
                                const pl = permLabels[pk];
                                return pv ? (
                                  <span
                                    key={pk}
                                    className={cn(
                                      'inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold',
                                      pl.bg,
                                      pl.color,
                                      'border border-current/20'
                                    )}
                                  >
                                    {pl.short}
                                  </span>
                                ) : null;
                              })}
                              {permCount === 0 && (
                                <span className="text-xs text-text-muted">No access</span>
                              )}
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-text-muted" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-text-muted" />
                            )}
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-border bg-background px-4 py-3">
                            <div className="grid grid-cols-4 gap-2">
                              {Object.entries(perms).map(([pk, pv]) => {
                                const pl = permLabels[pk];
                                return (
                                  <div
                                    key={pk}
                                    className={cn(
                                      'rounded-md border px-3 py-2 text-center',
                                      pv
                                        ? cn(pl.bg, 'border-current/20')
                                        : 'bg-surface border-border'
                                    )}
                                  >
                                    <p
                                      className={cn(
                                        'text-xs font-bold',
                                        pv ? pl.color : 'text-text-muted'
                                      )}
                                    >
                                      {pl.label}
                                    </p>
                                    <p
                                      className={cn(
                                        'text-[10px]',
                                        pv ? 'text-text-secondary' : 'text-text-muted'
                                      )}
                                    >
                                      {pv ? 'Granted' : 'Denied'}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                  Access Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(permLabels).map(([key, meta]) => {
                    const count = Object.values(selectedRole.permissions).filter(
                      (m) => m[key]
                    ).length;
                    const total = Object.keys(selectedRole.permissions).length;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={key} className="text-center">
                        <div
                          className={cn(
                            'inline-flex h-12 w-12 items-center justify-center rounded-xl border',
                            meta.bg,
                            'border-current/20 mb-2'
                          )}
                        >
                          <span className={cn('text-lg font-bold', meta.color)}>{meta.short}</span>
                        </div>
                        <p className="text-sm font-medium text-text-primary">{meta.label}</p>
                        <p className={cn('text-lg font-bold', meta.color)}>
                          {count}
                          <span className="text-xs text-text-muted font-normal">/{total}</span>
                        </p>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-border overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', meta.bg.replace('/10', ''))}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-12 text-center">
              <Shield className="mx-auto h-12 h-12 w-12 text-text-muted mb-3" />
              <p className="text-text-muted font-medium">Select a role to view details</p>
              <p className="text-xs text-text-muted mt-1">Click on any role card from the list</p>
            </div>
          )}
        </div>
      </div>

      {showEditor && (
        <RoleEditorModal
          role={editingRole}
          allPermissions={allPermissions}
          locked={Boolean(editingRole?.isLocked)}
          isNew={!editingRole?.id}
          onClose={() => setShowEditor(false)}
          onSave={() => {
            setShowEditor(false);
            load();
          }}
        />
      )}
    </div>
  );
}
