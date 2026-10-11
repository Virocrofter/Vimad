/* apps/web/src/api/loyalty.ts */
import { apiClient } from './client';
import type { PaginationParams, PaginatedResponse } from './types';

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type LoyaltyTxType = 'accrual' | 'redemption' | 'bonus' | 'adjustment';

export interface LoyaltyMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: LoyaltyTier;
  points: number;
  lifetimeValue: number;
  totalStays: number;
  totalNights: number;
  joined: string;
  lastStay: string | null;
  nextTierProgress: number;
  avatar: string;
}

export interface LoyaltyTransaction {
  id: string;
  guestId: string;
  memberName: string;
  type: LoyaltyTxType;
  amount: number;
  balance: number;
  description: string;
  source: string;
  date: string;
  createdAt: string;
}

export interface LoyaltyStats {
  totalMembers: number;
  totalPoints: number;
  avgPoints: number;
  redemptions: number;
  tierDistribution: Record<string, number>;
}

export interface AdjustPointsInput {
  guestId: string;
  type: LoyaltyTxType;
  amount: number;
  description: string;
  source?: string;
}

const client = apiClient;

export async function listLoyaltyMembers(
  params?: PaginationParams & { search?: string; tier?: string }
): Promise<PaginatedResponse<LoyaltyMember>> {
  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);
  if (params?.search) queryParams.search = params.search;
  if (params?.tier) queryParams.tier = params.tier;
  return client.get('/v1/loyalty/members', queryParams);
}

export async function getLoyaltyMember(id: string): Promise<LoyaltyMember> {
  return client.get(`/v1/loyalty/members/${id}`);
}

export async function listLoyaltyTransactions(
  params?: PaginationParams & { guestId?: string; type?: string }
): Promise<PaginatedResponse<LoyaltyTransaction>> {
  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);
  if (params?.guestId) queryParams.guestId = params.guestId;
  if (params?.type) queryParams.type = params.type;
  return client.get('/v1/loyalty/transactions', queryParams);
}

export async function getLoyaltyStats(): Promise<LoyaltyStats> {
  return client.get('/v1/loyalty/stats');
}

export async function adjustLoyaltyPoints(input: AdjustPointsInput): Promise<LoyaltyTransaction> {
  return client.post('/v1/loyalty/adjust', input);
}
