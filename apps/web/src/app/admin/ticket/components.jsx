/* src/app/admin/tickets/components.jsx */
import { useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, MessageSquare, User,
  Tag, Building2, ChevronDown, ChevronUp, Star, StarOff,
  ArrowUpRight, ArrowDownRight, Minus, Zap, Shield
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { priorityMeta, statusMeta, categoryMeta, timeAgo, getSlaStatus, getResponseTime } from './data';

/* ─── Priority Badge ─── */
export function PriorityBadge({ priority }) {
  const meta = priorityMeta[priority] || priorityMeta.medium;
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

/* ─── Status Badge ─── */
export function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.open;
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

/* ─── Category Badge ─── */
export function CategoryBadge({ category }) {
  const meta = categoryMeta[category] || categoryMeta.data;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
      meta.bg, meta.color, 'border-current/20'
    )}>
      <Tag className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

/* ─── SLA Badge ─── */
export function SlaBadge({ ticket }) {
  const sla = getSlaStatus(ticket);
  const configs = {
    met: { label: 'SLA Met', class: 'bg-accent/10 text-accent border-accent/20', icon: CheckCircle2 },
    on_track: { label: 'On Track', class: 'bg-info/10 text-info border-info/20', icon: Clock },
    at_risk: { label: 'At Risk', class: 'bg-warning/10 text-warning border-warning/20', icon: AlertTriangle },
    breached: { label: 'Breached', class: 'bg-danger/10 text-danger border-danger/20', icon: AlertTriangle },
  };
  const config = configs[sla];
  const Icon = config.icon;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
      config.class
    )}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

/* ─── Ticket Stat Card ─── */
export function TicketStatCard({ label, value, subtext, icon: Icon, color, trend }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend !== undefined && (
            <p className={cn('mt-1 text-xs font-medium', trend >= 0 ? 'text-accent' : 'text-danger')}>
              {trend >= 0 ? '+' : ''}{trend}% vs last week
            </p>
          )}
        </div>
        <div className={cn(
          'rounded-lg p-2.5',
          color.replace('text-', 'bg-')
            .replace('danger', 'danger/10')
            .replace('accent', 'accent/10')
            .replace('warning', 'warning/10')
            .replace('info', 'info/10')
            .replace('secondary', 'secondary/10')
        )}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

/* ─── Mini Priority Bar ─── */
export function PriorityBar({ counts }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const items = [
    { key: 'critical', color: 'bg-danger', count: counts.critical || 0 },
    { key: 'high', color: 'bg-warning', count: counts.high || 0 },
    { key: 'medium', color: 'bg-info', count: counts.medium || 0 },
    { key: 'low', color: 'bg-text-muted', count: counts.low || 0 },
  ];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-text-muted">Priority Distribution</span>
        <span className="font-mono font-medium text-text-secondary">{total} total</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden flex">
        {items.map((item) => {
          const pct = total > 0 ? (item.count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={item.key}
              className={cn('h-full transition-all', item.color)}
              style={{ width: `${pct}%` }}
              title={`${item.key}: ${item.count}`}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ─── Satisfaction Stars ─── */
export function SatisfactionStars({ rating }) {
  if (rating === null || rating === undefined) return (
    <span className="text-[10px] text-text-muted">Not rated</span>
  );
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-3 w-3',
            star <= rating ? 'fill-amber-400 text-amber-400' : 'text-border'
          )}
        />
      ))}
    </div>
  );
}

/* ─── Message Bubble ─── */
export function MessageBubble({ message, isInternal }) {
  const isAgent = message.from === 'agent';
  const isSystem = message.from === 'system';

  return (
    <div className={cn(
      'flex gap-3',
      isAgent ? 'flex-row-reverse' : 'flex-row'
    )}>
      <div className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
        isAgent ? 'bg-secondary/10 text-secondary' :
        isSystem ? 'bg-surface-elevated text-text-muted border border-border' :
        'bg-accent/10 text-accent'
      )}>
        {isAgent ? 'A' : isSystem ? 'T' : 'T'}
      </div>
      <div className={cn(
        'max-w-[80%] rounded-xl px-4 py-3',
        isAgent ? 'bg-secondary/10 border border-secondary/20' :
        isInternal ? 'bg-warning/5 border border-warning/20 border-dashed' :
        'bg-surface border border-border'
      )}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-text-primary">{message.author}</span>
          {isInternal && (
            <span className="rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning">
              Internal
            </span>
          )}
          <span className="text-[10px] text-text-muted">{timeAgo(message.timestamp)}</span>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{message.body}</p>
      </div>
    </div>
  );
}

/* ─── Team Member Card ─── */
export function TeamMemberCard({ member, onClick, isSelected }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
        isSelected ? 'bg-secondary/10 text-secondary' : 'text-text-secondary hover:bg-surface-elevated'
      )}
    >
      <div className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
        isSelected ? 'bg-secondary text-white' : 'bg-secondary/10 text-secondary'
      )}>
        {member.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{member.name}</p>
        <p className="text-[10px] text-text-muted">{member.role}</p>
      </div>
      <span className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-medium',
        member.activeTickets > 3 ? 'bg-danger/10 text-danger' :
        member.activeTickets > 1 ? 'bg-warning/10 text-warning' :
        'bg-accent/10 text-accent'
      )}>
        {member.activeTickets}
      </span>
    </button>
  );
}

/* ─── Ticket Timeline Item ─── */
export function TimelineItem({ icon: Icon, iconColor, iconBg, title, time, description }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', iconBg)}>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>
        <div className="mt-1 h-full w-px bg-border" />
      </div>
      <div className="pb-4">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-[10px] text-text-muted">{time}</p>
        {description && <p className="mt-1 text-xs text-text-secondary">{description}</p>}
      </div>
    </div>
  );
}

/* ─── Simple Bar Chart for ticket volume ─── */
export function TicketVolumeChart({ data }) {
  const max = Math.max(...data.map(d => d.count));

  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => {
        const height = max > 0 ? (d.count / max) * 80 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-sm bg-secondary/60 hover:bg-secondary transition-colors"
              style={{ height: `${height}px` }}
              title={`${d.label}: ${d.count}`}
            />
            <span className="text-[9px] text-text-muted">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
