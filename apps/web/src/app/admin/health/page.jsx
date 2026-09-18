'use client';

import { useApiFetch } from '@/hooks/useApiFetch';
import { fetchSystemHealth, fetchServiceMetrics } from '@/api/health';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Server,
  Database,
  Mail,
  FileText,
} from 'lucide-react';

const SERVICE_ICONS = {
  'API Server': Server,
  Database: Database,
  'Redis / Job Queue': Database,
  'Email Worker': Mail,
  'PDF Worker': FileText,
};

const STATUS_CONFIG = {
  operational: { icon: CheckCircle2, color: 'text-green-600', badge: 'default' },
  degraded: { icon: AlertTriangle, color: 'text-yellow-600', badge: 'secondary' },
  critical: { icon: XCircle, color: 'text-red-600', badge: 'destructive' },
};

export default function HealthPage() {
  const { data: health, loading, error, refetch } = useApiFetch(fetchSystemHealth, []);

  const { data: metrics } = useApiFetch(fetchServiceMetrics, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <LoadingSkeleton count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (!health) {
    return (
      <div className="container mx-auto p-6">
        <EmptyState
          title="No health data"
          description="System health information is not available."
          actionLabel="Refresh"
          onAction={refetch}
        />
      </div>
    );
  }

  const overallStatus = health.status || 'healthy';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            System Health
          </h1>
          <p className="text-muted-foreground mt-1">Monitor platform services and performance</p>
        </div>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card
        className={
          overallStatus === 'healthy'
            ? 'border-green-200 bg-green-50'
            : overallStatus === 'degraded'
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-red-200 bg-red-50'
        }
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {overallStatus === 'healthy' && <CheckCircle2 className="h-12 w-12 text-green-600" />}
              {overallStatus === 'degraded' && (
                <AlertTriangle className="h-12 w-12 text-yellow-600" />
              )}
              {overallStatus === 'critical' && <XCircle className="h-12 w-12 text-red-600" />}
              <div>
                <h2 className="text-2xl font-bold capitalize">{overallStatus}</h2>
                <p className="text-muted-foreground">
                  All systems{' '}
                  {overallStatus === 'healthy' ? 'operating normally' : 'experiencing issues'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Uptime</p>
              <p className="text-2xl font-bold">{health.uptime}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {health.services?.map((service) => {
          const Icon = SERVICE_ICONS[service.name] || Server;
          const statusConfig = STATUS_CONFIG[service.status] || STATUS_CONFIG.operational;
          const StatusIcon = statusConfig.icon;

          return (
            <Card key={service.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {service.name}
                </CardTitle>
                <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant={statusConfig.badge}>{service.status}</Badge>
                  <span className="text-sm text-muted-foreground">{service.responseTime}</span>
                </div>
                {metrics?.[service.name] && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    {Object.entries(metrics[service.name]).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Last Incident</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {health.lastIncident || 'No recent incidents'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Environment</span>
              <span className="font-medium">{import.meta.env.MODE || 'development'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">0.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-medium">{new Date().toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
