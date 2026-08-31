/* src/app/admin/announcements/components.jsx */
import { useState } from 'react';
import {
  Sparkles, Wrench, AlertTriangle, Info, Globe, Tag, Building2,
  Clock, Eye, Pin, ChevronDown, ChevronUp, CheckCircle2, XCircle,
  Calendar, Server, Zap, ArrowUpRight, Users, BarChart3, Trash2,
  Edit3, Copy, MoreHorizontal, Check, X, ExternalLink
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  announcementTypeMeta, priorityMeta, announcementStatusMeta,
  maintenanceStatusMeta, impactMeta, changelogTypeMeta,
  formatDateTime, formatDate, formatRelativeTime, isUpcoming, isOngoing
} from './data';

/* ─── Type Icon Helper ─── */
function TypeIcon({ type, className }) {
  const icons = {
    feature: Sparkles,
    maintenance: Wrench,
    alert: AlertTriangle,
    update: Info,
  };
  const Icon = icons[type] || Info;
  return <Icon className={className} />;
}

/* ─── Announcement Type Badge ─── */
export function TypeBadge({ type }) {
  const meta = announcementTypeMeta[type] || announcementTypeMeta.update;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
      meta.bg, meta.color, meta.border
    )}>
      <TypeIcon type={type} className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

/* ─── Priority Badge ─── */
export function PriorityBadge({ priority }) {
  const meta = priorityMeta[priority] || priorityMeta.low;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium',
      meta.bg, meta.color, meta.border
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Status Badge ─── */
export function StatusBadge({ status, kind = 'announcement' }) {
  const meta = kind === 'maintenance'
    ? maintenanceStatusMeta[status] || maintenanceStatusMeta.scheduled
    : announcementStatusMeta[status] || announcementStatusMeta.draft;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium',
      meta.bg, meta.color, meta.border
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Impact Badge ─── */
export function ImpactBadge({ impact }) {
  const meta = impactMeta[impact] || impactMeta.none;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
      meta.bg, meta.color, meta.border
    )}>
      {meta.label}
    </span>
  );
}

/* ─── Changelog Type Badge ─── */
export function ChangeTypeBadge({ type }) {
  const meta = changelogTypeMeta[type] || changelogTypeMeta.fix;
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
      meta.bg, meta.color, meta.border
    )}>
      {meta.label}
    </span>
  );
}

/* ─── Read Rate Bar ─── */
export function ReadRateBar({ read, total }) {
  const pct = total > 0 ? Math.round((read / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-text-muted">Read rate</span>
        <span className={cn('font-mono font-medium', pct >= 80 ? 'text-accent' : pct >= 50 ? 'text-warning' : 'text-danger')}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', pct >= 80 ? 'bg-accent' : pct >= 50 ? 'bg-warning' : 'bg-danger')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-text-muted">{read} of {total} tenants</p>
    </div>
  );
}

/* ─── Announcement Card ─── */
export function AnnouncementCard({ announcement, onEdit, onDelete, onTogglePin, onPublish }) {
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  return (
    <div className={cn(
      'rounded-xl border bg-surface p-4 transition-all hover:shadow-md',
      announcement.pinned ? 'border-secondary/30 ring-1 ring-secondary/10' : 'border-border'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            announcementTypeMeta[announcement.type]?.bg || 'bg-info/10'
          )}>
            <TypeIcon
              type={announcement.type}
              className={cn('h-5 w-5', announcementTypeMeta[announcement.type]?.color || 'text-info')}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-text-primary truncate">{announcement.title}</h3>
              {announcement.pinned && (
                <Pin className="h-3.5 w-3.5 text-secondary shrink-0" />
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <TypeBadge type={announcement.type} />
              <PriorityBadge priority={announcement.priority} />
              <StatusBadge status={announcement.status} />
              {announcement.scheduledAt && announcement.status === 'draft' && (
                <span className="inline-flex items-center gap-1 text-[10px] text-text-muted">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(announcement.scheduledAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowActions(!showActions)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-elevated hover:text-text-primary"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {showActions && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-surface-elevated shadow-xl py-1">
                {announcement.status === 'draft' && (
                  <button
                    onClick={() => { onPublish?.(announcement.id); setShowActions(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-accent hover:bg-surface"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Publish Now
                  </button>
                )}
                <button
                  onClick={() => { onTogglePin?.(announcement.id); setShowActions(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface"
                >
                  <Pin className="h-4 w-4" /> {announcement.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  onClick={() => { onEdit?.(announcement); setShowActions(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface"
                >
                  <Edit3 className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(announcement.id); setShowActions(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface"
                >
                  <Copy className="h-4 w-4" /> Copy ID
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={() => { onDelete?.(announcement.id); setShowActions(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mt-3">
        <p className={cn(
          'text-sm text-text-secondary leading-relaxed',
          !expanded && 'line-clamp-2'
        )}>
          {announcement.content}
        </p>
        {announcement.content.length > 120 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-xs text-secondary hover:underline inline-flex items-center gap-1"
          >
            {expanded ? (
              <>Less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>More <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
      </div>

      {/* CTA */}
      {announcement.cta && (
        <div className="mt-3">
          <a
            href={announcement.cta.url}
            className="inline-flex items-center gap-1.5 rounded-md bg-secondary/10 px-3 py-1.5 text-xs font-medium text-secondary hover:bg-secondary/20 transition-colors"
          >
            {announcement.cta.label}
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-text-muted">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {announcement.audience === 'all' ? 'All tenants' :
             announcement.audience === 'plan' ? `Plans: ${announcement.targetPlans.join(', ')}` :
             `${announcement.targetTenants.length} tenant(s)`}
          </span>
          <span>·</span>
          <span>By {announcement.createdBy}</span>
          <span>·</span>
          <span>{formatRelativeTime(announcement.publishedAt || announcement.createdAt)}</span>
        </div>
        {announcement.status === 'published' && (
          <div className="w-24">
            <ReadRateBar read={announcement.readCount} total={announcement.totalRecipients} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Changelog Entry ─── */
export function ChangelogEntry({ entry, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative pl-8 pb-8 last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border" />

      {/* Timeline dot */}
      <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-secondary bg-secondary/10">
        <Zap className="h-3 w-3 text-secondary" />
      </div>

      {/* Card */}
      <div className="rounded-xl border border-border bg-surface p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-md bg-secondary/10 px-2 py-0.5 text-xs font-mono font-bold text-secondary">
                v{entry.version}
              </span>
              <h3 className="text-sm font-semibold text-text-primary">{entry.title}</h3>
            </div>
            <p className="mt-1 text-xs text-text-muted">
              {formatDate(entry.date)} · {entry.author}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit?.(entry)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-surface-elevated hover:text-text-primary"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete?.(entry.id)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Summary */}
        <p className="mt-3 text-sm text-text-secondary">{entry.summary}</p>

        {/* Changes List */}
        <div className={cn('mt-3 space-y-2', !expanded && 'max-h-32 overflow-hidden relative')}>          {entry.changes.map((change, i) => (
            <div key={i} className="flex items-start gap-2">
              <ChangeTypeBadge type={change.type} />
              <span className="text-sm text-text-secondary">{change.text}</span>
            </div>
          ))}
          {!expanded && entry.changes.length > 4 && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-surface to-transparent" />
          )}
        </div>

        {entry.changes.length > 4 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs text-secondary hover:underline inline-flex items-center gap-1"
          >
            {expanded ? (
              <>Show less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>Show all {entry.changes.length} changes <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Maintenance Window Card ─── */
export function MaintenanceWindowCard({ window, onEdit, onDelete, onCancel }) {
  const upcoming = isUpcoming(window.startTime);
  const ongoing = isOngoing(window.startTime, window.endTime);

  return (
    <div className={cn(
      'rounded-xl border bg-surface p-4 transition-all hover:shadow-md',
      ongoing ? 'border-warning/30 ring-1 ring-warning/10' :
      upcoming ? 'border-info/30' : 'border-border'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            ongoing ? 'bg-warning/10' : upcoming ? 'bg-info/10' : 'bg-accent/10'
          )}>
            <Server className={cn(
              'h-5 w-5',
              ongoing ? 'text-warning' : upcoming ? 'text-info' : 'text-accent'
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-text-primary">{window.title}</h3>
              {ongoing && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 border border-warning/20 px-2 py-0.5 text-[10px] font-medium text-warning animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                  In Progress
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <StatusBadge status={window.status} kind="maintenance" />
              <ImpactBadge impact={window.impact} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {window.status === 'scheduled' && (
            <button
              onClick={() => onEdit?.(window)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-surface-elevated hover:text-text-primary"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          )}
          {window.status === 'scheduled' && (
            <button
              onClick={() => onCancel?.(window.id)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-danger/10 hover:text-danger"
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}
          {window.status !== 'scheduled' && (
            <button
              onClick={() => onDelete?.(window.id)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 text-sm text-text-secondary">{window.description}</p>

      {/* Time Block */}
      <div className="mt-3 rounded-lg border border-border bg-background p-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Start
          </span>
          <span className="font-mono text-text-primary">{formatDateTime(window.startTime)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> End
          </span>
          <span className="font-mono text-text-primary">{formatDateTime(window.endTime)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Duration
          </span>
          <span className="font-mono text-text-primary">
            {window.actualDuration || window.estimatedDuration}
          </span>
        </div>
      </div>

      {/* Affected Services */}
      <div className="mt-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-1.5">Affected Services</p>
        <div className="flex flex-wrap gap-1.5">
          {window.affectedServices.map((svc) => (
            <span
              key={svc}
              className="inline-flex items-center gap-1 rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary"
            >
              <Server className="h-3 w-3" />
              {svc}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
        <span>By {window.createdBy}</span>
        <span className="flex items-center gap-1">
          {window.tenantNotification ? (
            <><Check className="h-3 w-3 text-accent" /> Tenants notified</>
          ) : (
            <><X className="h-3 w-3 text-text-muted" /> Silent</>
          )}
        </span>
      </div>
    </div>
  );
}

/* ─── Stat Card ─── */
export function StatCard({ label, value, subtext, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
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

/* ─── Empty State ─── */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated">
        <Icon className="h-8 w-8 text-text-muted" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 text-xs text-text-muted max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
