/* apps/web/src/stores/authStores.ts */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  tenantId?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialized: boolean;

  setAuth: (payload: {
    user: User;
    tenant?: Tenant | null;
    token: string;
    refreshToken: string;
  }) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  refreshAccessToken: () => Promise<boolean>;
}

const STORAGE_KEY = 'vimad_auth';

// ─── Storage helpers (used by interceptors outside React) ───

export function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.state?.token ?? null;
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.state?.refreshToken ?? null;
  } catch {
    return null;
  }
}

export function setTokens(token: string, refreshToken: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed.state = {
      ...parsed.state,
      token,
      refreshToken,
      isAuthenticated: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore (e.g. private mode)
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ─── Zustand store with persistence ───

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      initialized: false,

      setAuth: ({ user, tenant, token, refreshToken }) =>
        set({
          user,
          tenant: tenant ?? null,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        }),

      clearAuth: () =>
        set({
          user: null,
          tenant: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          initialized: true,
        }),

      setLoading: (loading) => set({ isLoading: loading }),
      setInitialized: (initialized) => set({ initialized }),

      refreshAccessToken: async () => {
        const currentRefresh = get().refreshToken;
        if (!currentRefresh) {
          get().clearAuth();
          return false;
        }

        try {
          const { refreshToken } = await import('../api/auth');
          const response = await refreshToken(currentRefresh);

          set({
            token: response.data.token,
            refreshToken: response.data.refreshToken,
            user: response.data.user,
            isAuthenticated: true,
          });

          return true;
        } catch {
          get().clearAuth();
          return false;
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
