/* src/app/app/keys/components.jsx */
import {
  Key,
  Shield,
  Smartphone,
  Lock,
  Unlock,
  Clock,
  AlertTriangle,
  CheckCircle2,
  User,
  Building2,
  DoorOpen,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { keyStatusMeta, keyTypeMeta, accessLevelMeta } from './constants';

/* ─── Components ─── */

export function StatusBadge({ status }) {
  const meta = keyStatusMeta[status] || keyStatusMeta.active;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.class
      )}
    >
      <Icon className={cn('h-3 w-3', meta.dot.replace('bg-', 'text-'))} />
      {meta.label}
    </span>
  );
}

export function KeyTypeBadge({ type }) {
  const meta = keyTypeMeta[type] || keyTypeMeta.physical;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-0.5 text-xs font-medium',
        meta.color
      )}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

export function AccessLevelBadge({ level }) {
  const meta = accessLevelMeta[level] || accessLevelMeta.guest;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        meta.class
      )}
    >
      {meta.label}
    </span>
  );
}

export function HolderAvatar({ name, size = 'md' }) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';
  const sizeClasses = {
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-12 w-12 text-sm',
  };
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-bold bg-secondary/10 text-secondary',
        sizeClasses[size]
      )}
    >
      {initials}
    </div>
  );
}

export function KeyCard({ keyData, onClick, onIssue, onReturn, onRevoke }) {
  const typeMeta = keyTypeMeta[keyData.type] || keyTypeMeta.physical;
  const statusMeta = keyStatusMeta[keyData.status] || keyStatusMeta.active;
  const TypeIcon = typeMeta.icon;

  const isActionable = ['active', 'issued'].includes(keyData.status);

  return (
    <div
      onClick={onClick}
      className={cn(
        'group rounded-xl border bg-surface p-4 transition-all cursor-pointer',
        keyData.status === 'revoked' || keyData.status === 'lost'
          ? 'border-danger/20 opacity-60'
          : 'border-border hover:border-secondary/50 hover:shadow-md'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg border',
              typeMeta.color.replace('text-', 'border-'),
              'bg-surface'
            )}
          >
            <TypeIcon className={cn('h-5 w-5', typeMeta.color)} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              {keyData.name || keyData.id}
            </h3>
            <p className="text-xs text-text-muted font-mono">{keyData.id}</p>
          </div>
        </div>
        <StatusBadge status={keyData.status} />
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Room / Area</span>
          <span className="font-medium text-text-primary">
            {keyData.room || keyData.area || '—'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Access Level</span>
          <AccessLevelBadge level={keyData.accessLevel} />
        </div>
        {keyData.holder && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">Holder</span>
            <div className="flex items-center gap-1.5">
              <HolderAvatar name={keyData.holder} size="sm" />
              <span className="text-text-primary">{keyData.holder}</span>
            </div>
          </div>
        )}
        {keyData.expiresAt && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">Expires</span>
            <span
              className={cn(
                'font-mono',
                keyData.status === 'expired' ? 'text-danger' : 'text-text-secondary'
              )}
            >
              {keyData.expiresAt}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {isActionable && (
        <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {keyData.status === 'active' && onIssue && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onIssue(keyData);
              }}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-secondary/30 bg-secondary/5 px-2 text-xs font-medium text-secondary hover:bg-secondary/10"
            >
              <Key className="h-3 w-3" /> Issue
            </button>
          )}
          {keyData.status === 'issued' && onReturn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReturn(keyData);
              }}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-accent/30 bg-accent/5 px-2 text-xs font-medium text-accent hover:bg-accent/10"
            >
              <Lock className="h-3 w-3" /> Return
            </button>
          )}
          {onRevoke && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRevoke(keyData);
              }}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-danger/30 bg-danger/5 px-2 text-xs font-medium text-danger hover:bg-danger/10 ml-auto"
            >
              <AlertTriangle className="h-3 w-3" /> Revoke
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AuditLogRow({ log }) {
  const statusMeta = keyStatusMeta[log.action] || keyStatusMeta.active;
  const ActionIcon = statusMeta.icon;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3 hover:bg-background/50 transition-colors">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          statusMeta.bg || 'bg-surface-elevated'
        )}
      >
        <ActionIcon className={cn('h-4 w-4', statusMeta.dot.replace('bg-', 'text-'))} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-primary">{log.actionLabel}</p>
          <span className="text-xs text-text-muted font-mono">{log.timestamp}</span>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">{log.description}</p>
        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-text-muted">
          {log.user && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" /> {log.user}
            </span>
          )}
          {log.keyId && <span className="font-mono">{log.keyId}</span>}
          {log.room && (
            <span className="flex items-center gap-1">
              <DoorOpen className="h-3 w-3" /> {log.room}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function KeyStatCard({ label, value, subtext, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
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

export function DigitalKeyStatus({ status, expiry, lastUsed }) {
  const isExpired = status === 'expired';
  const isActive = status === 'active';

  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        isExpired
          ? 'border-danger/20 bg-danger/5'
          : isActive
            ? 'border-accent/20 bg-accent/5'
            : 'border-border bg-surface'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone
            className={cn(
              'h-4 w-4',
              isExpired ? 'text-danger' : isActive ? 'text-accent' : 'text-text-muted'
            )}
          />
          <span className="text-sm font-medium text-text-primary">Digital Key</span>
        </div>
        <StatusBadge status={status} />
      </div>
      {expiry && (
        <p className="mt-1 text-xs text-text-secondary">
          Expires:{' '}
          <span className={cn('font-mono', isExpired ? 'text-danger' : 'text-text-primary')}>
            {expiry}
          </span>
        </p>
      )}
      {lastUsed && <p className="mt-0.5 text-xs text-text-muted">Last used: {lastUsed}</p>}
    </div>
  );
}

export function MasterKeyRow({ keyData, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 hover:border-secondary/50 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
        <Shield className="h-5 w-5 text-warning" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text-primary">{keyData.name}</h3>
          <AccessLevelBadge level={keyData.accessLevel} />
        </div>
        <p className="text-xs text-text-muted font-mono mt-0.5">{keyData.id}</p>
      </div>
      <div className="text-right">
        <StatusBadge status={keyData.status} />
        {keyData.holder && <p className="mt-1 text-xs text-text-secondary">{keyData.holder}</p>}
      </div>
    </div>
  );
}
