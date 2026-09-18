'use client';

import { useState, useCallback } from 'react';

/**
 * Hook for mutations (POST, PUT, PATCH, DELETE)
 * @param {Function} mutationFn - Async function that performs the mutation
 * @returns {Object} { mutate, loading, error, data, reset }
 */
export function useApiMutation(mutationFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(
    async (variables, options = {}) => {
      try {
        setLoading(true);
        setError(null);

        const result = await mutationFn(variables);
        setData(result);

        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (err) {
        setError(err);
        console.error('API Mutation Error:', err);

        if (options.onError) {
          options.onError(err);
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, loading, error, data, reset };
}
