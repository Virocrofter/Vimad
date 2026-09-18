/* src/app/guest-portal/status/page.jsx */
import { useState, useMemo } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  XCircle,
  Clock,
  RefreshCw,
  Wifi,
  WifiOff,
  Server,
  Shield,
  Globe,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Bell,
  BellOff,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  ArrowRight,
  Coffee,
  Dumbbell,
  Waves,
  Car,
  Briefcase,
  ConciergeBell,
  UtensilsCrossed,
  Sparkles,
  BedDouble,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { serviceStatuses, serviceStatusMeta, guestAnnouncements, formatDateTime } from '../data';
import { GuestAnnouncementCard, ServiceStatusCard, EmptyState } from '../components';

const serviceIcons = {
  'Front Desk': BedDouble,
  'Room Service': UtensilsCrossed,
  'Spa & Wellness': Sparkles,
  'Fitness Center': Dumbbell,
  'Rooftop Pool': Waves,
  'Business Center': Briefcase,
  'Valet Parking': Car,
  Concierge: ConciergeBell,
};

export default function StatusPage() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [expandedService, setExpandedService] = useState(null);
  const [filter, setFilter] = useState('all');
  const [subscribed, setSubscribed] = useState(false);

  const handleRefresh = () => setLastRefresh(new Date());

  const stats = useMemo(() => {
    const total = serviceStatuses.length;
    const operational = serviceStatuses.filter((s) => s.status === 'operational').length;
    const degraded = serviceStatuses.filter((s) => s.status === 'degraded').length;
    const maintenance = serviceStatuses.filter((s) => s.status === 'maintenance').length;
    const unavailable = serviceStatuses.filter((s) => s.status === 'unavailable').length;
    const healthScore = Math.round((operational / total) * 100);
    return { total, operational, degraded, maintenance, unavailable, healthScore };
  }, []);

  const filteredServices = useMemo(() => {
    if (filter === 'all') return serviceStatuses;
    return serviceStatuses.filter((s) => s.status === filter);
  }, [filter]);

  const activeAnnouncements = guestAnnouncements.filter(
    (a) => a.status === 'published' && new Date(a.expiresAt) > new Date()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Service Status</h1>
          <p className="text-sm text-text-secondary">
            Real-time status of hotel services and amenities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSubscribed(!subscribed)}
            className={subscribed ? 'border-accent text-accent' : ''}
          >
            {subscribed ? (
              <BellOff className="mr-1.5 h-4 w-4" />
            ) : (
              <Bell className="mr-1.5 h-4 w-4" />
            )}
            {subscribed ? 'Subscribed' : 'Subscribe'}
          </Button>
        </div>
      </div>

      {/* Overall Health */}
      <div
        className={cn(
          'rounded-xl border p-5 flex items-center gap-4',
          stats.healthScore >= 90
            ? 'border-accent/20 bg-accent/5'
            : stats.healthScore >= 70
              ? 'border-warning/20 bg-warning/5'
              : 'border-danger/20 bg-danger/5'
        )}
      >
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-full',
            stats.healthScore >= 90
              ? 'bg-accent/10'
              : stats.healthScore >= 70
                ? 'bg-warning/10'
                : 'bg-danger/10'
          )}
        >
          {stats.healthScore >= 90 ? (
            <CheckCircle2 className="h-7 w-7 text-accent" />
          ) : stats.healthScore >= 70 ? (
            <AlertTriangle className="h-7 w-7 text-warning" />
          ) : (
            <XCircle className="h-7 w-7 text-danger" />
          )}
        </div>
        <div className="flex-1">
          <p
            className={cn(
              'text-lg font-bold',
              stats.healthScore >= 90
                ? 'text-accent'
                : stats.healthScore >= 70
                  ? 'text-warning'
                  : 'text-danger'
            )}
          >
            {stats.healthScore >= 90
              ? 'All Systems Operational'
              : stats.healthScore >= 70
                ? 'Some Services Affected'
                : 'Service Disruptions Detected'}
          </p>
          <p className="text-xs text-text-secondary">
            {stats.operational} of {stats.total} services operational
            {stats.degraded > 0 && ` · ${stats.degraded} degraded`}
            {stats.maintenance > 0 && ` · ${stats.maintenance} under maintenance`}
          </p>
        </div>
        <div className="hidden sm:block text-right">
          <p
            className={cn(
              'text-3xl font-bold font-mono',
              stats.healthScore >= 90
                ? 'text-accent'
                : stats.healthScore >= 70
                  ? 'text-warning'
                  : 'text-danger'
            )}
          >
            {stats.healthScore}%
          </p>
          <p className="text-[10px] text-text-muted">Health Score</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <CheckCircle2 className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-text-primary">{stats.operational}</p>
              <p className="text-[10px] text-text-muted">Operational</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-text-primary">{stats.degraded}</p>
              <p className="text-[10px] text-text-muted">Degraded</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10">
              <Wrench className="h-4 w-4 text-info" />
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-text-primary">{stats.maintenance}</p>
              <p className="text-[10px] text-text-muted">Maintenance</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/10">
              <XCircle className="h-4 w-4 text-danger" />
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-text-primary">{stats.unavailable}</p>
              <p className="text-[10px] text-text-muted">Unavailable</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Services', count: stats.total },
          { id: 'operational', label: 'Operational', count: stats.operational },
          { id: 'degraded', label: 'Degraded', count: stats.degraded },
          { id: 'maintenance', label: 'Maintenance', count: stats.maintenance },
          { id: 'unavailable', label: 'Unavailable', count: stats.unavailable },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
              filter === tab.id
                ? 'border-secondary bg-secondary/10 text-secondary'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
            )}
          >
            {tab.label}
            <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] text-text-muted">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filteredServices.map((service) => {
          const Icon = serviceIcons[service.name] || Server;
          const meta = serviceStatusMeta[service.status];
          const isExpanded = expandedService === service.id;

          return (
            <div
              key={service.id}
              className={cn(
                'rounded-xl border bg-surface p-4 transition-all cursor-pointer',
                service.status === 'operational'
                  ? 'border-border'
                  : service.status === 'degraded'
                    ? 'border-warning/30'
                    : service.status === 'maintenance'
                      ? 'border-info/30'
                      : 'border-danger/30',
                isExpanded && 'shadow-md'
              )}
              onClick={() => setExpandedService(isExpanded ? null : service.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      meta.color
                        .replace('text-', 'bg-')
                        .replace('danger', 'bg-danger/10')
                        .replace('accent', 'bg-accent/10')
                        .replace('warning', 'bg-warning/10')
                        .replace('info', 'bg-info/10')
                    )}
                  >
                    <Icon className={cn('h-5 w-5', meta.color)} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{service.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                          meta.color
                            .replace('text-', 'bg-')
                            .replace('danger', 'bg-danger/10')
                            .replace('accent', 'bg-accent/10')
                            .replace('warning', 'bg-warning/10')
                            .replace('info', 'bg-info/10'),
                          meta.color,
                          meta.color
                            .replace('text-', 'border-')
                            .replace('danger', 'border-danger/20')
                            .replace('accent', 'border-accent/20')
                            .replace('warning', 'border-warning/20')
                            .replace('info', 'border-info/20')
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                        {meta.label}
                      </span>
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-text-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-muted" />
                )}
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <p className="text-xs text-text-secondary">{service.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Last checked: Just now
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" /> Uptime: 99.9%
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Announcements Section */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Info className="h-5 w-5 text-secondary" /> Announcements
          </h2>
          <a
            href="/guest-portal/status/announcements"
            className="text-xs text-secondary hover:underline inline-flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </a>
        </div>

        {activeAnnouncements.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {activeAnnouncements.map((ann) => (
              <GuestAnnouncementCard key={ann.id} announcement={ann} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Info}
            title="No active announcements"
            description="All services are running normally. Check back for updates."
          />
        )}
      </div>

      {/* Footer */}
      <div className="rounded-lg border border-border bg-surface p-4 text-center">
        <p className="text-xs text-text-muted">
          <Shield className="h-3 w-3 inline mr-1" />
          Status updates are monitored in real-time. Subscribe to get notified of changes.
        </p>
        <p className="text-[10px] text-text-muted mt-1">
          Data refreshed every 60 seconds · Powered by Vimad PMS
        </p>
      </div>
    </div>
  );
}
