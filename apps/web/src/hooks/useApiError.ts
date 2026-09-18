import { useEffect } from 'react';
import { useToast } from './use-toast';
import { ApiError } from '../api/client';

export function useApiError(error: Error | null) {
  const { toast } = useToast();

  useEffect(() => {
    if (!error) return;

    let title = 'Error';
    let description = error.message;

    if (error instanceof ApiError) {
      title =
        error.code === 'UNAUTHORIZED'
          ? 'Authentication Required'
          : error.code === 'FORBIDDEN'
            ? 'Access Denied'
            : error.code === 'VALIDATION_ERROR'
              ? 'Invalid Input'
              : error.code === 'NOT_FOUND'
                ? 'Not Found'
                : 'Request Failed';
      description = error.message;
    }

    toast({
      title,
      description,
      variant: 'destructive',
    });
  }, [error, toast]);
}
