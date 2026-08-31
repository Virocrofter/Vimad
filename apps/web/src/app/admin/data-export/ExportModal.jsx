/* src/app/admin/data-export/ExportModal.jsx */
import { useState } from 'react';
import {
  X,
  Check,
  Download,
  Database,
  FileText,
  Calendar,
  Users,
  CreditCard,
  MessageSquare,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { exportTypes, exportFormats, initialTenants } from './data';

const tenantOptions = [
  { id: 'all', name: 'All Tenants', desc: 'Export data across all properties' },
  ...initialTenants.map((t) => ({ id: t.id, name: t.name, desc: t.subdomain + '.vimad.io' })),
];

export default function ExportModal({ onClose, onCreate }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    tenantId: 'all',
    exportType: 'full',
    format: 'json',
    dateRange: 'all',
    customStart: '',
    customEnd: '',
    includeDeleted: false,
    anonymizePii: false,
    notifyEmail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const typeMeta = exportTypes.find((t) => t.key === form.exportType);
  const formatMeta = exportFormats.find((f) => f.key === form.format);
  const tenantMeta = tenantOptions.find((t) => t.id === form.tenantId);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    onCreate({
      ...form,
      id: `EXP-2026-0816-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
      status: 'pending',
      requestedBy: 'Admin',
      requestedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });
    setIsSubmitting(false);
    onClose();
  };

  const steps = [
    { id: 1, label: 'Tenant' },
    { id: 2, label: 'Data Type' },
    { id: 3, label: 'Format' },
    { id: 4, label: 'Options' },
    { id: 5, label: 'Review' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <Download className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Export Tenant Data</h3>
              <p className="text-xs text-text-muted">GDPR-compliant data portability request</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 pt-4">
          <div className="flex items-center">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    step === s.id
                      ? 'bg-secondary text-white'
                      : step > s.id
                        ? 'bg-accent text-white'
                        : 'bg-border text-text-muted'
                  )}
                >
                  {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
                </div>
                <span
                  className={cn(
                    'ml-2 text-xs font-medium',
                    step === s.id ? 'text-secondary' : 'text-text-muted'
                  )}
                >
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div
                    className={cn('mx-2 h-0.5 flex-1', step > s.id ? 'bg-accent' : 'bg-border')}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">
          {/* Step 1: Tenant Selection */}
          {step === 1 && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Select Tenant
              </label>
              <div className="grid grid-cols-1 gap-2">
                {tenantOptions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => update('tenantId', t.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                      form.tenantId === t.id
                        ? 'border-secondary bg-secondary/5'
                        : 'border-border bg-surface hover:bg-surface-elevated'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        form.tenantId === t.id ? 'bg-secondary/10' : 'bg-neutral/10'
                      )}
                    >
                      <Database
                        className={cn(
                          'h-4 w-4',
                          form.tenantId === t.id ? 'text-secondary' : 'text-text-muted'
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          form.tenantId === t.id ? 'text-secondary' : 'text-text-primary'
                        )}
                      >
                        {t.name}
                      </p>
                      <p className="text-xs text-text-muted">{t.desc}</p>
                    </div>
                    {form.tenantId === t.id && <Check className="h-4 w-4 text-secondary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Export Type */}
          {step === 2 && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Data Category
              </label>
              <div className="grid grid-cols-2 gap-3">
                {exportTypes.map((t) => {
                  const icons = {
                    Database,
                    Users,
                    CreditCard,
                    Calendar,
                    MessageSquare,
                    BarChart3,
                  };
                  const Icon = icons[t.icon] || Database;
                  return (
                    <button
                      key={t.key}
                      onClick={() => update('exportType', t.key)}
                      className={cn(
                        'flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all',
                        form.exportType === t.key
                          ? 'border-secondary bg-secondary/5'
                          : 'border-border bg-surface hover:bg-surface-elevated'
                      )}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Icon
                          className={cn(
                            'h-4 w-4',
                            form.exportType === t.key ? 'text-secondary' : 'text-text-muted'
                          )}
                        />
                        <span
                          className={cn(
                            'text-sm font-medium',
                            form.exportType === t.key ? 'text-secondary' : 'text-text-primary'
                          )}
                        >
                          {t.label}
                        </span>
                        {form.exportType === t.key && (
                          <Check className="h-3.5 w-3.5 text-secondary ml-auto" />
                        )}
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">{t.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Format */}
          {step === 3 && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Export Format
              </label>
              <div className="grid grid-cols-1 gap-2">
                {exportFormats.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => update('format', f.key)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                      form.format === f.key
                        ? 'border-secondary bg-secondary/5'
                        : 'border-border bg-surface hover:bg-surface-elevated'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-bold',
                        form.format === f.key
                          ? 'bg-secondary/10 text-secondary'
                          : 'bg-neutral/10 text-text-muted'
                      )}
                    >
                      {f.ext}
                    </div>
                    <div className="flex-1">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          form.format === f.key ? 'text-secondary' : 'text-text-primary'
                        )}
                      >
                        {f.label}
                      </p>
                      <p className="text-xs text-text-muted">{f.desc}</p>
                    </div>
                    {form.format === f.key && <Check className="h-4 w-4 text-secondary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Options */}
          {step === 4 && (
            <div className="space-y-5">
              {/* Date Range */}
              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                  Date Range
                </label>
                <div className="flex gap-2">
                  {['all', '30d', '90d', '1y', 'custom'].map((range) => (
                    <button
                      key={range}
                      onClick={() => update('dateRange', range)}
                      className={cn(
                        'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                        form.dateRange === range
                          ? 'border-secondary bg-secondary/10 text-secondary'
                          : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                      )}
                    >
                      {range === 'all'
                        ? 'All Time'
                        : range === '30d'
                          ? 'Last 30 Days'
                          : range === '90d'
                            ? 'Last 90 Days'
                            : range === '1y'
                              ? 'Last Year'
                              : 'Custom'}
                    </button>
                  ))}
                </div>
                {form.dateRange === 'custom' && (
                  <div className="mt-3 flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-text-muted">Start Date</label>
                      <input
                        type="date"
                        value={form.customStart}
                        onChange={(e) => update('customStart', e.target.value)}
                        className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-text-muted">End Date</label>
                      <input
                        type="date"
                        value={form.customEnd}
                        onChange={(e) => update('customEnd', e.target.value)}
                        className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Additional Options
                </label>

                <label className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 cursor-pointer hover:bg-surface-elevated">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Include Soft-Deleted Records
                    </p>
                    <p className="text-xs text-text-muted">
                      Export records marked as deleted within retention period
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.includeDeleted}
                    onChange={(e) => update('includeDeleted', e.target.checked)}
                    className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
                  />
                </label>

                <label className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 cursor-pointer hover:bg-surface-elevated">
                  <div>
                    <p className="text-sm font-medium text-text-primary">Anonymize PII in Export</p>
                    <p className="text-xs text-text-muted">
                      Replace personal data with pseudonyms for testing
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.anonymizePii}
                    onChange={(e) => update('anonymizePii', e.target.checked)}
                    className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
                  />
                </label>
              </div>

              {/* Notification */}
              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                  Notification Email
                </label>
                <input
                  type="email"
                  placeholder="admin@unifiedpms.com"
                  value={form.notifyEmail}
                  onChange={(e) => update('notifyEmail', e.target.value)}
                  className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted"
                />
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Export Summary
                </h4>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-text-muted">Tenant:</span>
                    <span className="ml-2 text-text-primary font-medium">{tenantMeta?.name}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Data Type:</span>
                    <span className="ml-2 text-text-primary font-medium">{typeMeta?.label}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Format:</span>
                    <span className="ml-2 text-text-primary font-medium">
                      {formatMeta?.label} ({formatMeta?.ext})
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Date Range:</span>
                    <span className="ml-2 text-text-primary font-medium">
                      {form.dateRange === 'all'
                        ? 'All Time'
                        : form.dateRange === 'custom'
                          ? `${form.customStart} to ${form.customEnd}`
                          : form.dateRange}
                    </span>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex items-center gap-4 text-xs">
                    {form.includeDeleted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 border border-warning/20 px-2 py-0.5 text-warning">
                        <FileText className="h-3 w-3" /> Includes deleted records
                      </span>
                    )}
                    {form.anonymizePii && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 border border-secondary/20 px-2 py-0.5 text-secondary">
                        <Users className="h-3 w-3" /> PII anonymized
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 flex items-start gap-2">
                <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <p className="text-xs text-accent">
                  This export complies with GDPR Article 20 (Data Portability). The file will be
                  available for download for 30 days and then automatically deleted.
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

          {step < 5 ? (
            <Button type="button" onClick={() => setStep(step + 1)}>
              Next <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Download className="mr-1.5 h-4 w-4" /> Start Export
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
