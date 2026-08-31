/* src/app/guest-portal/components.jsx */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Key, UtensilsCrossed, Sparkles, MapPin, Receipt, MessageCircle,
  Crown, Star, ChevronRight, Bell, Home, Calendar, User, Settings,
  Clock, CheckCircle2, AlertTriangle, Wrench, XCircle, Wifi, WifiOff,
  Battery, BatteryMedium, BatteryLow, Lock, Unlock, QrCode, Smartphone,
  Plus, Minus, Trash2, Send, Paperclip, Image, Phone, Mail, MapPin as MapPinIcon,
  Coffee, Wine, UtensilsCrossed as UtensilsIcon, Info, ArrowRight,
  Heart, ThumbsUp, ThumbsDown, Camera, FileText, Shield, Check
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency, formatPoints, getStayPhase, getPhaseBadge, formatDate, timeAgo } from './data';
import { tierBenefits } from './data';

// ─── Guest Booking Card ───
export function GuestBookingCard({ stay, onAction }) {
  const phase = getStayPhase(stay);
  const badge = getPhaseBadge(phase);
  
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden transition-all hover:shadow-lg">
      {/* Property Image */}
      <div className="relative h-48 bg-background">
        <img 
          src={stay.property.images[0]} 
          alt={stay.property.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-lg font-bold text-white">{stay.property.name}</h3>
          <p className="text-sm text-white/80">{stay.property.address.city}, {stay.property.address.state}</p>
        </div>
        <div className="absolute top-4 right-4">
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm',
            badge.bg, badge.color, badge.border, 'bg-black/30'
          )}>
            {phase === 'in-stay' && <Wifi className="h-3 w-3" />}
            {badge.label}
          </span>
        </div>
      </div>
      
      {/* Room & Dates */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">{stay.room.type}</p>
            <p className="text-xs text-text-muted">Room {stay.room.number} · {stay.room.bedType} bed</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold font-mono text-text-primary">{stay.dates.nights} <span className="text-xs font-normal text-text-muted">nights</span></p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 rounded-xl bg-background p-3">
          <div className="flex-1 text-center">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Check-in</p>
            <p className="text-sm font-semibold text-text-primary">{formatDate(stay.dates.arrival)}</p>
            <p className="text-xs text-text-muted">{stay.dates.arrivalTime}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex-1 text-center">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Check-out</p>
            <p className="text-sm font-semibold text-text-primary">{formatDate(stay.dates.departure)}</p>
            <p className="text-xs text-text-muted">{stay.dates.departureTime}</p>
          </div>
        </div>
        
        {/* Quick Actions based on phase */}
        <div className="grid grid-cols-2 gap-2">
          {phase === 'pre-arrival' && (
            <>
              <Link 
                to="/guest-portal/check-in" 
                className="flex items-center justify-center gap-2 rounded-xl bg-accent/10 border border-accent/20 px-4 py-3 text-sm font-medium text-accent hover:bg-accent/20 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" /> Check In
              </Link>
              <Link 
                to={`/guest-portal/booking/modify?id=${stay.id}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-surface-elevated border border-border px-4 py-3 text-sm font-medium text-text-secondary hover:bg-background transition-colors"
              >
                <Settings className="h-4 w-4" /> Modify
              </Link>
            </>
          )}
          {phase === 'in-stay' && (
            <>
              <Link 
                to="/guest-portal/keys" 
                className="flex items-center justify-center gap-2 rounded-xl bg-accent/10 border border-accent/20 px-4 py-3 text-sm font-medium text-accent hover:bg-accent/20 transition-colors"
              >
                <Key className="h-4 w-4" /> Digital Key
              </Link>
              <Link 
                to="/guest-portal/billing"
                className="flex items-center justify-center gap-2 rounded-xl bg-surface-elevated border border-border px-4 py-3 text-sm font-medium text-text-secondary hover:bg-background transition-colors"
              >
                <Receipt className="h-4 w-4" /> View Folio
              </Link>
            </>
          )}
          {phase === 'post-stay' && (
            <>
              <Link 
                to={`/guest-portal/reviews?id=${stay.id}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-secondary/10 border border-secondary/20 px-4 py-3 text-sm font-medium text-secondary hover:bg-secondary/20 transition-colors"
              >
                <Star className="h-4 w-4" /> {stay.review.submitted ? 'View Review' : 'Write Review'}
              </Link>
              <Link 
                to="/guest-portal/loyalty"
                className="flex items-center justify-center gap-2 rounded-xl bg-surface-elevated border border-border px-4 py-3 text-sm font-medium text-text-secondary hover:bg-background transition-colors"
              >
                <Crown className="h-4 w-4" /> Points
              </Link>
            </>
          )}
        </div>
        
        {/* Confirmation Number */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-text-muted">Confirmation</span>
          <span className="text-xs font-mono font-medium text-text-primary">{stay.confirmationNumber}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Digital Key Widget ───
export function DigitalKeyWidget({ keyData, onUnlock }) {
  const [unlocking, setUnlocking] = useState(false);
  
  const handleUnlock = async () => {
    setUnlocking(true);
    await onUnlock?.();
    setTimeout(() => setUnlocking(false), 2000);
  };
  
  const isActive = keyData?.status === 'active';
  const isExpired = keyData?.status === 'expired';
  
  return (
    <div className={cn(
      'rounded-2xl border p-5 transition-all',
      isActive ? 'border-accent/30 bg-accent/5' : 'border-border bg-surface'
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            isActive ? 'bg-accent/10' : 'bg-neutral/10'
          )}>
            {isActive ? <Unlock className="h-6 w-6 text-accent" /> : <Lock className="h-6 w-6 text-text-muted" />}
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">Room {keyData?.roomNumber || '—'}</h3>
            <p className="text-xs text-text-muted">
              {isActive ? 'Key Active' : isExpired ? 'Key Expired' : 'Key Pending'}
            </p>
          </div>
        </div>
        <div className="text-right">
          {isActive && <Battery className="h-5 w-5 text-accent" />}
        </div>
      </div>
      
      {/* Large Unlock Button */}
      <button
        onClick={handleUnlock}
        disabled={!isActive || unlocking}
        className={cn(
          'w-full rounded-xl py-4 text-sm font-bold transition-all active:scale-95',
          isActive 
            ? 'bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20' 
            : 'bg-border text-text-muted cursor-not-allowed'
        )}
      >
        {unlocking ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Unlocking...
          </span>
        ) : isActive ? (
          <span className="flex items-center justify-center gap-2">
            <Unlock className="h-5 w-5" /> TAP TO UNLOCK
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" /> UNAVAILABLE
          </span>
        )}
      </button>
      
      {/* Access Log */}
      {keyData?.accessLog && keyData.accessLog.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">Recent Access</p>
          <div className="space-y-2">
            {keyData.accessLog.slice(0, 3).map((log, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{log.location}</span>
                <span className="text-text-muted">{timeAgo(log.time)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Menu Category Card ───
export function MenuCategoryCard({ category, onSelect }) {
  const iconMap = {
    Coffee: Coffee,
    UtensilsCrossed: UtensilsIcon,
    Wine: Wine,
    Sparkles: Sparkles,
  };
  const Icon = iconMap[category.icon] || Coffee;
  
  return (
    <button
      onClick={() => onSelect?.(category)}
      className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 transition-all hover:shadow-md hover:border-secondary/30 active:scale-95"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10">
        <Icon className="h-7 w-7 text-secondary" />
      </div>
      <span className="text-sm font-medium text-text-primary">{category.name}</span>
      <span className="text-[10px] text-text-muted">{category.available}</span>
    </button>
  );
}

// ─── Menu Item Card ───
export function MenuItemCard({ item, onAdd }) {
  const [qty, setQty] = useState(1);
  
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-surface p-3">
      <div className="h-20 w-20 shrink-0 rounded-lg bg-background overflow-hidden">
        <img 
          src={item.image} 
          alt={item.name}
          className="h-full w-full object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-medium text-text-primary">{item.name}</h4>
            <p className="text-xs text-text-muted line-clamp-2">{item.description}</p>
          </div>
          <span className="text-sm font-bold font-mono text-text-primary">{formatCurrency(item.price)}</span>
        </div>
        
        {item.dietary?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.dietary.map(d => (
              <span key={d} className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent font-medium">
                {d}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-text-muted">{item.prepTime} min</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-text-muted hover:bg-background"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-sm font-medium w-4 text-center">{qty}</span>
            <button 
              onClick={() => setQty(qty + 1)}
              className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-text-muted hover:bg-background"
            >
              <Plus className="h-3 w-3" />
            </button>
            <button 
              onClick={() => onAdd?.({ ...item, qty })}
              className="ml-2 h-8 rounded-full bg-accent px-3 text-xs font-medium text-white hover:bg-accent/90"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Item ───
export function CartItemRow({ item, onUpdateQty, onRemove }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-text-primary">{item.name}</h4>
        <p className="text-xs text-text-muted">{formatCurrency(item.price)} each</p>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onUpdateQty?.(item.cartId, Math.max(0, item.qty - 1))}
          className="h-7 w-7 rounded-full border border-border flex items-center justify-center"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="text-sm font-medium w-4 text-center">{item.qty}</span>
        <button 
          onClick={() => onUpdateQty?.(item.cartId, item.qty + 1)}
          className="h-7 w-7 rounded-full border border-border flex items-center justify-center"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <div className="text-right min-w-[60px]">
        <p className="text-sm font-bold font-mono">{formatCurrency(item.price * item.qty)}</p>
      </div>
      <button 
        onClick={() => onRemove?.(item.cartId)}
        className="h-8 w-8 rounded-full flex items-center justify-center text-danger hover:bg-danger/10"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Folio Line Item ───
export function FolioLineItem({ charge }) {
  const categoryColors = {
    room: 'bg-accent/10 text-accent',
    dining: 'bg-secondary/10 text-secondary',
    spa: 'bg-purple-500/10 text-purple-500',
    minibar: 'bg-warning/10 text-warning',
    other: 'bg-neutral/10 text-text-muted',
  };
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <span className={cn(
          'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase',
          categoryColors[charge.category] || categoryColors.other
        )}>
          {charge.category}
        </span>
        <div>
          <p className="text-sm text-text-primary">{charge.description}</p>
          <p className="text-[10px] text-text-muted">{formatDate(charge.date)}</p>
        </div>
      </div>
      <span className="text-sm font-mono font-medium text-text-primary">{formatCurrency(charge.amount)}</span>
    </div>
  );
}

// ─── Chat Thread ───
export function ChatThread({ messages, onSend, staffName = 'Front Desk' }) {
  const [input, setInput] = useState('');
  
  const handleSend = () => {
    if (!input.trim()) return;
    onSend?.(input);
    setInput('');
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-10 w-10 text-text-muted mb-2" />
            <p className="text-sm text-text-muted">Start a conversation with {staffName}</p>
          </div>
        )}
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              'flex max-w-[80%]',
              msg.from === 'guest' ? 'ml-auto' : 'mr-auto'
            )}
          >
            <div className={cn(
              'rounded-2xl px-4 py-2.5 text-sm',
              msg.from === 'guest' 
                ? 'bg-accent text-white rounded-br-sm' 
                : 'bg-surface-elevated border border-border text-text-primary rounded-bl-sm'
            )}>
              {msg.text}
              <p className={cn(
                'text-[10px] mt-1',
                msg.from === 'guest' ? 'text-white/60' : 'text-text-muted'
              )}>
                {timeAgo(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Composer */}
      <div className="border-t border-border p-3 bg-surface">
        <div className="flex items-center gap-2">
          <button className="h-9 w-9 rounded-full flex items-center justify-center text-text-muted hover:bg-background">
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Message ${staffName}...`}
            className="flex-1 h-10 rounded-full border border-border bg-background px-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-white disabled:opacity-50 hover:bg-accent/90"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Review Form ───
export function ReviewForm({ stay, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [categories, setCategories] = useState({
    cleanliness: 0,
    service: 0,
    location: 0,
    value: 0,
    amenities: 0,
  });
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  
  const handleSubmit = () => {
    onSubmit?.({ rating, categories, comment, photos });
  };
  
  const allRated = rating > 0 && Object.values(categories).every(c => c > 0);
  
  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <div className="text-center">
        <p className="text-sm text-text-muted mb-3">How was your stay at {stay.property.name}?</p>
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110"
            >
              <Star 
                className={cn(
                  'h-10 w-10 transition-colors',
                  (hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-border'
                )} 
              />
            </button>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-2">
          {rating > 0 ? ['Terrible', 'Poor', 'Average', 'Very Good', 'Excellent'][rating - 1] : 'Tap to rate'}
        </p>
      </div>
      
      {/* Category Ratings */}
      <div className="space-y-3">
        {Object.entries(categories).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-text-secondary capitalize">{key}</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setCategories(prev => ({ ...prev, [key]: star }))}
                >
                  <Star 
                    className={cn(
                      'h-5 w-5',
                      value >= star ? 'fill-yellow-400 text-yellow-400' : 'text-border'
                    )} 
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Comment */}
      <div>
        <label className="text-sm text-text-secondary mb-2 block">Tell us about your experience</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="What did you like? What could we improve?"
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>
      
      {/* Photo Upload */}
      <div>
        <label className="text-sm text-text-secondary mb-2 block">Add Photos (optional)</label>
        <div className="flex gap-2">
          <button className="h-20 w-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-text-muted hover:border-secondary hover:text-secondary transition-colors">
            <Camera className="h-6 w-6 mb-1" />
            <span className="text-[10px]">Add</span>
          </button>
        </div>
      </div>
      
      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!allRated}
        className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-50 hover:bg-accent/90 transition-colors"
      >
        Submit Review
      </button>
    </div>
  );
}

// ─── Tier Badge ───
export function TierBadge({ tier }) {
  const meta = tierBenefits[tier];
  if (!meta) return null;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
      meta.bg, meta.color, meta.border
    )}>
      <Crown className="h-3.5 w-3.5" />
      {meta.label} Member
    </span>
  );
}

// ─── Points Display ───
export function PointsDisplay({ points, toNextTier, tier }) {
  const meta = tierBenefits[tier];
  const tiers = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIdx = tiers.indexOf(tier);
  const nextTier = tiers[currentIdx + 1];
  const nextMeta = nextTier ? tierBenefits[nextTier] : null;
  const progress = nextMeta ? ((points - (points - toNextTier)) / (points + toNextTier)) * 100 : 100;
  
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider">Points Balance</p>
          <p className="text-3xl font-bold font-mono text-text-primary">{formatPoints(points)}</p>
        </div>
        <TierBadge tier={tier} />
      </div>
      
      {nextMeta && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">{formatPoints(toNextTier)} points to {nextMeta.label}</span>
            <span className="text-text-muted">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-border overflow-hidden">
            <div 
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3">
        <div className="text-center">
          <p className="text-lg font-bold font-mono text-text-primary">1.5x</p>
          <p className="text-[10px] text-text-muted">Earn Multiplier</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold font-mono text-text-primary">12,500</p>
          <p className="text-[10px] text-text-muted">Lifetime Points</p>
        </div>
      </div>
    </div>
  );
}

// ─── Service Status Card ───
export function ServiceStatusCard({ service }) {
  const meta = serviceStatusMeta[service.status];
  const iconMap = {
    CheckCircle2: CheckCircle2,
    AlertTriangle: AlertTriangle,
    Wrench: Wrench,
    XCircle: XCircle,
  };
  const Icon = iconMap[meta?.icon] || Info;
  
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <Icon className={cn('h-5 w-5', meta?.color || 'text-text-muted')} />
      <div>
        <p className="text-sm font-medium text-text-primary">{service.name}</p>
        <p className={cn('text-xs', meta?.color || 'text-text-muted')}>{meta?.label || service.status}</p>
      </div>
    </div>
  );
}

// ─── Announcement Card ───
export function GuestAnnouncementCard({ announcement }) {
  const typeMeta = {
    feature: { bg: 'bg-accent/10', color: 'text-accent', border: 'border-accent/20', label: 'New' },
    maintenance: { bg: 'bg-warning/10', color: 'text-warning', border: 'border-warning/20', label: 'Maintenance' },
    alert: { bg: 'bg-danger/10', color: 'text-danger', border: 'border-danger/20', label: 'Alert' },
    update: { bg: 'bg-info/10', color: 'text-info', border: 'border-info/20', label: 'Update' },
  };
  const meta = typeMeta[announcement.type] || typeMeta.update;
  
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {announcement.image && (
        <div className="h-32 bg-background">
          <img 
            src={announcement.image} 
            alt={announcement.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-medium border',
            meta.bg, meta.color, meta.border
          )}>
            {meta.label}
          </span>
          <span className="text-[10px] text-text-muted">{timeAgo(announcement.publishedAt)}</span>
        </div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">{announcement.title}</h3>
        <p className="text-xs text-text-secondary leading-relaxed">{announcement.content}</p>
        {announcement.cta && (
          <Link 
            to={announcement.cta.url}
            className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-secondary hover:underline"
          >
            {announcement.cta.label} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Quick Action Button ───
export function QuickAction({ icon: Icon, label, href, color = 'secondary' }) {
  const colorMap = {
    accent: 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20',
    secondary: 'bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20',
    info: 'bg-info/10 text-info border-info/20 hover:bg-info/20',
    warning: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20 hover:bg-danger/20',
    'purple-500': 'bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20',
  };
  
  return (
    <Link 
      to={href}
      className={cn(
        'flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all hover:shadow-md active:scale-95',
        colorMap[color] || colorMap.secondary
      )}
    >
      <div className={cn(
        'flex h-12 w-12 items-center justify-center rounded-full',
        color === 'accent' ? 'bg-accent/20' : 
        color === 'secondary' ? 'bg-secondary/20' : 
        color === 'info' ? 'bg-info/20' : 
        color === 'purple-500' ? 'bg-purple-500/20' : 'bg-warning/20'
      )}>
        <Icon className={cn('h-6 w-6')} />
      </div>
      <span className="text-xs font-medium text-center">{label}</span>
    </Link>
  );
}

// ─── Bottom Navigation ───
export function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: 'Home', href: '/guest-portal' },
    { icon: Key, label: 'Key', href: '/guest-portal/keys' },
    { icon: UtensilsCrossed, label: 'Services', href: '/guest-portal/stay' },
    { icon: MessageCircle, label: 'Chat', href: '/guest-portal/messages' },
    { icon: User, label: 'Profile', href: '/guest-portal/profile' },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors',
                isActive ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'fill-current')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Guest Header ───
export function GuestHeader({ title, showBack, onBack, rightAction }) {
  const location = useLocation();
  
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-lg">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          {showBack && (
            <button 
              onClick={onBack || (() => window.history.back())}
              className="h-9 w-9 rounded-full flex items-center justify-center text-text-muted hover:bg-background"
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </button>
          )}
          <h1 className="text-lg font-bold text-text-primary">{title}</h1>
        </div>
        {rightAction && (
          <div>{rightAction}</div>
        )}
      </div>
    </header>
  );
}

// ─── Notification Bell ───
export function NotificationBell({ count, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="relative h-9 w-9 rounded-full flex items-center justify-center text-text-muted hover:bg-background"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-danger px-1 text-[10px] font-bold text-white flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}

// ─── Loading Skeleton ───
export function Skeleton({ className }) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-border', className)} />
  );
}

// ─── Empty State ───
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated mb-4">
        <Icon className="h-8 w-8 text-text-muted" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-muted max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
}

// ─── Section Header ───
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Info Row ───
export function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-text-muted" />}
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}

/* ─── File Upload Zone ─── */
export function FileUploadZone({ onUpload, accept = 'image/*', maxSize = 5 }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    setError(null);
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File too large. Max ${maxSize}MB.`);
      return;
    }
    const acceptedTypes = accept.split(',').map(t => t.trim());
    const isAccepted = acceptedTypes.some(type => {
      if (type.includes('*')) {
        const prefix = type.split('/')[0];
        return file.type.startsWith(prefix + '/');
      }
      return file.type === type || file.name.endsWith(type.replace('.', ''));
    });
    if (!isAccepted && accept !== '*') {
      setError('File type not accepted.');
      return;
    }
    onUpload?.([file]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
          dragOver ? 'border-secondary bg-secondary/5' : 'border-border bg-background hover:bg-surface-elevated'
        )}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 mb-3">
          <Upload className="h-6 w-6 text-secondary" />
        </div>
        <p className="text-sm font-medium text-text-primary">Drop files here or click to browse</p>
        <p className="text-xs text-text-muted mt-1">
          {accept === 'image/*' ? 'JPG, PNG' : accept} · Max {maxSize}MB
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Step Indicator ─── */
export function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <div className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-colors',
            idx < currentStep ? 'bg-accent text-white' :
            idx === currentStep ? 'bg-secondary text-white' :
            'bg-border text-text-muted'
          )}>
            {idx < currentStep ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
          </div>
          <span className={cn('text-[10px] font-medium hidden sm:inline',
            idx <= currentStep ? 'text-text-primary' : 'text-text-muted'
          )}>
            {step}
          </span>
          {idx < steps.length - 1 && (
            <div className={cn('h-px w-3', idx < currentStep ? 'bg-accent' : 'bg-border')} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Form Input ─── */
export function FormInput({ label, value, onChange, type = 'text', placeholder, required, error, icon: Icon }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'h-10 w-full rounded-md border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            Icon ? 'pl-10' : '',
            error ? 'border-danger focus-visible:ring-danger/20' : 'border-border'
          )}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

/* ─── Form Select ─── */
export function FormSelect({ label, value, onChange, options, required, error }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          'h-10 w-full rounded-md border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none',
          error ? 'border-danger focus-visible:ring-danger/20' : 'border-border'
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

/* ─── Toggle Switch ─── */
export function ToggleSwitch({ label, description, checked, onChange, icon: Icon }) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3 cursor-pointer hover:bg-surface-elevated transition-colors">
      {Icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
          <Icon className="h-5 w-5 text-secondary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && <p className="text-xs text-text-muted">{description}</p>}
      </div>
      <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-border transition-colors">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="peer sr-only"
        />
        <span className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
          checked ? 'translate-x-6' : 'translate-x-1'
        )} />
        <div className={cn(
          'absolute inset-0 rounded-full transition-colors',
          checked ? 'bg-secondary' : 'bg-border'
        )} />
      </div>
    </label>
  );
}

/* ─── Checkbox Group ─── */
export function CheckboxGroup({ label, options, values, onChange }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              const newValues = values.includes(opt.value)
                ? values.filter(v => v !== opt.value)
                : [...values, opt.value];
              onChange?.(newValues);
            }}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
              values.includes(opt.value)
                ? 'border-secondary bg-secondary/5 text-secondary'
                : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Radio Group ─── */
export function RadioGroup({ label, options, value, onChange }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange?.(opt.value)}
            className={cn(
              'rounded-lg border p-2.5 text-center text-xs font-medium transition-all',
              value === opt.value
                ? 'border-secondary bg-secondary/5 text-secondary'
                : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Document Card ─── */
export function DocumentCard({ document, onDelete, onView }) {
  const typeIcons = {
    passport: FileText,
    drivers_license: FileText,
    national_id: FileText,
    visa: FileText,
  };
  const Icon = typeIcons[document.type] || FileText;

  const isExpiringSoon = new Date(document.expiryDate) < new Date('2027-01-01');
  const isVerified = document.verified;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            isVerified ? 'bg-accent/10' : 'bg-warning/10'
          )}>
            <Icon className={cn('h-5 w-5', isVerified ? 'text-accent' : 'text-warning')} />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary capitalize">{document.type.replace('_', ' ')}</p>
            <p className="text-xs text-text-muted">{document.country} · {document.fileName || 'Document'}</p>
            <div className="flex items-center gap-2 mt-1">
              {isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
                  <AlertTriangle className="h-3 w-3" /> Pending
                </span>
              )}
              {isExpiringSoon && (
                <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
                  Expiring Soon
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onView}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-elevated hover:text-text-primary"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
        <span>ID: {document.id}</span>
        <span>Expires: {new Date(document.expiryDate).toLocaleDateString()}</span>
      </div>
    </div>
  );
}