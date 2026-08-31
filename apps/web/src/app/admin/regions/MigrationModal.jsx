/* src/app/admin/regions/MigrationModal.jsx */
import { useState } from 'react';
import {
  X,
  ArrowRight,
  Server,
  Globe,
  Check,
  AlertTriangle,
  Clock,
  Database,
  Shield,
  Activity,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { regions, getRegionName } from './data';

export default function MigrationModal({ job, onClose, onSave, tenants = [] }) {
  const isEditing = !!job;
  const [form, setForm] = useState({
    tenantId: job?.tenantId || '',
    tenantName: job?.tenantName || '',
    sourceRegion: job?.sourceRegion || '',
    targetRegion: job?.targetRegion || '',
    reason: job?.reason || '',
    scheduledAt: job?.startedAt || '',
    verifyBeforeCutover: true,
    notifyTenant: true,
    maintenanceWindow: 'low_traffic',
  });
  const [step, setStep] = useState(1); // 1: select, 2: configure, 3: review

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const selectedTenant = tenants.find((t) => t.id === form.tenantId);
  const sourceRegion = regions.find(
    (r) => r.id === form.sourceRegion || r.code === form.sourceRegion
  );
  const targetRegion = regions.find((r) => r.id === form.targetRegion);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      id: job?.id || `MIG-${Date.now().toString(36).toUpperCase()}`,
      status: form.scheduledAt ? 'scheduled' : 'pending',
      progress: 0,
      dataSizeGB: selectedTenant?.storageGB || 0,
      startedAt: null,
      completedAt: null,
      duration: null,
      initiatedBy: 'You',
      verificationStatus: 'pending',
      downtimeSeconds: null,
    });
    onClose();
  };

  const canProceed = () => {
    if (step === 1)
      return form.tenantId && form.targetRegion && form.sourceRegion !== form.targetRegion;
    if (step === 2) return form.reason.length > 5;
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <ArrowRight className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {isEditing ? 'Edit Migration' : 'New Cross-Region Migration'}
              </h3>
              <p className="text-xs text-text-muted">
                {isEditing ? job.id : 'Move a tenant between geographic regions'}
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

        {/* Step Indicator */}
        {!isEditing && (
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2">
              {['Select Tenant', 'Configure', 'Review'].map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                      step > i + 1
                        ? 'bg-secondary text-white'
                        : step === i + 1
                          ? 'border-2 border-secondary bg-secondary/10 text-secondary'
                          : 'border-2 border-border bg-surface text-text-muted'
                    )}
                  >
                    {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      step >= i + 1 ? 'text-text-primary' : 'text-text-muted'
                    )}
                  >
                    {s}
                  </span>
                  {i < 2 && (
                    <div
                      className={cn('h-0.5 flex-1', step > i + 1 ? 'bg-secondary' : 'bg-border')}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Step 1: Select Tenant & Regions */}
          {(step === 1 || isEditing) && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Tenant
                </label>
                <select
                  value={form.tenantId}
                  onChange={(e) => {
                    const t = tenants.find((x) => x.id === e.target.value);
                    update('tenantId', e.target.value);
                    update('tenantName', t?.name || '');
                    update(
                      'sourceRegion',
                      t ? regions.find((r) => r.id.includes(t.id))?.id || 'us-east-1' : ''
                    );
                  }}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select a tenant...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.id}) — {t.plan}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTenant && (
                <div className="rounded-lg border border-border bg-surface p-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-xs font-bold text-secondary">
                    {selectedTenant.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{selectedTenant.name}</p>
                    <p className="text-[10px] text-text-muted">
                      {selectedTenant.storageGB} GB · ${selectedTenant.mrr}/mo
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Source Region
                  </label>
                  <select
                    value={form.sourceRegion}
                    onChange={(e) => update('sourceRegion', e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select...</option>
                    {regions
                      .filter((r) => r.status !== 'maintenance')
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Target Region
                  </label>
                  <select
                    value={form.targetRegion}
                    onChange={(e) => update('targetRegion', e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select...</option>
                    {regions
                      .filter((r) => r.id !== form.sourceRegion && r.status !== 'maintenance')
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {form.sourceRegion &&
                form.targetRegion &&
                form.sourceRegion === form.targetRegion && (
                  <div className="rounded-lg border border-danger/20 bg-danger/5 p-3">
                    <p className="text-xs text-danger flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Source and target regions must be different
                    </p>
                  </div>
                )}
            </div>
          )}

          {/* Step 2: Configure */}
          {(step === 2 || isEditing) && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Migration Reason
                </label>
                <textarea
                  value={form.reason}
                  onChange={(e) => update('reason', e.target.value)}
                  rows={3}
                  placeholder="Why is this migration needed?"
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Schedule
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => update('scheduledAt', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="mt-1 text-[10px] text-text-muted">
                  Leave empty to start immediately upon approval
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 cursor-pointer hover:bg-surface-elevated">
                  <input
                    type="checkbox"
                    checked={form.verifyBeforeCutover}
                    onChange={(e) => update('verifyBeforeCutover', e.target.checked)}
                    className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
                  />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Verify before cutover</p>
                    <p className="text-xs text-text-muted">
                      Run data integrity checks before switching traffic
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 cursor-pointer hover:bg-surface-elevated">
                  <input
                    type="checkbox"
                    checked={form.notifyTenant}
                    onChange={(e) => update('notifyTenant', e.target.checked)}
                    className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
                  />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Notify tenant</p>
                    <p className="text-xs text-text-muted">
                      Send email notification to tenant admin before migration
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Maintenance Window
                </label>
                <select
                  value={form.maintenanceWindow}
                  onChange={(e) => update('maintenanceWindow', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="low_traffic">Low Traffic (02:00 - 06:00 local)</option>
                  <option value="weekend">Weekend</option>
                  <option value="immediate">Immediate (no window)</option>
                  <option value="custom">Custom Schedule</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && !isEditing && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Migration Summary
                </h4>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-text-muted">Tenant</p>
                    <p className="font-medium text-text-primary">{form.tenantName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Data Size</p>
                    <p className="font-medium text-text-primary">
                      {selectedTenant?.storageGB || 0} GB
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">From</p>
                    <p className="font-medium text-text-primary font-mono text-xs">
                      {getRegionName(form.sourceRegion)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">To</p>
                    <p className="font-medium text-text-primary font-mono text-xs">
                      {getRegionName(form.targetRegion)}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-xs text-text-muted">Reason</p>
                  <p className="text-sm text-text-secondary">{form.reason}</p>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-xs text-text-muted">Schedule</p>
                  <p className="text-sm text-text-primary">
                    {form.scheduledAt
                      ? new Date(form.scheduledAt).toLocaleString()
                      : 'Immediate upon approval'}
                  </p>
                </div>

                <div className="border-t border-border pt-3 flex items-center gap-4 text-xs">
                  {form.verifyBeforeCutover && (
                    <span className="inline-flex items-center gap-1 text-accent">
                      <Shield className="h-3.5 w-3.5" /> Pre-cutover verification enabled
                    </span>
                  )}
                  {form.notifyTenant && (
                    <span className="inline-flex items-center gap-1 text-secondary">
                      <Activity className="h-3.5 w-3.5" /> Tenant will be notified
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                <p className="text-xs text-warning flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Cross-region migration will incur brief downtime (typically 30-120 seconds).
                  Ensure the tenant has been notified and the maintenance window is acceptable.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            {!isEditing && step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {!isEditing && step < 3 ? (
              <Button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Next
              </Button>
            ) : (
              <Button type="submit" variant="secondary">
                <ArrowRight className="mr-1.5 h-4 w-4" />
                {isEditing ? 'Save Changes' : 'Create Migration'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
