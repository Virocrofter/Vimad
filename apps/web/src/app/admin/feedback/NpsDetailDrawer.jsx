/* src/app/admin/feedback/NpsDetailDrawer.jsx */
import { useState } from 'react';
import {
  X,
  Star,
  MessageSquare,
  Send,
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  Tag,
  Hash,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import {
  SentimentBadge,
  NpsScoreBadge,
  CategoryBadge,
  KeywordTag,
  ResponseCard,
} from './components';
import { sentimentMeta } from './data';

export default function NpsDetailDrawer({ response, onClose, onRespond, onLinkToFeature }) {
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);

  if (!response) return null;

  const meta = sentimentMeta[response.sentiment];
  const SentimentIcon =
    response.sentiment === 'positive'
      ? ThumbsUp
      : response.sentiment === 'negative'
        ? ThumbsDown
        : Minus;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  meta.bgSoft || 'bg-surface'
                )}
              >
                <SentimentIcon className={cn('h-5 w-5', meta.iconColor || 'text-text-muted')} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">NPS Response</h2>
                <p className="text-xs text-text-muted font-mono">{response.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NpsScoreBadge score={response.score} />
              <button
                onClick={onClose}
                className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Tenant & User Info */}
          <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                <Building2 className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{response.tenantName}</p>
                <p className="text-xs text-text-muted font-mono">{response.tenantId}</p>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                  {response.user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{response.user.name}</p>
                  <p className="text-xs text-text-muted">{response.user.role}</p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-text-muted" /> {response.user.email}
                </div>
              </div>
            </div>
          </div>

          {/* Score & Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">Score</p>
              <div className="mt-1 flex items-center gap-2">
                <Star
                  className={cn(
                    'h-5 w-5',
                    response.score >= 9
                      ? 'text-accent'
                      : response.score >= 7
                        ? 'text-secondary'
                        : 'text-danger'
                  )}
                />
                <span
                  className={cn(
                    'text-2xl font-bold font-mono',
                    response.score >= 9
                      ? 'text-accent'
                      : response.score >= 7
                        ? 'text-secondary'
                        : 'text-danger'
                  )}
                >
                  {response.score}/10
                </span>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">Sentiment</p>
              <div className="mt-1">
                <SentimentBadge sentiment={response.sentiment} />
              </div>
              <p className="mt-1 text-xs text-text-muted">
                Score: {response.sentimentScore.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">Category</p>
              <div className="mt-1">
                <CategoryBadge category={response.category} />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">Touchpoint</p>
              <p className="mt-1 text-sm font-medium text-text-primary capitalize">
                {response.touchpoint.replace('-', ' ')}
              </p>
            </div>
          </div>

          {/* Comment */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5" /> Feedback Comment
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">{response.comment}</p>
          </div>

          {/* Keywords */}
          {response.keywords && response.keywords.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-2">
                <Hash className="h-3.5 w-3.5" /> Extracted Keywords
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {response.keywords.map((kw) => (
                  <KeywordTag key={kw} keyword={kw} />
                ))}
              </div>
            </div>
          )}

          {/* Follow-up Flag */}
          {response.followUp && !response.responded && (
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              <p className="text-xs text-warning">
                <strong>Follow-up required:</strong> This response needs a reply from the team.
              </p>
            </div>
          )}

          {/* Existing Response */}
          {response.responded && response.response && <ResponseCard response={response.response} />}

          {/* Reply Section */}
          {!response.responded && (
            <div className="space-y-3">
              {!showReply ? (
                <div className="flex items-center gap-2">
                  <Button onClick={() => setShowReply(true)}>
                    <Send className="mr-1.5 h-4 w-4" /> Reply to Response
                  </Button>
                  <Button variant="outline" onClick={() => onLinkToFeature?.(response)}>
                    <Tag className="mr-1.5 h-4 w-4" /> Link to Feature Request
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your response..."
                    rows={4}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowReply(false);
                        setReplyText('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        onRespond(response.id, replyText);
                        setShowReply(false);
                        setReplyText('');
                      }}
                    >
                      <Send className="mr-1.5 h-4 w-4" /> Send Response
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Metadata Footer */}
          <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Submitted: {response.createdAt}
              </span>
              <span>Version: {response.version}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
