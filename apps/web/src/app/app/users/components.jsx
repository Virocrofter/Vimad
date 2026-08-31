/* src/app/app/users/components.jsx */
import {
  Shield, ShieldCheck, ShieldAlert, ShieldX, ShieldOff,
  UserCheck, UserX, UserMinus, Clock, Key, Lock, Unlock,
  Eye, EyeOff, Check, X, AlertTriangle, AlertOctagon, Info,
  Crown, Star, Award, Gem, User, Monitor, Wrench, Sparkles,
  Utensils, TrendingUp, DollarSign, ConciergeBell
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  userStatusMeta,
  auditSeverityMeta,
  complianceStatusMeta,
  getPermissionCategoryColor,
  getPermissionCategoryLabel,
  roles,
  departments,
} from './data';

/* ─── User Status Badge ─── */
export function UserStatusBadge({ status }) {
  const meta = userStatusMeta[status] || userStatusMeta.inactive;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
      meta.class
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Role Badge ─── */
export function RoleBadge({ roleId, showLevel = false }) {
  const role = roles.find((r) => r.id === roleId);
  if (!role) return <span className="text-xs text-text-muted">Unknown Role</span>;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
      role.color
    )}>
      <Shield className="h-3 w-3" />
      {role.name}
      {showLevel && <span className="opacity-60">· L{role.level}</span>}
    </span>
  );
}

/* ─── Department Badge ─── */
export function DepartmentBadge({ departmentId }) {
  const dept = departments.find((d) => d.id === departmentId);
  if (!dept) return <span className="text-xs text-text-muted">—</span>;

  const iconMap = {
    ConciergeBell, Sparkles, Utensils, TrendingUp, DollarSign,
    Wrench, Shield, Monitor, Crown,
  };
  const Icon = iconMap[dept.icon] || User;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
      <Icon className="h-3.5 w-3.5 text-text-muted" />
      {dept.name}
    </span>
  );
}

/* ─── Permission Chip ─── */
export function PermissionChip({ permission, active = false, size = 'sm' }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
      active
        ? getPermissionCategoryColor(permission.category)
        : 'border-border bg-background text-text-muted opacity-50'
    )}>
      {active && <Check className="h-3 w-3" />}
      {permission.label}
      <span className={cn(
        'text-[10px] uppercase tracking-wider ml-0.5',
        active ? 'opacity-70' : 'opacity-40'
      )}>
        {getPermissionCategoryLabel(permission.category)}
      </span>
    </span>
  );
}

/* ─── Permission Category Badge ─── */
export function PermissionCategoryBadge({ category, count }) {
  const colors = {
    read: 'bg-info/10 text-info border-info/20',
    write: 'bg-secondary/10 text-secondary border-secondary/20',
    delete: 'bg-danger/10 text-danger border-danger/20',
    admin: 'bg-warning/10 text-warning border-warning/20',
  };
  const labels = { read: 'Read', write: 'Write', delete: 'Delete', admin: 'Admin' };

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
      colors[category] || colors.read
    )}>
      {labels[category] || category}
      {count !== undefined && <span className="opacity-70">· {count}</span>}
    </span>
  );
}

/* ─── Audit Severity Badge ─── */
export function AuditSeverityBadge({ severity }) {
  const meta = auditSeverityMeta[severity] || auditSeverityMeta.info;
  const iconMap = { Info, AlertTriangle, AlertOctagon };
  const Icon = iconMap[meta.icon] || Info;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
      meta.class
    )}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

/* ─── Compliance Status Badge ─── */
export function ComplianceStatusBadge({ status }) {
  const meta = complianceStatusMeta[status] || complianceStatusMeta.noncompliant;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
      meta.class
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── MFA Status Badge ─── */
export function MfaBadge({ enabled }) {
  return enabled ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
      <ShieldCheck className="h-3 w-3" /> MFA On
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 border border-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning">
      <ShieldAlert className="h-3 w-3" /> MFA Off
    </span>
  );
}

/* ─── Session Status Badge ─── */
export function SessionBadge({ expiry }) {
  if (!expiry) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-text-muted">
        <Unlock className="h-3 w-3" /> Offline
      </span>
    );
  }
  const isExpired = new Date(expiry) < new Date();
  return isExpired ? (
    <span className="inline-flex items-center gap-1 text-[10px] text-text-muted">
      <Clock className="h-3 w-3" /> Expired
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] text-accent">
      <Lock className="h-3 w-3" /> Active
    </span>
  );
}

/* ─── User Avatar ─── */
export function UserAvatar({ user, size = 'md' }) {
  const initials = user?.avatar || '??';
  const sizeClasses = {
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-12 w-12 text-sm',
    xl: 'h-16 w-16 text-lg',
  };

  const statusRing = {
    active: 'ring-2 ring-accent/30',
    suspended: 'ring-2 ring-danger/30',
    'on-leave': 'ring-2 ring-warning/30',
    inactive: 'ring-2 ring-text-muted/20',
  };

  return (
    <div className={cn(
      'flex items-center justify-center rounded-full font-bold bg-secondary/10 text-secondary',
      sizeClasses[size],
      statusRing[user?.status] || statusRing.inactive
    )}>
      {initials}
    </div>
  );
}

/* ─── Stat Card ─── */
export function StatCard({ label, value, subtext, icon: Icon, color, trend }) {
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

/* ─── Permission Matrix Row ─── */
export function PermissionMatrixRow({ module, rolePermissions, onToggle, readOnly = false }) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="border-b border-border bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">{module.name}</h4>
            <p className="text-xs text-text-muted">{module.description}</p>
          </div>
          <div className="flex gap-1">
            {['read', 'write', 'delete', 'admin'].map((cat) => {
              const count = module.permissions.filter((p) => p.category === cat).length;
              const activeCount = module.permissions.filter(
                (p) => p.category === cat && rolePermissions.includes(p.key)
              ).length;
              if (count === 0) return null;
              return (
                <PermissionCategoryBadge
                  key={cat}
                  category={cat}
                  count={`${activeCount}/${count}`}
                />
              );
            })}
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="flex flex-wrap gap-2">
          {module.permissions.map((perm) => {
            const isActive = rolePermissions.includes(perm.key);
            return (
              <button
                key={perm.key}
                onClick={() => !readOnly && onToggle?.(perm.key)}
                disabled={readOnly}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all',
                  isActive
                    ? getPermissionCategoryColor(perm.category)
                    : 'border-border bg-background text-text-muted opacity-50 hover:opacity-80',
                  readOnly && 'cursor-default'
                )}
              >
                {isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {perm.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Compliance Score Ring ─── */
export function ComplianceScoreRing({ passed, total, size = 48 }) {
  const pct = total > 0 ? (passed / total) * 100 : 0;
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const color = pct >= 95 ? 'text-accent' : pct >= 80 ? 'text-warning' : 'text-danger';
  const strokeColor = pct >= 95 ? '#22c55e' : pct >= 80 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className={cn('absolute text-[10px] font-bold', color)}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

/* ─── Audit Log Row ─── */
export function AuditLogRow({ entry, onClick, compact = false }) {
  const meta = auditSeverityMeta[entry.severity] || auditSeverityMeta.info;
  const iconMap = { Info, AlertTriangle, AlertOctagon };
  const SeverityIcon = iconMap[meta.icon] || Info;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 transition-all hover:bg-background/50',
        compact ? 'border-border/50' : 'border-border'
      )}
    >
      <div className={cn('mt-0.5 shrink-0', meta.class.split(' ')[1])}>
        <SeverityIcon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-text-muted">{entry.id}</span>
          <AuditSeverityBadge severity={entry.severity} />
          <span className="text-xs text-text-muted">{entry.timestamp}</span>
        </div>
        <p className="mt-1 text-sm text-text-primary">
          <span className="font-medium">{entry.userName}</span>
          {' '}<span className="text-text-secondary">{entry.action.replace(/\\./g, ' › ')}</span>
        </p>
        <p className="text-xs text-text-secondary truncate">{entry.details}</p>
        {!compact && entry.complianceTags?.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {entry.complianceTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-medium text-text-muted border border-border"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {!compact && (
        <div className="shrink-0 text-right">
          <p className="text-[10px] text-text-muted font-mono">{entry.ipAddress}</p>
          <SessionBadge expiry={entry.sessionId !== 'system' ? new Date(Date.now() + 3600000).toISOString() : null} />
        </div>
      )}
    </div>
  );
}