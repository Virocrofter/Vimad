import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'super_admin' | 'admin' | 'manager' | 'front_desk' | 'housekeeping' | 'readonly';
}

interface Property {
  id: string;
  name: string;
  address: string;
}

interface AuthState {
  user: User | null;
  property: Property | null;
  availableProperties: Property[];
  isAuthenticated: boolean;
  requires2FA: boolean;
  loginStep: 'credentials' | '2fa';
  setUser: (user: User | null) => void;
  setProperty: (property: Property | null) => void;
  setAvailableProperties: (properties: Property[]) => void;
  login: (email: string, password: string) => void;
  verify2FA: (code: string) => void;
  logout: () => void;
  switchProperty: (propertyId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      property: null,
      availableProperties: [],
      isAuthenticated: false,
      requires2FA: false,
      loginStep: 'credentials',

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setProperty: (property) => set({ property }),
      setAvailableProperties: (properties) => set({ availableProperties: properties }),

      login: (email, password) => {
        // Simulate auth flow — replace with API call
        if (email && password) {
          // Mock: require 2FA for demo
          set({ requires2FA: true, loginStep: '2fa' });
        }
      },

      verify2FA: (code) => {
        if (code.length === 6) {
          set({
            user: {
              id: '1',
              name: 'Alex Morgan',
              email: 'alex@property.com',
              role: 'admin',
            },
            isAuthenticated: true,
            requires2FA: false,
            loginStep: 'credentials',
            availableProperties: [
              { id: '1', name: 'Grand Plaza Hotel', address: '123 Main St' },
              { id: '2', name: 'Seaside Resort', address: '456 Ocean Ave' },
            ],
            property: { id: '1', name: 'Grand Plaza Hotel', address: '123 Main St' },
          });
        }
      },

      logout: () => {
        set({
          user: null,
          property: null,
          isAuthenticated: false,
          requires2FA: false,
          loginStep: 'credentials',
        });
      },

      switchProperty: (propertyId) => {
        const prop = get().availableProperties.find((p) => p.id === propertyId);
        if (prop) set({ property: prop });
      },
    }),
    {
      name: 'pms-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        property: state.property,
        availableProperties: state.availableProperties,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
