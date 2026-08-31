/* src/app/admin/reports/ScheduleModal.jsx */
import { useState } from 'react';
import {
  X, Clock, Mail, Check, Calendar, Bell, BellOff,
  FileSpreadsheet, FileText, FileJson, Image, Trash2
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { exportFormats, scheduleFrequencies } from './data';

export default function ScheduleModal({ report, onClose, onSave }) {
  const existing = report?.schedule;
  const [form, setForm] = useState({
    frequency: existing?.frequency || 'daily',
    time: existing?.time || '08:00',
    format: existing?.format || 'csv',
    recipients: existing?.recipients || [''],
    paused: existing?.paused || false,
  });

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const addRecipient = () => {
    setForm(prev => ({ ...prev, recipients: [...prev.recipients, ''] }));
  };

  const updateRecipient = (index, value) => {
    setForm(prev => ({
      ...prev,
      recipients: prev.recipients.map((r, i) => i === index ? value : r),
    }));
  };

  const removeRecipient = (index) => {
    setForm(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    const cleaned = {
      ...form,
      recipients: form.recipients.filter(r => r.trim() !== ''),
    };
    if (cleaned.recipients.length === 0) {
      onSave(null); // Remove schedule if no recipients
    } else {
      onSave(cleaned);
    }
    onClose();
  };

  const handleRemove = () => {
    onSave(null);
    onClose();
  };

  const formatIcons = {
    csv: FileSpreadsheet, xlsx: FileSpreadsheet, pdf: FileText,
    json: FileJson, png: Image,
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Schedule Export</h3>
              <p className="text-xs text-text-muted">{report?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Frequency */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {scheduleFrequencies.map(freq => (
                <button
                  key={freq.key}
                  onClick={() => updateForm('frequency', freq.key)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    form.frequency === freq.key
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {freq.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time (not for hourly) */}
          {form.frequency !== 'hourly' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Run Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => updateForm('time', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-[10px] text-text-muted">All times in UTC</p>
            </div>
          )}

          {/* Export Format */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Export Format</label>
            <div className="grid grid-cols-5 gap-2">
              {exportFormats.map(fmt => {
                const Icon = formatIcons[fmt.key] || FileText;
                return (
                  <button
                    key={fmt.key}
                    onClick={() => updateForm('format', fmt.key)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors',
                      form.format === fmt.key
                        ? 'border-secondary bg-secondary/10 text-secondary'
                        : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', form.format === fmt.key ? 'text-secondary' : 'text-text-muted')} />
                    <span className="text-[10px] font-medium">{fmt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Email Recipients</label>
            <div className="space-y-2">
              {form.recipients.map((recipient, i) => (
                <div key={i} className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      type="email"
                      value={recipient}
                      onChange={(e) => updateRecipient(i, e.target.value)}
                      placeholder="email@company.com"
                      className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  {form.recipients.length > 1 && (
                    <button
                      onClick={() => removeRecipient(i)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-text-muted hover:text-danger hover:bg-danger/5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addRecipient} className="w-full">
              <Mail className="mr-1.5 h-3.5 w-3.5" /> Add Recipient
            </Button>
          </div>

          {/* Pause Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              {form.paused ? <BellOff className="h-5 w-5 text-text-muted" /> : <Bell className="h-5 w-5 text-accent" />}
              <div>
                <p className="text-sm font-medium text-text-primary">{form.paused ? 'Schedule Paused' : 'Schedule Active'}</p>
                <p className="text-xs text-text-muted">
                  {form.paused ? 'Exports will not run until resumed' : 'Exports will run automatically'}
                </p>
              </div>
            </div>
            <button
              onClick={() => updateForm('paused', !form.paused)}
              className={cn(
                'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                !form.paused ? 'bg-accent' : 'bg-border'
              )}
            >
              <span className={cn(
                'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
                !form.paused ? 'translate-x-6' : 'translate-x-1'
              )} />
            </button>
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-text-muted">
              <span className="font-medium text-text-secondary">Summary:</span>{' '}
              This report will be exported as{' '}
              <span className="font-medium text-text-primary">{exportFormats.find(f => f.key === form.format)?.label}</span>{' '}
              {form.frequency === 'hourly' ? 'every hour' : `${scheduleFrequencies.find(f => f.key === form.frequency)?.label.toLowerCase()} at ${form.time} UTC`}{' '}
              and sent to {form.recipients.filter(r => r.trim()).length} recipient(s).
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border p-4 flex items-center justify-between">
          {existing && (
            <Button type="button" variant="ghost" className="text-danger hover:bg-danger/5" onClick={handleRemove}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Remove Schedule
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={handleSave}>
              <Check className="mr-1.5 h-4 w-4" /> Save Schedule
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
