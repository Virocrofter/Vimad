/* src/app/admin/audit/components.jsx */
import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Hash,
  Link2,
  Clock,
  MapPin,
  Globe,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  FileText,
  Download,
  Filter,
  Search,
  Eye,
  EyeOff,
  Fingerprint,
  Lock,
  Unlock,
  Copy,
  Check,
  X,
  FileDown,
  Calendar,
  Tag,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Server,
  HardDrive,
  Database,
  KeyRound,
  Users,
  CreditCard,
  Settings,
  Building2,
  Flag,
  Ban,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  severityMeta,
  statusMeta,
  actionCategories,
  timeAgo,
  formatDateTime,
  verifyLogIntegrity,
  complianceFrameworks,
  exportFormats,
} from './data';

/* ─── Severity Badge ─── */
export function SeverityBadge({ severity }) {
  const meta = severityMeta[severity] || severityMeta.info;
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

/* ─── Status Badge ─── */
export function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.verified;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
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
  const meta = actionCategories[category] || actionCategories.config;
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

/* ─── Tamper-Proof Indicator ─── */
export function TamperProofBadge({ log, compact = false }) {
  const integrity = verifyLogIntegrity(log);
  const allValid =
    integrity.hashValid &&
    integrity.signatureValid &&
    integrity.chainLinked &&
    integrity.shadowExcluded;

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
          allValid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
        )}
        title={allValid ? 'Tamper-proof verified' : 'Integrity check failed'}
      >
        {allValid ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
        {allValid ? 'Verified' : 'Compromised'}
      </span>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
      <div className="flex items-center gap-2">
        {allValid ? (
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
        ) : (
          <ShieldAlert className="h-4 w-4 text-rose-500" />
        )}
        <span
          className={cn('text-xs font-semibold', allValid ? 'text-emerald-500' : 'text-rose-500')}
        >
          {allValid ? 'Tamper-Proof Verified' : 'Integrity Alert'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="flex items-center gap-1.5">
          {integrity.hashValid ? (
            <Check className="h-3 w-3 text-emerald-500" />
          ) : (
            <X className="h-3 w-3 text-rose-500" />
          )}
          <span className="text-text-secondary">Hash Valid</span>
        </div>
        <div className="flex items-center gap-1.5">
          {integrity.signatureValid ? (
            <Check className="h-3 w-3 text-emerald-500" />
          ) : (
            <X className="h-3 w-3 text-rose-500" />
          )}
          <span className="text-text-secondary">Signature Valid</span>
        </div>
        <div className="flex items-center gap-1.5">
          {integrity.chainLinked ? (
            <Check className="h-3 w-3 text-emerald-500" />
          ) : (
            <X className="h-3 w-3 text-rose-500" />
          )}
          <span className="text-text-secondary">Chain Linked</span>
        </div>
        <div className="flex items-center gap-1.5">
          {integrity.shadowExcluded ? (
            <Check className="h-3 w-3 text-emerald-500" />
          ) : (
            <X className="h-3 w-3 text-rose-500" />
          )}
          <span className="text-text-secondary">No Shadow</span>
        </div>
      </div>
      <div className="pt-1 border-t border-border">
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <Hash className="h-3 w-3" />
          <span className="font-mono">{log.tamperProof.hash}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted mt-0.5">
          <Link2 className="h-3 w-3" />
          <span className="font-mono">Prev: {log.tamperProof.previousHash}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Audit Log Row (Expandable) ─── */
export function AuditLogRow({ log, expanded, onToggle, onFlag, onExport }) {
  const [copiedHash, setCopiedHash] = useState(false);

  const copyHash = () => {
    navigator.clipboard.writeText(log.tamperProof.hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <>
      <tr
        className="hover:bg-background/50 transition-colors cursor-pointer group"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <button className="text-text-muted hover:text-text-primary">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-text-muted">{log.id}</span>
            {log.status === 'flagged' && <Flag className="h-3.5 w-3.5 text-rose-500" />}
          </div>
        </td>
        <td className="px-4 py-3">
          <SeverityBadge severity={log.severity} />
        </td>
        <td className="px-4 py-3">
          <CategoryBadge category={log.action.category} />
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-text-primary">{log.action.label}</p>
          <p className="text-xs text-text-muted truncate max-w-50">{log.action.description}</p>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary/10 text-[10px] font-bold text-secondary">
              {log.actor.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-text-primary">{log.actor.name}</p>
              <p className="text-[10px] text-text-muted">{log.actor.role}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <p className="text-xs text-text-secondary">{timeAgo(log.timestamp)}</p>
          <p className="text-[10px] text-text-muted">{formatDateTime(log.timestamp)}</p>
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={log.status} />
        </td>
        <td className="px-4 py-3">
          <TamperProofBadge log={log} compact />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyHash();
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated"
              title="Copy hash"
            >
              {copiedHash ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFlag?.(log);
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-rose-500/10 hover:text-rose-500"
              title="Flag for review"
            >
              <Flag className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={10} className="px-4 py-4 bg-background/50">
            <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
              {/* Actor Details */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-background p-3 space-y-2">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Actor
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                      {log.actor.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{log.actor.name}</p>
                      <p className="text-xs text-text-muted">{log.actor.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-text-muted" /> {log.actor.role}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-text-muted" /> {log.actor.ip}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-text-muted" />{' '}
                      {log.actor.userAgent.slice(0, 40)}...
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background p-3 space-y-2">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Target
                  </h4>
                  <p className="text-sm font-medium text-text-primary">{log.target.name}</p>
                  <p className="text-xs text-text-muted font-mono">{log.target.id}</p>
                  <p className="text-xs text-text-secondary capitalize">
                    Type: {log.target.type.replace('_', ' ')}
                  </p>
                  {log.target.tenantId && (
                    <p className="text-xs text-text-secondary">Tenant: {log.target.tenantId}</p>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-background p-3 space-y-2">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Session
                  </h4>
                  <p className="text-xs text-text-secondary font-mono">{log.sessionId}</p>
                  <div className="flex items-center gap-1.5">
                    {log.shadowSession ? (
                      <>
                        <EyeOff className="h-3 w-3 text-rose-500" />
                        <span className="text-xs text-rose-500">Shadow Session</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 text-emerald-500" />
                        <span className="text-xs text-emerald-500">Standard Session</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">{formatDateTime(log.timestamp)}</p>
                </div>
              </div>

              {/* Metadata */}
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="rounded-lg border border-border bg-background p-3">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
                    Metadata
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(log.metadata).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="text-text-muted capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>{' '}
                        <span className="text-text-primary font-medium">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tamper-Proof */}
              <TamperProofBadge log={log} />

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => onExport?.(log)}>
                  <FileDown className="mr-1.5 h-3.5 w-3.5" /> Export Entry
                </Button>
                {log.status !== 'flagged' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
                    onClick={() => onFlag?.(log)}
                  >
                    <Flag className="mr-1.5 h-3.5 w-3.5" /> Flag for Review
                  </Button>
                )}
                {log.status === 'flagged' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark Resolved
                  </Button>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── Anomaly Card ─── */
export function AnomalyCard({ anomaly, onInvestigate, onDismiss }) {
  const severityMeta = {
    critical: {
      icon: AlertTriangle,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
    },
    high: {
      icon: AlertTriangle,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
    },
    medium: {
      icon: Info,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    low: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  };

  const meta = severityMeta[anomaly.severity] || severityMeta.low;
  const Icon = meta.icon;

  return (
    <div
      className={cn('rounded-xl border p-4 transition-all hover:shadow-md', meta.border, meta.bg)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg bg-background',
              meta.color
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-text-primary">{anomaly.title}</h4>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-medium',
                  meta.bg,
                  meta.color
                )}
              >
                {anomaly.confidence * 100}% confidence
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {anomaly.id} · Detected {timeAgo(anomaly.detectedAt)}
            </p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
            anomaly.status === 'active'
              ? 'bg-rose-500/10 text-rose-500'
              : anomaly.status === 'investigating'
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-emerald-500/10 text-emerald-500'
          )}
        >
          {anomaly.status === 'active'
            ? 'Active'
            : anomaly.status === 'investigating'
              ? 'Investigating'
              : 'Resolved'}
        </span>
      </div>

      <p className="mt-3 text-sm text-text-secondary">{anomaly.description}</p>

      <div className="mt-3 flex flex-wrap gap-1">
        {anomaly.affectedTargets.map((target) => (
          <span
            key={target}
            className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary"
          >
            {target}
          </span>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-border bg-background p-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">
          Recommended Action
        </p>
        <p className="text-xs text-text-secondary">{anomaly.recommendedAction}</p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {anomaly.status !== 'resolved' && (
          <Button size="sm" variant="outline" onClick={() => onInvestigate?.(anomaly)}>
            <Search className="mr-1.5 h-3.5 w-3.5" /> Investigate
          </Button>
        )}
        {anomaly.status === 'active' && (
          <Button
            size="sm"
            variant="outline"
            className="text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
            onClick={() => onDismiss?.(anomaly)}
          >
            <Ban className="mr-1.5 h-3.5 w-3.5" /> Dismiss
          </Button>
        )}
        {anomaly.status === 'resolved' && (
          <Button
            size="sm"
            variant="outline"
            className="text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reopen
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Compliance Export Modal ─── */
export function ComplianceExportModal({ isOpen, onClose, onExport }) {
  const [selectedFramework, setSelectedFramework] = useState('gdpr');
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [dateRange, setDateRange] = useState({ from: '2026-08-01', to: '2026-08-16' });
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeTamperProof, setIncludeTamperProof] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    await new Promise((r) => setTimeout(r, 1500));
    onExport?.({
      framework: selectedFramework,
      format: selectedFormat,
      dateRange,
      includeMetadata,
      includeTamperProof,
    });
    setIsExporting(false);
    onClose();
  };

  const framework = complianceFrameworks.find((f) => f.id === selectedFramework);
  const format = exportFormats.find((f) => f.id === selectedFormat);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <FileDown className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Compliance Export</h3>
              <p className="text-xs text-text-muted">Generate tamper-proof audit report</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Framework */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Compliance Framework
            </label>
            <div className="grid grid-cols-2 gap-2">
              {complianceFrameworks.map((fw) => (
                <button
                  key={fw.id}
                  onClick={() => setSelectedFramework(fw.id)}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-all',
                    selectedFramework === fw.id
                      ? 'border-secondary bg-secondary/5'
                      : 'border-border bg-surface hover:border-secondary/30'
                  )}
                >
                  <p
                    className={cn(
                      'text-sm font-medium',
                      selectedFramework === fw.id ? 'text-secondary' : 'text-text-primary'
                    )}
                  >
                    {fw.label}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">{fw.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Export Format
            </label>
            <div className="flex gap-2">
              {exportFormats.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                    selectedFormat === fmt.id
                      ? 'border-secondary bg-secondary/5 text-secondary'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-text-muted mb-1 block">From</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-muted mb-1 block">To</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Options
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
                className="h-4 w-4 rounded border-border text-secondary"
              />
              <div>
                <p className="text-sm font-medium text-text-primary">Include Metadata</p>
                <p className="text-xs text-text-muted">
                  Actor details, session info, and target context
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTamperProof}
                onChange={(e) => setIncludeTamperProof(e.target.checked)}
                className="h-4 w-4 rounded border-border text-secondary"
              />
              <div>
                <p className="text-sm font-medium text-text-primary">Include Tamper-Proof Chain</p>
                <p className="text-xs text-text-muted">
                  Cryptographic hashes and signatures for verification
                </p>
              </div>
            </label>
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Framework:</span>
              <span className="font-medium text-text-primary">{framework?.label}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-text-muted">Format:</span>
              <span className="font-medium text-text-primary">{format?.label}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-text-muted">Period:</span>
              <span className="font-medium text-text-primary">
                {dateRange.from} → {dateRange.to}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-border p-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} isLoading={isExporting}>
            <FileDown className="mr-1.5 h-4 w-4" /> Generate Export
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Stat Card ─── */
export function AuditStatCard({ label, value, subtext, icon: Icon, color, trend }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend !== undefined && (
            <p
              className={cn(
                'mt-1 text-xs font-medium',
                trend >= 0 ? 'text-emerald-500' : 'text-rose-500'
              )}
            >
              {trend >= 0 ? '+' : ''}
              {trend}% vs last period
            </p>
          )}
        </div>
        <div
          className={cn(
            'rounded-lg p-2.5',
            color
              .replace('text-', 'bg-')
              .replace('rose-500', 'rose-500/10')
              .replace('emerald-500', 'emerald-500/10')
              .replace('amber-500', 'amber-500/10')
              .replace('blue-500', 'blue-500/10')
              .replace('purple-500', 'purple-500/10')
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

/* ─── Chain Verification Visual ─── */
export function ChainVerificationVisual({ logs }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Link2 className="h-4 w-4 text-secondary" /> Hash Chain Verification
        </h3>
        <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" /> Chain Valid
        </span>
      </div>
      <div className="space-y-2 max-h-64 overflow-auto">
        {logs.slice(0, 20).map((log, idx) => {
          const isFirst = idx === 0;
          const prevHash = isFirst ? 'GENESIS' : logs[idx - 1].tamperProof.hash;
          const linked = log.tamperProof.previousHash === prevHash;

          return (
            <div key={log.id} className="flex items-center gap-3 text-xs">
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  linked ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                )}
              >
                {linked ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-text-muted">{log.id}</span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px]',
                      severityMeta[log.severity]?.class
                    )}
                  >
                    {log.severity}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-text-muted">
                  <Hash className="h-3 w-3" />
                  <span className="font-mono">{log.tamperProof.hash}</span>
                  <ArrowRight className="h-3 w-3" />
                  <Link2 className="h-3 w-3" />
                  <span className="font-mono">{log.tamperProof.previousHash}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {logs.length > 20 && (
        <p className="text-xs text-text-muted text-center mt-2">
          +{logs.length - 20} more entries in chain
        </p>
      )}
    </div>
  );
}
