// apps/web/src/app/admin/audit/components.jsx
import { useState } from 'react';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Dialog as Drawer,
  DialogContent as DrawerContent,
  DialogHeader as DrawerHeader,
  DialogTitle as DrawerTitle,
  DialogDescription as DrawerDescription,
  DialogFooter as DrawerFooter,
} from '../../../components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Clock,
  Target,
  AlertTriangle,
  Info,
  CheckCircle,
} from 'lucide-react';

const severityConfig = {
  critical: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
  high: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
  medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Info },
  low: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Info },
  info: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: CheckCircle },
};

export function AuditStatsCards({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: 'Total Events',
      value: stats.totalEvents?.toLocaleString() || '0',
      sub: `${stats.eventsToday || 0} today`,
    },
    {
      label: 'Critical Events',
      value: stats.criticalCount?.toLocaleString() || '0',
      sub: `${stats.highCount || 0} high severity`,
    },
    {
      label: 'This Week',
      value: stats.eventsThisWeek?.toLocaleString() || '0',
      sub: 'Last 7 days',
    },
    { label: 'Success Rate', value: `${stats.successRate || 100}%`, sub: 'Audit coverage' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-4">
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="text-2xl font-bold mt-1">{card.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
        </Card>
      ))}
    </div>
  );
}

export function AuditLogTable({ logs, loading, meta, onPageChange, onRowClick }) {
  if (loading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-8 w-full mb-4" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full mb-2" />
        ))}
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No audit logs found matching your filters
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => {
              const severity = severityConfig[log.severity] || severityConfig.info;
              const SeverityIcon = severity.icon;
              return (
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onRowClick(log)}
                >
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={severity.color}>
                      <SeverityIcon className="h-3 w-3 mr-1" />
                      {log.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{log.actor?.name || 'System'}</span>
                      <span className="text-xs text-muted-foreground">
                        ({log.actor?.role || 'system'})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {log.action?.label || log.action?.type}
                      </span>
                      <span className="text-xs text-muted-foreground">{log.action?.category}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{log.target?.name || log.target?.id}</span>
                      <span className="text-xs text-muted-foreground">({log.target?.type})</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.action?.description || log.metadata?.description || '-'}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.pageSize + 1} to{' '}
            {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total} entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(meta.page - 1)}
              disabled={meta.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {meta.page} of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(meta.page + 1)}
              disabled={meta.page >= meta.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export function AuditFilters({ filters, categories, actors, onChange, onClear }) {
  return null; // Filters are inline in the page now
}

export function AuditDetailDrawer({ log, open, onClose }) {
  if (!log) return null;

  const severity = severityConfig[log.severity] || severityConfig.info;
  const SeverityIcon = severity.icon;

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="max-w-2xl">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <SeverityIcon className={`h-5 w-5 ${severity.color.split(' ')[1]}`} />
            Audit Event Details
          </DrawerTitle>
          <DrawerDescription>
            {new Date(log.timestamp).toLocaleString()} · ID: {log.id}
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">Actor</label>
              <div className="mt-1 flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{log.actor?.name || 'System'}</p>
                  <p className="text-sm text-muted-foreground">
                    {log.actor?.role || 'system'} · {log.actor?.ip || 'internal'}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">
                Severity
              </label>
              <div className="mt-1">
                <Badge variant="outline" className={severity.color}>
                  {log.severity}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase">Action</label>
            <div className="mt-1 p-3 bg-muted rounded-lg">
              <p className="font-medium">{log.action?.label || log.action?.type}</p>
              <p className="text-sm text-muted-foreground mt-1">{log.action?.description}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">{log.action?.type}</Badge>
                <Badge variant="secondary">{log.action?.category}</Badge>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase">Target</label>
            <div className="mt-1 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{log.target?.name || log.target?.id}</p>
                  <p className="text-sm text-muted-foreground">Type: {log.target?.type}</p>
                  {log.target?.tenantId && (
                    <p className="text-sm text-muted-foreground">Tenant: {log.target.tenantId}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">
                Metadata
              </label>
              <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-64">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
