// apps/web/src/components/FlagRoute.tsx
// Route-level feature gate: wraps a route element. When the flag is off,
// renders a "Coming soon" notice instead of the page.

import type { ReactNode } from 'react';
import { flags, type Flag } from '@/lib/flags';

export function FlagRoute({ flag, children }: { flag: Flag; children: ReactNode }) {
  if (flags[flag]) return <>{children}</>;

  return (
    <div className="flex min-h-[40vh] items-center justify-center p-8">
      <div className="max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Coming soon</p>
        <h2 className="mt-2 text-lg font-semibold text-gray-900">
          This area isn&apos;t available yet
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          The backend for this feature is not part of v1. Enable the{' '}
          <code className="rounded bg-gray-100 px-1 font-mono text-xs">{flag}</code> flag to preview
          it.
        </p>
      </div>
    </div>
  );
}
