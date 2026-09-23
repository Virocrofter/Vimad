import { useState, useCallback } from 'react';

// ─── Types ───

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export interface UseApiErrorReturn {
  error: ApiError | null;
  setError: (error: ApiError | null) => void;
  clearError: () => void;
  handleError: (err: unknown) => void;
  isError: boolean;
}

// ─── Helper: Convert unknown error to ApiError ───

function toApiError(err: unknown): ApiError {
  if (err instanceof Error) {
    // Check if it's a fetch/network error
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    }
    return {
      message: err.message,
      code: 'UNKNOWN_ERROR',
    };
  }

  if (typeof err === 'object' && err !== null) {
    const errorObj = err as Record<string, unknown>;

    // Check for API error response format
    if (errorObj.error && typeof errorObj.error === 'object') {
      const apiError = errorObj.error as Record<string, unknown>;
      return {
        message: (apiError.message as string) || 'An error occurred',
        status: errorObj.status as number,
        code: (apiError.code as string) || 'API_ERROR',
        details: apiError.details,
      };
    }

    // Check for response-like object
    if (errorObj.message) {
      return {
        message: errorObj.message as string,
        status: errorObj.status as number,
        code: (errorObj.code as string) || 'API_ERROR',
        details: errorObj.details,
      };
    }
  }

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

// ─── Hook ───

export function useApiError(): UseApiErrorReturn {
  const [error, setError] = useState<ApiError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((err: unknown) => {
    const apiError = toApiError(err);
    setError(apiError);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[useApiError]', apiError);
    }
  }, []);

  return {
    error,
    setError,
    clearError,
    handleError,
    isError: error !== null,
  };
}

export default useApiError;
