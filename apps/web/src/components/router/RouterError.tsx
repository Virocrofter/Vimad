import type { JSX } from 'react';

export function RouterError(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center">
      <h1 className="text-2xl font-bold text-text-primary">Something went wrong</h1>
      <p className="mt-2 text-text-secondary">
        This page failed to load. Check the console for details.
      </p>
      <a
        href="/app/dashboard"
        className="mt-6 inline-flex items-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary/90"
      >
        Go to Dashboard
      </a>
    </div>
  );
}
