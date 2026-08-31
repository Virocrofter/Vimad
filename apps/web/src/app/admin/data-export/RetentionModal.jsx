/* src/app/admin/data-export/RetentionModal.jsx */
import { useState, useEffect } from 'react';
import { X, Check, Clock, Save, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { dataCategories, formatDuration } from './data';

const actionOptions = [
  { key: 'delete', label: 'Delete', desc: 'Permanently remove data after retention period' },
  { key: 'anonymize', label: 'Anonymize', desc: 'Pseudonymize PII but preserve aggregates' },
  { key: 'archive', label: 'Archive', desc: 'Move to cold storage with restricted access' },
  {
    key: 'archive_then_delete',
    label: 'Archive then Delete',
    desc: 'Archive for 1 year, then permanently delete',
  },
];

const scopeOptions = [
  { key: 'global', label: 'Global', desc: 'Applies to all tenants automatically' },
  { key: 'tenant_specific', label: 'Tenant-Specific', desc: 'Override for specific tenant only' },
];

export default function RetentionModal({ policy, onClose, onSave }) {
  const isEditing = !!policy;
  const [form, setForm] = useState({
    name: '',
    category: 'guest_pii',
    description: '',
    retentionPeriod: 365,
    retentionUnit: 'days',
    action: 'anonymize',
    scope: 'global',
    appliesTo: ['all_tenants'],
    exceptions: [],
    active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (policy) {
      setForm({
        name: policy.name || '',
        category: policy.category || 'guest_pii',
        description: policy.description || '',
        retentionPeriod: policy.retentionPeriod || 365,
        retentionUnit: policy.retentionUnit || 'days',
        action: policy.action || 'anonymize',
        scope: policy.scope || 'global',
        appliesTo: policy.appliesTo || ['all_tenants'],
        exceptions: policy.exceptions || [],
        active: policy.active !== false,
      });
    }
  }, [policy]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const toggleException = (ex) => {
    const current = form.exceptions;
    update('exceptions', current.includes(ex) ? current.filter((e) => e !== ex) : [...current, ex]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    onSave({
      ...form,
      id: policy?.id || `POL-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
      createdAt: policy?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      lastRun: policy?.lastRun || null,
      nextRun: policy?.nextRun || null,
      recordsAffected: policy?.recordsAffected || 0,
    });
    setIsSubmitting(false);
    onClose();
  };

  const availableExceptions = [
    'loyalty_program_members',
    'legal_hold',
    'audit_in_progress',
    'security_incident',
    'compliance_audit',
    'support_ticket_open',
    'converted_to_paid',
    'pending_dispute',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <Clock className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {isEditing ? 'Edit Retention Policy' : 'New Retention Policy'}
              </h3>
              <p className="text-xs text-text-muted">
                {isEditing ? policy.id : 'Configure automated data lifecycle'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Policy Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. Guest PII Default"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={2}
                placeholder="What data does this policy manage?"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Category & Scope */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Data Category
              </label>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {dataCategories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Scope
              </label>
              <select
                value={form.scope}
                onChange={(e) => update('scope', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {scopeOptions.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Retention Period */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Retention Period
            </h4>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                value={form.retentionPeriod}
                onChange={(e) => update('retentionPeriod', parseInt(e.target.value) || 1)}
                className="h-10 w-24 rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <select
                value={form.retentionUnit}
                onChange={(e) => update('retentionUnit', e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="days">Days</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
              <span className="text-xs text-text-muted ml-auto">
                ≈{' '}
                {formatDuration(
                  form.retentionUnit === 'days'
                    ? form.retentionPeriod
                    : form.retentionUnit === 'months'
                      ? form.retentionPeriod * 30
                      : form.retentionPeriod * 365
                )}
              </span>
            </div>

            {/* Quick presets */}
            <div className="flex gap-2">
              {[30, 90, 365, 730, 2555].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => {
                    update('retentionPeriod', days);
                    update('retentionUnit', 'days');
                  }}
                  className={cn(
                    'rounded-md border px-2.5 py-1 text-[10px] font-medium transition-colors',
                    form.retentionPeriod === days && form.retentionUnit === 'days'
                      ? 'border-secondary bg-secondary/10 text-secondary'
                      : 'border-border bg-background text-text-muted hover:bg-surface-elevated'
                  )}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {/* Action */}
          <div>
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
              After Retention Expires
            </label>
            <div className="grid grid-cols-2 gap-3">
              {actionOptions.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => update('action', a.key)}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all',
                    form.action === a.key
                      ? 'border-secondary bg-secondary/5'
                      : 'border-border bg-surface hover:bg-surface-elevated'
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-medium',
                      form.action === a.key ? 'text-secondary' : 'text-text-primary'
                    )}
                  >
                    {a.label}
                  </span>
                  <span className="text-xs text-text-muted">{a.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Exceptions */}
          <div>
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
              Exceptions
            </label>
            <p className="text-xs text-text-muted mb-2">
              Data matching these conditions will be preserved beyond retention
            </p>
            <div className="flex flex-wrap gap-2">
              {availableExceptions.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => toggleException(ex)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    form.exceptions.includes(ex)
                      ? 'bg-warning/10 text-warning border-warning/30'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {form.exceptions.includes(ex) && <Check className="h-3 w-3" />}
                  {ex.replace(/_/g, ' ').replace(/\\b\\w/g, (l) => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Policy Active</p>
              <p className="text-xs text-text-muted">
                {form.active
                  ? 'Policy is enforced automatically'
                  : 'Policy is disabled and will not run'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => update('active', !form.active)}
              className={cn(
                'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                form.active ? 'bg-accent' : 'bg-border'
              )}
            >
              <span
                className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
                  form.active ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-4 w-4" />{' '}
                  {isEditing ? 'Update Policy' : 'Create Policy'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
