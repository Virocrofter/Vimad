/* src/app/admin/data-export/ErasureModal.jsx */
import { useState } from 'react';
import { X, Check, Shield, AlertTriangle, Trash2, Loader2, ChevronRight, ChevronLeft, Building2, Users, CreditCard, Calendar, MessageSquare, BarChart3 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { dataCategories, initialTenants } from './data';

const tenantOptions = initialTenants.map(t => ({ id: t.id, name: t.name, status: t.status }));

const scopeOptions = [
  { key: 'full_tenant', label: 'Full Tenant Deletion', desc: 'Permanently delete all data for this tenant', icon: Building2, danger: true },
  { key: 'partial_guests', label: 'Guest Data Only', desc: 'Remove guest PII but preserve operational metrics', icon: Users, danger: false },
  { key: 'partial_financial', label: 'Financial Records', desc: 'Purge invoices and payment data past retention', icon: CreditCard, danger: false },
  { key: 'partial_communications', label: 'Communications', desc: 'Delete email/SMS history beyond retention period', icon: MessageSquare, danger: false },
];

export default function ErasureModal({ request, onClose, onSave }) {
  const isEditing = !!request;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    tenantId: request?.tenantId || tenantOptions[0]?.id,
    scope: request?.scope || 'full_tenant',
    reason: request?.reason || '',
    priority: request?.priority || 'medium',
    dataCategories: request?.dataCategories || ['guest_pii', 'financial', 'operational', 'communications'],
    retentionOverride: request?.retentionOverride || false,
    legalHold: request?.legalHold || false,
    notes: request?.notes || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const toggleCategory = (cat) => {
    const current = form.dataCategories;
    update('dataCategories', current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    onSave({
      ...form,
      id: request?.id || `DEL-2026-0816-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
      tenantName: tenantOptions.find(t => t.id === form.tenantId)?.name || '',
      requestedBy: request?.requestedBy || 'Admin',
      requesterEmail: request?.requesterEmail || '',
      requestedAt: request?.requestedAt || new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: request?.status || 'pending_review',
      reviewedBy: request?.reviewedBy || null,
      reviewedAt: request?.reviewedAt || null,
      completedAt: request?.completedAt || null,
      estimatedRecords: Math.floor(Math.random() * 20000) + 1000,
      estimatedSize: `${(Math.random() * 50 + 5).toFixed(1)} MB`,
    });
    setIsSubmitting(false);
    onClose();
  };

  const steps = [
    { id: 1, label: 'Tenant' },
    { id: 2, label: 'Scope' },
    { id: 3, label: 'Categories' },
    { id: 4, label: 'Review' },
  ];

  const selectedTenant = tenantOptions.find(t => t.id === form.tenantId);
  const selectedScope = scopeOptions.find(s => s.key === form.scope);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger/10">
              <Trash2 className="h-5 w-5 text-danger" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {isEditing ? 'Edit Erasure Request' : 'Right to Erasure Request'}
              </h3>
              <p className="text-xs text-text-muted">GDPR Article 17 — Data deletion workflow</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 pt-4">
          <div className="flex items-center">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  step === s.id ? 'bg-danger text-white' :
                  step > s.id ? 'bg-accent text-white' :
                  'bg-border text-text-muted'
                )}>
                  {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
                </div>
                <span className={cn('ml-2 text-xs font-medium', step === s.id ? 'text-danger' : 'text-text-muted')}>
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={cn('mx-2 h-0.5 flex-1', step > s.id ? 'bg-accent' : 'bg-border')} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">
          {/* Step 1: Tenant */}
          {step === 1 && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">Select Tenant</label>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-auto">
                {tenantOptions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => update('tenantId', t.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                      form.tenantId === t.id
                        ? 'border-danger bg-danger/5'
                        : 'border-border bg-surface hover:bg-surface-elevated'
                    )}
                  >
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg',
                      form.tenantId === t.id ? 'bg-danger/10' : 'bg-neutral/10'
                    )}>
                      <Building2 className={cn('h-4 w-4', form.tenantId === t.id ? 'text-danger' : 'text-text-muted')} />
                    </div>
                    <div className="flex-1">
                      <p className={cn('text-sm font-medium', form.tenantId === t.id ? 'text-danger' : 'text-text-primary')}>
                        {t.name}
                      </p>
                      <p className="text-xs text-text-muted">{t.id} · {t.status}</p>
                    </div>
                    {form.tenantId === t.id && <Check className="h-4 w-4 text-danger" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Scope */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Deletion Scope</label>
                <div className="grid grid-cols-1 gap-2">
                  {scopeOptions.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.key}
                        onClick={() => update('scope', s.key)}
                        className={cn(
                          'flex items-start gap-3 rounded-lg border p-3 text-left transition-all',
                          form.scope === s.key
                            ? s.danger ? 'border-danger bg-danger/5' : 'border-secondary bg-secondary/5'
                            : 'border-border bg-surface hover:bg-surface-elevated'
                        )}
                      >
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
                          form.scope === s.key
                            ? s.danger ? 'bg-danger/10' : 'bg-secondary/10'
                            : 'bg-neutral/10'
                        )}>
                          <Icon className={cn('h-4 w-4',
                            form.scope === s.key
                              ? s.danger ? 'text-danger' : 'text-secondary'
                              : 'text-text-muted'
                          )} />
                        </div>
                        <div className="flex-1">
                          <p className={cn('text-sm font-medium', form.scope === s.key ? 'text-text-primary' : 'text-text-primary')}>
                            {s.label}
                          </p>
                          <p className="text-xs text-text-muted">{s.desc}</p>
                        </div>
                        {form.scope === s.key && <Check className={cn('h-4 w-4', s.danger ? 'text-danger' : 'text-secondary')} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Reason for Deletion</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => update('reason', e.target.value)}
                  placeholder="e.g. Business closure, GDPR request, data cleanup..."
                  rows={3}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Priority</label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map((p) => (
                    <button
                      key={p}
                      onClick={() => update('priority', p)}
                      className={cn(
                        'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors capitalize',
                        form.priority === p
                          ? p === 'high' ? 'border-danger bg-danger/5 text-danger' :
                            p === 'medium' ? 'border-warning bg-warning/5 text-warning' :
                            'border-accent bg-accent/5 text-accent'
                          : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Categories */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Data Categories to Delete</label>
                <div className="space-y-2">
                  {dataCategories.map((cat) => (
                    <label
                      key={cat.key}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all',
                        form.dataCategories.includes(cat.key)
                          ? 'border-danger bg-danger/5'
                          : 'border-border bg-surface hover:bg-surface-elevated'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={form.dataCategories.includes(cat.key)}
                        onChange={() => toggleCategory(cat.key)}
                        className="h-4 w-4 rounded border-border text-danger focus:ring-ring"
                      />
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', cat.bg)}>
                        <div className={cn('h-4 w-4', cat.color)} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">{cat.label}</p>
                        <p className="text-xs text-text-muted">{cat.key}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 cursor-pointer hover:bg-surface-elevated">
                  <div>
                    <p className="text-sm font-medium text-text-primary">Override Retention Policy</p>
                    <p className="text-xs text-text-muted">Allow deletion before standard retention period expires</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.retentionOverride}
                    onChange={(e) => update('retentionOverride', e.target.checked)}
                    className="h-4 w-4 rounded border-border text-danger focus:ring-ring"
                  />
                </label>

                <label className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 cursor-pointer hover:bg-surface-elevated">
                  <div>
                    <p className="text-sm font-medium text-text-primary">Legal Hold</p>
                    <p className="text-xs text-text-muted">Block deletion due to pending legal matter</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.legalHold}
                    onChange={(e) => update('legalHold', e.target.checked)}
                    className="h-4 w-4 rounded border-border text-danger focus:ring-ring"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Internal Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  placeholder="Add any relevant context for the review team..."
                  rows={3}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div className={cn(
                'rounded-xl border p-4 space-y-3',
                selectedScope?.danger ? 'border-danger/30 bg-danger/5' : 'border-border bg-surface'
              )}>
                <div className="flex items-center gap-2">
                  {selectedScope?.danger ? <AlertTriangle className="h-5 w-5 text-danger" /> : <Shield className="h-5 w-5 text-secondary" />}
                  <h4 className={cn('text-sm font-semibold', selectedScope?.danger ? 'text-danger' : 'text-text-primary')}>
                    {selectedScope?.danger ? 'Destructive Action Review' : 'Deletion Request Review'}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-text-muted">Tenant:</span>
                    <span className="ml-2 text-text-primary font-medium">{selectedTenant?.name}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Scope:</span>
                    <span className="ml-2 text-text-primary font-medium">{selectedScope?.label}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Priority:</span>
                    <span className={cn('ml-2 font-medium capitalize',
                      form.priority === 'high' ? 'text-danger' :
                      form.priority === 'medium' ? 'text-warning' : 'text-accent'
                    )}>{form.priority}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Categories:</span>
                    <span className="ml-2 text-text-primary font-medium">{form.dataCategories.length} selected</span>
                  </div>
                </div>

                {form.legalHold && (
                  <div className="rounded-lg border border-danger/20 bg-danger/5 p-2 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-danger shrink-0" />
                    <span className="text-xs text-danger font-medium">Legal hold will prevent execution until resolved</span>
                  </div>
                )}

                {form.retentionOverride && (
                  <div className="rounded-lg border border-warning/20 bg-warning/5 p-2 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                    <span className="text-xs text-warning font-medium">Retention policy override requested</span>
                  </div>
                )}

                {form.reason && (
                  <div className="rounded-lg bg-background border border-border p-2">
                    <span className="text-[10px] text-text-muted uppercase">Reason</span>
                    <p className="text-xs text-text-secondary mt-0.5">{form.reason}</p>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-danger/20 bg-danger/5 p-3">
                <p className="text-xs text-danger">
                  <strong>Warning:</strong> This action will permanently delete data. 
                  {selectedScope?.danger ? ' Full tenant deletion cannot be undone and will terminate all active services.' : ' Deleted data cannot be recovered unless a backup exists.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-border bg-surface px-6 py-4 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>

          {step < 4 ? (
            <Button type="button" onClick={() => setStep(step + 1)}>
              Next <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={selectedScope?.danger ? 'bg-danger hover:bg-danger/90' : ''}
            >
              {isSubmitting ? (
                <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                <><Trash2 className="mr-1.5 h-4 w-4" /> {isEditing ? 'Update Request' : 'Submit Request'}</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
