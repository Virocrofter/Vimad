/* src/app/admin/announcements/MaintenanceModal.jsx */
import { useState, useEffect } from 'react';
import {
  X, Check, Server, Calendar, Clock, Wrench, AlertTriangle,
  CheckCircle2, XCircle
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

const impacts = [
  { id: 'none', label: 'No Impact', desc: 'Services remain fully operational' },
  { id: 'degraded', label: 'Degraded', desc: 'Slower performance, all features work' },
  { id: 'read-only', label: 'Read-Only', desc: 'Viewing allowed, no modifications' },
  { id: 'unavailable', label: 'Unavailable', desc: 'Complete service interruption' },
];

const allServices = [
  'API Gateway',
  'Auth Service',
  'Primary Database',
  'Redis Cache',
  'Background Worker',
  'File Storage (S3)',
  'Search Index',
  'Notification Service',
];

export default function MaintenanceModal({ window, onClose, onSave }) {
  const isEditing = !!window;
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'scheduled',
    startTime: '',
    endTime: '',
    estimatedDuration: '',
    affectedServices: [],
    impact: 'none',
    tenantNotification: true,
  });

  useEffect(() => {
    if (window) {
      setForm({
        title: window.title || '',
        description: window.description || '',
        status: window.status || 'scheduled',
        startTime: window.startTime
          ? new Date(window.startTime).toISOString().slice(0, 16)
          : '',
        endTime: window.endTime
          ? new Date(window.endTime).toISOString().slice(0, 16)
          : '',
        estimatedDuration: window.estimatedDuration || '',
        affectedServices: window.affectedServices || [],
        impact: window.impact || 'none',
        tenantNotification: window.tenantNotification !== false,
      });
    }
  }, [window]);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleService = (svc) => {
    const current = form.affectedServices;
    update('affectedServices', current.includes(svc) ? current.filter(s => s !== svc) : [...current, svc]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      id: window?.id || `MW-${Date.now().toString(36).toUpperCase()}`,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      createdBy: window?.createdBy || 'Admin',
      createdAt: window?.createdAt || new Date().toISOString(),
      actualDuration: window?.actualDuration || null,
    };
    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
              <Wrench className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {isEditing ? 'Edit Maintenance Window' : 'Schedule Maintenance'}
              </h3>
              <p className="text-xs text-text-muted">
                {isEditing ? window.id : 'Plan and communicate system maintenance'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="e.g. Database Cluster Upgrade"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Description</label>
              <textarea
                required
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={3}
                placeholder="Describe the maintenance and its purpose..."
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          {/* Time Window */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Time Window</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-[10px] text-text-muted flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Start Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.startTime}
                  onChange={(e) => update('startTime', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-text-muted flex items-center gap-1">
                  <Clock className="h-3 w-3" /> End Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.endTime}
                  onChange={(e) => update('endTime', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-text-muted">Estimated Duration</label>
              <input
                type="text"
                value={form.estimatedDuration}
                onChange={(e) => update('estimatedDuration', e.target.value)}
                placeholder="e.g. 30 minutes"
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Impact Level */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">Impact Level</label>
            <div className="grid grid-cols-2 gap-3">
              {impacts.map((imp) => {
                const active = form.impact === imp.id;
                return (
                  <button
                    key={imp.id}
                    type="button"
                    onClick={() => update('impact', imp.id)}
                    className={cn(
                      'flex flex-col gap-1 rounded-lg border p-3 text-left transition-all',
                      active
                        ? 'border-warning bg-warning/5'
                        : 'border-border bg-surface hover:border-secondary/30'
                    )}
                  >
                    <span className={cn('text-sm font-medium', active ? 'text-warning' : 'text-text-primary')}>
                      {imp.label}
                    </span>
                    <span className="text-xs text-text-muted">{imp.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Affected Services */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">Affected Services</label>
            <div className="flex flex-wrap gap-2">
              {allServices.map((svc) => (
                <button
                  key={svc}
                  type="button"
                  onClick={() => toggleService(svc)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    form.affectedServices.includes(svc)
                      ? 'bg-secondary/10 text-secondary border-secondary/30'
                      : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {form.affectedServices.includes(svc) && <Check className="h-3 w-3" />}
                  <Server className="h-3 w-3" />
                  {svc}
                </button>
              ))}
            </div>
          </div>

          {/* Tenant Notification Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Notify Tenants</p>
              <p className="text-xs text-text-muted">
                {form.tenantNotification
                  ? 'An announcement will be automatically created and sent to affected tenants'
                  : 'This maintenance will not be communicated to tenants'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => update('tenantNotification', !form.tenantNotification)}
              className={cn(
                'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                form.tenantNotification ? 'bg-secondary' : 'bg-border'
              )}
            >
              <span className={cn(
                'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
                form.tenantNotification ? 'translate-x-6' : 'translate-x-1'
              )} />
            </button>
          </div>

          {/* Status (edit only) */}
          {isEditing && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-secondary">Status:</label>
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="secondary">
              <Check className="mr-1.5 h-4 w-4" />
              {isEditing ? 'Save Changes' : 'Schedule Maintenance'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
