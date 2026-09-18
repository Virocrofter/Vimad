'use client';

import { useState } from 'react';
import { useApiFetch } from '@/hooks/useApiFetch';
import { fetchSlowQueries, fetchQueryStats, fetchEndpointPerformance } from '@/api/profiler';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Gauge, Search, Clock, Database, AlertTriangle, TrendingUp } from 'lucide-react';

export default function ProfilerPage() {
  const [timeRange, setTimeRange] = useState('1h');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: slowQueries,
    loading: queriesLoading,
    error: queriesError,
    refetch: refetchQueries,
  } = useApiFetch(
    () => fetchSlowQueries({ range: timeRange, search: searchQuery }),
    [timeRange, searchQuery]
  );

  const { data: queryStats } = useApiFetch(fetchQueryStats, [timeRange]);

  const { data: endpointPerformance } = useApiFetch(
    () => fetchEndpointPerformance({ range: timeRange }),
    [timeRange]
  );

  if (queriesError) {
    return (
      <div className="container mx-auto p-6">
        <ErrorState error={queriesError} onRetry={refetchQueries} />
      </div>
    );
  }

  const getDurationColor = (duration) => {
    if (duration > 1000) return 'text-red-600';
    if (duration > 500) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gauge className="h-8 w-8" />
            Query Profiler
          </h1>
          <p className="text-muted-foreground mt-1">Monitor database queries and API performance</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15m">Last 15m</SelectItem>
            <SelectItem value="1h">Last 1h</SelectItem>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7d</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      {queryStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Queries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{queryStats.totalQueries?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {queryStats.queriesPerSecond} queries/sec
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{queryStats.avgDuration}ms</div>
              <p className="text-xs text-muted-foreground mt-1">{queryStats.p95Duration}ms p95</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Slow Queries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {queryStats.slowQueries?.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">&gt; 500ms</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {queryStats.errors?.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{queryStats.errorRate}% rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search queries by table, operation, or query text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Slow Queries Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Slow Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queriesLoading ? (
              <LoadingSkeleton count={5} />
            ) : slowQueries?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slowQueries.map((query, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="max-w-md">
                        <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
                          {query.query}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getDurationColor(query.duration)}`}>
                          {query.duration}ms
                        </span>
                      </TableCell>
                      <TableCell>{query.rows?.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(query.timestamp).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                title="No slow queries found"
                description="Great! No queries exceeded the 500ms threshold."
              />
            )}
          </CardContent>
        </Card>

        {/* Endpoint Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Endpoint Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {endpointPerformance?.length > 0 ? (
              <div className="space-y-4">
                {endpointPerformance.map((endpoint) => (
                  <div key={endpoint.path} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {endpoint.method} {endpoint.path}
                      </code>
                      <span className="font-medium">{endpoint.avgDuration}ms</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          endpoint.avgDuration > 500
                            ? 'bg-red-500'
                            : endpoint.avgDuration > 200
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min((endpoint.avgDuration / 1000) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{endpoint.requestCount} requests</span>
                      <span>{endpoint.errorRate}% errors</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No endpoint data"
                description="Performance metrics will appear here."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
