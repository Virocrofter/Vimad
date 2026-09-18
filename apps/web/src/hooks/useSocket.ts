import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

interface UseSocketOptions {
  autoConnect?: boolean;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true } = options;
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!autoConnect || !token) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const newSocket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = newSocket;
    // Publish the socket asynchronously to avoid a synchronous setState in the effect;
    // the ref check guards against a cleanup/re-run race before the microtask fires.
    queueMicrotask(() => {
      if (socketRef.current === newSocket) setSocket(newSocket);
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      newSocket.close();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [autoConnect, token]);

  const on = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, callback);
    return () => {
      socketRef.current?.off(event, callback);
    };
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const joinRoom = useCallback((room: string) => {
    socketRef.current?.emit('join:room', room);
  }, []);

  const leaveRoom = useCallback((room: string) => {
    socketRef.current?.emit('leave:room', room);
  }, []);

  return {
    socket,
    isConnected,
    on,
    emit,
    joinRoom,
    leaveRoom,
  };
}

// Specialized hook for notifications
export function useNotifications() {
  const { on, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<unknown[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = on('notification', (data) => {
      setNotifications((prev) => [data, ...prev]);
    });

    return unsubscribe;
  }, [on, isConnected]);

  return { notifications, isConnected };
}
