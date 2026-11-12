/* apps/web/src/hooks/useExceptions.ts — Phase 4 exception queue. */
import { useQuery } from '@tanstack/react-query';
import { listExceptions, type ExceptionsData } from '../api/exceptions';

export function useExceptions(status = 'active') {
  return useQuery<ExceptionsData>({
    queryKey: ['exceptions', status],
    queryFn: () => listExceptions(status),
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}
