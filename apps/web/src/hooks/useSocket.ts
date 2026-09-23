/* apps/web/src/hooks/useSocket.ts */
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  emit: (event: string, ...args: unknown[]) => void;
}

export function useSocket(token: string | null): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<(...args: unknown[]) => void>>>(new Map());

  // FIX: Use ref for token to avoid effect dependency issues
  const tokenRef = useRef(token);

  // FIX: Update ref in effect, not during render
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    const currentToken = tokenRef.current;

    if (!currentToken) {
      // FIX: Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => setIsConnected(false));
      return;
    }

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      auth: { token: currentToken },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
      setIsConnected(false);
    });

    // Re-attach stored listeners
    listenersRef.current.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        socket.on(event, callback);
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token]); // Only re-connect when token changes

  const on = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    // Store listener for reconnection
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);

    // Attach to current socket if exists
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const emit = useCallback((event: string, ...args: unknown[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, ...args);
    }
  }, []);

  // FIX: Return stable object, don't access ref during render
  return {
    get socket() {
      return socketRef.current;
    },
    isConnected,
    on,
    emit,
  };
}
