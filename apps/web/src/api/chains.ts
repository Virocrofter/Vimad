/* apps/web/src/api/chains.ts — C1 */
import { apiGet, apiPost, apiPatch, apiDelete, apiPut } from './client';

export interface Chain {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChainWithProperties extends Chain {
  properties?: { id: string; name: string; code: string; city?: string | null; status: string }[];
  _count?: { properties: number };
}

export interface ScopeProperty {
  id: string;
  name: string;
  code: string;
  city?: string | null;
  status: string;
  chainId?: string | null;
  _count: { rooms: number; reservations: number };
}

export interface PropertyScope {
  properties: ScopeProperty[];
  chains: (Chain & { _count: { properties: number } })[];
  currentPropertyId: string | null;
}

export async function getScope(): Promise<PropertyScope> {
  const response = await apiGet<{ data: PropertyScope }>('/v1/chains/scope');
  return response.data;
}

export async function setCurrentProperty(propertyId: string | null): Promise<void> {
  await apiPut('/v1/chains/me/current-property', { propertyId });
}

export async function listChains(): Promise<ChainWithProperties[]> {
  const response = await apiGet<{ data: ChainWithProperties[] }>('/v1/chains');
  return response.data;
}

export async function createChain(input: {
  name: string;
  slug: string;
  status?: string;
}): Promise<Chain> {
  const response = await apiPost<{ data: Chain }>('/v1/chains', input);
  return response.data;
}

export async function updateChain(
  id: string,
  input: { name?: string; slug?: string; status?: string }
): Promise<Chain> {
  const response = await apiPatch<{ data: Chain }>(`/v1/chains/${id}`, input);
  return response.data;
}

export async function attachProperty(chainId: string, propertyId: string): Promise<void> {
  await apiPost(`/v1/chains/${chainId}/properties`, { propertyId });
}

export async function detachProperty(chainId: string, propertyId: string): Promise<void> {
  await apiDelete(`/v1/chains/${chainId}/properties/${propertyId}`);
}
