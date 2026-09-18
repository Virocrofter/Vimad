'use client';

import { Zap, HardDrive, BedDouble, Users, Building2, Globe } from 'lucide-react';

// ─── Metadata Maps (keep existing) ───

export const resourceMeta = {
  api_calls: { label: 'API Calls', icon: Zap, color: 'text-secondary', bg: 'bg-secondary/10' },
  storage: { label: 'Storage', icon: HardDrive, color: 'text-accent', bg: 'bg-accent/10' },
  reservations: { label: 'Reservations', icon: BedDouble, color: 'text-info', bg: 'bg-info/10' },
  users: { label: 'Users', icon: Users, color: 'text-warning', bg: 'bg-warning/10' },
  properties: { label: 'Properties', icon: Building2, color: 'text-danger', bg: 'bg-danger/10' },
  bandwidth: { label: 'Bandwidth', icon: Globe, color: 'text-purple-500', bg: 'bg-purple-500/10' },
};

export const actionMeta = {
  throttle: {
    label: 'Throttle',
    class: 'bg-warning/10 text-warning border-warning/30',
    dot: 'bg-warning',
  },
  block: {
    label: 'Block',
    class: 'bg-danger/10 text-danger border-danger/30',
    dot: 'bg-danger',
  },
  notify: {
    label: 'Notify',
    class: 'bg-info/10 text-info border-info/30',
    dot: 'bg-info',
  },
};

export const scopeMeta = {
  tenant: { label: 'Tenant', color: 'text-secondary' },
  plan: { label: 'Plan', color: 'text-warning' },
  global: { label: 'Global', color: 'text-accent' },
};

export const periodMeta = {
  hourly: { label: 'Hourly', short: 'hr' },
  daily: { label: 'Daily', short: 'day' },
  monthly: { label: 'Monthly', short: 'mo' },
};

export const overageStatusMeta = {
  projected: {
    label: 'Projected',
    class: 'bg-info/10 text-info border-info/30',
    dot: 'bg-info',
  },
  billed: {
    label: 'Billed',
    class: 'bg-accent/10 text-accent border-accent/30',
    dot: 'bg-accent',
  },
  waived: {
    label: 'Waived',
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-neutral',
  },
  disputed: {
    label: 'Disputed',
    class: 'bg-warning/10 text-warning border-warning/30',
    dot: 'bg-warning',
  },
};

// ─── Helper Functions ───

export function getUsagePercent(used, limit) {
  if (!limit || limit === 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function getUsageColor(percent) {
  if (percent >= 90) return 'text-danger';
  if (percent >= 75) return 'text-warning';
  return 'text-accent';
}

export function getUsageBarColor(percent) {
  if (percent >= 90) return 'bg-danger';
  if (percent >= 75) return 'bg-warning';
  return 'bg-accent';
}

export function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
