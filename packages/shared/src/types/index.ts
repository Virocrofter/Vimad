export interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}
