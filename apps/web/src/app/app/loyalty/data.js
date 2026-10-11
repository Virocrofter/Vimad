/* apps/web/src/app/app/loyalty/data.js
 * Presentation config only — member/transaction mock data removed (Phase 2 de-mock).
 * Tiers are derived from points by the API; req values mirror loyalty.service.ts.
 */
export const tierMeta = {
  bronze: {
    label: 'Bronze',
    icon: null, // lazy-loaded in components
    color: 'text-orange-600',
    bg: 'bg-orange-600/10',
    border: 'border-orange-600/20',
    dot: 'bg-orange-600',
    gradient: 'from-orange-500/20 to-orange-600/5',
    req: 0,
    benefits: ['Late checkout (12 PM)', 'Free WiFi', 'Member newsletter'],
  },
  silver: {
    label: 'Silver',
    icon: null,
    color: 'text-slate-400',
    bg: 'bg-slate-400/10',
    border: 'border-slate-400/20',
    dot: 'bg-slate-400',
    gradient: 'from-slate-400/20 to-slate-500/5',
    req: 1000,
    benefits: [
      'Late checkout (1 PM)',
      'Room upgrade (subject to avail.)',
      '10% dining discount',
      'Priority support',
    ],
  },
  gold: {
    label: 'Gold',
    icon: null,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500',
    gradient: 'from-amber-500/20 to-amber-600/5',
    req: 5000,
    benefits: [
      'Late checkout (2 PM)',
      'Guaranteed room upgrade',
      '20% dining discount',
      'Early check-in',
      'Welcome amenity',
    ],
  },
  platinum: {
    label: 'Platinum',
    icon: null,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    dot: 'bg-purple-500',
    gradient: 'from-purple-500/20 to-purple-600/5',
    req: 10000,
    benefits: [
      'Late checkout (4 PM)',
      'Suite upgrades',
      '30% dining discount',
      'Early check-in',
      'Airport transfer',
      'Dedicated concierge',
      'Spa access',
    ],
  },
};

export const benefitIcons = {
  'Late checkout': 'Clock',
  'Room upgrade': 'ArrowUpDown',
  'Suite upgrades': 'Sparkles',
  'dining discount': 'Coffee',
  'Welcome amenity': 'Gift',
  'Early check-in': 'Zap',
  'Airport transfer': 'Car',
  concierge: 'Shield',
  'Spa access': 'Sparkles',
  'Free WiFi': 'Wifi',
  newsletter: 'Mail',
  'Priority support': 'Phone',
};
