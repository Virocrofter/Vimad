/* src/app/guest-portal/reviews/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  ChevronLeft,
  Camera,
  Send,
  ThumbsUp,
  MessageCircle,
  Hotel,
  Sparkles,
  Utensils,
  Users,
  MapPin,
  Wifi,
  BedDouble,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { useGuestStore } from '../store';
import { guestStays } from '../data';

const categories = [
  { id: 'cleanliness', label: 'Cleanliness', icon: Sparkles },
  { id: 'service', label: 'Service', icon: Users },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'value', label: 'Value', icon: ThumbsUp },
  { id: 'amenities', label: 'Amenities', icon: Hotel },
  { id: 'comfort', label: 'Comfort', icon: BedDouble },
];

export default function ReviewsPage() {
  const navigate = useNavigate();
  const { guest } = useGuestStore();
  const stay = guestStays[0];

  const [overallRating, setOverallRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState({});
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCategoryRating = (categoryId, rating) => {
    setCategoryRatings((prev) => ({ ...prev, [categoryId]: rating }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map((file) => ({
      id: `photo-${Date.now()}-${Math.random()}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
  };

  const removePhoto = (id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async () => {
    if (overallRating === 0) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const canSubmit = overallRating > 0 && comment.trim().length >= 10;

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 mb-6">
          <CheckCircle2 className="h-10 w-10 text-accent" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Thank You!</h2>
        <p className="text-sm text-text-secondary max-w-sm mb-2">
          Your review has been submitted successfully. We appreciate your feedback!
        </p>
        <p className="text-xs text-text-muted mb-8">
          +500 loyalty points have been added to your account
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/guest-portal')}>
            Back to Dashboard
          </Button>
          <Button onClick={() => navigate('/guest-portal/reviews/history')}>View My Reviews</Button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold text-text-primary">Review Your Stay</h1>
          <p className="text-sm text-text-secondary">{stay.property.name}</p>
        </div>
      </div>

      {/* Stay Card */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-lg bg-surface-elevated flex items-center justify-center">
            <Hotel className="h-8 w-8 text-secondary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{stay.room.type}</p>
            <p className="text-xs text-text-muted">
              Room {stay.room.number} - {stay.dates.nights} nights
            </p>
            <p className="text-xs text-text-muted">
              {new Date(stay.dates.arrival).toLocaleDateString()} -{' '}
              {new Date(stay.dates.departure).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Overall Rating */}
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <h3 className="text-sm font-semibold text-text-primary mb-4">
          How was your overall experience?
        </h3>
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setOverallRating(star)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  'h-10 w-10 transition-colors',
                  star <= (hoverRating || overallRating)
                    ? 'text-warning fill-warning'
                    : 'text-border'
                )}
              />
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          {overallRating === 0 && 'Tap a star to rate'}
          {overallRating === 1 && 'Poor'}
          {overallRating === 2 && 'Fair'}
          {overallRating === 3 && 'Good'}
          {overallRating === 4 && 'Very Good'}
          {overallRating === 5 && 'Excellent!'}
        </p>
      </div>

      {/* Category Ratings */}
      {overallRating > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Rate specific aspects</h3>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const rating = categoryRatings[cat.id] || 0;
            return (
              <div key={cat.id} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-32 shrink-0">
                  <Icon className="h-4 w-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">{cat.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleCategoryRating(cat.id, star)}
                      className="p-0.5"
                    >
                      <Star
                        className={cn(
                          'h-5 w-5 transition-colors',
                          star <= rating
                            ? 'text-warning fill-warning'
                            : 'text-border hover:text-warning/50'
                        )}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs text-text-muted w-16">
                  {rating > 0 ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating] : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Written Review */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Tell us about your stay</h3>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you like? What could we improve? Your feedback helps us provide better experiences for future guests."
          rows={5}
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className={cn('text-xs', comment.length < 10 ? 'text-text-muted' : 'text-accent')}>
            {comment.length} characters {comment.length < 10 && '(min 10)'}
          </span>
        </div>
      </div>

      {/* Photo Upload */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Add Photos (optional)</h3>
        <div className="flex flex-wrap gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative h-20 w-20 rounded-lg overflow-hidden border border-border"
            >
              <img src={photo.url} alt={photo.name} className="h-full w-full object-cover" />
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-danger text-white flex items-center justify-center text-xs"
              >
                x
              </button>
            </div>
          ))}
          {photos.length < 5 && (
            <label className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-secondary hover:bg-secondary/5 cursor-pointer transition-colors">
              <Camera className="h-6 w-6 text-text-muted" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>
          )}
        </div>
        <p className="text-xs text-text-muted mt-2">Max 5 photos - JPG, PNG</p>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pb-6">
        <Button variant="outline" className="flex-1" onClick={() => navigate('/guest-portal')}>
          Skip for Now
        </Button>
        <Button className="flex-1" disabled={!canSubmit || isSubmitting} onClick={handleSubmit}>
          <Send className="mr-1.5 h-4 w-4" /> Submit Review
        </Button>
      </div>
    </div>
  );
}
