import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useSocket } from './useSocket';
import { api } from './useApiFetch';

// ─── Types ───

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'reservation' | 'guest' | 'billing' | 'system' | 'housekeeping';
  title: string;
  message: string;
  read: boolean;
  readAt?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  categories: {
    reservation: boolean;
    guest: boolean;
    billing: boolean;
    system: boolean;
    housekeeping: boolean;
  };
}

// ─── Mock Data (replace with API data) ───

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'info',
    category: 'reservation',
    title: 'New Reservation',
    message: 'John Smith made a new reservation for Sep 25-28',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    actionUrl: '/app/reservations/detail/1',
    actionLabel: 'View Reservation',
    entityType: 'reservation',
    entityId: '1',
  },
  {
    id: '2',
    type: 'warning',
    category: 'billing',
    title: 'Payment Failed',
    message: 'Payment for invoice INV-2026-09 failed to process',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/app/billing/invoices',
    actionLabel: 'View Invoice',
    entityType: 'invoice',
    entityId: 'INV-2026-09',
  },
  {
    id: '3',
    type: 'success',
    category: 'guest',
    title: 'Check-in Complete',
    message: 'Sarah Johnson has been checked in to Room 204',
    read: true,
    readAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    entityType: 'reservation',
    entityId: '2',
  },
  {
    id: '4',
    type: 'info',
    category: 'housekeeping',
    title: 'Room Ready',
    message: 'Room 305 is now clean and ready for check-in',
    read: true,
    readAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    entityType: 'room',
    entityId: '305',
  },
  {
    id: '5',
    type: 'error',
    category: 'system',
    title: 'Sync Failed',
    message: 'Booking.com channel sync failed. Please check connection.',
    read: false,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/app/channel-manager',
    actionLabel: 'Check Connection',
    entityType: 'channel',
    entityId: 'bookingcom',
  },
];

const mockPreferences: NotificationPreferences = {
  email: true,
  push: true,
  sms: false,
  categories: {
    reservation: true,
    guest: true,
    billing: true,
    system: true,
    housekeeping: true,
  },
};

// ─── Hook ───

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [preferences, setPreferences] = useState<NotificationPreferences>(mockPreferences);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { isAuthenticated } = useAuth();

  // Get token from localStorage since useAuth doesn't expose it
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  // Pass token to useSocket
  const { on, isConnected: socketConnected } = useSocket(token);

  // ─── Computed Values ───

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const unreadNotifications = useMemo(() => {
    return notifications.filter((n) => !n.read);
  }, [notifications]);

  const recentNotifications = useMemo(() => {
    return [...notifications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [notifications]);

  // ─── Socket Subscription ───

  useEffect(() => {
    if (!socketConnected || !on) return;

    const handleNewNotification = (...args: unknown[]) => {
      const data = args[0] as Notification;
      setNotifications((prev) => [data, ...prev]);
    };

    const handleNotificationUpdate = (...args: unknown[]) => {
      const data = args[0] as Partial<Notification> & { id: string };
      setNotifications((prev) => prev.map((n) => (n.id === data.id ? { ...n, ...data } : n)));
    };

    // Subscribe to socket events
    const unsubscribeNew = on('notification:new', handleNewNotification);
    const unsubscribeUpdate = on('notification:update', handleNotificationUpdate);

    // FIX: Store unsubscribe functions in a way TypeScript can verify
    const cleanup: (() => void)[] = [];

    if (typeof unsubscribeNew === 'function') {
      cleanup.push(unsubscribeNew);
    }
    if (typeof unsubscribeUpdate === 'function') {
      cleanup.push(unsubscribeUpdate);
    }

    return () => {
      cleanup.forEach((fn) => fn());
    };
  }, [socketConnected, on]);

  // ─── API Functions ───

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      // Replace with actual API call
      // const data = await api.get('/notifications');
      // setNotifications(data);

      // Using mock data for now
      setNotifications(mockNotifications);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      // Replace with actual API call
      // await api.patch(`/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark as read'));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      // Replace with actual API call
      // await api.patch('/notifications/read-all');

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          readAt: n.readAt || new Date().toISOString(),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark all as read'));
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      // Replace with actual API call
      // await api.delete(`/notifications/${id}`);

      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete notification'));
    }
  }, []);

  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      try {
        // Replace with actual API call
        // await api.patch('/notifications/preferences', newPreferences);

        setPreferences((prev) => ({ ...prev, ...newPreferences }));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to update preferences'));
      }
    },
    []
  );

  // ─── Initial Fetch ───

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  return {
    // State
    notifications,
    unreadCount,
    unreadNotifications,
    recentNotifications,
    preferences,
    loading,
    error,
    socketConnected,

    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    refetch: fetchNotifications,
  };
}

export default useNotifications;
