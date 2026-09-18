// apps/web/src/app/admin/backups/page.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BackupTable, BackupStatsCards, ScheduleList } from './components';
import { RestoreModal } from './RestoreModal';
import { ScheduleModal } from './ScheduleModal';
import { TestRestoreModal } from './TestRestoreModal';
import {
  getBackups,
  getBackupSchedules,
  getBackupStats,
  createBackup,
  deleteBackup,
} from '../../../api/backups';
import { useToast } from '../../../hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Plus, RefreshCw, Download, Calendar, Trash2 } from 'lucide-react';

export default function BackupsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [backups, setBackups] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [testRestoreOpen, setTestRestoreOpen] = useState(false);

  const fetchBackups = useCallback(() => {
    return getBackups()
      .then((result) => {
        setBackups(result);
      })
      .catch((err) => {
        toast({
          title: 'Error',
          description: err.message || 'Failed to load backups',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [toast]);

  const fetchSchedules = useCallback(() => {
    return getBackupSchedules()
      .then((result) => {
        setSchedules(result);
      })
      .catch((err) => {
        toast({
          title: 'Error',
          description: err.message || 'Failed to load schedules',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setSchedulesLoading(false);
      });
  }, [toast]);

  const fetchStats = useCallback(() => {
    return getBackupStats()
      .then((result) => {
        setStats(result);
      })
      .catch((err) => {
        toast({
          title: 'Error',
          description: err.message || 'Failed to load backup stats',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setStatsLoading(false);
      });
  }, [toast]);

  useEffect(() => {
    fetchBackups();
    fetchSchedules();
    fetchStats();
  }, [fetchBackups, fetchSchedules, fetchStats]);

  const handleCreateBackup = async (type = 'full') => {
    setCreating(true);
    try {
      const result = await createBackup({
        name: `Manual ${type} backup - ${new Date().toISOString()}`,
        type,
      });
      toast({ title: 'Backup Started', description: `Backup ${result.name} is now running` });
      fetchBackups();
    } catch (err) {
      toast({
        title: 'Backup Failed',
        description: err.message || 'Failed to start backup',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBackup = async (id) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.'))
      return;
    try {
      await deleteBackup(id);
      toast({ title: 'Backup Deleted', description: 'The backup has been removed' });
      fetchBackups();
      fetchStats();
    } catch (err) {
      toast({
        title: 'Delete Failed',
        description: err.message || 'Failed to delete backup',
        variant: 'destructive',
      });
    }
  };

  const handleRestore = (backup) => {
    setSelectedBackup(backup);
    setRestoreOpen(true);
  };

  const handleTestRestore = (backup) => {
    setSelectedBackup(backup);
    setTestRestoreOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Backups</h1>
          <p className="text-muted-foreground mt-1">
            Manage database backups and restore operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              setSchedulesLoading(true);
              setStatsLoading(true);
              fetchBackups();
              fetchStats();
              fetchSchedules();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => handleCreateBackup('full')} disabled={creating}>
            <Plus className="h-4 w-4 mr-2" />
            {creating ? 'Creating...' : 'Full Backup'}
          </Button>
        </div>
      </div>

      <BackupStatsCards stats={stats} loading={statsLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BackupTable
            backups={backups}
            loading={loading}
            onDelete={handleDeleteBackup}
            onRestore={handleRestore}
            onTestRestore={handleTestRestore}
          />
        </div>
        <div>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Backup Schedules</h3>
              <Button variant="ghost" size="sm" onClick={() => setScheduleOpen(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </div>
            <ScheduleList
              schedules={schedules}
              loading={schedulesLoading}
              onUpdate={fetchSchedules}
            />
          </Card>
        </div>
      </div>

      <RestoreModal
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        backup={selectedBackup}
        onSuccess={fetchBackups}
      />

      <ScheduleModal
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        onSuccess={fetchSchedules}
      />

      <TestRestoreModal
        open={testRestoreOpen}
        onOpenChange={setTestRestoreOpen}
        backup={selectedBackup}
      />
    </div>
  );
}
