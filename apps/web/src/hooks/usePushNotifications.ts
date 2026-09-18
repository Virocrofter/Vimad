import { useState, useEffect, useCallback } from 'react';

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UsePushNotificationsReturn extends PushSubscriptionState {
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  // Initialize state synchronously to avoid setState in effect
  const [state, setState] = useState<PushSubscriptionState>(() => ({
    isSupported:
      typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window,
    isSubscribed: false,
    isLoading: false,
    error: null,
  }));

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!state.isSupported) return;

    const checkSubscription = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        setRegistration(reg);

        const subscription = await reg.pushManager.getSubscription();
        setState((prev) => ({ ...prev, isSubscribed: !!subscription }));
      } catch (err) {
        console.error('Failed to check push subscription:', err);
      }
    };

    checkSubscription();
  }, [state.isSupported]);

  const subscribe = useCallback(async () => {
    if (!state.isSupported || !registration) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to server
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/v1/push/subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(subscription),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      setState((prev) => ({ ...prev, isSubscribed: true, isLoading: false }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to subscribe',
      }));
    }
  }, [state.isSupported, registration]);

  const unsubscribe = useCallback(async () => {
    if (!registration) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();

        // Notify server
        const token = localStorage.getItem('token');
        await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/v1/push/unsubscribe`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      setState((prev) => ({ ...prev, isSubscribed: false, isLoading: false }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to unsubscribe',
      }));
    }
  }, [registration]);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
