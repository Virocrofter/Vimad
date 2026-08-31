/* src/app/guest-portal/reviews/history/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Star, MessageSquare, ThumbsUp, Filter, Search,
  Calendar, Hotel, Edit3, Trash2
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { ReviewCard, RatingBreakdown } from '../components';

const myReviews = [
  {
    id: 'rev-001',
    author: 'John Smith',
    rating: 5,
    date: 'Aug 16, 2026',
    property: 'Grand Hotel Boston',
    stayDate: 'Aug 12-15, 2026',
    comment: 'Wonderful stay! The staff was incredibly helpful, especially Sarah at the front desk who went above and beyond to accommodate our late checkout request. The room was spotless and the bed was extremely comfortable. Will definitely be returning!',
    verified: true,
    categories: { cleanliness: 5, service: 5, location: 4, value: 4, amenities: 5, comfort: 5 },
    photos: [],
    helpfulCount: 12,
    status: 'published',
  },
  {
    id: 'rev-002',
    author: 'John Smith',
    rating: 4,
    date: 'Mar 10, 2026',
    property: 'Seaside Resort Miami',
    stayDate: 'Mar 5-8, 2026',
    comment: 'Great location right on the beach. The pool area was beautiful and the restaurant had excellent seafood. Only minor complaint was the WiFi was a bit spotty in the room, but overall a very enjoyable stay.',
    verified: true,
    categories: { cleanliness: 4, service: 4, location: 5, value: 4, amenities: 4, comfort: 4 },
    photos: [],
    helpfulCount: 8,
    status: 'published',
  },
  {
    id: 'rev-003',
    author: 'John Smith',
    rating: 5,
    date: 'Dec 22, 2025',
    property: 'Mountain Lodge Aspen',
    stayDate: 'Dec 18-22, 2025',
    comment: 'Perfect winter getaway! The fireplace in the room was such a nice touch, and the ski-in/ski-out access was incredibly convenient. The hot chocolate service in the lobby every afternoon was delightful.',
    verified: true,
    categories: { cleanliness: 5, service: 5, location: 5, value: 4, amenities: 5, comfort: 5 },
    photos: [],
    helpfulCount: 24,
    status: 'published',
  },
];

const ratingDistribution = { 5: 2, 4: 1, 3: 0, 2: 0, 1: 0 };

export default function ReviewHistoryPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [reviews, setReviews] = useState(myReviews);

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  const filteredReviews = filter === 'all'
    ? reviews
    : reviews.filter(r => r.rating === parseInt(filter));

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal')}
          className="p-2 -ml-2 rounded-lg hover:bg-surface-elevated"
        >
          <ChevronLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">My Reviews</h1>
          <p className="text-sm text-text-secondary">{reviews.length} reviews submitted</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-5 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className="h-6 w-6 text-warning fill-warning" />
            <span className="text-3xl font-bold text-text-primary">{avgRating}</span>
          </div>
          <p className="text-xs text-text-muted">Average rating</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ThumbsUp className="h-6 w-6 text-accent" />
            <span className="text-3xl font-bold text-text-primary">
              {reviews.reduce((s, r) => s + r.helpfulCount, 0)}
            </span>
          </div>
          <p className="text-xs text-text-muted">Helpful votes</p>
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Rating Breakdown</h3>
        <RatingBreakdown ratings={ratingDistribution} />
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Reviews' },
          { id: '5', label: '5 Stars' },
          { id: '4', label: '4 Stars' },
          { id: '3', label: '3 Stars' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
              filter === f.id
                ? 'border-secondary bg-secondary/10 text-secondary'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {filteredReviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
        {filteredReviews.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-10 w-10 text-text-muted mb-3" />
            <p className="text-sm text-text-muted">No reviews found</p>
          </div>
        )}
      </div>
    </div>
  );
}
