/* apps/web/src/stores/propertyStore.ts — C1
 * Sticky property-switcher choice. Mirrored to localStorage so the axios
 * interceptor (client.ts) can read it synchronously on every request.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PropertyState {
  currentPropertyId: string | null;
  setCurrentPropertyId: (id: string | null) => void;
  clear: () => void;
}

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set) => ({
      currentPropertyId: null,
      setCurrentPropertyId: (id) => set({ currentPropertyId: id }),
      clear: () => set({ currentPropertyId: null }),
    }),
    { name: 'vimad-current-property' }
  )
);

/** Synchronous read for the axios request interceptor. */
export function getCurrentPropertyId(): string | null {
  return usePropertyStore.getState().currentPropertyId;
}
