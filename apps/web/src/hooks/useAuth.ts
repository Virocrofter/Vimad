import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface UseAuthReturn extends AuthState {
  login: (tenantSlug: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (_resource: string, _action: string) => boolean;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();

  const [state, setState] = useState<AuthState>(() => {
    let token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    // Discard credentials that are already expired (or malformed)
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 <= Date.now()) {
          token = null;
        }
      } catch {
        token = null;
      }
      if (!token) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }

    return {
      user: token && userStr ? JSON.parse(userStr) : null,
      token,
      isAuthenticated: !!token,
      isLoading: false,
    };
  });

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    navigate('/auth/login');
  }, [navigate]);

  const login = useCallback(async (tenantSlug: string, email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantSlug, email, password }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const { data } = await response.json();

      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      setState({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  }, []);

  const hasPermission = useCallback(
    (_resource: string, _action: string): boolean => {
      if (!state.user) return false;
      if (state.user.role === 'owner' || state.user.role === 'admin') return true;

      // Check permissions array
      const permissions = state.user.permissions || [];
      return permissions.includes('*') || permissions.includes(`${_resource}:${_action}`);
    },
    [state.user]
  );

  const refreshUser = useCallback(async () => {
    if (!state.token) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/me`,
        {
          headers: { Authorization: `Bearer ${state.token}` },
        }
      );

      if (response.ok) {
        const { data } = await response.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        setState((prev) => ({ ...prev, user: data.user }));
      } else if (response.status === 401) {
        logout();
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }, [state.token, logout]);

  return {
    ...state,
    login,
    logout,
    hasPermission,
    refreshUser,
  };
}
