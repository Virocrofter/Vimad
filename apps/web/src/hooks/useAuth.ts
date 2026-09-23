/* apps/web/src/hooks/useAuth.ts */
import { useState, useCallback } from 'react';
import { useAuthStore, type User } from '../stores/authStores';
import { apiPost, ApiError } from '../api/client';
import { setTokens, clearTokens } from '../stores/authStores';

export interface LoginInput {
  tenantSlug: string;
  email: string;
  password: string;
}

export interface RegisterInput {
  tenantName: string;
  tenantSlug: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerFirstName?: string;
  ownerLastName?: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface UseAuthReturn {
  login: (input: LoginInput) => Promise<AuthResult>;
  register: (data: RegisterInput) => Promise<AuthResult>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  user: User | null;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const storeLogin = useAuthStore((state) => state.login);
  const storeLogout = useAuthStore((state) => state.logout);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(
    async (input: LoginInput): Promise<AuthResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiPost<{
          data: {
            token: string;
            refreshToken: string;
            user: User;
          };
        }>('/auth/login', input);

        const { token, refreshToken, user: loggedInUser } = response.data;
        setTokens(token, refreshToken);
        storeLogin(loggedInUser, token, refreshToken);
        return { success: true };
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Login failed. Please try again.';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [storeLogin]
  );

  const register = useCallback(
    async (data: RegisterInput): Promise<AuthResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiPost<{
          data: {
            token: string;
            refreshToken: string;
            user: User;
          };
        }>('/auth/register', data);

        const { token, refreshToken, user: registeredUser } = response.data;
        setTokens(token, refreshToken);
        storeLogin(registeredUser, token, refreshToken);
        return { success: true };
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Registration failed. Please try again.';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [storeLogin]
  );

  const logout = useCallback(() => {
    clearTokens();
    storeLogout();
  }, [storeLogout]);

  return {
    login,
    register,
    logout,
    isLoading,
    error,
    clearError,
    user,
    isAuthenticated,
  };
}
