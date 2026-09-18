// apps/web/src/app/admin/backups/ScheduleModal.jsx
import { useState } from 'react';
import { createBackupSchedule } from '../../../api/backups';
import { useToast } from '../../../hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select } from '../../../components/ui/select';
import { Checkbox } from '../../../components/ui/checkbox';
import { Loader2, Calendar } from 'lucide-react';

const ALL_TABLES = [
  'tenants',
  'users',
  'properties',
  'room_types',
  'rooms',
  'rate_plans',
  'guests',
  'guest_preferences',
  'guest_documents',
  'reservations',
  'reservation_stays',
  'folios',
  'folio_items',
  'invoices',
  'channel_connections',
  'channel_mappings',
  'housekeeping_tasks',
  'night_audits',
  'audit_logs',
  'notifications',
  'push_subscriptions',
  'roles',
  'permissions',
  'role_permissions',
  'role_assignments',
  'api_keys',
];

export function ScheduleModal({ open, onOpenChange, onSuccess }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    enabled: true,
    type: 'full',
    frequency: 'daily',
    cronExpression: '0 2 * * *',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    retentionDays: 30,
    tables: [],
  });
  const [selectAll, setSelectAll] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Schedule name is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await createBackupSchedule({
        ...form,
        tables: form.tables.length > 0 ? form.tables : ALL_TABLES,
      });
      toast({
        title: 'Schedule Created',
        description: `Backup schedule "${form.name}" has been created`,
      });
      onOpenChange(false);
      onSuccess?.();
      // Reset form
      setForm({
        name: '',
        enabled: true,
        type: 'full',
        frequency: 'daily',
        cronExpression: '0 2 * * *',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        retentionDays: 30,
        tables: [],
      });
      setSelectAll(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create schedule',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleTable = (table) => {
    setForm((prev) => ({
      ...prev,
      tables: prev.tables.includes(table)
        ? prev.tables.filter((t) => t !== table)
        : [...prev.tables, table],
    }));
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setForm((prev) => ({ ...prev, tables: [] }));
    } else {
      setForm((prev) => ({ ...prev, tables: [...ALL_TABLES] }));
    }
    setSelectAll(!selectAll);
  };

  const frequencyCronMap = {
    hourly: '0 * * * *',
    daily: '0 2 * * *',
    weekly: '0 2 * * 0',
    monthly: '0 2 1 * *',
  };

  const handleFrequencyChange = (freq) => {
    setForm((prev) => ({
      ...prev,
      frequency: freq,
      cronExpression: frequencyCronMap[freq] || prev.cronExpression,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            New Backup Schedule
          </DialogTitle>
          <DialogDescription>
            Configure automated backup schedules for your database
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Schedule Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Daily Full Backup"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Backup Type</Label>
              <Select
                id="type"
                value={form.type}
                onValueChange={(v) => setForm((prev) => ({ ...prev, type: v }))}
              >
                <option value="full">Full</option>
                <option value="incremental">Incremental</option>
                <option value="differential">Differential</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select id="frequency" value={form.frequency} onValueChange={handleFrequencyChange}>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cron">Cron Expression</Label>
            <Input
              id="cron"
              value={form.cronExpression}
              onChange={(e) => setForm((prev) => ({ ...prev, cronExpression: e.target.value }))}
              placeholder="0 2 * * *"
            />
            <p className="text-xs text-muted-foreground">
              Advanced: Edit the cron expression directly
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retention">Retention (days)</Label>
              <Input
                id="retention"
                type="number"
                min={1}
                max={365}
                value={form.retentionDays}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, retentionDays: parseInt(e.target.value) || 30 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={form.timeZone}
                onChange={(e) => setForm((prev) => ({ ...prev, timeZone: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enabled"
              checked={form.enabled}
              onCheckedChange={(v) => setForm((prev) => ({ ...prev, enabled: v }))}
            />
            <Label htmlFor="enabled" className="text-sm font-normal">
              Schedule enabled
            </Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tables to Backup</Label>
              <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                {selectAll ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {ALL_TABLES.map((table) => (
                  <div key={table} className="flex items-center space-x-2">
                    <Checkbox
                      id={`table-${table}`}
                      checked={form.tables.includes(table)}
                      onCheckedChange={() => toggleTable(table)}
                    />
                    <Label htmlFor={`table-${table}`} className="text-xs font-normal capitalize">
                      {table.replace(/_/g, ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Schedule'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
