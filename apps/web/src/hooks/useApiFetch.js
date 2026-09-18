import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for API fetching with loading and error states.
 *
 * @param {string} url - The API endpoint to fetch
 * @param {object} options - Fetch options
 * @param {boolean} options.autoFetch - Whether to fetch on mount (default: true)
 * @param {array} options.deps - Dependencies to refetch when changed
 * @returns {object} { data, isLoading, error, refetch }
 */
export function useApiFetch(url, { autoFetch = true, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const fetcher = useCallback(() => {
    if (!url) return Promise.resolve();

    const token = localStorage.getItem('token');
    return fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${url}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/auth/login';
            return null;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then((result) => {
        if (mountedRef.current && result !== null) {
          setData(result.data ?? result);
        }
      })
      .catch((err) => {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      })
      .finally(() => {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      });
  }, [url]);

  // Use individual deps instead of spreading array
  useEffect(() => {
    mountedRef.current = true;

    if (autoFetch) {
      fetcher();
    }

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, autoFetch, ...deps]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    return fetcher();
  }, [fetcher]);

  return { data, isLoading, error, refetch };
}
