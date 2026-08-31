/* src/app/admin/data-export/components.jsx */
import { useState } from 'react';
import {
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Database,
  Shield,
  Trash2,
  FileText,
  BarChart3,
  Users,
  CreditCard,
  MessageSquare,
  Calendar,
  Eye,
  MoreHorizontal,
  Pause,
  Play,
  RotateCcw,
  Hash,
  FileDigit,
  HardDrive,
  Check,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  exportStatusMeta,
  erasureStatusMeta,
  priorityMeta,
  anonymizeStatusMeta,
  strategyMeta,
  getCategoryMeta,
  formatDuration,
  formatFileSize,
  timeAgo,
} from './data';

/* ─── Export Status Badge ─── */
export function ExportStatusBadge({ status }) {
  const meta = exportStatusMeta[status] || exportStatusMeta.pending;
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

/* ─── Erasure Status Badge ─── */
export function ErasureStatusBadge({ status }) {
  const meta = erasureStatusMeta[status] || erasureStatusMeta.pending_review;
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

/* ─── Priority Badge ─── */
export function PriorityBadge({ priority }) {
  const meta = priorityMeta[priority] || priorityMeta.medium;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        meta.class
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Category Badge ─── */
export function CategoryBadge({ category }) {
  const meta = getCategoryMeta(category);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
        meta.bg,
        meta.color,
        'border-current/20'
      )}
    >
      {meta.label}
    </span>
  );
}

/* ─── Strategy Badge ─── */
export function StrategyBadge({ strategy }) {
  const meta = strategyMeta[strategy] || strategyMeta.pseudonymize;
  return (
    <span className="inline-flex items-center rounded-full bg-secondary/10 border border-secondary/20 px-2 py-0.5 text-[10px] font-medium text-secondary">
      {meta.label}
    </span>
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
            <p
              className={cn('mt-1 text-xs font-medium', trend >= 0 ? 'text-accent' : 'text-danger')}
            >
              {trend >= 0 ? '+' : ''}
              {trend}% vs last month
            </p>
          )}
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

/* ─── Export Job Row ─── */
export function ExportJobRow({ job, onDownload, onDelete }) {
  const isExpired =
    job.status === 'completed' && new Date(job.expiresAt) < new Date('2026-08-16T14:20:00');
  const displayStatus = isExpired ? 'expired' : job.status;

  return (
    <tr className="hover:bg-background/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              exportStatusMeta[displayStatus]?.class || 'bg-surface'
            )}
          >
            {displayStatus === 'completed' ? (
              <CheckCircle2 className="h-4 w-4 text-accent" />
            ) : displayStatus === 'processing' ? (
              <Loader2 className="h-4 w-4 text-info animate-spin" />
            ) : displayStatus === 'failed' ? (
              <XCircle className="h-4 w-4 text-danger" />
            ) : (
              <Clock className="h-4 w-4 text-warning" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{job.id}</p>
            <p className="text-[10px] text-text-muted">{job.tenantName}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <CategoryBadge category={job.type === 'full' ? 'full_backup' : job.type} />
      </td>
      <td className="px-4 py-3">
        <span className="text-xs font-mono text-text-secondary uppercase">{job.format}</span>
      </td>
      <td className="px-4 py-3">
        <ExportStatusBadge status={displayStatus} />
      </td>
      <td className="px-4 py-3 text-xs text-text-secondary">{job.requestedAt}</td>
      <td className="px-4 py-3 text-xs text-text-secondary">
        {displayStatus === 'completed' ? (
          <div>
            <span className="font-mono">{formatFileSize(job.fileSize)}</span>
            <span className="text-text-muted"> · {job.recordCount?.toLocaleString()} records</span>
          </div>
        ) : displayStatus === 'failed' ? (
          <span className="text-danger truncate max-w-[200px] block" title={job.error}>
            {job.error}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          {displayStatus === 'completed' && !isExpired && (
            <button
              onClick={() => onDownload(job)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(job.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ─── Erasure Request Card ─── */
export function ErasureRequestCard({ request, onReview, onApprove, onHold, onComplete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        'rounded-xl border bg-surface p-4 transition-all hover:shadow-md',
        request.status === 'pending_review'
          ? 'border-warning/30 hover:border-warning/50'
          : request.status === 'on_hold'
            ? 'border-danger/30 hover:border-danger/50'
            : request.status === 'in_progress'
              ? 'border-secondary/30 hover:border-secondary/50'
              : 'border-border hover:border-secondary/30'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              request.status === 'pending_review'
                ? 'bg-warning/10'
                : request.status === 'on_hold'
                  ? 'bg-danger/10'
                  : request.status === 'in_progress'
                    ? 'bg-secondary/10'
                    : request.status === 'completed'
                      ? 'bg-accent/10'
                      : 'bg-neutral/10'
            )}
          >
            <Shield
              className={cn(
                'h-4 w-4',
                request.status === 'pending_review'
                  ? 'text-warning'
                  : request.status === 'on_hold'
                    ? 'text-danger'
                    : request.status === 'in_progress'
                      ? 'text-secondary'
                      : request.status === 'completed'
                        ? 'text-accent'
                        : 'text-text-muted'
              )}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{request.id}</h3>
            <p className="text-[10px] text-text-muted">{request.tenantName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={request.priority} />
          <ErasureStatusBadge status={request.status} />
        </div>
      </div>

      <p className="mt-2 text-xs text-text-secondary">{request.reason}</p>

      {/* Data Categories */}
      <div className="mt-3 flex flex-wrap gap-1">
        {request.dataCategories.map((cat) => (
          <CategoryBadge key={cat} category={cat} />
        ))}
      </div>

      {/* Meta */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-text-muted">
        <span>Requested by {request.requestedBy}</span>
        <span>{timeAgo(request.requestedAt)}</span>
      </div>

      {/* Legal Hold Warning */}
      {request.legalHold && (
        <div className="mt-3 rounded-lg border border-danger/20 bg-danger/5 p-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-danger shrink-0" />
          <span className="text-xs text-danger font-medium">
            Legal Hold Active — Deletion Blocked
          </span>
        </div>
      )}

      {/* Expandable Details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-text-muted">Scope:</span>
              <span className="ml-1 text-text-primary capitalize">
                {request.scope.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Estimated Records:</span>
              <span className="ml-1 text-text-primary font-mono">
                {request.estimatedRecords?.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Estimated Size:</span>
              <span className="ml-1 text-text-primary font-mono">{request.estimatedSize}</span>
            </div>
            <div>
              <span className="text-text-muted">Retention Override:</span>
              <span
                className={cn(
                  'ml-1 font-medium',
                  request.retentionOverride ? 'text-accent' : 'text-text-muted'
                )}
              >
                {request.retentionOverride ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          {request.notes && (
            <p className="text-xs text-text-secondary bg-background rounded p-2">{request.notes}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-secondary hover:underline"
        >
          {expanded ? 'Show Less' : 'Show Details'}
        </button>
        <div className="ml-auto flex items-center gap-2">
          {request.status === 'pending_review' && (
            <>
              <Button size="sm" variant="outline" onClick={() => onHold(request.id)}>
                <Pause className="mr-1 h-3 w-3" /> Hold
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onApprove(request.id)}>
                <Check className="mr-1 h-3 w-3" /> Approve
              </Button>
            </>
          )}
          {request.status === 'approved' && (
            <Button size="sm" variant="secondary" onClick={() => onComplete(request.id)}>
              <Play className="mr-1 h-3 w-3" /> Start Deletion
            </Button>
          )}
          {request.status === 'in_progress' && (
            <Button size="sm" variant="outline" onClick={() => onReview(request.id)}>
              <Eye className="mr-1 h-3 w-3" /> Review Progress
            </Button>
          )}
          {request.status === 'on_hold' && (
            <Button size="sm" variant="outline" onClick={() => onApprove(request.id)}>
              <RotateCcw className="mr-1 h-3 w-3" /> Resume
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Retention Policy Card ─── */
export function RetentionPolicyCard({ policy, onEdit, onToggle, onRunNow }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        'rounded-xl border bg-surface p-4 transition-all hover:shadow-md',
        !policy.active
          ? 'border-dashed border-border opacity-75'
          : 'border-border hover:border-secondary/30'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              policy.active ? 'bg-secondary/10' : 'bg-neutral/10'
            )}
          >
            <Clock
              className={cn('h-4 w-4', policy.active ? 'text-secondary' : 'text-text-muted')}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{policy.name}</h3>
            <p className="text-[10px] text-text-muted">{policy.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CategoryBadge category={policy.category} />
          <button
            onClick={() => onToggle(policy.id)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              policy.active ? 'bg-accent' : 'bg-border'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
                policy.active ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-text-secondary">{policy.description}</p>

      {/* Key Stats */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-background p-2 text-center">
          <p className="text-[10px] text-text-muted uppercase">Retention</p>
          <p className="text-sm font-bold font-mono text-text-primary">
            {formatDuration(policy.retentionPeriod)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-2 text-center">
          <p className="text-[10px] text-text-muted uppercase">Action</p>
          <p className="text-sm font-bold font-mono text-secondary capitalize">
            {policy.action.replace(/_/g, ' ')}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-2 text-center">
          <p className="text-[10px] text-text-muted uppercase">Records</p>
          <p className="text-sm font-bold font-mono text-text-primary">
            {policy.recordsAffected?.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-text-muted">Scope:</span>
              <span className="ml-1 text-text-primary capitalize">{policy.scope}</span>
            </div>
            <div>
              <span className="text-text-muted">Applies To:</span>
              <span className="ml-1 text-text-primary">
                {policy.appliesTo.map((a) => a.replace(/_/g, ' ')).join(', ')}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Last Run:</span>
              <span className="ml-1 text-text-primary">{timeAgo(policy.lastRun)}</span>
            </div>
            <div>
              <span className="text-text-muted">Next Run:</span>
              <span className="ml-1 text-text-primary">{policy.nextRun}</span>
            </div>
          </div>
          {policy.exceptions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] text-text-muted">Exceptions:</span>
              {policy.exceptions.map((ex) => (
                <span
                  key={ex}
                  className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] text-text-secondary"
                >
                  {ex.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-secondary hover:underline"
        >
          {expanded ? 'Show Less' : 'Show Details'}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onRunNow(policy.id)}>
            <Play className="mr-1 h-3 w-3" /> Run Now
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(policy)}>
            <FileText className="mr-1 h-3 w-3" /> Edit
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Anonymization Job Row ─── */
export function AnonymizeJobRow({ job, onView }) {
  const meta = anonymizeStatusMeta[job.status] || anonymizeStatusMeta.pending;
  const progress =
    job.status === 'running' && job.recordsProcessed
      ? Math.round((job.recordsProcessed / (job.recordsProcessed + 1200)) * 100)
      : 100;

  return (
    <tr className="hover:bg-background/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', meta.class)}>
            {job.status === 'running' ? (
              <Loader2 className="h-4 w-4 text-info animate-spin" />
            ) : job.status === 'completed' ? (
              <CheckCircle2 className="h-4 w-4 text-accent" />
            ) : (
              <XCircle className="h-4 w-4 text-danger" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{job.id}</p>
            <p className="text-[10px] text-text-muted">{job.tenantName}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <CategoryBadge category={job.type} />
      </td>
      <td className="px-4 py-3">
        <StrategyBadge strategy={job.strategy} />
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
            meta.class
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
          {meta.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="w-full max-w-[120px]">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-text-muted">{job.recordsProcessed?.toLocaleString()}</span>
            <span className="text-text-primary font-mono">{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                job.status === 'completed' ? 'bg-accent' : 'bg-info'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-text-secondary">
        {job.completedAt ? timeAgo(job.completedAt) : timeAgo(job.startedAt)}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onView(job)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

/* ─── Compliance Score Card ─── */
export function ComplianceScoreCard({ score, checks }) {
  const getScoreColor = (s) => {
    if (s >= 90) return 'text-accent';
    if (s >= 70) return 'text-warning';
    return 'text-danger';
  };

  const getScoreBg = (s) => {
    if (s >= 90) return 'bg-accent/10';
    if (s >= 70) return 'bg-warning/10';
    return 'bg-danger/10';
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full',
            getScoreBg(score)
          )}
        >
          <span className={cn('text-2xl font-bold', getScoreColor(score))}>{score}</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">GDPR Compliance Score</h3>
          <p className="text-xs text-text-muted">
            Based on retention policies, erasure requests, and data handling
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {checks.map((check, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {check.passed ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
              )}
              <span className={check.passed ? 'text-text-secondary' : 'text-warning'}>
                {check.label}
              </span>
            </div>
            <span
              className={cn('font-mono font-medium', check.passed ? 'text-accent' : 'text-warning')}
            >
              {check.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
