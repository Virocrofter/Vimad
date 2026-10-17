/* apps/web/src/hooks/usePropertyScope.ts — C1
 * Single source of truth for the property switcher. Resolves the effective
 * property (store choice → server-sticky choice → null = whole chain/tenant),
 * persists changes server-side, and invalidates the query cache on switch.
 */
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getScope,
  setCurrentProperty,
  type PropertyScope,
  type ScopeProperty,
} from '../api/chains';
import { usePropertyStore } from '../stores/propertyStore';

export interface PropertyScopeResult {
  properties: ScopeProperty[];
  chains: PropertyScope['chains'];
  /** Effective selection — null means "all properties" (no filter). */
  current: ScopeProperty | null;
  /** Server-sticky default for first paint. */
  serverCurrentPropertyId: string | null;
  isLoading: boolean;
  error: Error | null;
  selectProperty: (propertyId: string | null) => Promise<void>;
}

export function usePropertyScope(): PropertyScopeResult {
  const queryClient = useQueryClient();
  const storedId = usePropertyStore((s) => s.currentPropertyId);

  const { data, isLoading, error } = useQuery({
    queryKey: ['property-scope'],
    queryFn: getScope,
    staleTime: 30_000,
  });

  const properties = data?.properties ?? [];
  const preferred = storedId ?? data?.currentPropertyId ?? null;
  const current = properties.find((p) => p.id === preferred) ?? null;

  const selectProperty = useCallback(
    async (propertyId: string | null) => {
      usePropertyStore.getState().setCurrentPropertyId(propertyId);
      if (propertyId) {
        try {
          await setCurrentProperty(propertyId);
        } catch {
          // Sticky persistence is best-effort — the local choice still applies.
        }
      } else {
        try {
          await setCurrentProperty(null);
        } catch {
          // ignore
        }
      }
      await queryClient.invalidateQueries();
    },
    [queryClient]
  );

  return {
    properties,
    chains: data?.chains ?? [],
    current,
    serverCurrentPropertyId: data?.currentPropertyId ?? null,
    isLoading,
    error: error as Error | null,
    selectProperty,
  };
}
