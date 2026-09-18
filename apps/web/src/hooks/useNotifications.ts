import { useState, useEffect, useCallback } from 'react';
import { useNotificationSocket } from './useSocket.js';

interface Notification {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Declare updateUnreadCount before use
  const updateUnreadCount = useCallback((items: Notification[]) => {
    setUnreadCount(items.filter((n) => !n.read).length);
  }, []);

  const fetchNotifications = useCallback(() => {
    const token = localStorage.getItem('token');
    return fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/v1/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        return response.json();
      })
      .then((data) => {
        const items = data.data ?? [];
        setNotifications(items);
        updateUnreadCount(items);
        setIsLoading(false);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
        console.error('Failed to fetch notifications:', err);
      });
  }, [updateUnreadCount]);

  // Socket subscription for real-time updates
  useNotificationSocket((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  });

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/v1/notifications/${id}/read`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/v1/notifications/read-all`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    return fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
