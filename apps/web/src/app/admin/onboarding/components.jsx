/* src/app/admin/onboarding/components.jsx */
import { useState } from 'react';
import {
  ChevronDown, ChevronUp, ChevronRight, Mail, Phone, Monitor,
  Video, Tag, Clock, CheckCircle2, AlertTriangle, XCircle,
  TrendingUp, TrendingDown, Minus, User, Calendar, Activity,
  Zap, Filter, ArrowRight, BarChart3, Funnel, Users, DollarSign,
  Clock3, Target, Sparkles, Ban, Play, Pause, Eye, Edit3, Plus,
  Trash2, Check, X, MessageSquare, Headphones, Star, Flag
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  getStageProgress, getOverallProgress, formatDuration,
  getHealthScoreColor, getHealthScoreBg, getStatusMeta,
  getInterventionStatusMeta, funnelStages, dropOffReasons,
  interventionTypes
} from './data';

/* ─── Stat Card ─── */
export function OnboardingStatCard({ label, value, subtext, icon: Icon, color, trend }) {
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

/* ─── Status Badge ─── */
export function OnboardingStatusBadge({ status }) {
  const meta = getStatusMeta(status);
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', meta.class)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Health Score Badge ─── */
export function HealthScoreBadge({ score }) {
  return (
    <div className={cn('flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', getHealthScoreBg(score), getHealthScoreColor(score), 'border-current/20')}>
      <Activity className="h-3 w-3" />
      {score}
    </div>
  );
}

/* ─── Funnel Visualization ─── */
export function FunnelVisualization({ stageData }) {
  const maxEntered = Math.max(...stageData.map(s => s.entered));

  return (
    <div className="space-y-3">
      {stageData.map((stage, idx) => {
        const prevStage = idx > 0 ? stageData[idx - 1] : null;
        const widthPct = maxEntered > 0 ? (stage.entered / maxEntered) * 100 : 0;
        const completionPct = stage.entered > 0 ? (stage.completed / stage.entered) * 100 : 0;
        const isLast = idx === stageData.length - 1;

        return (
          <div key={stage.stage} className="space-y-1">
            {/* Stage Bar */}
            <div className="flex items-center gap-3">
              <div className="w-32 text-right">
                <span className="text-xs font-medium text-text-secondary">
                  {funnelStages.find(s => s.id === stage.stage)?.label || stage.stage}
                </span>
              </div>
              <div className="flex-1 space-y-1">
                {/* Entered bar */}
                <div className="h-6 rounded-md bg-border overflow-hidden relative">
                  <div
                    className={cn(
                      'h-full rounded-md transition-all flex items-center px-2',
                      stage.dropOffRate > 20 ? 'bg-warning/20' : 'bg-secondary/20'
                    )}
                    style={{ width: `${widthPct}%` }}
                  >
                    <span className="text-[10px] font-mono font-medium text-text-primary">
                      {stage.entered}
                    </span>
                  </div>
                  {/* Completion overlay */}
                  <div
                    className="absolute top-0 left-0 h-full rounded-md bg-secondary/40 flex items-center px-2"
                    style={{ width: `${widthPct * (completionPct / 100)}%` }}
                  >
                    <span className="text-[10px] font-mono font-medium text-white">
                      {stage.completed}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-20 text-right">
                {stage.dropOff > 0 ? (
                  <span className="text-xs font-medium text-danger">
                    -{stage.dropOff} ({stage.dropOffRate.toFixed(1)}%)
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">—</span>
                )}
              </div>
            </div>

            {/* Drop-off reason */}
            {stage.dropOff > 0 && stage.topReason && (
              <div className="flex items-center gap-2 ml-32">
                <ArrowRight className="h-3 w-3 text-danger" />
                <span className={cn('text-[10px] font-medium', dropOffReasons[stage.topReason]?.color || 'text-text-muted')}>
                  {dropOffReasons[stage.topReason]?.label || stage.topReason}
                </span>
                <span className="text-[10px] text-text-muted">
                  {dropOffReasons[stage.topReason]?.description || ''}
                </span>
              </div>
            )}

            {/* Connector */}
            {!isLast && stage.dropOff > 0 && (
              <div className="flex items-center gap-2 ml-32 py-1">
                <div className="h-4 w-0.5 bg-danger/30 rounded-full" />
                <span className="text-[10px] text-danger font-medium">
                  {stage.dropOff} dropped off
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Tenant Progress Row ─── */
export function TenantProgressRow({ tenant, expanded, onToggle, onIntervene }) {
  const overall = getOverallProgress(tenant);
  const meta = getStatusMeta(tenant.status);

  return (
    <>
      <tr
        className={cn('hover:bg-background/50 transition-colors cursor-pointer', tenant.status === 'at_risk' && 'bg-danger/5')}
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button className="text-text-muted hover:text-text-primary">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <span className="font-mono text-xs text-text-muted">{tenant.id}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div>
            <p className="text-sm font-medium text-text-primary">{tenant.name}</p>
            <p className="text-[10px] text-text-muted">{tenant.subdomain}.vimad.io</p>
          </div>
        </td>
        <td className="px-4 py-3">
          <OnboardingStatusBadge status={tenant.status} />
        </td>
        <td className="px-4 py-3">
          <HealthScoreBadge score={tenant.healthScore} />
        </td>
        <td className="px-4 py-3">
          <div className="w-full max-w-[120px]">
            <div className="flex items-center justify-between text-[10px] mb-0.5">
              <span className="text-text-muted">{overall}%</span>
              <span className="text-text-muted">{tenant.daysRemaining > 0 ? `${tenant.daysRemaining}d left` : 'Expired'}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', overall >= 80 ? 'bg-accent' : overall >= 50 ? 'bg-warning' : 'bg-danger')}
                style={{ width: `${overall}%` }}
              />
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs text-text-secondary">{tenant.assignedCSM}</span>
        </td>
        <td className="px-4 py-3 text-right">
          <span className="text-xs font-mono font-medium text-text-primary">
            ${tenant.revenueAtRisk.toLocaleString()}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <button
            onClick={(e) => { e.stopPropagation(); onIntervene(tenant); }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-secondary/10 hover:text-secondary transition-colors"
            title="Add Intervention"
          >
            <Flag className="h-4 w-4" />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="px-4 py-4 bg-background/50">
            <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
              {/* Stage Breakdown */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Onboarding Progress</h4>
                <div className="grid grid-cols-4 gap-2">
                  {funnelStages.map((stage) => {
                    const progress = getStageProgress(tenant, stage.id);
                    const stageMeta = funnelStages.find(s => s.id === stage.id);
                    return (
                      <div key={stage.id} className="rounded-lg border border-border bg-background p-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-medium text-text-secondary">{stageMeta?.label}</span>
                          {progress.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-accent" />}
                          {progress.status === 'in_progress' && <Clock3 className="h-3 w-3 text-warning" />}
                          {progress.status === 'not_started' && <Minus className="h-3 w-3 text-text-muted" />}
                        </div>
                        {progress.status === 'completed' && (
                          <p className="text-[10px] text-text-muted">
                            {formatDuration(tenant.progress[stage.id]?.duration || 0)}
                          </p>
                        )}
                        {progress.status === 'in_progress' && (
                          <div className="space-y-1">
                            <div className="h-1 w-full rounded-full bg-border overflow-hidden">
                              <div className="h-full rounded-full bg-warning" style={{ width: `${progress.pct}%` }} />
                            </div>
                            <p className="text-[10px] text-text-muted">{progress.pct}% done</p>
                          </div>
                        )}
                        {progress.status === 'not_started' && (
                          <p className="text-[10px] text-text-muted">Not started</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Drop-off Info */}
              {tenant.dropOffStage && (
                <div className="rounded-lg border border-danger/20 bg-danger/5 p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-danger" />
                    <span className="text-sm font-medium text-danger">
                      Dropped off at: {funnelStages.find(s => s.id === tenant.dropOffStage)?.label}
                    </span>
                    {tenant.dropOffReason && (
                      <span className={cn('text-xs', dropOffReasons[tenant.dropOffReason]?.color || 'text-text-muted')}>
                        ({dropOffReasons[tenant.dropOffReason]?.label})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Interventions */}
              {tenant.interventions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Interventions</h4>
                  <div className="space-y-2">
                    {tenant.interventions.map((int) => {
                      const intMeta = interventionTypes.find(t => t.id === int.type);
                      const statusMeta = getInterventionStatusMeta(int.status);
                      return (
                        <div key={int.id} className="flex items-center gap-3 rounded-md border border-border bg-background p-2.5">
                          <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', intMeta?.bg || 'bg-neutral/10')}>
                            {int.type === 'email' && <Mail className={cn('h-3.5 w-3.5', intMeta?.color)} />}
                            {int.type === 'call' && <Phone className={cn('h-3.5 w-3.5', intMeta?.color)} />}
                            {int.type === 'in_app' && <Monitor className={cn('h-3.5 w-3.5', intMeta?.color)} />}
                            {int.type === 'demo' && <Video className={cn('h-3.5 w-3.5', intMeta?.color)} />}
                            {int.type === 'discount' && <Tag className={cn('h-3.5 w-3.5', intMeta?.color)} />}
                            {int.type === 'extend_trial' && <Clock className={cn('h-3.5 w-3.5', intMeta?.color)} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-text-primary truncate">{int.subject}</p>
                            <p className="text-[10px] text-text-muted">{int.notes || int.sentAt || int.scheduledAt}</p>
                          </div>
                          <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', statusMeta.class)}>
                            <span className={cn('h-1 w-1 rounded-full', statusMeta.dot)} />
                            {statusMeta.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => onIntervene(tenant)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-white hover:bg-secondary/90"
                >
                  <Flag className="h-3.5 w-3.5" /> Add Intervention
                </button>
                {tenant.status === 'trial_expired' && (
                  <button className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20">
                    <Clock className="h-3.5 w-3.5" /> Extend Trial
                  </button>
                )}
                <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-elevated">
                  <MessageSquare className="h-3.5 w-3.5" /> Add Note
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── Intervention Card ─── */
export function InterventionCard({ intervention, tenantName }) {
  const intMeta = interventionTypes.find(t => t.id === intervention.type);
  const statusMeta = getInterventionStatusMeta(intervention.status);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', intMeta?.bg || 'bg-neutral/10')}>
            {intervention.type === 'email' && <Mail className={cn('h-4 w-4', intMeta?.color)} />}
            {intervention.type === 'call' && <Phone className={cn('h-4 w-4', intMeta?.color)} />}
            {intervention.type === 'in_app' && <Monitor className={cn('h-4 w-4', intMeta?.color)} />}
            {intervention.type === 'demo' && <Video className={cn('h-4 w-4', intMeta?.color)} />}
            {intervention.type === 'discount' && <Tag className={cn('h-4 w-4', intMeta?.color)} />}
            {intervention.type === 'extend_trial' && <Clock className={cn('h-4 w-4', intMeta?.color)} />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{intervention.subject}</h3>
            <p className="text-[10px] text-text-muted">{tenantName} · {intervention.sentAt || intervention.scheduledAt}</p>
          </div>
        </div>
        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', statusMeta.class)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', statusMeta.dot)} />
          {statusMeta.label}
        </span>
      </div>
      {intervention.notes && (
        <p className="mt-2 text-xs text-text-secondary">{intervention.notes}</p>
      )}
    </div>
  );
}

/* ─── CSM Performance Card ─── */
export function CsmPerformanceCard({ csm }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-sm font-bold text-secondary">
          {csm.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{csm.name}</h3>
          <p className="text-[10px] text-text-muted">Customer Success Manager</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-background p-2.5">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Active Cases</p>
          <p className="text-lg font-bold font-mono text-text-primary">{csm.activeCases}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-2.5">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Conv. Rate</p>
          <p className="text-lg font-bold font-mono text-accent">{csm.conversionRate}%</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Simple Sparkline (SVG) ─── */
export function MiniSparkline({ data, color = '#863bff', width = 100, height = 30 }) {
  if (!data || data.length < 2) return <div className="h-8 w-24 bg-border rounded" />;

  const values = data.map(d => d.value || d);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={width} cy={height - ((values[values.length - 1] - min) / range) * height} r="2" fill={color} />
    </svg>
  );
}