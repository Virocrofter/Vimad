import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

export type MockQueryFn<T> = () => T | Promise<T>;

export interface UseMockQueryOptions<T> extends Omit<
  UseQueryOptions<T, Error, T, readonly string[]>,
  'queryKey' | 'queryFn'
> {
  enabled?: boolean;
}

/**
 * Wrapper around TanStack Query's `useQuery` that reads from local mock data.
 * This keeps the UI behaving exactly as before while giving us the real data-fetching
 * shape (isLoading, error, refetch, etc.) so backend wiring is a drop-in replacement.
 */
export function useMockQuery<T>(
  queryKey: readonly string[],
  loader: MockQueryFn<T>,
  options: UseMockQueryOptions<T> = {}
) {
  return useQuery<T, Error, T, readonly string[]>({
    queryKey,
    queryFn: async () => {
      // Simulate a small network delay so loading states are observable
      await new Promise((resolve) => setTimeout(resolve, 250));
      return loader();
    },
    staleTime: Infinity,
    ...options,
  });
}
