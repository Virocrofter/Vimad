/* src/app/admin/dashboard/RecentAlerts.jsx */
import { useState } from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle2, X, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { timeAgo } from './data';

const severityConfig = {
  critical: { icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', label: 'Critical' },
  error: { icon: AlertCircle, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', label: 'Error' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', label: 'Warning' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10', border: 'border-info/20', label: 'Info' },
};

export default function RecentAlerts({ alerts: initialAlerts }) {
  const [alerts, setAlerts] = useState(initialAlerts);

  const toggleAcknowledge = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: !a.acknowledged } : a));
  };

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">Recent Alerts</h3>
          {unacknowledgedCount > 0 && (
            <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unacknowledgedCount}
            </span>
          )}
        </div>
        <span className="text-xs text-text-muted">{alerts.length} total</span>
      </div>

      {/* Alerts List */}
      <div className="max-h-[420px] overflow-y-auto">
        {alerts.map((alert) => {
          const config = severityConfig[alert.severity] || severityConfig.info;
          const SeverityIcon = config.icon;

          return (
            <div
              key={alert.id}
              className={cn(
                'border-b border-border px-5 py-3.5 transition-colors hover:bg-background/50',
                alert.acknowledged && 'opacity-60'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', config.bg)}>
                  <SeverityIcon className={cn('h-3.5 w-3.5', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('text-sm font-medium', alert.acknowledged ? 'text-text-secondary' : 'text-text-primary')}>
                      {alert.title}
                    </p>
                    <button
                      onClick={() => toggleAcknowledge(alert.id)}
                      className="shrink-0 text-text-muted hover:text-text-secondary transition-colors"
                      title={alert.acknowledged ? 'Mark unread' : 'Mark read'}
                    >
                      {alert.acknowledged ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">{alert.message}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-text-muted">
                    <span className="font-mono">{alert.service}</span>
                    <span>·</span>
                    <span>{timeAgo(alert.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
