'use client';

import { Inbox, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyState({
  title = 'No data found',
  description = 'There is nothing to display here yet.',
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">{description}</p>
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}

export function ErrorState({
  title = 'Failed to load data',
  error,
  onRetry,
  retryLabel = 'Try again',
  icon: Icon = AlertCircle,
}) {
  const message =
    typeof error === 'string'
      ? error
      : error && typeof error === 'object' && 'message' in error
        ? error.message
        : null;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Icon className="h-12 w-12 text-danger mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {message && <p className="text-sm text-muted-foreground mb-4 max-w-md">{message}</p>}
      {onRetry && <Button onClick={onRetry}>{retryLabel}</Button>}
    </div>
  );
}
