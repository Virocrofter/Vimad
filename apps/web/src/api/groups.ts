/* apps/web/src/api/groups.ts — G1 */
import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import type { PaginatedResponse } from './types';

export type GroupStatus = 'prospect' | 'tentative' | 'definite' | 'cancelled' | 'completed';
export type BlockType = 'courtesy' | 'negotiated' | 'contract';

export interface GroupSummary {
  id: string;
  code: string;
  name: string;
  company?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  status: GroupStatus;
  blockType: BlockType;
  arrivalDate: string;
  departureDate: string;
  cutOffDate?: string | null;
  eventSpace?: string | null;
  rate?: number | null;
  roomsBlocked: number;
  roomsPickedUp: number;
  pickupPct: number;
  memberCount: number;
  propertyId: string;
  createdAt: string;
}

export interface GroupBlock {
  id: string;
  roomTypeId: string;
  roomTypeName: string;
  roomsBlocked: number;
  rate?: number | null;
  notes?: string | null;
  roomsPickedUp: number;
  roomsAvailable: number;
  overblocked: boolean;
}

export interface GroupMember {
  id: string;
  confirmationNumber: string;
  status: string;
  guestId: string;
  guestName: string;
  email?: string | null;
  phone?: string | null;
  roomTypeId?: string | null;
  roomTypeName?: string | null;
  roomNumber?: string | null;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  rate: number;
  totalAmount: number;
  balance: number;
  checkedIn: boolean;
  notes?: string | null;
}

export interface GroupCharge {
  id: string;
  type: string;
  description: string;
  amount: number;
  quantity: number;
  total: number;
  postedAt: string;
}

export interface GroupPayment {
  id: string;
  method: string;
  amount: number;
  reference?: string | null;
  note?: string | null;
  receivedAt: string;
}

export interface GroupEventItem {
  id: string;
  name: string;
  venue?: string | null;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  guests: number;
  status: string;
  tags: string[];
  notes?: string | null;
  createdAt: string;
}

export interface GroupDetail {
  group: {
    id: string;
    code: string;
    name: string;
    company?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    blockType: BlockType;
    status: GroupStatus;
    arrivalDate: string;
    departureDate: string;
    cutOffDate?: string | null;
    rate?: number | null;
    eventSpace?: string | null;
    notes?: string | null;
    propertyId: string;
    createdAt: string;
  };
  stats: {
    roomsBlocked: number;
    roomsPickedUp: number;
    pickupPct: number;
    memberCount: number;
    nights: number;
    projectedRoomRevenue: number;
    totalCharges: number;
    totalPayments: number;
    balance: number;
  };
  blocks: GroupBlock[];
  freeRooms: {
    id: string;
    number: string;
    floor?: string | null;
    status: string;
    roomTypeId: string;
    roomTypeName: string;
  }[];
  freeByType: Record<string, number>;
  reservations: GroupMember[];
  charges: GroupCharge[];
  payments: GroupPayment[];
  events: GroupEventItem[];
}

export interface CreateGroupInput {
  propertyId: string;
  name: string;
  company?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  blockType?: BlockType;
  status?: GroupStatus;
  arrivalDate: string;
  departureDate: string;
  cutOffDate?: string;
  rate?: number;
  eventSpace?: string;
  notes?: string;
  blocks?: { roomTypeId: string; roomsBlocked: number; rate?: number; notes?: string }[];
}

export type UpdateGroupInput = Partial<Omit<CreateGroupInput, 'propertyId' | 'blocks'>>;

export interface RoomingRow {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  roomTypeId?: string;
  roomId?: string;
  arrivalDate?: string;
  departureDate?: string;
  adults?: number;
  children?: number;
  notes?: string;
}

export interface ListGroupsParams {
  page?: number;
  pageSize?: number;
  status?: GroupStatus;
  blockType?: BlockType;
  q?: string;
  upcoming?: 'true';
}

export async function listGroups(
  params: ListGroupsParams = {}
): Promise<PaginatedResponse<GroupSummary>> {
  return apiGet<PaginatedResponse<GroupSummary>>('/v1/groups', params as Record<string, unknown>);
}

export async function getGroup(id: string): Promise<GroupDetail> {
  const res = await apiGet<{ data: GroupDetail }>(`/v1/groups/${id}`);
  return res.data;
}

export async function createGroup(input: CreateGroupInput): Promise<GroupDetail> {
  const res = await apiPost<{ data: GroupDetail }>('/v1/groups', input);
  return res.data;
}

export async function updateGroup(id: string, input: UpdateGroupInput): Promise<GroupDetail> {
  const res = await apiPatch<{ data: GroupDetail }>(`/v1/groups/${id}`, input);
  return res.data;
}

export async function deleteGroup(id: string): Promise<GroupDetail> {
  // status → cancelled (ledgers stay for audit)
  const res = await apiPatch<{ data: GroupDetail }>(`/v1/groups/${id}`, { status: 'cancelled' });
  return res.data;
}

export async function addBlock(
  id: string,
  input: { roomTypeId: string; roomsBlocked: number; rate?: number; notes?: string }
): Promise<GroupDetail> {
  const res = await apiPost<{ data: GroupDetail }>(`/v1/groups/${id}/blocks`, input);
  return res.data;
}

export async function deleteBlock(id: string, blockId: string): Promise<GroupDetail> {
  const res = await apiDelete<{ data: GroupDetail }>(`/v1/groups/${id}/blocks/${blockId}`);
  return res.data;
}

export async function importRoomingList(id: string, rows: RoomingRow[]): Promise<GroupDetail> {
  const res = await apiPost<{ data: GroupDetail }>(`/v1/groups/${id}/rooming-list`, { rows });
  return res.data;
}

export async function removeMember(id: string, reservationId: string): Promise<GroupDetail> {
  const res = await apiDelete<{ data: GroupDetail }>(`/v1/groups/${id}/members/${reservationId}`);
  return res.data;
}

export async function postCharge(
  id: string,
  input: { type?: string; description: string; amount: number; quantity?: number }
): Promise<GroupDetail> {
  const res = await apiPost<{ data: GroupDetail }>(`/v1/groups/${id}/charges`, input);
  return res.data;
}

export async function recordPayment(
  id: string,
  input: { method?: string; amount: number; reference?: string; note?: string }
): Promise<GroupDetail> {
  const res = await apiPost<{ data: GroupDetail }>(`/v1/groups/${id}/payments`, input);
  return res.data;
}

export async function addEvent(
  id: string,
  input: {
    name: string;
    venue?: string;
    date: string;
    startTime?: string;
    endTime?: string;
    guests?: number;
    status?: string;
    tags?: string[];
    notes?: string;
  }
): Promise<GroupDetail> {
  const res = await apiPost<{ data: GroupDetail }>(`/v1/groups/${id}/events`, input);
  return res.data;
}

export async function deleteEvent(id: string, eventId: string): Promise<GroupDetail> {
  const res = await apiDelete<{ data: GroupDetail }>(`/v1/groups/${id}/events/${eventId}`);
  return res.data;
}
