/* src/app/guest-portal/stay/issues/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wifi,
  Volume2,
  Droplets,
  Snowflake,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Clock,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guestSupportApi } from '../../../../hooks/guestSupportApi';
import { getGuestToken } from '../../../../hooks/guestPortalApi';
import { timeAgo } from '../../../../lib/guest-utils';

const categories = [
  {
    type: 'maintenance',
    label: 'Plumbing',
    description: 'Leaks, toilet, shower issues',
    icon: Droplets,
  },
  {
    type: 'maintenance',
    label: 'Climate',
    description: 'AC or heating not working',
    icon: Snowflake,
  },
  {
    type: 'maintenance',
    label: 'Electrical',
    description: 'Lights, outlets, TV, safe',
    icon: Zap,
  },
  {
    type: 'maintenance',
    label: 'Noise',
    description: 'Excessive noise disturbance',
    icon: Volume2,
  },
  {
    type: 'maintenance',
    label: 'WiFi',
    description: 'Internet connection problems',
    icon: Wifi,
  },
  {
    type: 'general',
    label: 'Other',
    description: 'Anything else in your room',
    icon: AlertTriangle,
  },
];

const urgencyMap = {
  low: 'low',
  normal: 'medium',
  high: 'high',
  urgent: 'urgent',
};

const statusMeta = {
  open: { label: 'Open', cls: 'bg-warning/10 text-warning' },
  in_progress: { label: 'In Progress', cls: 'bg-info/10 text-info' },
  waiting_guest: { label: 'Waiting on You', cls: 'bg-secondary/10 text-secondary' },
  resolved: { label: 'Resolved', cls: 'bg-accent/10 text-accent' },
  closed: { label: 'Closed', cls: 'bg-neutral/10 text-text-muted' },
};

export default function IssuesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasToken = Boolean(getGuestToken());

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [submitted, setSubmitted] = useState(false);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['guest-tickets'],
    queryFn: () => guestSupportApi.list(),
    enabled: hasToken,
    refetchInterval: 30_000,
  });

  const createTicket = useMutation({
    mutationFn: (input) => guestSupportApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guest-tickets'] });
      setSubmitted(true);
      setSelectedCategory(null);
      setDescription('');
      setUrgency('normal');
      setTimeout(() => setSubmitted(false), 4000);
    },
  });

  const handleSubmit = () => {
    if (!selectedCategory || !description.trim()) return;
    createTicket.mutate({
      subject: `${selectedCategory.label}: ${description.trim().slice(0, 80)}`,
      message: `Room issue (${selectedCategory.label}): ${description.trim()}`,
      category: selectedCategory.type,
      priority: urgencyMap[urgency] ?? 'medium',
    });
  };

  const urgencyOptions = [
    { id: 'low', label: 'Low', description: 'Not urgent, can wait', color: 'text-accent' },
    { id: 'normal', label: 'Normal', description: 'Standard priority', color: 'text-info' },
    { id: 'high', label: 'High', description: 'Needs attention soon', color: 'text-warning' },
    {
      id: 'urgent',
      label: 'Urgent',
      description: 'Immediate attention needed',
      color: 'text-danger',
    },
  ];

  if (!hasToken) {
    navigate('/guest-portal/auth/login', { replace: true });
    return null;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/stay')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Report an Issue</h1>
          <p className="text-xs text-text-muted">
            Maintenance and in-room problems go straight to our engineering team
          </p>
        </div>
      </div>

      {/* Success Toast */}
      {submitted && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
          <div>
            <p className="text-sm font-medium text-text-primary">Issue Reported!</p>
            <p className="text-xs text-text-secondary">
              Our team will address it as soon as possible.
            </p>
          </div>
        </div>
      )}
      {createTicket.isError && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          <p className="text-sm text-danger">
            {createTicket.error?.message ?? 'Could not submit. Please try again.'}
          </p>
        </div>
      )}

      {/* Category Grid */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">What’s the issue?</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'rounded-xl border p-4 text-left transition-all',
                selectedCategory?.label === cat.label
                  ? 'border-secondary bg-secondary/5'
                  : 'border-border bg-surface hover:shadow-md'
              )}
            >
              <cat.icon
                className={cn(
                  'h-5 w-5 mb-2',
                  selectedCategory?.label === cat.label ? 'text-secondary' : 'text-text-muted'
                )}
              />
              <p
                className={cn(
                  'text-sm font-medium',
                  selectedCategory?.label === cat.label ? 'text-secondary' : 'text-text-primary'
                )}
              >
                {cat.label}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">{cat.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Details Form */}
      {selectedCategory && (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Tell us more about the {selectedCategory.label.toLowerCase()} issue
          </h3>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the problem — e.g. the bathroom sink is leaking"
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div>
            <p className="text-xs font-medium text-text-secondary mb-2">Urgency</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {urgencyOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setUrgency(opt.id)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left transition-colors',
                    urgency === opt.id
                      ? 'border-secondary bg-secondary/5'
                      : 'border-border bg-background hover:bg-surface-elevated'
                  )}
                >
                  <p className={cn('text-xs font-medium', opt.color)}>{opt.label}</p>
                  <p className="text-[10px] text-text-muted">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            disabled={!description.trim() || createTicket.isPending}
            onClick={handleSubmit}
          >
            {createTicket.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              'Submit Issue'
            )}
          </Button>
        </div>
      )}

      {/* Previous Reports */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Your Reports</h2>
        {isLoading ? (
          <div className="text-center py-8 rounded-xl border border-border bg-surface">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-text-muted mb-2" />
            <p className="text-sm text-text-muted">Loading…</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-border bg-surface">
            <CheckCircle2 className="mx-auto h-10 w-10 text-text-muted mb-3" />
            <p className="text-sm text-text-muted">No issues reported</p>
            <p className="text-xs text-text-secondary mt-1">
              Anything you report will show up here with live status
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => {
              const meta = statusMeta[t.status] ?? statusMeta.open;
              return (
                <button
                  key={t.id}
                  onClick={() => navigate('/guest-portal/support/tickets')}
                  className="w-full flex items-center justify-between rounded-xl border border-border bg-surface p-4 text-left hover:bg-surface-elevated transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warning/10">
                      <Clock className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{t.subject}</p>
                      <p className="text-xs text-text-muted">
                        {t.number} · Reported {timeAgo(t.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-medium', meta.cls)}
                  >
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
