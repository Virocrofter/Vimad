import { create } from 'zustand';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  time: string;
  type: 'info' | 'warning' | 'success' | 'danger';
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    {
      id: '1',
      title: 'New Reservation',
      message: 'Booking #4023 confirmed',
      read: false,
      time: '2m ago',
      type: 'success',
    },
    {
      id: '2',
      title: 'Night Audit',
      message: 'Audit completed successfully',
      read: false,
      time: '1h ago',
      type: 'info',
    },
    {
      id: '3',
      title: 'Low Inventory',
      message: 'Deluxe rooms running low',
      read: true,
      time: '3h ago',
      type: 'warning',
    },
  ],
  unreadCount: 2,
  addNotification: (notification) => {
    const newNotif = { ...notification, id: Date.now().toString(), read: false };
    set((state) => ({
      notifications: [newNotif, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      return { notifications: updated, unreadCount: updated.filter((n) => !n.read).length };
    });
  },
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
}));
