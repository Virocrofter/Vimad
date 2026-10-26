/* apps/web/src/api/guestIdentity.ts — C3 shared guest profile */
import { apiGet, apiPost, apiDelete } from './client';

export interface IdentityGroupSummary {
  id: string;
  label?: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  names: string[];
  loyaltyPoints: number;
  blacklisted: boolean;
  vipStatus?: string | null;
  primaryEmail?: string | null;
}
export interface IdentityMember {
  guestId: string;
  addedAt: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  passportNumber?: string | null;
  vipStatus?: string | null;
  blacklisted: boolean;
  doNotDisturb: boolean;
  loyaltyPoints: number;
  tags: string[];
  createdAt: string;
}
export interface Group360 {
  id: string;
  label?: string | null;
  createdAt: string;
  profile: {
    displayName: string;
    emails: string[];
    phones: string[];
    passports: string[];
    vipStatus?: string | null;
    blacklisted: boolean;
    doNotDisturb: boolean;
    loyaltyPoints: number;
    tags: string[];
    stayCount: number;
    lifetimeValue: number;
    properties: string[];
  };
  members: IdentityMember[];
  stays: {
    id: string;
    confirmationNumber: string;
    status: string;
    arrivalDate: string;
    departureDate: string;
    propertyName: string;
    propertyCode: string;
    guestName: string;
    totalAmount: number;
  }[];
  notes: { id: string; body: string; createdAt: string; guestName: string }[];
}
export interface DedupeGuest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  passportNumber?: string | null;
  createdAt: string;
  groupIds: string[];
}
export interface DedupeCluster {
  matchKey: 'email' | 'phone' | 'passport';
  matchValue: string;
  sharedGroupId: string | null;
  guests: DedupeGuest[];
}
export interface DedupeReport {
  generatedAt: string;
  guestCount: number;
  clusterCount: number;
  clusters: DedupeCluster[];
}

export async function listGroups(): Promise<IdentityGroupSummary[]> {
  const res = await apiGet<{ data: IdentityGroupSummary[] }>('/v1/guest-identity/groups');
  return res.data;
}
export async function getGroup(groupId: string): Promise<Group360> {
  const res = await apiGet<{ data: Group360 }>(`/v1/guest-identity/groups/${groupId}`);
  return res.data;
}
export async function createGroup(guestIds: string[]): Promise<Group360> {
  const res = await apiPost<{ data: Group360 }>('/v1/guest-identity/groups', { guestIds });
  return res.data;
}
export async function addMember(groupId: string, guestId: string): Promise<Group360> {
  const res = await apiPost<{ data: Group360 }>(`/v1/guest-identity/groups/${groupId}/members`, {
    guestId,
  });
  return res.data;
}
export async function removeMember(
  groupId: string,
  guestId: string
): Promise<{ removed: boolean; groupDeleted: boolean }> {
  const res = await apiDelete<{ data: { removed: boolean; groupDeleted: boolean } }>(
    `/v1/guest-identity/groups/${groupId}/members/${guestId}`
  );
  return res.data;
}
export async function dedupeReport(): Promise<DedupeReport> {
  const res = await apiGet<{ data: DedupeReport }>('/v1/guest-identity/dedupe');
  return res.data;
}
