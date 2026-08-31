/* src/app/admin/dashboard/SystemHealth.jsx */
import { Activity, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Link } from 'react-router-dom';

const statusConfig = {
  healthy: { icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20', label: 'All Systems Operational' },
  degraded: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', label: 'Degraded Performance' },
  critical: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', label: 'Critical Issues Detected' },
};

const serviceStatusConfig = {
  operational: { dot: 'bg-accent', label: 'Operational' },
  degraded: { dot: 'bg-warning', label: 'Degraded' },
  critical: { dot: 'bg-danger', label: 'Critical' },
};

export default function SystemHealth({ data }) {
  const config = statusConfig[data.status] || statusConfig.healthy;
  const StatusIcon = config.icon;
  const degradedCount = data.services.filter(s => s.status !== 'operational').length;

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">System Health</h3>
        </div>
        <Link
          to="/admin/health"
          className="inline-flex items-center gap-1 text-xs text-secondary hover:underline"
        >
          View Details <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Status Banner */}
      <div className={cn('mx-5 mt-4 rounded-lg border p-3 flex items-center gap-3', config.bg, config.border)}>
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-full bg-background', config.color)}>
          <StatusIcon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className={cn('text-sm font-semibold', config.color)}>{config.label}</p>
          <p className="text-xs text-text-muted">
            Uptime: {data.uptime} · Last incident: {data.lastIncident}
          </p>
        </div>
        {degradedCount > 0 && (
          <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
            {degradedCount} issue{degradedCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Services List */}
      <div className="p-5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {data.services.map((service) => {
            const svcConfig = serviceStatusConfig[service.status] || serviceStatusConfig.operational;
            return (
              <div
                key={service.name}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className={cn('h-2 w-2 rounded-full', svcConfig.dot)} />
                  <span className="text-sm text-text-primary">{service.name}</span>
                </div>
                <span className="text-xs font-mono text-text-muted">{service.latency}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
