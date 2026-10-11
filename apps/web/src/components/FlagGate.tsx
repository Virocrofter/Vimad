/* apps/web/src/components/FlagGate.tsx
 * Wraps a deferred page. When the flag is off, shows a clean notice
 * instead of the page. Usage:
 *   export default function Page() {
 *     return <FlagGate flag="loyalty"><LoyaltyPage /></FlagGate>;
 *   }
 */
'use client';

import React from 'react';
import { flags, type Flag } from '../lib/flags';

export function FlagGate({ flag, children }: { flag: Flag; children: React.ReactNode }) {
  if (flags[flag]) return <>{children}</>;

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="text-4xl" aria-hidden="true">
        🚧
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Coming soon</h2>
      <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
        This module isn&apos;t part of the current release. It&apos;s on the roadmap and will be
        enabled in a future update.
      </p>
    </div>
  );
}
