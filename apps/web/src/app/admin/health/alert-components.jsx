/* src/app/admin/health/alert-components.jsx */
import { useState } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit3,
  Copy,
  ToggleLeft,
  ToggleRight,
  Mail,
  MessageSquare,
  Radio,
  Globe,
  Phone,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Database,
  Zap,
  Layers,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  EyeOff,
  Filter,
  Search,
  MoreHorizontal,
  Pause,
  Play,
  RefreshCw,
  Settings,
  History,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { alertSeverityMeta, getAlertStatus, formatDuration } from './alert-data';

/* ─── Alert Status Badge ─── */
export function AlertStatusBadge({ status }) {
  const configs = {
    firing: {
      label: 'Firing',
      dot: 'bg-danger',
      class: 'bg-danger/10 text-danger border-danger/20',
      icon: BellRing,
    },
    ok: {
      label: 'OK',
      dot: 'bg-accent',
      class: 'bg-accent/10 text-accent border-accent/20',
      icon: CheckCircle2,
    },
    disabled: {
      label: 'Disabled',
      dot: 'bg-text-muted',
      class: 'bg-neutral/10 text-text-muted border-border',
      icon: BellOff,
    },
  };
  const config = configs[status] || configs.ok;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.class
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

/* ─── Alert Severity Badge ─── */
export function AlertSeverityBadge({ severity }) {
  const meta = alertSeverityMeta[severity] || alertSeverityMeta.info;
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

/* ─── Channel Badge ─── */
export function ChannelBadge({ channel }) {
  const icons = { email: Mail, slack: MessageSquare, pagerduty: Radio, webhook: Globe, sms: Phone };
  const Icon = icons[channel] || Globe;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary capitalize">
      <Icon className="h-3 w-3" />
      {channel}
    </span>
  );
}

/* ─── Alert Rule Card ─── */
export function AlertRuleCard({ rule, onToggle, onEdit, onDelete, onTest }) {
  const status = getAlertStatus(rule);
  const isFiring = status === 'firing';

  return (
    <div
      className={cn(
        'rounded-xl border bg-surface p-4 transition-all hover:shadow-md',
        isFiring
          ? 'border-danger/30 hover:border-danger/50'
          : 'border-border hover:border-secondary/30'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              isFiring ? 'bg-danger/10' : rule.enabled ? 'bg-accent/10' : 'bg-neutral/10'
            )}
          >
            <Bell
              className={cn(
                'h-4 w-4',
                isFiring ? 'text-danger' : rule.enabled ? 'text-accent' : 'text-text-muted'
              )}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{rule.name}</h3>
            <p className="text-[10px] text-text-muted">
              {rule.id} · {rule.metric}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <AlertStatusBadge status={status} />
        </div>
      </div>

      <p className="mt-2 text-xs text-text-secondary">{rule.description}</p>

      {/* Threshold */}
      <div className="mt-3 rounded-lg border border-border bg-background p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">Condition</span>
          <span className="text-xs font-mono font-medium text-text-primary">
            {rule.metric} {rule.condition} {rule.threshold}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-text-muted">Duration</span>
          <span className="text-xs font-mono text-text-secondary">
            {formatDuration(rule.duration)}
          </span>
        </div>
      </div>

      {/* Channels & Meta */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {rule.channels.map((ch) => (
            <ChannelBadge key={ch} channel={ch} />
          ))}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          <span>{rule.triggerCount} triggers</span>
          {rule.lastTriggered && <span>· Last: {rule.lastTriggered}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
        <button
          onClick={() => onToggle(rule.id)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
            rule.enabled
              ? 'text-accent hover:bg-accent/10'
              : 'text-text-muted hover:bg-surface-elevated'
          )}
        >
          {rule.enabled ? (
            <ToggleRight className="h-3.5 w-3.5" />
          ) : (
            <ToggleLeft className="h-3.5 w-3.5" />
          )}
          {rule.enabled ? 'Enabled' : 'Disabled'}
        </button>
        <button
          onClick={() => onTest(rule.id)}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-secondary hover:bg-secondary/10 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Test
        </button>
        <button
          onClick={() => onEdit(rule)}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
        >
          <Edit3 className="h-3.5 w-3.5" /> Edit
        </button>
        <button
          onClick={() => onDelete(rule.id)}
          className="ml-auto flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Alert History Row ─── */
export function AlertHistoryRow({ entry, expanded, onToggle, onAcknowledge }) {
  const meta = alertSeverityMeta[entry.severity] || alertSeverityMeta.info;
  const isOpen = entry.resolvedAt === null;

  return (
    <>
      <tr
        className={cn(
          'hover:bg-background/50 transition-colors cursor-pointer',
          isOpen && 'bg-danger/5'
        )}
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button className="text-text-muted hover:text-text-primary">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <span className="font-mono text-xs text-text-muted">{entry.id}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <AlertSeverityBadge severity={entry.severity} />
        </td>
        <td className="px-4 py-3 text-sm font-medium text-text-primary">{entry.ruleName}</td>
        <td className="px-4 py-3">
          <p className="text-sm text-text-primary truncate max-w-[250px]">{entry.message}</p>
        </td>
        <td className="px-4 py-3 text-text-secondary text-xs">{entry.triggeredAt}</td>
        <td className="px-4 py-3">
          {entry.resolvedAt ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
              <CheckCircle2 className="h-3 w-3" /> Resolved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 border border-danger/20 px-2 py-0.5 text-xs font-medium text-danger">
              <BellRing className="h-3 w-3" /> Firing
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          {entry.acknowledgedBy ? (
            <span className="text-xs text-text-secondary">{entry.acknowledgedBy}</span>
          ) : isOpen ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAcknowledge(entry.id);
              }}
              className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-white hover:bg-secondary/90"
            >
              Ack
            </button>
          ) : (
            <span className="text-xs text-text-muted">—</span>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="px-4 py-4 bg-background/50">
            <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-text-muted">Value</p>
                  <p className="font-mono font-medium text-text-primary">{entry.value}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Threshold</p>
                  <p className="font-mono font-medium text-text-primary">{entry.threshold}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Duration</p>
                  <p className="font-mono text-text-secondary">
                    {entry.resolvedAt ? `${entry.resolvedAt} (resolved)` : 'Ongoing'}
                  </p>
                </div>
              </div>
              {entry.acknowledgedBy && (
                <div className="rounded-md bg-secondary/5 border border-secondary/20 p-2">
                  <p className="text-xs text-secondary">
                    Acknowledged by <strong>{entry.acknowledgedBy}</strong> at{' '}
                    {entry.acknowledgedAt}
                  </p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── Channel Config Card ─── */
export function ChannelConfigCard({ channel, onConfigure }) {
  const icons = { email: Mail, slack: MessageSquare, pagerduty: Radio, webhook: Globe, sms: Phone };
  const Icon = icons[channel.id] || Globe;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all',
        channel.configured
          ? 'border-border bg-surface'
          : 'border-dashed border-border bg-background/50'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              channel.configured ? 'bg-secondary/10' : 'bg-neutral/10'
            )}
          >
            <Icon
              className={cn('h-4 w-4', channel.configured ? 'text-secondary' : 'text-text-muted')}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{channel.label}</h3>
            <p className="text-[10px] text-text-muted">
              {channel.configured ? channel.target : 'Not configured'}
            </p>
          </div>
        </div>
        <button
          onClick={() => onConfigure(channel)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            channel.configured
              ? 'text-text-secondary hover:bg-surface-elevated border border-border'
              : 'bg-secondary text-white hover:bg-secondary/90'
          )}
        >
          {channel.configured ? 'Edit' : 'Configure'}
        </button>
      </div>
    </div>
  );
}

/* ─── Alert Stats Card ─── */
export function AlertStatCard({ label, value, subtext, icon: Icon, color, trend }) {
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
              {trend}% vs last week
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
