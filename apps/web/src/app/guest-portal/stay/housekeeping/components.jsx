/* src/app/guest-portal/stay/housekeeping/components.jsx */
import {
  Sparkles, Droplets, Bath, BedDouble, Trash2, Bed, ChevronRight
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

/* ─── Housekeeping Service Card ─── */
export function HousekeepingServiceCard({ service, onRequest, isDnd }) {
  const icons = {
    Sparkles: Sparkles,
    Droplets: Droplets,
    Bath: Bath,
    BedDouble: BedDouble,
    Trash2: Trash2,
    Bed: Bed,
  };
  const Icon = icons[service.icon] || Sparkles;

  return (
    <button
      onClick={() => !isDnd && onRequest?.(service)}
      disabled={isDnd}
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-all hover:shadow-md',
        isDnd && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
        isDnd ? 'bg-border' : 'bg-secondary/10'
      )}>
        <Icon className={cn('h-5 w-5', isDnd ? 'text-text-muted' : 'text-secondary')} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-text-primary">{service.label}</h4>
        <p className="text-xs text-text-secondary">{service.description}</p>
        <p className="text-xs text-text-muted mt-1">~{service.estimatedTime}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-text-muted shrink-0 mt-2" />
    </button>
  );
}
