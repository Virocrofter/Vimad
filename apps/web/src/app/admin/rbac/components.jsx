/* src/app/admin/rbac/components.jsx */
import { useState } from 'react';
import {
  Shield, Users, Key, Globe, Check, X, ChevronDown, ChevronUp,
  Copy, Eye, EyeOff, Trash2, Edit3, RefreshCw, AlertTriangle,
  CheckCircle2, Clock, MoreHorizontal, Lock, Unlock, Zap,
  BarChart3, Activity, ToggleLeft, ToggleRight, Tag, Building2
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  roleTypeMeta, apiKeyStatusMeta, ssoProviderMeta, environmentMeta,
  getPermissionLabel, getKeyStatus
} from './data';

/* ─── Role Type Badge ─── */
export function RoleTypeBadge({ type }) {
  const meta = roleTypeMeta[type] || roleTypeMeta.custom;
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
      meta.bg, meta.color, meta.border
    )}>
      {meta.label}
    </span>
  );
}

/* ─── Role Card ─── */
export function RoleCard({ role, onEdit, onDelete, onAssign }) {
  const isWildcard = role.permissions.includes('*');
  const permCount = isWildcard ? 'All' : role.permissions.length;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-md hover:border-secondary/30">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            role.type === 'system' ? 'bg-info/10' : 'bg-secondary/10'
          )}>
            <Shield className={cn('h-5 w-5', role.type === 'system' ? 'text-info' : 'text-secondary')} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{role.name}</h3>
            <div className="mt-0.5 flex items-center gap-2">
              <RoleTypeBadge type={role.type} />
              {role.isDefault && (
                <span className="rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
                  Default
                </span>
              )}
              {role.isLocked && (
                <span className="rounded-full bg-warning/10 border border-warning/20 px-2 py-0.5 text-[10px] font-medium text-warning">
                  <Lock className="inline h-3 w-3 mr-0.5" /> Locked
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!role.isLocked && (
            <>
              <button
                onClick={() => onEdit(role)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                title="Edit"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(role)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-text-secondary line-clamp-2">{role.description}</p>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Users className="h-3.5 w-3.5" />
          <span>{role.userCount} users</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Key className="h-3.5 w-3.5" />
          <span>{permCount} permissions</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onAssign(role)}>
          <Users className="mr-1.5 h-3.5 w-3.5" /> Assign
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(role)}>
          <Shield className="mr-1.5 h-3.5 w-3.5" /> Permissions
        </Button>
      </div>
    </div>
  );
}

/* ─── Permission Matrix Row ─── */
export function PermissionMatrixRow({ category, rolePermissions, onToggle, readOnly }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-background/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
            <Shield className="h-4 w-4 text-secondary" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-semibold text-text-primary">{category.label}</h4>
            <p className="text-xs text-text-muted">{category.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">
            {category.permissions.filter(p => rolePermissions.includes(p.key)).length} / {category.permissions.length}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {category.permissions.map((perm) => {
              const enabled = rolePermissions.includes('*') || rolePermissions.includes(perm.key);
              return (
                <label
                  key={perm.key}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                    enabled ? 'border-accent/30 bg-accent/5' : 'border-border bg-background hover:bg-surface-elevated',
                    readOnly && 'cursor-default opacity-60'
                  )}
                >
                  {!readOnly && (
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => onToggle(perm.key)}
                      className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent"
                      disabled={rolePermissions.includes('*')}
                    />
                  )}
                  {readOnly && (
                    <div className="mt-0.5">
                      {enabled ? <Check className="h-4 w-4 text-accent" /> : <X className="h-4 w-4 text-text-muted" />}
                    </div>
                  )}
                  <div>
                    <p className={cn('text-sm font-medium', enabled ? 'text-accent' : 'text-text-secondary')}>
                      {perm.label}
                    </p>
                    <p className="text-xs text-text-muted">{perm.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── API Key Row ─── */
export function ApiKeyRow({ apiKey, onRevoke, onRegenerate, onView }) {
  const [showFull, setShowFull] = useState(false);
  const status = getKeyStatus(apiKey);
  const meta = apiKeyStatusMeta[status];
  const envMeta = environmentMeta[apiKey.environment];

  return (
    <tr className="hover:bg-background/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', envMeta.bg)}>
            <Key className={cn('h-4 w-4', envMeta.color)} />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{apiKey.name}</p>
            <p className="text-[10px] text-text-muted font-mono">{apiKey.id}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium', meta.class)}>
            <span className={cn('h-1.5 w-1.5 rounded-full mr-1', meta.dot)} />
            {meta.label}
          </span>
          <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium', envMeta.bg, envMeta.color, 'border-current/20')}>
            {envMeta.label}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono text-text-secondary bg-background border border-border rounded px-2 py-1">
            {showFull ? apiKey.keyFull : apiKey.keyPrefix}
          </code>
          <button
            onClick={() => setShowFull(!showFull)}
            className="text-text-muted hover:text-text-primary"
            title={showFull ? 'Hide' : 'Reveal'}
          >
            {showFull ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(apiKey.keyFull)}
            className="text-text-muted hover:text-secondary"
            title="Copy"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {apiKey.scopes.slice(0, 3).map((scope) => (
            <span key={scope} className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] text-text-secondary">
              {scope === '*' ? 'All' : getPermissionLabel(scope)}
            </span>
          ))}
          {apiKey.scopes.length > 3 && (
            <span className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] text-text-muted">
              +{apiKey.scopes.length - 3}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-text-secondary">
        {apiKey.usageCount.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-xs text-text-secondary">
        {apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleDateString() : 'Never'}
      </td>
      <td className="px-4 py-3 text-xs text-text-secondary">
        {apiKey.expiresAt ? new Date(apiKey.expiresAt).toLocaleDateString() : 'Never'}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onView(apiKey)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {status === 'active' && (
            <>
              <button
                onClick={() => onRegenerate(apiKey)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                title="Regenerate"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={() => onRevoke(apiKey)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger"
                title="Revoke"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ─── SSO Provider Card ─── */
export function SSOCard({ provider, onEdit, onToggle, onSync, onDelete }) {
  const meta = ssoProviderMeta[provider.provider] || ssoProviderMeta.saml;
  const Icon = provider.status === 'active' ? CheckCircle2 : AlertTriangle;
  const iconColor = provider.status === 'active' ? 'text-accent' : 'text-warning';

  return (
    <div className={cn(
      'rounded-xl border bg-surface p-4 transition-all hover:shadow-md',
      provider.status === 'active' ? 'border-border hover:border-secondary/30' : 'border-warning/30 hover:border-warning/50'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', meta.bg)}>
            <Globe className={cn('h-5 w-5', meta.color)} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{provider.name}</h3>
            <div className="mt-0.5 flex items-center gap-2">
              <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', provider.status === 'active' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-warning/10 text-warning border-warning/20')}>
                <Icon className={cn('h-3 w-3', iconColor)} />
                {provider.status === 'active' ? 'Active' : 'Inactive'}
              </span>
              <span className={cn('text-[10px] font-medium', meta.color)}>{meta.label}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(provider)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            title="Edit"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          {provider.status === 'active' ? (
            <button
              onClick={() => onToggle(provider)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-warning/10 hover:text-warning"
              title="Deactivate"
            >
              <ToggleRight className="h-4 w-4 text-accent" />
            </button>
          ) : (
            <button
              onClick={() => onToggle(provider)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-accent/10 hover:text-accent"
              title="Activate"
            >
              <ToggleLeft className="h-4 w-4 text-text-muted" />
            </button>
          )}
          <button
            onClick={() => onDelete(provider)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Domains</span>
          <div className="flex gap-1">
            {provider.domains.map(d => (
              <span key={d} className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] text-text-secondary">
                {d}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Auto-Provision</span>
          <span className={cn('font-medium', provider.autoProvision ? 'text-accent' : 'text-text-muted')}>
            {provider.autoProvision ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Default Role</span>
          <span className="text-text-secondary">{provider.defaultRole.replace('role-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Force SSO</span>
          <span className={cn('font-medium', provider.forceSSO ? 'text-accent' : 'text-text-muted')}>
            {provider.forceSSO ? 'Required' : 'Optional'}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Users className="h-3.5 w-3.5" />
          <span>{provider.userCount} users</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Clock className="h-3.5 w-3.5" />
          <span>Last sync: {provider.lastSyncAt ? new Date(provider.lastSyncAt).toLocaleTimeString() : 'Never'}</span>
        </div>
        {provider.syncErrors > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 border border-danger/20 px-2 py-0.5 text-[10px] text-danger">
            <AlertTriangle className="h-3 w-3" /> {provider.syncErrors} errors
          </span>
        )}
      </div>

      <div className="mt-2">
        <Button variant="outline" size="sm" className="w-full" onClick={() => onSync(provider)}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Sync Now
        </Button>
      </div>
    </div>
  );
}

/* ─── Stat Card ─── */
export function RbacStatCard({ label, value, subtext, icon: Icon, color, trend }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend !== undefined && (
            <p className={cn('mt-1 text-xs font-medium', trend >= 0 ? 'text-accent' : 'text-danger')}>
              {trend >= 0 ? '+' : ''}{trend}% vs last month
            </p>
          )}
        </div>
        <div className={cn(
          'rounded-lg p-2.5',
          color.replace('text-', 'bg-').replace('danger', 'danger/10').replace('accent', 'accent/10').replace('warning', 'warning/10').replace('info', 'info/10').replace('secondary', 'secondary/10')
        )}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

/* ─── User Assignment Row ─── */
export function UserAssignmentRow({ user, roles, onRoleChange }) {
  return (
    <tr className="hover:bg-background/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{user.name}</p>
            <p className="text-xs text-text-muted">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <select
          value={user.role}
          onChange={(e) => onRoleChange(user.id, e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {roles.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <span className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
          user.status === 'active' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-danger/10 text-danger border-danger/20'
        )}>
          <span className={cn('h-1.5 w-1.5 rounded-full', user.status === 'active' ? 'bg-accent' : 'bg-danger')} />
          {user.status === 'active' ? 'Active' : 'Suspended'}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-text-secondary">
        {user.lastActive ? new Date(user.lastActive).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
      </td>
    </tr>
  );
}