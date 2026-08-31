/* src/app/admin/feedback/ResponseModal.jsx */
import { useState } from 'react';
import { X, Send, MessageSquare, User, Building2, Star } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { NpsScoreBadge, SentimentBadge, CategoryBadge } from './components';

const responseTemplates = [
  {
    id: 'thanks-positive',
    label: 'Thank You (Positive)',
    text: "Thank you so much for your feedback! We're thrilled that you're enjoying {{feature}}. Your input helps us prioritize what matters most to our users.",
  },
  {
    id: 'acknowledge-issue',
    label: 'Acknowledge Issue',
    text: "Thank you for bringing this to our attention. We sincerely apologize for the inconvenience with {{issue}}. Our team is investigating and we'll have an update for you within {{timeframe}}.",
  },
  {
    id: 'feature-roadmap',
    label: 'Feature on Roadmap',
    text: "Great suggestion! We're actually planning to build {{feature}} in {{timeframe}}. I've added your vote to the feature request ({{frId}}) and you'll be notified when it's available for beta testing.",
  },
  {
    id: 'workaround',
    label: 'Provide Workaround',
    text: "Thank you for your patience. While we work on a permanent fix, here's a workaround: {{workaround}}. Please let us know if this helps or if you need further assistance.",
  },
  {
    id: 'escalate',
    label: 'Escalate to Team',
    text: "I've escalated this to our {{team}} team for immediate review. Someone will reach out to you directly within {{timeframe}} to resolve this.",
  },
];

export default function ResponseModal({ response, onClose, onSend }) {
  const [text, setText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  if (!response) return null;

  const applyTemplate = (template) => {
    setSelectedTemplate(template.id);
    let filled = template.text
      .replace('{{feature}}', response.keywords?.[0] || 'this feature')
      .replace('{{issue}}', response.keywords?.[0] || 'this issue')
      .replace('{{timeframe}}', '24 hours')
      .replace('{{frId}}', 'FR-001')
      .replace('{{workaround}}', 'You can manually refresh the page to sync the latest data')
      .replace('{{team}}', 'Engineering');
    setText(filled);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(response.id, text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <MessageSquare className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Reply to Feedback</h3>
              <p className="text-xs text-text-muted">
                {response.id} · {response.tenantName}
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

        <div className="p-6 space-y-5">
          {/* Original Feedback Preview */}
          <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <NpsScoreBadge score={response.score} />
                <SentimentBadge sentiment={response.sentiment} />
                <CategoryBadge category={response.category} />
              </div>
            </div>
            <p className="text-sm text-text-secondary italic">"{response.comment}"</p>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <User className="h-3 w-3" /> {response.user.name}
              <span>·</span>
              <Building2 className="h-3 w-3" /> {response.tenantName}
            </div>
          </div>

          {/* Templates */}
          <div>
            <label className="mb-2 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Quick Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {responseTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                    selectedTemplate === t.id
                      ? 'border-secondary bg-secondary/10 text-secondary'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Response Text */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Your Response
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Write a personalized response..."
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
            <p className="mt-1 text-[10px] text-text-muted">{text.length} characters</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={!text.trim()}>
              <Send className="mr-1.5 h-4 w-4" /> Send Response
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
