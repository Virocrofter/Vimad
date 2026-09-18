import { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStores';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status;
          if (status === 401) return false;
          if (status === 403) return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

// Global error handler for 401 responses
export function handleApiError(error: unknown) {
  if (error instanceof Error && 'code' in error) {
    const code = (error as any).code;
    if (code === 'UNAUTHORIZED') {
      // Trigger logout
      useAuthStore.getState().logout();
      window.location.href = '/auth/login';
    }
  }
}
