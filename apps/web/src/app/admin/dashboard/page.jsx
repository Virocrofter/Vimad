'use client';

import { useApiFetch } from '@/hooks/useApiFetch';
import {
  fetchAdminKpis,
  fetchSystemHealth,
  fetchAdminAlerts,
  fetchTenantActivity,
  fetchPlanDistribution,
  fetchQuickActions,
} from '@/api/dashboard';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const {
    data: kpis,
    loading: kpisLoading,
    error: kpisError,
    refetch: refetchKpis,
  } = useApiFetch(fetchAdminKpis, []);

  const { data: health, loading: healthLoading } = useApiFetch(fetchSystemHealth, []);

  const { data: alerts, loading: alertsLoading } = useApiFetch(fetchAdminAlerts, []);

  const { data: activity, loading: activityLoading } = useApiFetch(fetchTenantActivity, []);

  const { data: plans, loading: plansLoading } = useApiFetch(fetchPlanDistribution, []);

  const { data: quickActions } = useApiFetch(fetchQuickActions, []);

  if (kpisLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (kpisError) {
    return (
      <div className="container mx-auto p-6">
        <ErrorState error={kpisError} onRetry={refetchKpis} />
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total Tenants',
      value: kpis?.totalTenants?.value || 0,
      change: kpis?.totalTenants?.change || 0,
      icon: Building2,
      trend: kpis?.totalTenants?.trend || [],
    },
    {
      title: 'MRR',
      value: `$${(kpis?.mrr?.value || 0).toLocaleString()}`,
      change: kpis?.mrr?.change || 0,
      icon: DollarSign,
      trend: kpis?.mrr?.trend || [],
    },
    {
      title: 'Churn Rate',
      value: `${kpis?.churnRate?.value || 0}%`,
      change: kpis?.churnRate?.change || 0,
      icon: TrendingUp,
      trend: kpis?.churnRate?.trend || [],
    },
    {
      title: 'Active Users',
      value: kpis?.activeUsers?.value || 0,
      change: kpis?.activeUsers?.change || 0,
      icon: Users,
      trend: kpis?.activeUsers?.trend || [],
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview and key metrics</p>
        </div>
        <Button onClick={refetchKpis} variant="outline">
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          const isPositive = kpi.change > 0;
          const isNegative = kpi.change < 0;

          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center text-xs mt-1">
                  {isPositive && (
                    <span className="text-green-600 flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      {kpi.change}%
                    </span>
                  )}
                  {isNegative && (
                    <span className="text-red-600 flex items-center">
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                      {Math.abs(kpi.change)}%
                    </span>
                  )}
                  {!isPositive && !isNegative && (
                    <span className="text-muted-foreground">No change</span>
                  )}
                  <span className="text-muted-foreground ml-1">vs last month</span>
                </div>
                {/* Mini trend chart */}
                <div className="mt-3 flex items-end gap-1 h-8">
                  {kpi.trend.map((val, idx) => {
                    const max = Math.max(...kpi.trend, 1);
                    const height = (val / max) * 100;
                    return (
                      <div
                        key={idx}
                        className="flex-1 bg-primary/20 rounded-sm"
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <LoadingSkeleton count={3} />
            ) : health ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Status</span>
                  <Badge
                    variant={
                      health.status === 'healthy'
                        ? 'default'
                        : health.status === 'degraded'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {health.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {health.services?.map((service) => (
                    <div key={service.name} className="flex items-center justify-between text-sm">
                      <span>{service.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{service.responseTime}</span>
                        <Badge
                          variant={service.status === 'operational' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {service.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  Uptime: {health.uptime} | Last incident: {health.lastIncident}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <LoadingSkeleton count={3} />
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <Badge
                      variant={
                        alert.severity === 'critical'
                          ? 'destructive'
                          : alert.severity === 'error'
                            ? 'destructive'
                            : alert.severity === 'warning'
                              ? 'secondary'
                              : 'default'
                      }
                      className="mt-0.5"
                    >
                      {alert.severity}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.source} • {alert.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No recent alerts</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {plansLoading ? (
              <LoadingSkeleton count={3} />
            ) : plans && plans.length > 0 ? (
              <div className="space-y-4">
                {plans.map((plan) => (
                  <div key={plan.plan} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{plan.plan}</span>
                      <span className="text-muted-foreground">
                        {plan.count} tenants ({plan.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${plan.percentage}%`,
                          backgroundColor: plan.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No plan data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <LoadingSkeleton count={4} />
            ) : activity && activity.length > 0 ? (
              <div className="space-y-3">
                {activity.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-start gap-3 text-sm">
                    <Badge variant="outline" className="mt-0.5">
                      {item.type}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.tenant} • {item.detail}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {quickActions && quickActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              {quickActions.map((action) => (
                <Button key={action.id} variant="outline" className="h-auto flex-col py-4">
                  <span className="text-sm font-medium">{action.label}</span>
                  <span className="text-xs text-muted-foreground mt-1">{action.description}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
