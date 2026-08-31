/* src/app/admin/backups/ScheduleModal.jsx */
import { useState, useEffect } from 'react';
import { X, Check, Clock, Database, Calendar, HardDrive, Shield } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

const backupTypes = [
  { id: 'full', label: 'Full Backup', desc: 'Complete backup of all data' },
  { id: 'incremental', label: 'Incremental', desc: 'Only changes since last backup' },
  { id: 'snapshot', label: 'Snapshot', desc: 'Point-in-time snapshot' },
];

const frequencies = [
  { id: 'hourly', label: 'Hourly' },
  { id: 'every_6h', label: 'Every 6 hours' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

const storageTargets = [
  { id: 's3-us-east', label: 'S3 US-East (Standard)', region: 'us-east-1' },
  { id: 's3-us-west', label: 'S3 US-West (Standard-IA)', region: 'us-west-2' },
  { id: 's3-glacier', label: 'S3 Glacier (Archive)', region: 'us-east-1' },
  { id: 's3-eu-west', label: 'S3 EU-West (Standard-IA)', region: 'eu-west-1' },
];

const databases = ['postgres-main', 'postgres-analytics', 'elasticsearch', 'redis-cache'];

const targets = [
  { id: 'db-primary', label: 'Primary Database' },
  { id: 'db-analytics', label: 'Analytics Database' },
  { id: 'file-storage', label: 'S3 File Storage' },
  { id: 'redis-cache', label: 'Redis Cache' },
  { id: 'search-index', label: 'Search Index' },
  { id: 'all-systems', label: 'All Systems' },
];

export default function ScheduleModal({ schedule, onClose, onSave }) {
  const isEditing = !!schedule;
  const [form, setForm] = useState({
    name: '',
    type: 'full',
    target: 'db-primary',
    databases: ['postgres-main'],
    frequency: 'daily',
    time: '02:00',
    timezone: 'UTC',
    retentionDays: 30,
    storage: 's3-us-east',
    encryption: 'AES-256-GCM',
    compression: 'zstd',
    enabled: true,
  });

  useEffect(() => {
    if (schedule) {
      setForm({
        name: schedule.name || '',
        type: schedule.type || 'full',
        target: schedule.target || 'db-primary',
        databases: schedule.databases || ['postgres-main'],
        frequency: schedule.frequency || 'daily',
        time: schedule.time || '02:00',
        timezone: schedule.timezone || 'UTC',
        retentionDays: schedule.retentionDays || 30,
        storage: schedule.storage || 's3-us-east',
        encryption: schedule.encryption || 'AES-256-GCM',
        compression: schedule.compression || 'zstd',
        enabled: schedule.enabled !== false,
      });
    }
  }, [schedule]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleDatabase = (db) => {
    const current = form.databases;
    update('databases', current.includes(db) ? current.filter((d) => d !== db) : [...current, db]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      id: schedule?.id || `SCH-${Date.now().toString(36).toUpperCase()}`,
      lastRun: schedule?.lastRun || null,
      nextRun: schedule?.nextRun || null,
      status: schedule?.status || 'success',
      sizeAvg: schedule?.sizeAvg || '—',
      durationAvg: schedule?.durationAvg || '—',
    });
    onClose();
  };

  const showTimeField = ['daily', 'weekly', 'monthly'].includes(form.frequency);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <Calendar className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {isEditing ? 'Edit Schedule' : 'New Backup Schedule'}
              </h3>
              <p className="text-xs text-text-muted">
                {isEditing ? schedule.id : 'Configure automated backup schedule'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Schedule Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. Full Database Backup"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Backup Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => update('type', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {backupTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Target
                </label>
                <select
                  value={form.target}
                  onChange={(e) => update('target', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Databases */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Databases to Backup
            </label>
            <div className="flex flex-wrap gap-2">
              {databases.map((db) => (
                <button
                  key={db}
                  type="button"
                  onClick={() => toggleDatabase(db)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    form.databases.includes(db)
                      ? 'bg-secondary/10 text-secondary border-secondary/30'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {form.databases.includes(db) && <Check className="h-3 w-3" />}
                  {db}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Schedule Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Frequency
                </label>
                <select
                  value={form.frequency}
                  onChange={(e) => update('frequency', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {frequencies.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              {showTimeField && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">Time</label>
                  <input
                    type="time"
                    value={form.time || ''}
                    onChange={(e) => update('time', e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Timezone
                </label>
                <select
                  value={form.timezone}
                  onChange={(e) => update('timezone', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern (ET)</option>
                  <option value="America/Chicago">Central (CT)</option>
                  <option value="America/Denver">Mountain (MT)</option>
                  <option value="America/Los_Angeles">Pacific (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Retention (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={form.retentionDays}
                  onChange={(e) => update('retentionDays', parseInt(e.target.value) || 30)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Storage */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Storage & Encryption
            </h4>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                Storage Target
              </label>
              <select
                value={form.storage}
                onChange={(e) => update('storage', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {storageTargets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Encryption
                </label>
                <select
                  value={form.encryption}
                  onChange={(e) => update('encryption', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="AES-256-GCM">AES-256-GCM</option>
                  <option value="AES-256-CBC">AES-256-CBC</option>
                  <option value="ChaCha20-Poly1305">ChaCha20-Poly1305</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Compression
                </label>
                <select
                  value={form.compression || ''}
                  onChange={(e) => update('compression', e.target.value || null)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="zstd">zstd (recommended)</option>
                  <option value="gzip">gzip</option>
                  <option value="lz4">lz4</option>
                  <option value="">None</option>
                </select>
              </div>
            </div>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Enable Schedule</p>
              <p className="text-xs text-text-muted">
                {form.enabled
                  ? 'Schedule is active and will run automatically'
                  : 'Schedule is disabled'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => update('enabled', !form.enabled)}
              className={cn(
                'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                form.enabled ? 'bg-accent' : 'bg-border'
              )}
            >
              <span
                className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
                  form.enabled ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary">
              <Check className="mr-1.5 h-4 w-4" /> {isEditing ? 'Save Changes' : 'Create Schedule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
