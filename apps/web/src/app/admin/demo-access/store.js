/* src/app/admin/demo-access/store.js */
import { create } from 'zustand';
import { initialDemos, usageAnalytics } from './data';

export const useDemoStore = create((set, get) => ({
  demos: initialDemos,
  analytics: usageAnalytics,

  addDemo: (newDemo) =>
    set((state) => ({ demos: [newDemo, ...state.demos] })),

  updateDemo: (id, updater) =>
    set((state) => ({
      demos: state.demos.map((d) =>
        d.id === id
          ? typeof updater === 'function'
            ? updater(d)
            : { ...d, ...updater }
          : d
      ),
    })),

  removeDemo: (id) =>
    set((state) => ({
      demos: state.demos.filter((d) => d.id !== id),
    })),

  extendDemo: (id, extraDays) =>
    set((state) => ({
      demos: state.demos.map((d) => {
        if (d.id !== id) return d;
        const currentExpiry = new Date(d.expiresAt);
        const newExpiry = new Date(currentExpiry.getTime() + extraDays * 24 * 60 * 60 * 1000);
        const daysRemaining = Math.ceil((newExpiry - new Date()) / (1000 * 60 * 60 * 24));
        return {
          ...d,
          expiresAt: newExpiry.toISOString().split('T')[0],
          daysRemaining: Math.max(0, daysRemaining),
          totalDays: d.totalDays + extraDays,
          status: daysRemaining > 5 ? 'active' : daysRemaining > 0 ? 'expiring_soon' : 'expired',
        };
      }),
    })),

  convertDemo: (id, plan) =>
    set((state) => ({
      demos: state.demos.map((d) =>
        d.id === id
          ? {
              ...d,
              status: 'converted',
              convertedAt: new Date().toISOString().split('T')[0],
              convertedPlan: plan,
              daysRemaining: 0,
            }
          : d
      ),
    })),

  lockDemo: (id) =>
    set((state) => ({
      demos: state.demos.map((d) =>
        d.id === id ? { ...d, status: 'locked', daysRemaining: 0 } : d
      ),
    })),

  unlockDemo: (id, extraDays = 7) =>
    set((state) => {
      const demo = state.demos.find((d) => d.id === id);
      if (!demo) return state;
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + extraDays);
      const daysRemaining = Math.ceil((newExpiry - new Date()) / (1000 * 60 * 60 * 24));
      return {
        demos: state.demos.map((d) =>
          d.id === id
            ? {
                ...d,
                status: daysRemaining > 5 ? 'active' : 'expiring_soon',
                expiresAt: newExpiry.toISOString().split('T')[0],
                daysRemaining,
                totalDays: extraDays,
              }
            : d
        ),
      };
    }),

  sendReminder: (id) =>
    set((state) => ({
      demos: state.demos.map((d) =>
        d.id === id ? { ...d, reminderSent: true } : d
      ),
    })),

  getDemoById: (id) => get().demos.find((d) => d.id === id),

  getStats: () => {
    const { demos } = get();
    const active = demos.filter((d) => d.status === 'active').length;
    const expiringSoon = demos.filter((d) => d.status === 'expiring_soon').length;
    const expired = demos.filter((d) => d.status === 'expired').length;
    const converted = demos.filter((d) => d.status === 'converted').length;
    const locked = demos.filter((d) => d.status === 'locked').length;
    const total = demos.length;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0';
    const potentialMrr = demos
      .filter((d) => d.status === 'active' || d.status === 'expiring_soon')
      .reduce((s, d) => {
        const tier = d.tier === 'Starter' ? 199 : d.tier === 'Professional' ? 499 : 999;
        return s + tier;
      }, 0);
    const convertedMrr = demos
      .filter((d) => d.status === 'converted')
      .reduce((s, d) => {
        const tier = d.convertedPlan === 'Starter' ? 199 : d.convertedPlan === 'Professional' ? 499 : 999;
        return s + tier;
      }, 0);

    return {
      total,
      active,
      expiringSoon,
      expired,
      converted,
      locked,
      conversionRate,
      potentialMrr,
      convertedMrr,
    };
  },
}));
