/* apps/web/src/api/users.ts */
import { apiClient } from './client';

export interface SafeUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  roles?: { id: string; name: string }[];
  lastLoginAt?: string | null;
  loginCount?: number;
  lastLoginIp?: string | null;
  activeSessions?: number;
}

export interface UserListResponse {
  data: SafeUser[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface UserUpdateBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  role?: string;
}

export const usersApi = {
  list: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    role?: string;
  }) => apiClient.get<UserListResponse>('/v1/users', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<{ data: SafeUser }>(`/v1/users/${id}`).then((r) => r.data.data),

  create: (body: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: string;
    phone?: string;
  }) => apiClient.post<{ data: SafeUser }>('/v1/users', body).then((r) => r.data.data),

  update: (id: string, body: UserUpdateBody) =>
    apiClient.patch<{ data: SafeUser }>(`/v1/users/${id}`, body).then((r) => r.data.data),

  setStatus: (id: string, status: 'active' | 'inactive' | 'suspended', reason?: string) =>
    apiClient
      .patch<{ data: SafeUser }>(`/v1/users/${id}/status`, { status, reason })
      .then((r) => r.data.data),

  setRoles: (id: string, roleIds: string[]) =>
    apiClient
      .put<{ data: { userId: string; roleIds: string[] } }>(`/v1/users/${id}/roles`, { roleIds })
      .then((r) => r.data.data),

  resetPassword: (id: string) =>
    apiClient
      .post<{ data: { resetUrl: string; expiresAt: string } }>(`/v1/users/${id}/reset-password`)
      .then((r) => r.data.data),

  activity: (id: string, params: { page?: number; pageSize?: number }) =>
    apiClient
      .get<{ data: any[]; meta: UserListResponse['meta'] }>(`/v1/users/${id}/activity`, { params })
      .then((r) => r.data),
};
