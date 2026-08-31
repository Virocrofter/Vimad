/* src/app/guest-portal/store.js */
import { create } from 'zustand';
import { guestProfile, guestStays, guestAnnouncements } from './data';

export const useGuestStore = create((set, get) => ({
  // Auth
  guest: guestProfile,
  isAuthenticated: true,
  isLoading: false,

  // Current stay
  currentStay: guestStays[0],
  stays: guestStays,

  // Services
  cart: [],
  messages: [],
  notifications: guestAnnouncements.map((a) => ({
    id: a.id,
    type: a.type === 'feature' ? 'promo' : a.type === 'maintenance' ? 'alert' : 'system',
    title: a.title,
    body: a.content,
    time: timeAgo(a.publishedAt),
    read: false,
    cta: a.cta,
  })),

  // UI
  activeTab: 'dashboard',
  sidebarOpen: false,

  // Actions
  login: (guest) => set({ guest, isAuthenticated: true, isLoading: false }),
  logout: () => set({ guest: null, isAuthenticated: false, currentStay: null }),
  setCurrentStay: (stay) => set({ currentStay: stay }),

  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  removeFromCart: (itemId) =>
    set((state) => ({ cart: state.cart.filter((i) => i.cartId !== itemId) })),
  clearCart: () => set({ cart: [] }),
  updateCartQty: (itemId, qty) =>
    set((state) => ({
      cart: state.cart
        .map((i) => (i.cartId === itemId ? { ...i, qty } : i))
        .filter((i) => i.qty > 0),
    })),

  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  archiveNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

function timeAgo(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
