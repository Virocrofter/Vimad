/* src/app/guest-portal/stay/room-service/components.jsx */
import { useState } from 'react';
import {
  Coffee, UtensilsCrossed, Wine, Sparkles, X, Plus, Minus,
  CheckCircle2, Clock, ChevronRight, Leaf, Wheat, Egg, Milk,
  Fish, AlertCircle
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

/* ─── Menu Category Card ─── */
export function MenuCategoryCard({ category, onSelect, isAvailable }) {
  const icons = {
    Coffee: Coffee,
    UtensilsCrossed: UtensilsCrossed,
    Wine: Wine,
    Sparkles: Sparkles,
  };
  const Icon = icons[category.icon] || Coffee;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-md',
        !isAvailable && 'opacity-50'
      )}
    >
      <div className={cn(
        'flex h-12 w-12 items-center justify-center rounded-full',
        isAvailable ? 'bg-secondary/10' : 'bg-border'
      )}>
        <Icon className={cn('h-6 w-6', isAvailable ? 'text-secondary' : 'text-text-muted')} />
      </div>
      <span className="text-sm font-medium text-text-primary">{category.name}</span>
      <span className="text-xs text-text-muted">{category.available}</span>
      <span className="text-xs text-text-secondary">{category.items.length} items</span>
      {!isAvailable && (
        <span className="text-[10px] text-danger font-medium">Currently Closed</span>
      )}
    </button>
  );
}

/* ─── Menu Item Card ─── */
export function MenuItemCard({ item, onAdd, qty = 0, onUpdateQty }) {
  const [imageError, setImageError] = useState(false);

  const allergenIcons = {
    gluten: Wheat,
    dairy: Milk,
    egg: Egg,
    fish: Fish,
    shellfish: AlertCircle,
    soy: AlertCircle,
    sesame: AlertCircle,
    nuts: AlertCircle,
    peanuts: AlertCircle,
  };

  return (
    <div className="flex gap-3 rounded-xl border border-border bg-surface p-3">
      <div className="h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-background">
        {!imageError ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UtensilsCrossed className="h-6 w-6 text-text-muted" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">{item.name}</h4>
            <p className="text-xs text-text-secondary line-clamp-2">{item.description}</p>
          </div>
          <span className="text-sm font-bold text-text-primary shrink-0">${item.price}</span>
        </div>

        {/* Dietary & Allergens */}
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          {item.dietary.map((d) => (
            <span key={d} className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent capitalize">
              {d}
            </span>
          ))}
          {item.allergens.map((a) => {
            const AllergenIcon = allergenIcons[a] || AlertCircle;
            return (
              <span key={a} className="inline-flex items-center gap-0.5 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] text-warning capitalize">
                <AllergenIcon className="h-3 w-3" />
                {a}
              </span>
            );
          })}
          <span className="text-[10px] text-text-muted ml-auto">{item.prepTime} min</span>
        </div>

        {/* Quantity Controls */}
        <div className="mt-2 flex items-center gap-2">
          {qty > 0 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQty?.(item.id, qty - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-text-primary hover:bg-surface-elevated transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-sm font-medium text-text-primary w-4 text-center">{qty}</span>
              <button
                onClick={() => onUpdateQty?.(item.id, qty + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-text-primary hover:bg-surface-elevated transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
              <span className="text-sm font-medium text-text-primary ml-2">
                ${(item.price * qty).toFixed(2)}
              </span>
            </div>
          ) : (
            <button
              onClick={() => onAdd?.(item)}
              className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-white hover:bg-secondary/90 transition-colors"
            >
              Add to Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Cart Summary ─── */
export function CartSummary({ items, total, onCheckout, onClear }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <UtensilsCrossed className="mx-auto h-10 w-10 text-text-muted mb-3" />
        <p className="text-sm text-text-muted">Your cart is empty</p>
        <p className="text-xs text-text-secondary mt-1">Add items from the menu</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Your Order</h3>
        <button onClick={onClear} className="text-xs text-danger hover:underline">
          Clear All
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{item.qty}x {item.name}</span>
            <span className="text-text-primary font-medium">${(item.price * item.qty).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">Total</span>
        <span className="text-lg font-bold text-text-primary">${total.toFixed(2)}</span>
      </div>
      <button
        onClick={onCheckout}
        className="w-full rounded-lg bg-secondary py-2.5 text-sm font-medium text-white hover:bg-secondary/90 transition-colors"
      >
        Place Order
      </button>
      <p className="text-[10px] text-text-muted text-center">
        Charged to room · Estimated delivery: 30-45 min
      </p>
    </div>
  );
}

/* ─── Order Status Card ─── */
export function OrderStatusCard({ order }) {
  const statusSteps = ['pending', 'preparing', 'ready', 'delivered'];
  const currentStep = statusSteps.indexOf(order.status);
  const statusLabels = {
    pending: 'Order Received',
    preparing: 'Preparing',
    ready: 'Ready for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  const statusColors = {
    pending: 'text-warning',
    preparing: 'text-info',
    ready: 'text-accent',
    delivered: 'text-text-muted',
    cancelled: 'text-danger',
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-muted">Order #{order.id}</p>
          <p className="text-sm font-semibold text-text-primary">{statusLabels[order.status]}</p>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', statusColors[order.status]?.replace('text-', 'bg-') + '/10')}>
          <Clock className={cn('h-5 w-5', statusColors[order.status])} />
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1">
        {statusSteps.map((step, i) => (
          <div key={step} className="flex-1 flex items-center gap-1">
            <div className={cn(
              'h-2 flex-1 rounded-full transition-all',
              i <= currentStep ? (i === currentStep ? 'bg-secondary' : 'bg-accent') : 'bg-border'
            )} />
            {i < 3 && <div className={cn('h-px w-2', i < currentStep ? 'bg-accent' : 'bg-border')} />}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">{item.qty}x {item.name}</span>
            <span className="text-text-primary">${(item.price * item.qty).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-2 flex items-center justify-between text-sm">
        <span className="text-text-muted">Total</span>
        <span className="font-bold text-text-primary">${order.total.toFixed(2)}</span>
      </div>
    </div>
  );
}
