/* src/app/admin/onboarding/InterventionModal.jsx */
import { useState } from 'react';
import {
  X,
  Check,
  Flag,
  Mail,
  Phone,
  Monitor,
  Video,
  Tag,
  Clock,
  MessageSquare,
  Send,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { interventionTypes, funnelStages } from './data';

const interventionTemplates = [
  {
    id: 't1',
    type: 'email',
    subject: 'Need help getting started?',
    body: "Hi {{name}}, I noticed you started setting up your property but haven't finished. I'd love to help you get everything configured. Would you like to schedule a quick call?",
    trigger: 'property_setup',
  },
  {
    id: 't2',
    type: 'email',
    subject: 'Let us help you connect your channels',
    body: 'Hi {{name}}, connecting your booking channels can be tricky. Our team can walk you through it in 10 minutes. Reply to schedule a time.',
    trigger: 'integrations',
  },
  {
    id: 't3',
    type: 'call',
    subject: 'Onboarding check-in call',
    body: 'Scheduled 15-minute call to review progress and answer questions.',
    trigger: 'any',
  },
  {
    id: 't4',
    type: 'extend_trial',
    subject: 'Trial Extension Offer',
    body: "We'd like to offer you an additional 7 days on your trial to complete your setup. No action needed — your trial has been extended.",
    trigger: 'trial_expired',
  },
  {
    id: 't5',
    type: 'discount',
    subject: '20% off your first 3 months',
    body: "To help you get started, we're offering 20% off your first 3 months. Use code ONBOARD20 at checkout.",
    trigger: 'billing_setup',
  },
  {
    id: 't6',
    type: 'demo',
    subject: 'Live platform walkthrough',
    body: "Join us for a 30-minute live demo where we'll show you how to get the most out of Vimad.",
    trigger: 'any',
  },
  {
    id: 't7',
    type: 'in_app',
    subject: 'Complete your room setup',
    body: "You're almost there! Finish configuring your room types to start accepting reservations.",
    trigger: 'room_config',
  },
];

export default function InterventionModal({ tenant, onClose, onSave }) {
  const [form, setForm] = useState({
    type: 'email',
    subject: '',
    body: '',
    scheduledAt: '',
    useTemplate: true,
    selectedTemplate: '',
  });
  const [preview, setPreview] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleTemplateSelect = (templateId) => {
    const template = interventionTemplates.find((t) => t.id === templateId);
    if (template) {
      setForm((prev) => ({
        ...prev,
        selectedTemplate: templateId,
        type: template.type,
        subject: template.subject,
        body: template.body.replace(/{{name}}/g, tenant?.name || 'there'),
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: `INT-${Date.now().toString(36).toUpperCase()}`,
      type: form.type,
      subject: form.subject,
      body: form.body,
      status: form.type === 'call' || form.type === 'demo' ? 'scheduled' : 'sent',
      sentAt:
        form.type === 'email' || form.type === 'in_app'
          ? new Date().toISOString().replace('T', ' ').slice(0, 19)
          : null,
      scheduledAt: form.type === 'call' || form.type === 'demo' ? form.scheduledAt : null,
      notes: form.body.slice(0, 100),
    });
    onClose();
  };

  if (!tenant) return null;

  const dropOffStage = tenant.dropOffStage;
  const filteredTemplates = dropOffStage
    ? interventionTemplates.filter((t) => t.trigger === 'any' || t.trigger === dropOffStage)
    : interventionTemplates;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <Flag className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Create Intervention</h3>
              <p className="text-xs text-text-muted">
                {tenant.name} · {tenant.id}
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
          {/* Template Selection */}
          <div>
            <label className="mb-2 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Suggested Templates
            </label>
            <div className="space-y-2">
              {filteredTemplates.map((template) => {
                const intMeta = interventionTypes.find((t) => t.id === template.type);
                const selected = form.selectedTemplate === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template.id)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all',
                      selected
                        ? 'border-secondary bg-secondary/5'
                        : 'border-border bg-surface hover:border-secondary/30'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                        intMeta?.bg
                      )}
                    >
                      {template.type === 'email' && (
                        <Mail className={cn('h-4 w-4', intMeta?.color)} />
                      )}
                      {template.type === 'call' && (
                        <Phone className={cn('h-4 w-4', intMeta?.color)} />
                      )}
                      {template.type === 'in_app' && (
                        <Monitor className={cn('h-4 w-4', intMeta?.color)} />
                      )}
                      {template.type === 'demo' && (
                        <Video className={cn('h-4 w-4', intMeta?.color)} />
                      )}
                      {template.type === 'discount' && (
                        <Tag className={cn('h-4 w-4', intMeta?.color)} />
                      )}
                      {template.type === 'extend_trial' && (
                        <Clock className={cn('h-4 w-4', intMeta?.color)} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          selected ? 'text-secondary' : 'text-text-primary'
                        )}
                      >
                        {template.subject}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5 truncate">{template.body}</p>
                    </div>
                    {selected && <Check className="h-4 w-4 text-secondary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Override */}
          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() => update('useTemplate', !form.useTemplate)}
              className="text-xs text-secondary hover:underline mb-3"
            >
              {form.useTemplate ? 'Or create custom intervention' : 'Use a template instead'}
            </button>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Intervention Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {interventionTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => update('type', type.id)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                        form.type === type.id
                          ? cn(type.bg, type.color, 'border-current')
                          : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                      )}
                    >
                      {type.id === 'email' && <Mail className="h-3.5 w-3.5" />}
                      {type.id === 'call' && <Phone className="h-3.5 w-3.5" />}
                      {type.id === 'in_app' && <Monitor className="h-3.5 w-3.5" />}
                      {type.id === 'demo' && <Video className="h-3.5 w-3.5" />}
                      {type.id === 'discount' && <Tag className="h-3.5 w-3.5" />}
                      {type.id === 'extend_trial' && <Clock className="h-3.5 w-3.5" />}
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => update('subject', e.target.value)}
                  placeholder="Intervention subject..."
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {(form.type === 'call' || form.type === 'demo') && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Schedule For
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.scheduledAt}
                    onChange={(e) => update('scheduledAt', e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Message / Notes
                </label>
                <textarea
                  value={form.body}
                  onChange={(e) => update('body', e.target.value)}
                  rows={4}
                  placeholder="Enter your message or notes..."
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
            </div>
          </div>

          {/* Preview Toggle */}
          {form.body && (
            <div>
              <button
                type="button"
                onClick={() => setPreview(!preview)}
                className="text-xs text-secondary hover:underline"
              >
                {preview ? 'Hide preview' : 'Show preview'}
              </button>
              {preview && (
                <div className="mt-2 rounded-lg border border-border bg-background p-3">
                  <p className="text-xs text-text-muted mb-1">Preview:</p>
                  <p className="text-sm text-text-primary">{form.body}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary">
              <Send className="mr-1.5 h-4 w-4" />{' '}
              {form.type === 'call' || form.type === 'demo' ? 'Schedule' : 'Send Intervention'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
