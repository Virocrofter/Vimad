/* src/app/guest-portal/reviews/components.jsx */
import { useState } from 'react';
import {
  Star,
  ThumbsUp,
  MessageCircle,
  Image,
  ChevronDown,
  ChevronUp,
  Flag,
  CheckCircle2,
  Hotel,
  Calendar,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

/* ─── Review Card ─── */
export function ReviewCard({ review, onHelpful }) {
  const [expanded, setExpanded] = useState(false);
  const [markedHelpful, setMarkedHelpful] = useState(false);

  const handleHelpful = () => {
    if (!markedHelpful) {
      setMarkedHelpful(true);
      onHelpful?.(review.id);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-sm font-bold text-secondary">
            {review.author
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{review.author}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-3 w-3',
                      star <= review.rating ? 'text-warning fill-warning' : 'text-border'
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-text-muted">- {review.date}</span>
            </div>
          </div>
        </div>
        {review.verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
            <CheckCircle2 className="h-3 w-3" /> Verified Stay
          </span>
        )}
      </div>

      {/* Property */}
      <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
        <Hotel className="h-3.5 w-3.5" />
        <span>{review.property}</span>
        <span>-</span>
        <Calendar className="h-3.5 w-3.5" />
        <span>{review.stayDate}</span>
      </div>

      {/* Comment */}
      <p
        className={cn(
          'mt-3 text-sm text-text-secondary leading-relaxed',
          !expanded && review.comment.length > 200 && 'line-clamp-3'
        )}
      >
        {review.comment}
      </p>
      {review.comment.length > 200 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-xs text-secondary hover:underline inline-flex items-center gap-1"
        >
          {expanded ? (
            <>
              Less <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              More <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      )}

      {/* Category Ratings */}
      {review.categories && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(review.categories).map(([key, val]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 rounded-full bg-background border border-border px-2.5 py-1 text-[10px] font-medium text-text-secondary"
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}: {val}/5
            </span>
          ))}
        </div>
      )}

      {/* Photos */}
      {review.photos?.length > 0 && (
        <div className="mt-3 flex gap-2">
          {review.photos.map((photo, i) => (
            <div key={i} className="h-16 w-16 rounded-lg border border-border overflow-hidden">
              <img src={photo} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-border flex items-center gap-4">
        <button
          onClick={handleHelpful}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium transition-colors',
            markedHelpful ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
          )}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          Helpful{' '}
          {review.helpfulCount > 0 &&
            `(${markedHelpful ? review.helpfulCount + 1 : review.helpfulCount})`}
        </button>
        <button className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary">
          <MessageCircle className="h-3.5 w-3.5" />
          Reply
        </button>
        <button className="flex items-center gap-1.5 text-xs text-text-muted hover:text-danger ml-auto">
          <Flag className="h-3.5 w-3.5" />
          Report
        </button>
      </div>
    </div>
  );
}

/* ─── Rating Breakdown ─── */
export function RatingBreakdown({ ratings }) {
  const total = Object.values(ratings).reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = ratings[star] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-3">
            <span className="text-xs text-text-secondary w-8">{star} star</span>
            <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-warning transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-text-muted w-8 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
