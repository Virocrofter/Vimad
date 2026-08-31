/* src/app/guest-portal/stay/concierge/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Navigation,
  Search,
  X,
  Star,
  Clock,
  Phone,
  MapPin,
  ChevronRight,
  Filter,
  Heart,
  Share2,
  ExternalLink,
  Calendar,
  Car,
  Ticket,
  UtensilsCrossed,
  Sparkles,
  Bike,
  Footprints,
  Plane,
  Bus,
  Train,
  Ship,
  Info,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { conciergeServices } from '../../data';
import { ConciergeServiceCard } from './components';

const categoryFilters = [
  { id: 'all', label: 'All', icon: Navigation },
  { id: 'spa', label: 'Spa & Wellness', icon: Sparkles },
  { id: 'dining', label: 'Dining', icon: UtensilsCrossed },
  { id: 'transport', label: 'Transport', icon: Car },
  { id: 'activities', label: 'Activities', icon: Ticket },
];

export default function ConciergePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedService, setSelectedService] = useState(null);
  const [favorites, setFavorites] = useState(new Set());

  const filteredServices = useMemo(() => {
    let services = conciergeServices;
    if (activeFilter !== 'all') {
      services = services.filter((s) => s.category === activeFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      services = services.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }
    return services;
  }, [activeFilter, searchQuery]);

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">Concierge</h1>
          <p className="text-xs text-text-muted">Local recommendations & bookings</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search services, restaurants, activities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 w-full rounded-lg border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-text-muted" />
          </button>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {categoryFilters.map((filter) => {
          const Icon = filter.icon;
          const active = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors',
                active
                  ? 'border-secondary bg-secondary/5 text-secondary'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      <p className="text-sm text-text-muted">
        <span className="font-medium text-text-primary">{filteredServices.length}</span> services
        available
      </p>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-12">
          <Navigation className="mx-auto h-10 w-10 text-text-muted mb-3" />
          <p className="text-sm text-text-muted">No services found</p>
          <p className="text-xs text-text-secondary mt-1">Try a different search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredServices.map((service) => (
            <ConciergeServiceCard
              key={service.id}
              service={service}
              isFavorite={favorites.has(service.id)}
              onToggleFavorite={() => toggleFavorite(service.id)}
              onBook={() => setSelectedService(service)}
            />
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedService(null)}
          />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
            {/* Image Header */}
            <div className="relative h-48">
              <img
                src={selectedService.image}
                alt={selectedService.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={() => setSelectedService(null)}
                className="absolute top-3 right-3 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase',
                    {
                      spa: 'bg-pink-500/20 text-pink-300',
                      dining: 'bg-orange-500/20 text-orange-300',
                      transport: 'bg-blue-500/20 text-blue-300',
                      activities: 'bg-green-500/20 text-green-300',
                    }[selectedService.category] || 'bg-secondary/20 text-secondary'
                  )}
                >
                  {selectedService.category}
                </span>
                <h2 className="mt-1 text-xl font-bold text-white">{selectedService.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm text-white">{selectedService.rating}</span>
                  <span className="text-sm text-white/70">({selectedService.reviews} reviews)</span>
                  <span className="text-sm text-white/70">· {selectedService.priceRange}</span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-text-secondary">{selectedService.description}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-text-muted" />
                  <span className="text-text-secondary">Hours: {selectedService.hours}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-text-muted" />
                  <span className="text-text-secondary">{selectedService.phone}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    window.location.href = `tel:${selectedService.phone}`;
                  }}
                  className="flex-1 rounded-lg bg-secondary py-2.5 text-sm font-medium text-white hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Call to Book
                </button>
                <button
                  onClick={() => toggleFavorite(selectedService.id)}
                  className={cn(
                    'rounded-lg border px-4 py-2.5 transition-colors',
                    favorites.has(selectedService.id)
                      ? 'border-danger bg-danger/5 text-danger'
                      : 'border-border bg-surface text-text-primary hover:bg-surface-elevated'
                  )}
                >
                  <Heart
                    className={cn('h-4 w-4', favorites.has(selectedService.id) && 'fill-danger')}
                  />
                </button>
              </div>

              <div className="rounded-lg bg-info/5 border border-info/20 p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
                  <p className="text-xs text-text-secondary">
                    Mention you are a guest at{' '}
                    {selectedService.name.includes('Hotel') ? 'Grand Hotel Boston' : 'our hotel'}{' '}
                    for exclusive rates and priority reservations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
