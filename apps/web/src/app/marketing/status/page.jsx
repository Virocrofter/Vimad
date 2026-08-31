import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  Wifi,
  Database,
  Cloud,
  Server,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

const services = [
  { name: 'API & Core Platform', icon: Cloud, status: 'operational', uptime: '99.99%' },
  { name: 'Dashboard & Web App', icon: Activity, status: 'operational', uptime: '99.98%' },
  { name: 'Booking Engine', icon: Wifi, status: 'operational', uptime: '99.97%' },
  { name: 'Channel Manager', icon: Server, status: 'operational', uptime: '99.95%' },
  { name: 'Payment Processing', icon: Database, status: 'operational', uptime: '99.99%' },
  { name: 'Guest Portal', icon: CheckCircle, status: 'operational', uptime: '99.96%' },
];

const incidents = [
  {
    id: 1,
    date: '2026-08-10',
    title: 'Degraded Channel Manager Sync',
    status: 'resolved',
    duration: '12 min',
    description:
      'Slower than normal sync speeds with Booking.com and Expedia. Root cause: rate limit threshold adjustment.',
  },
  {
    id: 2,
    date: '2026-07-28',
    title: 'Scheduled Maintenance',
    status: 'resolved',
    duration: '45 min',
    description:
      'Database cluster upgrade to PostgreSQL 16. No data loss. Maintenance window: 02:00-02:45 UTC.',
  },
  {
    id: 3,
    date: '2026-07-15',
    title: 'API Latency Spike',
    status: 'resolved',
    duration: '8 min',
    description: 'Elevated p99 latency on reservation endpoints. Auto-scaling resolved the issue.',
  },
];

export default function StatusPage() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const allOperational = services.every((s) => s.status === 'operational');

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
            <Activity className="h-6 w-6 text-accent" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-text-primary">System Status</h1>
          <p className="mt-2 text-sm text-text-muted">
            Last updated: {now.toLocaleTimeString()} · Real-time monitoring across all regions
          </p>
        </div>

        {/* Overall Status */}
        <div
          className={cn(
            'mb-8 flex items-center justify-center gap-3 rounded-xl border p-6',
            allOperational ? 'border-accent/20 bg-accent/5' : 'border-warning/20 bg-warning/5'
          )}
        >
          <div
            className={cn(
              'h-3 w-3 animate-pulse rounded-full',
              allOperational ? 'bg-accent' : 'bg-warning'
            )}
          />
          <span
            className={cn('text-lg font-semibold', allOperational ? 'text-accent' : 'text-warning')}
          >
            {allOperational ? 'All Systems Operational' : 'Partial Service Disruption'}
          </span>
        </div>

        {/* Services Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-center gap-3">
                <service.icon className="h-5 w-5 text-text-muted" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{service.name}</p>
                  <p className="text-xs text-text-muted">{service.uptime} uptime (30d)</p>
                </div>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  service.status === 'operational'
                    ? 'bg-accent/10 text-accent'
                    : 'bg-warning/10 text-warning'
                )}
              >
                {service.status === 'operational' ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
                {service.status === 'operational' ? 'Operational' : 'Degraded'}
              </span>
            </div>
          ))}
        </div>

        {/* Incident History */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-text-primary">Recent Incidents</h2>
          <div className="mt-4 space-y-3">
            {incidents.map((incident) => (
              <div key={incident.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-text-muted" />
                    <span className="text-sm font-medium text-text-primary">{incident.title}</span>
                  </div>
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    {incident.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {incident.date} · Duration: {incident.duration}
                </p>
                <p className="mt-2 text-sm text-text-secondary">{incident.description}</p>
              </div>
            ))}
          </div>
          {incidents.length === 0 && (
            <p className="py-8 text-center text-sm text-text-muted">
              No incidents reported in the last 90 days.
            </p>
          )}
        </div>

        {/* Subscribe */}
        <div className="mt-10 rounded-xl border border-border bg-surface p-6 text-center">
          <h3 className="font-semibold text-text-primary">Subscribe to Status Updates</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Get notified via email or Slack when incidents occur.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button className="inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium text-white hover:bg-secondary/90">
              Email Alerts
            </button>
            <button className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-text-primary hover:bg-surface-elevated">
              Slack Integration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
