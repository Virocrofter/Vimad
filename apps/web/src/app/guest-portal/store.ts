import { create } from 'zustand';
import { guestProfile, guestStays, guestAnnouncements } from './data';

export interface GuestNotification {
  id: string;
  type: 'promo' | 'alert' | 'system';
  title: string;
  body: string;
  time: string;
  read: boolean;
  cta?: { label: string; url: string } | null;
}

export interface CartItem {
  cartId: string;
  qty: number;
  [key: string]: unknown;
}

export interface GuestState {
  guest: typeof guestProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentStay: (typeof guestStays)[number] | null;
  stays: typeof guestStays;
  cart: CartItem[];
  messages: unknown[];
  notifications: GuestNotification[];
  activeTab: string;
  sidebarOpen: boolean;
  login: (guest: typeof guestProfile) => void;
  logout: () => void;
  setCurrentStay: (stay: (typeof guestStays)[number]) => void;
  addToCart: (item: unknown) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  updateCartQty: (itemId: string, qty: number) => void;
  addMessage: (msg: unknown) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  archiveNotification: (id: string) => void;
  toggleSidebar: () => void;
}

function timeAgo(isoString: string): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
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

export const useGuestStore = create<GuestState>()((set) => ({
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

  addToCart: (item) => set((state) => ({ cart: [...state.cart, item as CartItem] })),
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
