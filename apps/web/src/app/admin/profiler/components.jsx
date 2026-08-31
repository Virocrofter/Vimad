/* src/app/admin/profiler/components.jsx */
import { useState } from 'react';
import {
  Clock,
  Database,
  Zap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Server,
  Cpu,
  HardDrive,
  Activity,
  Layers,
  Code,
  Eye,
  Link2,
  Flame,
  Package,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Play,
  Pause,
  X,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  impactMeta,
  severityMeta,
  effortMeta,
  typeMeta,
  formatDuration,
  formatNumber,
} from './data';

/* ─── Impact Badge ─── */
export function ImpactBadge({ impact }) {
  const meta = impactMeta[impact] || impactMeta.low;
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

/* ─── Severity Badge ─── */
export function SeverityBadge({ severity }) {
  const meta = severityMeta[severity] || severityMeta.low;
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

/* ─── Effort Badge ─── */
export function EffortBadge({ effort }) {
  const meta = effortMeta[effort] || effortMeta.low;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
        meta.class
      )}
    >
      {meta.label}
    </span>
  );
}

/* ─── Type Badge ─── */
export function TypeBadge({ type }) {
  const meta = typeMeta[type] || typeMeta.index;
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

/* ─── Latency Heatmap Cell ─── */
export function LatencyCell({ p95, p99, rpm }) {
  const getColor = (val) => {
    if (val < 100) return 'bg-accent/20 text-accent border-accent/30';
    if (val < 500) return 'bg-info/20 text-info border-info/30';
    if (val < 1500) return 'bg-warning/20 text-warning border-warning/30';
    return 'bg-danger/20 text-danger border-danger/30';
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-all hover:shadow-md cursor-pointer',
        getColor(p95)
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold font-mono">{formatDuration(p95)}</span>
        <span className="text-[10px] font-medium opacity-70">p95</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] opacity-70">
        <span>p99: {formatDuration(p99)}</span>
        <span>{rpm} rpm</span>
      </div>
    </div>
  );
}

/* ─── Query Performance Bar ─── */
export function QueryPerfBar({ label, value, max, color = 'bg-secondary', unit = '' }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono font-medium text-text-primary">
          {unit === 'ms' ? formatDuration(value) : formatNumber(value)}
          {unit}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Resource Hog Card ─── */
export function ResourceHogCard({ hog, onClick }) {
  const TrendIcon = hog.trend === 'up' ? TrendingUp : hog.trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    hog.trend === 'up' ? 'text-danger' : hog.trend === 'down' ? 'text-accent' : 'text-text-muted';

  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-border bg-surface p-4 cursor-pointer transition-all hover:shadow-md hover:border-secondary/30"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
            <Server className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{hog.tenantName}</h3>
            <p className="text-[10px] text-text-muted font-mono">
              {hog.tenantId} · {hog.plan}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <TrendIcon className={cn('h-3.5 w-3.5', trendColor)} />
          <span className={trendColor}>
            {hog.trendValue > 0 ? '+' : ''}
            {hog.trendValue}%
          </span>
        </div>
      </div>

      {/* Resource Bars */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <QueryPerfBar
          label="CPU"
          value={hog.cpuPercent}
          max={100}
          color={
            hog.cpuPercent > 50 ? 'bg-danger' : hog.cpuPercent > 25 ? 'bg-warning' : 'bg-accent'
          }
          unit="%"
        />
        <QueryPerfBar
          label="Memory"
          value={hog.memoryMB}
          max={2048}
          color={
            hog.memoryMB > 1500 ? 'bg-danger' : hog.memoryMB > 1000 ? 'bg-warning' : 'bg-accent'
          }
          unit="MB"
        />
        <QueryPerfBar
          label="DB Conns"
          value={hog.dbConnections}
          max={80}
          color={
            hog.dbConnections > 60
              ? 'bg-danger'
              : hog.dbConnections > 40
                ? 'bg-warning'
                : 'bg-accent'
          }
        />
        <QueryPerfBar
          label="Cache Hit"
          value={hog.cacheHitRate}
          max={100}
          color={
            hog.cacheHitRate < 85 ? 'bg-danger' : hog.cacheHitRate < 92 ? 'bg-warning' : 'bg-accent'
          }
          unit="%"
        />
      </div>

      {/* Top Endpoints */}
      <div className="mt-3 space-y-1.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
          Top Endpoints
        </p>
        {hog.topEndpoints.map((ep, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-text-secondary truncate max-w-[200px]">{ep.endpoint}</span>
            <span className="font-mono text-text-muted">{ep.pct}%</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
        <span>{formatNumber(hog.apiCallsPerMin)} req/min</span>
        <span>{hog.slowQueries} slow queries</span>
      </div>
    </div>
  );
}

/* ─── Recommendation Card ─── */
export function RecommendationCard({ rec, onApply, onViewQuery }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (rec.sql) {
      navigator.clipboard.writeText(rec.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const improvement = rec.estimatedImprovement;
  const improvementPct =
    improvement && improvement.before > 0
      ? Math.round(((improvement.before - improvement.after) / improvement.before) * 100)
      : 0;

  return (
    <div
      className={cn(
        'rounded-xl border bg-surface p-4 transition-all',
        rec.severity === 'critical' ? 'border-danger/30' : 'border-border hover:border-secondary/30'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <TypeBadge type={rec.type} />
          <SeverityBadge severity={rec.severity} />
          <EffortBadge effort={rec.effort} />
        </div>
        {rec.autoApplicable && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
            <Zap className="h-3 w-3" /> Auto-apply
          </span>
        )}
      </div>

      <h3 className="mt-2 text-sm font-semibold text-text-primary">{rec.title}</h3>
      <p className="mt-1 text-xs text-text-secondary">{rec.description}</p>

      {/* Impact */}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-text-muted">Impact:</span>
        <span className="text-xs font-medium text-accent">{rec.impact}</span>
      </div>

      {/* Improvement Preview */}
      {improvement && (
        <div className="mt-2 rounded-lg border border-border bg-background p-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Before</span>
            <span className="text-text-muted">After</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-mono text-sm text-danger">
              {improvement.before}
              {improvement.unit}
            </span>
            <div className="flex-1 mx-3 h-px bg-border relative">
              <span className="absolute left-1/2 -translate-x-1/2 -top-2 text-[10px] font-bold text-accent bg-background px-1">
                -{improvementPct}%
              </span>
            </div>
            <span className="font-mono text-sm text-accent">
              {improvement.after}
              {improvement.unit}
            </span>
          </div>
        </div>
      )}

      {/* Affected */}
      <div className="mt-2 flex flex-wrap gap-1">
        {rec.affectedTenants.map((t) => (
          <span
            key={t}
            className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] text-text-secondary font-mono"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Expandable SQL */}
      {rec.sql && (
        <div className="mt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-secondary hover:underline"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? 'Hide SQL' : 'View SQL'}
          </button>
          {expanded && (
            <div className="mt-2 relative">
              <pre className="rounded-lg bg-background border border-border p-3 text-xs font-mono text-text-secondary overflow-x-auto whitespace-pre-wrap">
                {rec.sql}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute right-2 top-2 rounded-md border border-border bg-surface p-1 text-text-muted hover:text-text-primary"
              >
                {copied ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
        {rec.affectedQueries.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => onViewQuery(rec.affectedQueries[0])}>
            <Eye className="mr-1.5 h-3.5 w-3.5" /> View Query
          </Button>
        )}
        {rec.autoApplicable ? (
          <Button size="sm" onClick={() => onApply(rec)}>
            <Play className="mr-1.5 h-3.5 w-3.5" /> Apply
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onApply(rec)}>
            <Code className="mr-1.5 h-3.5 w-3.5" /> Review
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Slow Query Row (Expandable) ─── */
export function SlowQueryRow({ query, expanded, onToggle, onViewDetail }) {
  const meta = impactMeta[query.impact] || impactMeta.low;

  return (
    <>
      <tr
        className={cn(
          'hover:bg-background/50 transition-colors cursor-pointer',
          expanded && 'bg-secondary/5'
        )}
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button className="text-text-muted hover:text-text-primary">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <span className="font-mono text-xs text-text-muted">{query.id}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <ImpactBadge impact={query.impact} />
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-text-primary truncate max-w-[300px]">
            {query.endpoint}
          </p>
          <p className="text-[10px] text-text-muted font-mono">{query.method}</p>
        </td>
        <td className="px-4 py-3">
          <span className="font-mono text-sm font-medium text-text-primary">
            {formatDuration(query.avgDuration)}
          </span>
          <p className="text-[10px] text-text-muted">max: {formatDuration(query.maxDuration)}</p>
        </td>
        <td className="px-4 py-3">
          <span className="font-mono text-sm text-text-primary">
            {formatNumber(query.callCount)}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs text-text-secondary">{query.tenantName}</span>
          <p className="text-[10px] text-text-muted font-mono">{query.tenant}</p>
        </td>
        <td className="px-4 py-3">
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs',
              query.indexUsed ? 'text-accent' : 'text-danger'
            )}
          >
            {query.indexUsed ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
            {query.indexUsed ? 'Indexed' : 'No Index'}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="px-4 py-4 bg-background/50">
            <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
              {/* Query Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                    Query
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetail(query);
                    }}
                    className="text-xs text-secondary hover:underline"
                  >
                    Open Analyzer →
                  </button>
                </div>
                <pre className="rounded-md bg-background border border-border p-3 text-xs font-mono text-text-secondary overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {query.query}
                </pre>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-[10px] text-text-muted uppercase">Rows Examined</p>
                  <p className="font-mono text-sm font-medium text-text-primary">
                    {formatNumber(query.rowsExamined)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-[10px] text-text-muted uppercase">Rows Returned</p>
                  <p className="font-mono text-sm font-medium text-text-primary">
                    {formatNumber(query.rowsReturned)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-[10px] text-text-muted uppercase">Efficiency</p>
                  <p
                    className={cn(
                      'font-mono text-sm font-medium',
                      query.rowsReturned / query.rowsExamined < 0.001
                        ? 'text-danger'
                        : 'text-accent'
                    )}
                  >
                    {((query.rowsReturned / query.rowsExamined) * 100).toFixed(3)}%
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-[10px] text-text-muted uppercase">Table</p>
                  <p className="font-mono text-sm font-medium text-text-primary">{query.table}</p>
                </div>
              </div>

              {/* Optimization Hint */}
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-accent">Optimization Recommendation</p>
                    <p className="text-xs text-text-secondary mt-0.5">{query.optimization}</p>
                  </div>
                </div>
              </div>

              {query.suggestedIndex && (
                <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                  <p className="text-[10px] text-text-muted uppercase mb-1">Suggested Index</p>
                  <code className="text-xs font-mono text-warning">{query.suggestedIndex}</code>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── Profiler Stat Card ─── */
export function ProfilerStatCard({ label, value, subtext, icon: Icon, color, trend }) {
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
              {trend}% vs last hour
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
