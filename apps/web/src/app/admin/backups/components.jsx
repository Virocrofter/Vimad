// apps/web/src/app/admin/backups/components.jsx
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
import { Progress } from '../../../components/ui/progress';
import {
  Clock,
  Database,
  HardDrive,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  TestTube,
  Trash2,
  Calendar,
} from 'lucide-react';

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  running: { color: 'bg-blue-100 text-blue-800', icon: Loader2 },
  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
  cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

const typeConfig = {
  full: { label: 'Full', color: 'bg-purple-100 text-purple-800' },
  incremental: { label: 'Incremental', color: 'bg-blue-100 text-blue-800' },
  differential: { label: 'Differential', color: 'bg-cyan-100 text-cyan-800' },
};

export function BackupStatsCards({ stats, loading }) {
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
      label: 'Total Backups',
      value: stats.totalBackups?.toLocaleString() || '0',
      sub: stats.lastBackupAt
        ? `Last: ${new Date(stats.lastBackupAt).toLocaleDateString()}`
        : 'No backups yet',
    },
    {
      label: 'Storage Used',
      value: stats.storageUsed || '0 GB',
      sub: `${stats.storageAvailable || '∞'} available`,
    },
    { label: 'Total Size', value: stats.totalSize || '0 GB', sub: 'Compressed' },
    { label: 'Success Rate', value: `${stats.successRate || 100}%`, sub: 'Last 30 days' },
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

export function BackupTable({ backups, loading, onDelete, onRestore, onTestRestore }) {
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
            <TableHead>Backup</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {backups.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No backups found. Create your first backup to get started.
              </TableCell>
            </TableRow>
          ) : (
            backups.map((backup) => {
              const status = statusConfig[backup.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const type = typeConfig[backup.type] || typeConfig.full;

              return (
                <TableRow key={backup.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{backup.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {backup.tables?.length || 0} tables
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={type.color}>
                      {type.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={status.color}>
                      <StatusIcon
                        className={`h-3 w-3 mr-1 ${backup.status === 'running' ? 'animate-spin' : ''}`}
                      />
                      {backup.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {backup.sizeFormatted || backup.sizeBytes?.toLocaleString() + ' bytes'}
                  </TableCell>
                  <TableCell>{backup.durationFormatted || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {new Date(backup.startedAt).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {backup.status === 'completed' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onTestRestore(backup)}
                            title="Test Restore"
                          >
                            <TestTube className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRestore(backup)}
                            title="Restore"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(backup.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

export function ScheduleList({ schedules, loading, onUpdate }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No scheduled backups</p>
        <p className="text-xs">Create a schedule to automate backups</p>
      </div>
    );
  }

  const frequencyLabels = {
    hourly: 'Every hour',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
  };

  return (
    <div className="space-y-3">
      {schedules.map((schedule) => (
        <div key={schedule.id} className="p-3 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{schedule.name}</span>
            </div>
            <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
              {schedule.enabled ? 'Active' : 'Paused'}
            </Badge>
          </div>
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            <p>
              {frequencyLabels[schedule.frequency] || schedule.frequency} · {schedule.type} backup
            </p>
            <p>Retention: {schedule.retentionDays} days</p>
            {schedule.nextRunAt && <p>Next run: {new Date(schedule.nextRunAt).toLocaleString()}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
