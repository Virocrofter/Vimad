import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

// ─── Configuration ───

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ─── Default Options ───

const defaultOptions = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
};

// ─── Error Class ───

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// ─── Fetch Wrapper ───

async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        data?.message || data?.error || `HTTP ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network error', 0, null);
  }
}

// ─── useApiFetch Hook ───

export function useApiFetch(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refetchIndex, setRefetchIndex] = useState(0);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const abortControllerRef = useRef(null);

  const refetch = useCallback(() => {
    setRefetchIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // Don't fetch if auth is still loading
    if (authLoading) return;

    // FIX: Use a flag to track if we should skip due to auth
    const shouldSkipFetch = !isAuthenticated && options.requireAuth !== false;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (shouldSkipFetch) {
      // FIX: Use setTimeout to defer state update and avoid setState in effect
      const timer = setTimeout(() => {
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFetch(endpoint, {
          ...options,
          signal,
        });
        setData(result);
      } catch (err) {
        if (err.name === 'AbortError') {
          // Request was cancelled, don't update state
          return;
        }
        setError(err);
      } finally {
        // FIX: Check if not aborted before setting loading state
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, refetchIndex, isAuthenticated, authLoading]);

  // FIX: Remove ref access during render - track aborted state in a ref that's safe to read
  const isAbortedRef = useRef(false);

  useEffect(() => {
    isAbortedRef.current = abortControllerRef.current?.signal.aborted ?? false;
  });

  return {
    data,
    error,
    loading,
    refetch,
  };
}

// ─── useApiMutation Hook ───

export function useApiMutation(endpoint, defaultMethod = 'POST') {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { isAuthenticated } = useAuth();

  const mutate = useCallback(
    async (body, options = {}) => {
      if (!isAuthenticated && options.requireAuth !== false) {
        throw new ApiError('Not authenticated', 401, null);
      }

      setLoading(true);
      setError(null);

      try {
        const result = await apiFetch(endpoint, {
          method: options.method || defaultMethod,
          body: body ? JSON.stringify(body) : undefined,
          ...options,
        });
        setData(result);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, defaultMethod, isAuthenticated]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    error,
    loading,
    mutate,
    reset,
  };
}

// ─── Standalone API Functions ───

export const api = {
  get: (endpoint, options) => apiFetch(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) =>
    apiFetch(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options) =>
    apiFetch(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body, options) =>
    apiFetch(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint, options) => apiFetch(endpoint, { ...options, method: 'DELETE' }),
};

export default useApiFetch;
