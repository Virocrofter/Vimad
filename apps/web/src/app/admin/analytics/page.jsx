'use client';

import { useState } from 'react';
import { useApiFetch } from '@/hooks/useApiFetch';
import { fetchAnalyticsOverview, fetchAnalyticsTimeseries } from '@/api/analytics';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Users, Building2, DollarSign } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');

  const {
    data: overview,
    loading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useApiFetch(() => fetchAnalyticsOverview({ range: timeRange }), [timeRange]);

  const { data: timeseries, loading: timeseriesLoading } = useApiFetch(
    () => fetchAnalyticsTimeseries({ range: timeRange }),
    [timeRange]
  );

  if (overviewError) {
    return (
      <div className="container mx-auto p-6">
        <ErrorState error={overviewError} onRetry={refetchOverview} />
      </div>
    );
  }

  const metrics = [
    {
      title: 'Total Revenue',
      value: `$${(overview?.totalRevenue || 0).toLocaleString()}`,
      change: overview?.revenueChange || 0,
      icon: DollarSign,
    },
    {
      title: 'Active Tenants',
      value: overview?.activeTenants || 0,
      change: overview?.tenantChange || 0,
      icon: Building2,
    },
    {
      title: 'Total Users',
      value: overview?.totalUsers || 0,
      change: overview?.userChange || 0,
      icon: Users,
    },
    {
      title: 'Avg. Revenue per Tenant',
      value: `$${(overview?.avgRevenuePerTenant || 0).toFixed(2)}`,
      change: overview?.avgRevenueChange || 0,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Platform performance and usage metrics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metrics Cards */}
      {overviewLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p
                    className={`text-xs mt-1 ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {metric.change >= 0 ? '+' : ''}
                    {metric.change}% from previous period
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Timeseries */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {timeseriesLoading ? (
              <LoadingSkeleton count={1} />
            ) : timeseries && timeseries.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeseries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value) => [`$${value}`, 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="No data available"
                description="Revenue data will appear here once available."
              />
            )}
          </CardContent>
        </Card>

        {/* Tenant Signups */}
        <Card>
          <CardHeader>
            <CardTitle>Tenant Signups</CardTitle>
          </CardHeader>
          <CardContent>
            {timeseriesLoading ? (
              <LoadingSkeleton count={1} />
            ) : timeseries && timeseries.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={timeseries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString()} />
                  <Bar dataKey="newTenants" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="No data available"
                description="Signup data will appear here once available."
              />
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <LoadingSkeleton count={1} />
            ) : overview?.planDistribution && overview.planDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={overview.planDistribution}
                    dataKey="count"
                    nameKey="plan"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.plan}: ${entry.count}`}
                  >
                    {overview.planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="No data available"
                description="Plan distribution will appear here once available."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage */}
      {overview?.featureUsage && overview.featureUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overview.featureUsage.map((feature) => (
                <div key={feature.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{feature.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {feature.usageCount} uses ({feature.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${feature.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
