/* src/app/admin/analytics/components.jsx */
import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Clock,
  Zap,
  BarChart3,
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Target,
  ArrowRight,
  Lightbulb,
  DollarSign,
  MousePointer,
  Eye,
  Layers,
  Star,
  Crown,
  Calendar,
  Timer,
  MousePointerClick,
  Percent,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  getHeatmapColor,
  getHeatmapIntensity,
  getUsageBarColor,
  formatNumber,
  classificationMeta,
  severityMeta,
  categoryMeta,
} from './data';

/* ─── Stat Card ─── */
export function AnalyticsStatCard({ label, value, subtext, icon: Icon, color, trend, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-border bg-surface p-4 transition-all',
        onClick && 'cursor-pointer hover:shadow-md hover:border-secondary/30'
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend !== undefined && (
            <p
              className={cn(
                'mt-1 text-xs font-medium flex items-center gap-1',
                parseFloat(trend) >= 0 ? 'text-accent' : 'text-danger'
              )}
            >
              {parseFloat(trend) >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
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
              .replace('danger', 'danger/10')
              .replace('accent', 'accent/10')
              .replace('warning', 'warning/10')
              .replace('info', 'info/10')
              .replace('secondary', 'secondary/10')
              .replace('purple-500', 'purple-500/10')
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

/* ─── Classification Badge ─── */
export function ClassificationBadge({ classification }) {
  const meta = classificationMeta[classification] || classificationMeta.engaged;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.bg,
        meta.color,
        meta.border
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Severity Badge ─── */
export function SeverityBadge({ severity }) {
  const meta = severityMeta[severity] || severityMeta.medium;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.bg,
        meta.color,
        meta.border
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Category Badge ─── */
export function CategoryBadge({ category }) {
  const meta = categoryMeta[category] || categoryMeta.operations;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        meta.bg,
        meta.color,
        'border-current/20'
      )}
    >
      {meta.label}
    </span>
  );
}

/* ─── Feature Usage Heatmap ─── */
export function FeatureHeatmap({ data, maxValue }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-3">
      {/* Hour labels */}
      <div className="flex items-center gap-0.5 ml-32">
        {hours.map((h) => (
          <div key={h} className="flex-1 text-center">
            <span className="text-[9px] text-text-muted">{h}</span>
          </div>
        ))}
      </div>

      {/* Heatmap rows */}
      <div className="space-y-1">
        {data.map((feature) => (
          <div key={feature.feature} className="flex items-center gap-2">
            {/* Feature label */}
            <div className="w-32 shrink-0">
              <p className="text-xs font-medium text-text-primary truncate">{feature.feature}</p>
              <p className="text-[9px] text-text-muted">
                {formatNumber(feature.totalEvents)} events
              </p>
            </div>

            {/* Hourly cells */}
            <div className="flex flex-1 gap-0.5">
              {feature.hourly.map((value, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex-1 h-6 rounded-sm transition-all cursor-pointer relative',
                    getHeatmapColor(value, maxValue)
                  )}
                  onMouseEnter={() =>
                    setHoveredCell({ feature: feature.feature, hour: idx, value })
                  }
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  {hoveredCell?.feature === feature.feature && hoveredCell?.hour === idx && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10">
                      <div className="rounded-md border border-border bg-surface-elevated shadow-lg px-2 py-1 whitespace-nowrap">
                        <p className="text-[10px] font-medium text-text-primary">
                          {feature.feature}
                        </p>
                        <p className="text-[9px] text-text-muted">
                          {idx}:00 — {value} events
                        </p>
                        <p className="text-[9px] text-text-muted">
                          {getHeatmapIntensity(value, maxValue)} activity
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <span className="text-[10px] text-text-muted">Low</span>
        <div className="flex gap-0.5">
          {[
            'bg-border',
            'bg-warning/60',
            'bg-info',
            'bg-accent',
            'bg-secondary',
            'bg-purple-500',
          ].map((c, i) => (
            <div key={i} className={cn('h-3 w-4 rounded-sm', c)} />
          ))}
        </div>
        <span className="text-[10px] text-text-muted">High</span>
      </div>
    </div>
  );
}

/* ─── Funnel Chart ─── */
export function FunnelChart({ funnel, onSelect }) {
  const maxCount = funnel.steps[0].count;
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => onSelect?.(funnel)}
      className={cn(
        'rounded-xl border border-border bg-surface p-5 transition-all',
        onSelect && 'cursor-pointer hover:shadow-md hover:border-secondary/30'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{funnel.name}</h3>
          <p className="text-xs text-text-muted mt-0.5">{funnel.description}</p>
        </div>
        <div className="text-right">
          <p
            className={cn(
              'text-lg font-bold font-mono',
              funnel.totalConversion >= 40
                ? 'text-accent'
                : funnel.totalConversion >= 20
                  ? 'text-warning'
                  : 'text-danger'
            )}
          >
            {funnel.totalConversion}%
          </p>
          <p className="text-[10px] text-text-muted">conversion</p>
        </div>
      </div>

      {/* Funnel Bars */}
      <div className="space-y-2">
        {funnel.steps.map((step, idx) => {
          const width = (step.count / maxCount) * 100;
          const isLast = idx === funnel.steps.length - 1;
          return (
            <div key={step.name} className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-text-secondary">{step.name}</span>
                    <span className="text-xs font-mono font-medium text-text-primary">
                      {step.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-6 rounded-md bg-border overflow-hidden relative">
                    <div
                      className={cn(
                        'h-full rounded-md transition-all',
                        idx === 0
                          ? 'bg-secondary'
                          : step.dropOff > 30
                            ? 'bg-danger'
                            : step.dropOff > 15
                              ? 'bg-warning'
                              : 'bg-accent'
                      )}
                      style={{ width: `${width}%` }}
                    />
                    {step.dropOff > 0 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-white drop-shadow">
                        -{step.dropOff}%
                      </span>
                    )}
                  </div>
                </div>
                {!isLast && <ArrowRight className="h-3.5 w-3.5 text-text-muted shrink-0" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <Timer className="h-3 w-3" />
          Avg. time: {funnel.avgTimeMin ? `${funnel.avgTimeMin} min` : `${funnel.avgTimeDays} days`}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-secondary hover:underline flex items-center gap-1"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? 'Less' : 'Details'}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 rounded-lg border border-border bg-background p-3 space-y-2">
          {funnel.steps.map((step, idx) => (
            <div key={step.name} className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">
                {idx + 1}. {step.name}
              </span>
              <div className="flex items-center gap-3">
                {step.dropOff > 0 && (
                  <span className="text-danger font-medium">-{step.dropOff}% drop</span>
                )}
                <span className="font-mono text-text-primary">{step.count.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Engagement Score Card ─── */
export function EngagementCard({ user, onClick }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const meta = classificationMeta[user.classification];
  const scoreColor =
    user.score >= 80
      ? 'text-purple-500'
      : user.score >= 60
        ? 'text-accent'
        : user.score >= 40
          ? 'text-warning'
          : 'text-danger';

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border bg-surface p-4 transition-all',
        onClick && 'cursor-pointer hover:shadow-md',
        user.classification === 'power'
          ? 'border-purple-500/20 hover:border-purple-500/40'
          : user.classification === 'engaged'
            ? 'border-accent/20 hover:border-accent/40'
            : user.classification === 'at-risk'
              ? 'border-warning/20 hover:border-warning/40'
              : 'border-danger/20 hover:border-danger/40'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', meta.bg)}>
            {user.classification === 'power' ? (
              <Crown className={cn('h-5 w-5', meta.color)} />
            ) : user.classification === 'engaged' ? (
              <Star className={cn('h-5 w-5', meta.color)} />
            ) : user.classification === 'at-risk' ? (
              <AlertTriangle className={cn('h-5 w-5', meta.color)} />
            ) : (
              <Zap className={cn('h-5 w-5', meta.color)} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{user.tenantName}</h3>
            <p className="text-[10px] text-text-muted font-mono">
              {user.tenantId} · {user.plan}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn('text-2xl font-bold font-mono', scoreColor)}>{user.score}</p>
          <p className="text-[10px] text-text-muted">engagement</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-text-muted" />
          {user.sessionsPerWeek}/wk
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-text-muted" />
          {user.avgSessionMin}m avg
        </span>
        <span className="flex items-center gap-1">
          <Layers className="h-3 w-3 text-text-muted" />
          {user.featuresUsed} features
        </span>
      </div>

      {/* Score bar */}
      <div className="mt-3">
        <div className="h-2 w-full rounded-full bg-border overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              user.score >= 80
                ? 'bg-purple-500'
                : user.score >= 60
                  ? 'bg-accent'
                  : user.score >= 40
                    ? 'bg-warning'
                    : 'bg-danger'
            )}
            style={{ width: `${user.score}%` }}
          />
        </div>
      </div>

      {/* Trend */}
      <div className="mt-2 flex items-center justify-between">
        <ClassificationBadge classification={user.classification} />
        <span
          className={cn(
            'text-xs font-medium flex items-center gap-1',
            parseFloat(user.trend) >= 0 ? 'text-accent' : 'text-danger'
          )}
        >
          {parseFloat(user.trend) >= 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {user.trend}%
        </span>
      </div>

      {/* Breakdown toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowBreakdown(!showBreakdown);
        }}
        className="mt-3 text-xs text-secondary hover:underline flex items-center gap-1 w-full justify-center"
      >
        {showBreakdown ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Score Breakdown
      </button>

      {showBreakdown && (
        <div className="mt-3 rounded-lg border border-border bg-background p-3 space-y-2">
          {[
            { label: 'Daily Activity', value: user.breakdown.daily, max: 30 },
            { label: 'Weekly Retention', value: user.breakdown.weekly, max: 40 },
            { label: 'Feature Retention', value: user.breakdown.retention, max: 50 },
            { label: 'Feature Depth', value: user.breakdown.depth, max: 50 },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-text-secondary">{item.label}</span>
                <span className="font-mono text-text-primary">
                  {item.value}/{item.max}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                <div
                  className={cn('h-full rounded-full bg-secondary')}
                  style={{ width: `${(item.value / item.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Drop-off Point Card ─── */
export function DropOffCard({ dropOff, onClick }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border bg-surface p-4 transition-all',
        onClick && 'cursor-pointer hover:shadow-md',
        dropOff.severity === 'critical'
          ? 'border-danger/30 hover:border-danger/50'
          : dropOff.severity === 'high'
            ? 'border-warning/30 hover:border-warning/50'
            : 'border-border hover:border-secondary/30'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              dropOff.severity === 'critical'
                ? 'bg-danger/10'
                : dropOff.severity === 'high'
                  ? 'bg-warning/10'
                  : dropOff.severity === 'medium'
                    ? 'bg-info/10'
                    : 'bg-neutral/10'
            )}
          >
            <Target
              className={cn(
                'h-4 w-4',
                dropOff.severity === 'critical'
                  ? 'text-danger'
                  : dropOff.severity === 'high'
                    ? 'text-warning'
                    : dropOff.severity === 'medium'
                      ? 'text-info'
                      : 'text-text-muted'
              )}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{dropOff.location}</h3>
            <p className="text-[10px] text-text-muted">
              {dropOff.affectedUsers.toLocaleString()} users affected
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={cn(
              'text-lg font-bold font-mono',
              dropOff.dropOffRate >= 35
                ? 'text-danger'
                : dropOff.dropOffRate >= 20
                  ? 'text-warning'
                  : 'text-info'
            )}
          >
            {dropOff.dropOffRate}%
          </p>
          <p className="text-[10px] text-text-muted">drop-off</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <SeverityBadge severity={dropOff.severity} />
        <span className="text-[10px] text-text-muted">
          {dropOff.funnel !== 'internal' && `in ${dropOff.funnel}`}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="mt-3 text-xs text-secondary hover:underline flex items-center gap-1 w-full justify-center"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? 'Hide Details' : 'View Details'}
      </button>

      {expanded && (
        <div className="mt-3 rounded-lg border border-border bg-background p-3 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">
              Root Cause
            </p>
            <p className="text-xs text-text-secondary">{dropOff.reason}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">
              Suggested Fix
            </p>
            <div className="flex items-start gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary">{dropOff.suggestedFix}</p>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">
              Business Impact
            </p>
            <p className="text-xs font-medium text-text-primary flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-accent" />
              {dropOff.impact}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Power User Row ─── */
export function PowerUserRow({ user, rank }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-surface hover:bg-background/50 transition-colors">
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
          rank === 1
            ? 'bg-purple-500 text-white'
            : rank === 2
              ? 'bg-secondary text-white'
              : rank === 3
                ? 'bg-accent text-white'
                : 'bg-border text-text-muted'
        )}
      >
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
        <p className="text-[10px] text-text-muted font-mono">{user.tenantId}</p>
      </div>
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-purple-500" />
          <span className="font-mono font-medium">{user.score}</span>
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-text-muted" />
          <span className="font-mono">{user.streakDays}d</span>
        </span>
        <span className="flex items-center gap-1">
          <MousePointerClick className="h-3 w-3 text-text-muted" />
          <span className="font-mono">{formatNumber(user.commandsUsed)}</span>
        </span>
      </div>
    </div>
  );
}

/* ─── Session Duration Bar Chart ─── */
export function SessionDurationChart({ data }) {
  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const width = (item.count / maxCount) * 100;
        return (
          <div key={item.range}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-secondary">{item.range}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-text-muted">
                  {item.count.toLocaleString()}
                </span>
                <span className="text-xs font-mono font-medium text-text-primary">
                  {item.percentage}%
                </span>
              </div>
            </div>
            <div className="h-4 w-full rounded-full bg-border overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  item.percentage > 25
                    ? 'bg-secondary'
                    : item.percentage > 15
                      ? 'bg-accent'
                      : item.percentage > 5
                        ? 'bg-info'
                        : 'bg-text-muted/30'
                )}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
