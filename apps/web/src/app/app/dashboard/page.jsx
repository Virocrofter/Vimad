import { useState } from 'react';
import { TrendingUp, Users, BedDouble, DollarSign, Bell, X, Plus, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../../lib/utils';

const kpis = [
  { label: 'Occupancy', value: '78%', change: '+5.2%', icon: BedDouble, color: 'text-accent' },
  { label: 'ADR', value: '$189', change: '+3.1%', icon: DollarSign, color: 'text-secondary' },
  { label: 'RevPAR', value: '$147', change: '+8.4%', icon: TrendingUp, color: 'text-info' },
  { label: 'Guests Today', value: '142', change: '+12', icon: Users, color: 'text-warning' },
];

const activities = [
  { action: 'Check-in', guest: 'John Smith', room: '204', time: '10:30 AM' },
  { action: 'Check-out', guest: 'Sarah Johnson', room: '312', time: '9:15 AM' },
  { action: 'New Reservation', guest: 'Michael Brown', room: '105', time: '8:45 AM' },
  { action: 'Payment', guest: 'Emily Davis', room: '401', time: 'Yesterday' },
];

const initialAlerts = [
  { id: 1, severity: 'danger', title: 'Room 103 — Dirty', message: 'Housekeeping flagged as dirty, guest arriving at 2 PM', time: '5 min ago' },
  { id: 2, severity: 'warning', title: '3 Arrivals Pending', message: 'Rooms 105, 204, 310 not yet assigned', time: '12 min ago' },
  { id: 3, severity: 'info', title: 'Night Audit Ready', message: 'All charges posted. Ready to roll date.', time: '1 hr ago' },
  { id: 4, severity: 'success', title: 'Backup Complete', message: 'Incremental backup finished successfully', time: '2 hrs ago' },
  { id: 5, severity: 'warning', title: 'Low Inventory — Suites', message: 'Only 2 suites available for Aug 14-16', time: '3 hrs ago' },
];

const severityMeta = {
  danger: { icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', dot: 'bg-danger' },
  warning: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', dot: 'bg-warning' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10', border: 'border-info/20', dot: 'bg-info' },
  success: { icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20', dot: 'bg-accent' },
};

const quickActions = [
  { label: 'New Reservation', icon: BedDouble },
  { label: 'Walk-In', icon: Users },
  { label: 'Post Charge', icon: DollarSign },
  { label: 'Night Audit', icon: TrendingUp },
];

export default function AppDashboard() {
  const [alertsOpen, setAlertsOpen] = useState(true);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [fabOpen, setFabOpen] = useState(false);

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Command Center</h2>
        <p className="text-text-secondary">Overview of your property performance</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-border bg-surface p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">{kpi.label}</p>
                    <p className="mt-2 text-3xl font-bold text-text-primary">{kpi.value}</p>
                    <p className="mt-1 text-sm text-accent">{kpi.change}</p>
                  </div>
                  <div className="rounded-lg bg-surface-elevated p-3">
                    <kpi.icon className={cn("h-6 w-6", kpi.color)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
            <div className="mt-4 space-y-3">
              {activities.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{item.action}</p>
                    <p className="text-xs text-text-secondary">{item.guest} • Room {item.room}</p>
                  </div>
                  <span className="text-xs text-text-muted">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alert Panel */}
        <div className={cn(
          'rounded-xl border border-border bg-surface overflow-hidden transition-all duration-300',
          alertsOpen ? 'opacity-100' : 'opacity-90'
        )}>
          <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-secondary" />
              <h3 className="text-sm font-semibold text-text-primary">Alerts</h3>
              {alerts.length > 0 && (
                <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {alerts.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setAlertsOpen(!alertsOpen)}
              className="rounded-md p-1 text-text-muted hover:bg-surface-elevated hover:text-text-primary"
            >
              {alertsOpen ? <X className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </button>
          </div>

          {alertsOpen && (
            <div className="max-h-[480px] overflow-auto">
              {alerts.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-accent mb-2" />
                  <p className="text-sm text-text-muted">All clear — no active alerts</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {alerts.map((alert) => {
                    const meta = severityMeta[alert.severity];
                    const Icon = meta.icon;
                    return (
                      <div key={alert.id} className={cn('relative px-4 py-3', meta.bg)}>
                        <div className="flex items-start gap-3">
                          <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', meta.color)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                              <p className="text-sm font-medium text-text-primary">{alert.title}</p>
                            </div>
                            <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">{alert.message}</p>
                            <p className="mt-1 text-[10px] text-text-muted">{alert.time}</p>
                          </div>
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="shrink-0 rounded-md p-1 text-text-muted hover:bg-background hover:text-text-primary"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {fabOpen && (
          <div className="flex flex-col items-end gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {quickActions.map((action) => (
              <button
                key={action.label}
                className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary shadow-lg hover:bg-surface-elevated transition-colors"
              >
                <action.icon className="h-4 w-4 text-secondary" />
                {action.label}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-200 hover:scale-105',
            fabOpen ? 'bg-danger rotate-45' : 'bg-secondary'
          )}
        >
          <Plus className="h-6 w-6 text-white" />
        </button>
      </div>
    </div>
  );
}