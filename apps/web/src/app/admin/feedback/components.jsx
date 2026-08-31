/* src/app/admin/feedback/components.jsx */
import { useState } from 'react';
import {
  ThumbsUp, ThumbsDown, Minus, TrendingUp, TrendingDown, MessageSquare,
  CheckCircle2, AlertTriangle, XCircle, Star, ArrowUp, ArrowDown,
  Zap, Clock, Target, BarChart3, Smile, Frown, Meh, Hash
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { sentimentMeta, getNpsColor, getNpsBarColor, formatNpsScore } from './data';

/* ─── NPS Gauge (Circular) ─── */
export function NpsGauge({ score, size = 120 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalized = Math.min(Math.max((score + 100) / 200, 0), 1);
  const dashOffset = circumference * (1 - normalized);

  const color = score >= 50 ? '#22c55e' : score >= 30 ? '#863bff' : score >= 0 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--border)" strokeWidth="8"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-bold font-mono', getNpsColor(score))}>
          {formatNpsScore(score)}
        </span>
        <span className="text-[10px] text-text-muted uppercase tracking-wider">NPS</span>
      </div>
    </div>
  );
}

/* ─── NPS Breakdown Bar ─── */
export function NpsBreakdownBar({ promoters, passives, detractors, total }) {
  const pPct = total > 0 ? (promoters / total) * 100 : 0;
  const paPct = total > 0 ? (passives / total) * 100 : 0;
  const dPct = total > 0 ? (detractors / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        <div className="bg-accent transition-all" style={{ width: `${pPct}%` }} />
        <div className="bg-warning transition-all" style={{ width: `${paPct}%` }} />
        <div className="bg-danger transition-all" style={{ width: `${dPct}%` }} />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-accent font-medium">{promoters} Promoters</span>
        <span className="text-warning font-medium">{passives} Passives</span>
        <span className="text-danger font-medium">{detractors} Detractors</span>
      </div>
    </div>
  );
}

/* ─── Sentiment Badge ─── */
export function SentimentBadge({ sentiment }) {
  const meta = sentimentMeta[sentiment] || sentimentMeta.neutral;
  const Icon = sentiment === 'positive' ? Smile : sentiment === 'negative' ? Frown : Meh;

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', meta.class)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

/* ─── NPS Score Badge ─── */
export function NpsScoreBadge({ score }) {
  const color = score >= 9 ? 'text-accent' : score >= 7 ? 'text-secondary' : score >= 5 ? 'text-warning' : 'text-danger';
  const bg = score >= 9 ? 'bg-accent/10' : score >= 7 ? 'bg-secondary/10' : score >= 5 ? 'bg-warning/10' : 'bg-danger/10';
  const border = score >= 9 ? 'border-accent/20' : score >= 7 ? 'border-secondary/20' : score >= 5 ? 'border-warning/20' : 'border-danger/20';

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-bold font-mono', bg, color, border)}>
      <Star className="h-3.5 w-3.5" />
      {score}
    </span>
  );
}

/* ─── Category Badge ─── */
export function CategoryBadge({ category }) {
  const meta = {
    product: { label: 'Product', class: 'bg-secondary/10 text-secondary border-secondary/20' },
    feature: { label: 'Feature', class: 'bg-info/10 text-info border-info/20' },
    support: { label: 'Support', class: 'bg-warning/10 text-warning border-warning/20' },
    billing: { label: 'Billing', class: 'bg-danger/10 text-danger border-danger/20' },
    performance: { label: 'Performance', class: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    onboarding: { label: 'Onboarding', class: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
  }[category] || { label: category, class: 'bg-neutral/10 text-text-muted border-border' };

  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider', meta.class)}>
      {meta.label}
    </span>
  );
}

/* ─── Feature Status Badge ─── */
export function FeatureStatusBadge({ status }) {
  const meta = {
    backlog: { label: 'Backlog', class: 'bg-neutral/10 text-text-muted border-border', dot: 'bg-text-muted' },
    planned: { label: 'Planned', class: 'bg-info/10 text-info border-info/20', dot: 'bg-info' },
    'in-progress': { label: 'In Progress', class: 'bg-warning/10 text-warning border-warning/20', dot: 'bg-warning' },
    shipped: { label: 'Shipped', class: 'bg-accent/10 text-accent border-accent/20', dot: 'bg-accent' },
    declined: { label: 'Declined', class: 'bg-danger/10 text-danger border-danger/20', dot: 'bg-danger' },
  }[status] || { label: status, class: 'bg-neutral/10 text-text-muted border-border', dot: 'bg-text-muted' };

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', meta.class)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Priority Badge ─── */
export function PriorityBadge({ priority }) {
  const meta = {
    critical: { label: 'Critical', class: 'bg-danger/10 text-danger border-danger/20' },
    high: { label: 'High', class: 'bg-warning/10 text-warning border-warning/20' },
    medium: { label: 'Medium', class: 'bg-info/10 text-info border-info/20' },
    low: { label: 'Low', class: 'bg-neutral/10 text-text-muted border-border' },
  }[priority] || { label: priority, class: 'bg-neutral/10 text-text-muted border-border' };

  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider', meta.class)}>
      {meta.label}
    </span>
  );
}

/* ─── Vote Button ─── */
export function VoteButton({ count, voted, onVote }) {
  return (
    <button
      onClick={onVote}
      className={cn(
        'flex flex-col items-center gap-0.5 rounded-lg border px-3 py-2 transition-all min-w-[60px]',
        voted
          ? 'border-secondary bg-secondary/10 text-secondary'
          : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
      )}
    >
      <ArrowUp className={cn('h-4 w-4', voted && 'fill-current')} />
      <span className="text-xs font-bold font-mono">{count}</span>
    </button>
  );
}

/* ─── Sentiment Mini Chart (Sparkline-style) ─── */
export function SentimentMiniChart({ data }) {
  const max = Math.max(...data.map(d => d.positive + d.neutral + d.negative));
  const barWidth = 100 / data.length;

  return (
    <div className="flex items-end gap-px h-16">
      {data.map((d, i) => {
        const total = d.positive + d.neutral + d.negative;
        const height = max > 0 ? (total / max) * 100 : 0;
        return (
          <div
            key={i}
            className="flex flex-col justify-end relative group"
            style={{ width: `${barWidth}%`, height: '100%' }}
          >
            <div
              className={cn(
                'w-full rounded-t-sm transition-all',
                d.nps >= 50 ? 'bg-accent/60' : d.nps >= 30 ? 'bg-secondary/60' : d.nps >= 0 ? 'bg-warning/60' : 'bg-danger/60'
              )}
              style={{ height: `${height}%` }}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap text-[10px] bg-surface border border-border rounded px-1.5 py-0.5 z-10">
              NPS: {d.nps}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Keyword Tag ─── */
export function KeywordTag({ keyword }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-background border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary">
      <Hash className="h-3 w-3 text-text-muted" />
      {keyword}
    </span>
  );
}

/* ─── Response Card (for drawer) ─── */
export function ResponseCard({ response }) {
  return (
    <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-accent">Response</span>
        <span className="text-[10px] text-text-muted">{response.at}</span>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{response.text}</p>
      <p className="text-xs text-text-muted">— {response.by}</p>
    </div>
  );
}

/* ─── Stat Card ─── */
export function FeedbackStatCard({ label, value, subtext, icon: Icon, color, trend }) {
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

/* ─── NPS Score Bar (0-10 scale) ─── */
export function NpsScoreBar({ score, count, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  const color = score >= 9 ? 'bg-accent' : score >= 7 ? 'bg-secondary' : score >= 5 ? 'bg-warning' : 'bg-danger';

  return (
    <div className="flex items-center gap-2">
      <span className={cn('w-6 text-xs font-mono font-medium text-right', score >= 9 ? 'text-accent' : score >= 7 ? 'text-secondary' : score >= 5 ? 'text-warning' : 'text-danger')}>
        {score}
      </span>
      <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-xs font-mono text-text-muted text-right">{count}</span>
    </div>
  );
}
