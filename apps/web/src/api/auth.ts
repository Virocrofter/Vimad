/* apps/web/src/api/auth.ts */
import { apiPost } from './client';
import type { User, Tenant } from '../stores/authStores';

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

export interface PasswordResetRequestInput {
  email: string;
  tenantSlug: string;
}

export interface PasswordResetConfirmInput {
  token: string;
  newPassword: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  data: {
    token: string;
    refreshToken: string;
    user: User;
    tenant?: Tenant;
  };
}

// ─── Auth API ───
// NOTE: apiPost already returns response.data, so the backend's `{ data: ... }`
// envelope is returned directly — no extra `.data` unwrapping here.

export async function login(input: LoginInput): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/login', input);
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/register', input);
}

export async function refreshToken(refreshToken: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/refresh', { refreshToken });
}

export async function requestPasswordReset(
  input: PasswordResetRequestInput
): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/auth/forgot-password', input);
}

export async function confirmPasswordReset(
  input: PasswordResetConfirmInput
): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/auth/reset-password', input);
}

export async function changePassword(input: ChangePasswordInput): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/auth/change-password', input);
}

export async function logout(): Promise<void> {
  await apiPost('/auth/logout').catch(() => {
    // Ignore errors on logout
  });
}
