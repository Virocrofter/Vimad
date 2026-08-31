/* src/app/admin/dashboard/TenantActivity.jsx */
import {
  ArrowUpCircle,
  CalendarPlus,
  UserPlus,
  Shield,
  Tag,
  CreditCard,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Link } from 'react-router-dom';

const actionConfig = {
  upgrade: { icon: ArrowUpCircle, color: 'text-accent', bg: 'bg-accent/10', label: 'Upgrade' },
  booking: { icon: CalendarPlus, color: 'text-secondary', bg: 'bg-secondary/10', label: 'Booking' },
  user: { icon: UserPlus, color: 'text-info', bg: 'bg-info/10', label: 'User' },
  security: { icon: Shield, color: 'text-warning', bg: 'bg-warning/10', label: 'Security' },
  rate: { icon: Tag, color: 'text-secondary', bg: 'bg-secondary/10', label: 'Rate' },
  billing: { icon: CreditCard, color: 'text-danger', bg: 'bg-danger/10', label: 'Billing' },
  sync: { icon: RefreshCw, color: 'text-accent', bg: 'bg-accent/10', label: 'Sync' },
};

export default function TenantActivity({ activities }) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">Recent Tenant Activity</h3>
        </div>
        <Link
          to="/admin/audit"
          className="inline-flex items-center gap-1 text-xs text-secondary hover:underline"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Activity List */}
      <div className="max-h-[360px] overflow-y-auto">
        {activities.map((activity) => {
          const config = actionConfig[activity.type] || actionConfig.booking;
          const ActionIcon = config.icon;

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 border-b border-border px-5 py-3.5 transition-colors hover:bg-background/50"
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                  config.bg
                )}
              >
                <ActionIcon className={cn('h-4 w-4', config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {activity.tenant}
                  </p>
                  <span className="shrink-0 text-[10px] text-text-muted">{activity.time}</span>
                </div>
                <p className="text-xs text-text-secondary">
                  <span className="font-medium">{activity.action}</span>
                  {' · '}
                  {activity.detail}
                </p>
                <p className="mt-0.5 text-[10px] text-text-muted">by {activity.user}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
