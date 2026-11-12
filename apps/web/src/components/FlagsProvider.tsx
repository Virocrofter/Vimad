// FlagsProvider — bootstraps live feature flags for the signed-in tenant.
// Fetches /v1/flags/evaluate on mount + every 60s. useLiveFlag(key, fallback)
// reads the live value; before the first fetch settles (or on error) the
// fallback is returned, so pages behave exactly as they did pre-flags.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { evaluateMyFlags } from '../api/flags';

interface FlagsState {
  values: Record<string, unknown>;
  meta: Record<string, { source: string; detail: string }>;
  ready: boolean;
  loadedAt: number | null;
}

const EMPTY: FlagsState = { values: {}, meta: {}, ready: false, loadedAt: null };
const Ctx = createContext<FlagsState>(EMPTY);

export function FlagsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FlagsState>(EMPTY);

  const load = async () => {
    try {
      const r = await evaluateMyFlags();
      const values = r?.values ?? {};
      const meta = r?.meta ?? {};
      setState({ values, meta, ready: true, loadedAt: Date.now() });
    } catch {
      setState((prev) => ({ ...prev, ready: true }));
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useFlags(): FlagsState {
  return useContext(Ctx);
}

export function useLiveFlag<T>(key: string, fallback: T): T {
  const { values, ready } = useContext(Ctx);
  if (!ready || !(key in values)) return fallback;
  return values[key] as T;
}
