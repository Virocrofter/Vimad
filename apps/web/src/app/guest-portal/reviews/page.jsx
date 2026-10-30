/* src/app/guest-portal/reviews/page.jsx — G5: post-stay reviews */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { getGuestToken, guestPortalApi, setGuestToken } from '../../../hooks/guestPortalApi';
import { useStayDetails } from '../../../hooks/useGuestPortalData';
import { useMyReview, useSubmitReview } from '../../../hooks/useGuestComms';

const statusMeta = {
  pending: {
    label: 'Under review',
    chip: 'bg-warning/10 text-warning border-warning/20',
    icon: AlertTriangle,
  },
  approved: {
    label: 'Published — thank you',
    chip: 'bg-accent/10 text-accent border-accent/20',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Not published',
    chip: 'bg-danger/10 text-danger border-danger/20',
    icon: XCircle,
  },
};

export default function ReviewsPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data: stay } = useStayDetails();
  const { data: mineData } = useMyReview();
  const submit = useSubmitReview();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hasToken) {
      // Deep link from transactional emails: ?cn=CONF&ln=Lastname → verify → stay.
      const params = new URLSearchParams(window.location.search);
      const cn = params.get('cn');
      const ln = params.get('ln');
      if (cn && ln) {
        guestPortalApi
          .verify(cn, ln)
          .then((r) => {
            setGuestToken(r.token);
            window.location.reload();
          })
          .catch(() => navigate('/guest-portal/auth/login', { replace: true }));
      } else {
        navigate('/guest-portal/auth/login', { replace: true });
      }
    }
  }, [hasToken, navigate]);

  if (!hasToken) return null;

  const review = mineData?.review ?? null;
  const checkedOut = stay?.status === 'checked_out';

  const handleSubmit = () => {
    setError(null);
    submit.mutate(
      { rating, title: title.trim() || undefined, body: body.trim() },
      { onError: (e) => setError(e.message) }
    );
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Reviews</h1>
          <p className="text-xs text-text-muted">{stay?.propertyName ?? ''}</p>
        </div>
      </div>

      {review ? (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-4 w-4',
                    i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-border'
                  )}
                />
              ))}
            </div>
            {(() => {
              const meta = statusMeta[review.status] ?? statusMeta.pending;
              const Icon = meta.icon;
              return (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium',
                    meta.chip
                  )}
                >
                  <Icon className="h-3 w-3" /> {meta.label}
                </span>
              );
            })()}
          </div>
          {review.title && (
            <p className="text-sm font-semibold text-text-primary">{review.title}</p>
          )}
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{review.body}</p>
          {review.status === 'rejected' && review.moderationNote && (
            <p className="text-xs text-danger">Note: {review.moderationNote}</p>
          )}
          {review.status === 'rejected' && (
            <p className="text-xs text-text-muted">
              You can submit a revised review — it will re-enter moderation.
            </p>
          )}
        </div>
      ) : checkedOut ? (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">How was your stay?</h3>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => {
              const v = i + 1;
              return (
                <button
                  key={v}
                  onMouseEnter={() => setHover(v)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(v)}
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors',
                      (hover || rating) >= v ? 'fill-amber-400 text-amber-400' : 'text-border'
                    )}
                  />
                </button>
              );
            })}
            <span className="ml-2 text-xs text-text-muted">
              {rating > 0 ? `${rating}/5` : 'Tap to rate'}
            </span>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Headline (optional)"
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Tell us about your stay — what stood out? (min 10 characters)"
            className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-text-primary resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button
            className="w-full"
            disabled={rating === 0 || body.trim().length < 10 || submit.isPending}
            onClick={handleSubmit}
          >
            {submit.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Star className="mr-2 h-4 w-4" />
            )}
            Submit review
          </Button>
          <p className="text-[10px] text-text-muted">
            Reviews are moderated before publication — one per stay.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-6 text-center">
          <Star className="h-7 w-7 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">
            Reviews open after check-out — we'd love your feedback then.
          </p>
        </div>
      )}
    </div>
  );
}
