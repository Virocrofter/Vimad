import { apiClient } from './client';

export interface FinancialSummary {
  currentMonth: {
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
    currency: string;
  };
  lastMonth: {
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
  };
  yearToDate: {
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
  };
  upcoming: {
    invoices: number;
    amount: number;
    overdue: number;
  };
  trends: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  vendor?: string;
  status: 'pending' | 'approved' | 'paid';
  receipt?: string;
}

export async function fetchFinancialSummary(): Promise<FinancialSummary> {
  const response = await apiClient.get<{ data: FinancialSummary }>('/v1/admin/finances/summary');
  return response.data.data;
}

export async function fetchExpenses(params: {
  page: number;
  pageSize: number;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ data: Expense[]; meta: { total: number; page: number; totalPages: number } }> {
  const response = await apiClient.get('/v1/admin/finances/expenses', { params });
  return response.data;
}

export async function createExpense(payload: Omit<Expense, 'id'>): Promise<Expense> {
  const response = await apiClient.post<{ data: Expense }>('/v1/admin/finances/expenses', payload);
  return response.data.data;
}

export async function updateExpense(id: string, payload: Partial<Expense>): Promise<Expense> {
  const response = await apiClient.patch<{ data: Expense }>(
    `/v1/admin/finances/expenses/${id}`,
    payload
  );
  return response.data.data;
}

export async function deleteExpense(id: string): Promise<void> {
  await apiClient.delete(`/v1/admin/finances/expenses/${id}`);
}
