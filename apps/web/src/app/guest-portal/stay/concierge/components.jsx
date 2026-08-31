/* src/app/guest-portal/stay/concierge/components.jsx */
import { useState } from 'react';
import {
  Star, Clock, Phone, ChevronRight, Heart, Share2, ExternalLink, Navigation
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

/* ─── Concierge Service Card ─── */
export function ConciergeServiceCard({ service, onBook, isFavorite, onToggleFavorite }) {
  const [imageError, setImageError] = useState(false);

  const categoryColors = {
    spa: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    dining: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    transport: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    activities: 'bg-green-500/10 text-green-500 border-green-500/20',
  };

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden transition-all hover:shadow-md group">
      <div className="relative h-40">
        {!imageError ? (
          <img
            src={service.image}
            alt={service.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-background">
            <Navigation className="h-8 w-8 text-text-muted" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={cn(
            'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase border',
            categoryColors[service.category] || 'bg-secondary/10 text-secondary border-secondary/20'
          )}>
            {service.category}
          </span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
          className="absolute top-3 right-3 rounded-full bg-black/30 p-1.5 text-white hover:bg-black/50 transition-colors"
        >
          <Heart className={cn('h-4 w-4', isFavorite && 'fill-white')} />
        </button>

        {/* Rating */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/40 backdrop-blur px-2 py-0.5">
          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-medium text-white">{service.rating}</span>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-text-primary">{service.name}</h4>
          <span className="text-xs text-text-muted shrink-0">{service.priceRange}</span>
        </div>
        <p className="text-xs text-text-secondary line-clamp-2">{service.description}</p>

        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {service.hours}
          </span>
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {service.phone}
          </span>
        </div>

        <button
          onClick={onBook}
          className="w-full mt-1 rounded-lg border border-secondary bg-secondary/5 py-2 text-xs font-medium text-secondary hover:bg-secondary/10 transition-colors flex items-center justify-center gap-1"
        >
          Book Now
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
