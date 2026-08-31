/* src/app/app/users/roles/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Plus, Search, X, Check, Edit3, Trash2, Copy,
  ChevronDown, ChevronUp, Users, Lock, Unlock, AlertTriangle,
  Save, Ban, CheckCircle2, MoreHorizontal, Eye, FileText,
  DollarSign, BedDouble, TrendingUp, Settings, ClipboardList,
  User, Monitor, Sparkles, Briefcase, Database, Globe
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';

/* ─── Mock Data ─── */
const initialRoles = [
  {
    id: 'ROLE-001',
    name: 'Super Admin',
    description: 'Full system access. Can manage users, roles, settings, and all property data.',
    userCount: 2,
    isSystem: true,
    permissions: {
      reservations: { read: true, write: true, delete: true, approve: true },
      billing: { read: true, write: true, delete: true, approve: true },
      housekeeping: { read: true, write: true, delete: true, approve: true },
      rates: { read: true, write: true, delete: true, approve: true },
      reports: { read: true, write: true, delete: true, approve: true },
      users: { read: true, write: true, delete: true, approve: true },
      settings: { read: true, write: true, delete: true, approve: true },
      auditLogs: { read: true, write: true, delete: true, approve: true },
      groups: { read: true, write: true, delete: true, approve: true },
      inventory: { read: true, write: true, delete: true, approve: true },
      channelManager: { read: true, write: true, delete: true, approve: true },
      marketing: { read: true, write: true, delete: true, approve: true },
    },
  },
  {
    id: 'ROLE-002',
    name: 'General Manager',
    description: 'Property-level oversight. Can view all reports and approve overrides.',
    userCount: 1,
    isSystem: false,
    permissions: {
      reservations: { read: true, write: true, delete: true, approve: true },
      billing: { read: true, write: true, delete: false, approve: true },
      housekeeping: { read: true, write: true, delete: false, approve: true },
      rates: { read: true, write: true, delete: false, approve: true },
      reports: { read: true, write: true, delete: false, approve: true },
      users: { read: true, write: true, delete: false, approve: false },
      settings: { read: true, write: true, delete: false, approve: false },
      auditLogs: { read: true, write: false, delete: false, approve: false },
      groups: { read: true, write: true, delete: false, approve: true },
      inventory: { read: true, write: true, delete: false, approve: false },
      channelManager: { read: true, write: true, delete: false, approve: true },
      marketing: { read: true, write: true, delete: false, approve: true },
    },
  },
  {
    id: 'ROLE-003',
    name: 'Front Desk Manager',
    description: 'Manages front desk operations, reservations, and guest services.',
    userCount: 3,
    isSystem: false,
    permissions: {
      reservations: { read: true, write: true, delete: true, approve: true },
      billing: { read: true, write: true, delete: false, approve: false },
      housekeeping: { read: true, write: true, delete: false, approve: false },
      rates: { read: true, write: false, delete: false, approve: false },
      reports: { read: true, write: false, delete: false, approve: false },
      users: { read: true, write: false, delete: false, approve: false },
      settings: { read: false, write: false, delete: false, approve: false },
      auditLogs: { read: false, write: false, delete: false, approve: false },
      groups: { read: true, write: true, delete: false, approve: false },
      inventory: { read: true, write: false, delete: false, approve: false },
      channelManager: { read: true, write: false, delete: false, approve: false },
      marketing: { read: true, write: false, delete: false, approve: false },
    },
  },
  {
    id: 'ROLE-004',
    name: 'Front Desk Agent',
    description: 'Handles check-ins, check-outs, and basic reservation tasks.',
    userCount: 8,
    isSystem: false,
    permissions: {
      reservations: { read: true, write: true, delete: false, approve: false },
      billing: { read: true, write: true, delete: false, approve: false },
      housekeeping: { read: true, write: false, delete: false, approve: false },
      rates: { read: true, write: false, delete: false, approve: false },
      reports: { read: false, write: false, delete: false, approve: false },
      users: { read: false, write: false, delete: false, approve: false },
      settings: { read: false, write: false, delete: false, approve: false },
      auditLogs: { read: false, write: false, delete: false, approve: false },
      groups: { read: true, write: false, delete: false, approve: false },
      inventory: { read: true, write: false, delete: false, approve: false },
      channelManager: { read: false, write: false, delete: false, approve: false },
      marketing: { read: false, write: false, delete: false, approve: false },
    },
  },
  {
    id: 'ROLE-005',
    name: 'Night Auditor',
    description: 'Overnight operations including audit, billing reconciliation, and reports.',
    userCount: 2,
    isSystem: false,
    permissions: {
      reservations: { read: true, write: true, delete: false, approve: false },
      billing: { read: true, write: true, delete: false, approve: false },
      housekeeping: { read: true, write: false, delete: false, approve: false },
      rates: { read: true, write: false, delete: false, approve: false },
      reports: { read: true, write: false, delete: false, approve: false },
      users: { read: false, write: false, delete: false, approve: false },
      settings: { read: false, write: false, delete: false, approve: false },
      auditLogs: { read: false, write: false, delete: false, approve: false },
      groups: { read: true, write: false, delete: false, approve: false },
      inventory: { read: true, write: false, delete: false, approve: false },
      channelManager: { read: true, write: false, delete: false, approve: false },
      marketing: { read: false, write: false, delete: false, approve: false },
    },
  },
  {
    id: 'ROLE-006',
    name: 'Revenue Manager',
    description: 'Manages pricing, rate plans, and channel distribution.',
    userCount: 1,
    isSystem: false,
    permissions: {
      reservations: { read: true, write: false, delete: false, approve: false },
      billing: { read: true, write: false, delete: false, approve: false },
      housekeeping: { read: true, write: false, delete: false, approve: false },
      rates: { read: true, write: true, delete: false, approve: true },
      reports: { read: true, write: true, delete: false, approve: false },
      users: { read: false, write: false, delete: false, approve: false },
      settings: { read: true, write: false, delete: false, approve: false },
      auditLogs: { read: true, write: false, delete: false, approve: false },
      groups: { read: true, write: false, delete: false, approve: false },
      inventory: { read: true, write: false, delete: false, approve: false },
      channelManager: { read: true, write: true, delete: false, approve: true },
      marketing: { read: true, write: true, delete: false, approve: false },
    },
  },
  {
    id: 'ROLE-007',
    name: 'Housekeeping Supervisor',
    description: 'Manages room status, cleaning schedules, and maintenance requests.',
    userCount: 2,
    isSystem: false,
    permissions: {
      reservations: { read: true, write: false, delete: false, approve: false },
      billing: { read: false, write: false, delete: false, approve: false },
      housekeeping: { read: true, write: true, delete: false, approve: true },
      rates: { read: false, write: false, delete: false, approve: false },
      reports: { read: true, write: false, delete: false, approve: false },
      users: { read: false, write: false, delete: false, approve: false },
      settings: { read: false, write: false, delete: false, approve: false },
      auditLogs: { read: false, write: false, delete: false, approve: false },
      groups: { read: false, write: false, delete: false, approve: false },
      inventory: { read: true, write: true, delete: false, approve: false },
      channelManager: { read: false, write: false, delete: false, approve: false },
      marketing: { read: false, write: false, delete: false, approve: false },
    },
  },
  {
    id: 'ROLE-008',
    name: 'Read-Only',
    description: 'View-only access to reports and basic property data.',
    userCount: 0,
    isSystem: false,
    permissions: {
      reservations: { read: true, write: false, delete: false, approve: false },
      billing: { read: true, write: false, delete: false, approve: false },
      housekeeping: { read: true, write: false, delete: false, approve: false },
      rates: { read: true, write: false, delete: false, approve: false },
      reports: { read: true, write: false, delete: false, approve: false },
      users: { read: false, write: false, delete: false, approve: false },
      settings: { read: false, write: false, delete: false, approve: false },
      auditLogs: { read: false, write: false, delete: false, approve: false },
      groups: { read: true, write: false, delete: false, approve: false },
      inventory: { read: true, write: false, delete: false, approve: false },
      channelManager: { read: true, write: false, delete: false, approve: false },
      marketing: { read: true, write: false, delete: false, approve: false },
    },
  },
];

const moduleMeta = {
  reservations: { label: 'Reservations', icon: FileText, color: 'text-secondary', bg: 'bg-secondary/10' },
  billing: { label: 'Billing', icon: DollarSign, color: 'text-accent', bg: 'bg-accent/10' },
  housekeeping: { label: 'Housekeeping', icon: Sparkles, color: 'text-info', bg: 'bg-info/10' },
  rates: { label: 'Rates', icon: TrendingUp, color: 'text-warning', bg: 'bg-warning/10' },
  reports: { label: 'Reports', icon: ClipboardList, color: 'text-teal-500', bg: 'bg-teal-500/10' },
  users: { label: 'Users', icon: User, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  settings: { label: 'Settings', icon: Settings, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  auditLogs: { label: 'Audit Logs', icon: Shield, color: 'text-danger', bg: 'bg-danger/10' },
  groups: { label: 'Groups', icon: Briefcase, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  inventory: { label: 'Inventory', icon: Database, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  channelManager: { label: 'Channel Manager', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  marketing: { label: 'Marketing', icon: Monitor, color: 'text-rose-500', bg: 'bg-rose-500/10' },
};

const permLabels = {
  read: { label: 'Read', short: 'R', color: 'text-accent', bg: 'bg-accent/10' },
  write: { label: 'Write', short: 'W', color: 'text-secondary', bg: 'bg-secondary/10' },
  delete: { label: 'Delete', short: 'D', color: 'text-danger', bg: 'bg-danger/10' },
  approve: { label: 'Approve', short: 'A', color: 'text-warning', bg: 'bg-warning/10' },
};

/* ─── Components ─── */
function PermissionCell({ enabled, onToggle, label, disabled = false }) {
  const meta = permLabels[label];
  return (
    <button
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
  const totalPerms = Object.values(role.permissions).reduce((sum, mod) =>
    sum + Object.values(mod).filter(Boolean).length, 0
  );
  const maxPerms = Object.keys(role.permissions).length * 4;
  const coverage = Math.round((totalPerms / maxPerms) * 100);

  return (
    <div
      onClick={onSelect}
      className={cn(
        'rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md',
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
            <p className="text-xs text-text-muted">{role.id}</p>
          </div>
        </div>
        {role.isSystem && (
          <span className="inline-flex items-center rounded-full bg-info/10 border border-info/20 px-2 py-0.5 text-[10px] font-semibold text-info">
            System
          </span>
        )}
      </div>

      <p className="text-xs text-text-secondary line-clamp-2 mb-3">{role.description}</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Permission Coverage</span>
          <span className={cn('font-bold', coverage > 75 ? 'text-danger' : coverage > 40 ? 'text-warning' : 'text-accent')}>
            {coverage}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', coverage > 75 ? 'bg-danger' : coverage > 40 ? 'bg-warning' : 'bg-accent')}
            style={{ width: `${coverage}%` }}
          />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Users className="h-3.5 w-3.5 text-text-muted" />
          {role.userCount} users
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(role); }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            title="Edit"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(role); }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            title="Duplicate"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          {!role.isSystem && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(role.id); }}
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

/* ─── Role Editor Modal ─── */
function RoleEditorModal({ role, onClose, onSave, isNew = false }) {
  const [form, setForm] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions || Object.fromEntries(
      Object.keys(moduleMeta).map(key => [key, { read: false, write: false, delete: false, approve: false }])
    ),
  });

  const handlePermToggle = (module, perm) => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [perm]: !prev.permissions[module][perm],
        },
      },
    }));
  };

  const handleSetAll = (module, value) => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: { read: value, write: value, delete: value, approve: value },
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...role,
      ...form,
      id: role?.id || `ROLE-${1009 + Math.floor(Math.random() * 900)}`,
    });
    onClose();
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
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Role Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Front Desk Manager"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of this role..."
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Permission Matrix */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-text-primary">Permission Matrix</h4>
              <div className="flex items-center gap-3 text-xs">
                {Object.entries(permLabels).map(([key, meta]) => (
                  <span key={key} className="flex items-center gap-1">
                    <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold', meta.bg, meta.color, 'border-current/30')}>
                      {meta.short}
                    </span>
                    <span className="text-text-muted">{meta.label}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Module</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider w-16">Read</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider w-16">Write</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider w-16">Delete</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider w-16">Approve</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(form.permissions).map(([moduleKey, perms]) => {
                    const meta = moduleMeta[moduleKey];
                    const Icon = meta.icon;
                    const allEnabled = Object.values(perms).every(Boolean);
                    const noneEnabled = Object.values(perms).every(v => !v);
                    return (
                      <tr key={moduleKey} className="hover:bg-background/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', meta.bg)}>
                              <Icon className={cn('h-4 w-4', meta.color)} />
                            </div>
                            <span className="text-sm font-medium text-text-primary">{meta.label}</span>
                          </div>
                        </td>
                        {['read', 'write', 'delete', 'approve'].map((permKey) => (
                          <td key={permKey} className="px-4 py-3 text-center">
                            <PermissionCell
                              enabled={perms[permKey]}
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

          {/* Quick Presets */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Quick Presets</h4>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => {
                const allTrue = Object.fromEntries(Object.keys(moduleMeta).map(k => [k, { read: true, write: true, delete: true, approve: true }]));
                setForm(prev => ({ ...prev, permissions: allTrue }));
              }}>
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Grant All
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => {
                const allRead = Object.fromEntries(Object.keys(moduleMeta).map(k => [k, { read: true, write: false, delete: false, approve: false }]));
                setForm(prev => ({ ...prev, permissions: allRead }));
              }}>
                <Eye className="mr-1.5 h-3.5 w-3.5" /> Read-Only All
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => {
                const allFalse = Object.fromEntries(Object.keys(moduleMeta).map(k => [k, { read: false, write: false, delete: false, approve: false }]));
                setForm(prev => ({ ...prev, permissions: allFalse }));
              }}>
                <Ban className="mr-1.5 h-3.5 w-3.5" /> Revoke All
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="secondary">
              <Save className="mr-1.5 h-4 w-4" /> {isNew ? 'Create Role' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function RolesPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState(initialRoles);
  const [query, setQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [expandedModules, setExpandedModules] = useState(new Set());

  const filteredRoles = useMemo(() => {
    return roles.filter((r) =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.description.toLowerCase().includes(query.toLowerCase()) ||
      r.id.toLowerCase().includes(query.toLowerCase())
    );
  }, [roles, query]);

  const handleSaveRole = (roleData) => {
    if (editingRole) {
      setRoles(prev => prev.map(r => r.id === roleData.id ? roleData : r));
    } else {
      setRoles(prev => [...prev, { ...roleData, userCount: 0, isSystem: false }]);
    }
    setEditingRole(null);
    setShowEditor(false);
  };

  const handleDeleteRole = (id) => {
    const role = roles.find(r => r.id === id);
    if (role?.userCount > 0) {
      alert(`Cannot delete role with ${role.userCount} assigned users. Reassign users first.`);
      return;
    }
    setRoles(prev => prev.filter(r => r.id !== id));
    if (selectedRole?.id === id) setSelectedRole(null);
  };

  const handleDuplicateRole = (role) => {
    setEditingRole({
      ...role,
      id: null,
      name: `${role.name} (Copy)`,
      userCount: 0,
      isSystem: false,
    });
    setShowEditor(true);
  };

  const toggleModule = (moduleKey) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleKey)) next.delete(moduleKey);
      else next.add(moduleKey);
      return next;
    });
  };

  const stats = useMemo(() => ({
    total: roles.length,
    system: roles.filter(r => r.isSystem).length,
    custom: roles.filter(r => !r.isSystem).length,
    totalUsers: roles.reduce((s, r) => s + r.userCount, 0),
  }), [roles]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Role Management</h1>
          <p className="text-sm text-text-secondary">Create and manage user roles with granular permissions</p>
        </div>
        <Button onClick={() => { setEditingRole(null); setShowEditor(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Create Role
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Roles', value: stats.total, icon: Shield, color: 'text-secondary' },
          { label: 'System Roles', value: stats.system, icon: Lock, color: 'text-info' },
          { label: 'Custom Roles', value: stats.custom, icon: Unlock, color: 'text-accent' },
          { label: 'Assigned Users', value: stats.totalUsers, icon: Users, color: 'text-warning' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{stat.label}</p>
                <p className={cn('mt-1 text-2xl font-bold', stat.color)}>{stat.value}</p>
              </div>
              <stat.icon className={cn('h-6 w-6', stat.color)} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Role List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search roles..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-3">
            {filteredRoles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                isSelected={selectedRole?.id === role.id}
                onSelect={() => setSelectedRole(role)}
                onEdit={(r) => { setEditingRole(r); setShowEditor(true); }}
                onDelete={handleDeleteRole}
                onDuplicate={handleDuplicateRole}
              />
            ))}
            {filteredRoles.length === 0 && (
              <div className="rounded-xl border border-border bg-surface p-8 text-center">
                <Shield className="mx-auto h-8 w-8 text-text-muted mb-2" />
                <p className="text-text-muted text-sm">No roles match your search.</p>
              </div>
            )}
          </div>
        </div>

        {/* Role Detail */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <div className="space-y-6">
              {/* Role Header */}
              <div className="rounded-xl border border-border bg-surface p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                      <Shield className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-text-primary">{selectedRole.name}</h2>
                        {selectedRole.isSystem && (
                          <span className="inline-flex items-center rounded-full bg-info/10 border border-info/20 px-2 py-0.5 text-[10px] font-semibold text-info">
                            System Role
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">{selectedRole.id} · {selectedRole.userCount} users assigned</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDuplicateRole(selectedRole)}>
                      <Copy className="mr-1.5 h-3.5 w-3.5" /> Duplicate
                    </Button>
                    {!selectedRole.isSystem && (
                      <Button variant="outline" size="sm" onClick={() => { setEditingRole(selectedRole); setShowEditor(true); }}>
                        <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-sm text-text-secondary">{selectedRole.description}</p>
              </div>

              {/* Permission Breakdown */}
              <div className="rounded-xl border border-border bg-surface p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">Permission Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(selectedRole.permissions).map(([moduleKey, perms]) => {
                    const meta = moduleMeta[moduleKey];
                    const Icon = meta.icon;
                    const permCount = Object.values(perms).filter(Boolean).length;
                    const isExpanded = expandedModules.has(moduleKey);

                    return (
                      <div key={moduleKey} className="rounded-lg border border-border overflow-hidden">
                        <button
                          onClick={() => toggleModule(moduleKey)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-background/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', meta.bg)}>
                              <Icon className={cn('h-4 w-4', meta.color)} />
                            </div>
                            <span className="text-sm font-medium text-text-primary">{meta.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {Object.entries(perms).map(([pk, pv]) => {
                                const pl = permLabels[pk];
                                return pv ? (
                                  <span key={pk} className={cn('inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold', pl.bg, pl.color, 'border border-current/20')}>
                                    {pl.short}
                                  </span>
                                ) : null;
                              })}
                              {permCount === 0 && (
                                <span className="text-xs text-text-muted">No access</span>
                              )}
                            </div>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-border bg-background px-4 py-3">
                            <div className="grid grid-cols-4 gap-2">
                              {Object.entries(perms).map(([pk, pv]) => {
                                const pl = permLabels[pk];
                                return (
                                  <div key={pk} className={cn(
                                    'rounded-md border px-3 py-2 text-center',
                                    pv ? cn(pl.bg, 'border-current/20') : 'bg-surface border-border'
                                  )}>
                                    <p className={cn('text-xs font-bold', pv ? pl.color : 'text-text-muted')}>{pl.label}</p>
                                    <p className={cn('text-[10px]', pv ? 'text-text-secondary' : 'text-text-muted')}>
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

              {/* Permission Summary Chart */}
              <div className="rounded-xl border border-border bg-surface p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">Access Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(permLabels).map(([key, meta]) => {
                    const count = Object.values(selectedRole.permissions).filter(m => m[key]).length;
                    const total = Object.keys(selectedRole.permissions).length;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={key} className="text-center">
                        <div className={cn('inline-flex h-12 w-12 items-center justify-center rounded-xl border', meta.bg, 'border-current/20 mb-2')}>
                          <span className={cn('text-lg font-bold', meta.color)}>{meta.short}</span>
                        </div>
                        <p className="text-sm font-medium text-text-primary">{meta.label}</p>
                        <p className={cn('text-lg font-bold', meta.color)}>{count}<span className="text-xs text-text-muted font-normal">/{total}</span></p>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-border overflow-hidden">
                          <div className={cn('h-full rounded-full', meta.bg.replace('/10', ''))} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-12 text-center">
              <Shield className="mx-auto h-12 w-12 text-text-muted mb-3" />
              <p className="text-text-muted font-medium">Select a role to view details</p>
              <p className="text-xs text-text-muted mt-1">Click on any role card from the list</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <RoleEditorModal
          role={editingRole}
          isNew={!editingRole?.id}
          onClose={() => { setShowEditor(false); setEditingRole(null); }}
          onSave={handleSaveRole}
        />
      )}
    </div>
  );
}
