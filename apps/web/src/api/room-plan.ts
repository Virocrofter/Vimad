import { apiClient } from './client';

export interface RoomPlanProperty {
  id: string;
  name: string;
  currency: string;
}

export interface RoomPlanRoom {
  id: string;
  number: string;
  floor: string | null;
  status: string;
  housekeepingStatus: string;
  roomTypeId: string;
  roomType: { id: string; name: string; code: string; baseOccupancy: number };
}

export interface RoomPlanRoomType {
  id: string;
  name: string;
  code: string;
  baseOccupancy: number;
  maxOccupancy: number;
}

export interface RoomPlanReservation {
  id: string;
  confirmationNumber: string;
  status: string;
  source: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  adults: number;
  children: number;
  eta: string | null;
  specialRequests: string | null;
  marketSegment: string | null;
  houseUse: boolean;
  guaranteed: boolean;
  doNotMove: boolean;
  fixedRoom: boolean;
  depositDue: number;
  depositPaid: number;
  totalAmount: number;
  balance: number;
  checkedInAt: string | null;
  roomId: string | null;
  roomTypeId: string | null;
  groupId: string | null;
  groupCode: string | null;
  guestId: string;
  guestName: string;
  vipStatus: string | null;
  corporateAccountName: string | null;
  openTraces: number;
  companionsCount: number;
  pendingTasks: number;
}

export interface RoomPlanStay {
  reservationId: string;
  roomId: string;
  date: string;
  rate: number;
}

export interface RoomPlanBlock {
  id: string;
  roomId: string | null;
  roomTypeId: string | null;
  type: string;
  status: string;
  reason: string | null;
  startDate: string;
  endDate: string;
}

export interface RoomPlanRestriction {
  roomTypeId: string;
  date: string;
  stopSell: boolean;
  closeToArrival: boolean;
  closeToDeparture: boolean;
  adjustment: number;
}

export interface RoomPlanHold {
  id: string;
  roomTypeId: string;
  date: string;
  type: string;
  name: string;
  quantity: number;
}

export interface RoomPlanDayStat {
  date: string;
  sellable: number;
  occupied: number;
  ooo: number;
  arrivals: number;
  departures: number;
  occupancyPct: number;
  adr: number;
}

export interface RoomPlanData {
  property: RoomPlanProperty;
  rooms: RoomPlanRoom[];
  roomTypes: RoomPlanRoomType[];
  reservations: RoomPlanReservation[];
  stays: RoomPlanStay[];
  blocks: RoomPlanBlock[];
  restrictions: RoomPlanRestriction[];
  holds: RoomPlanHold[];
  dayStats: RoomPlanDayStat[];
}

export async function fetchRoomPlan(params: {
  propertyId: string;
  from: string;
  to: string;
}): Promise<RoomPlanData> {
  const response = await apiClient.get<{ data: RoomPlanData }>('/room-plan', { params });
  return response.data.data;
}

export interface CreateRoomBlockInput {
  propertyId: string;
  roomId?: string;
  roomTypeId?: string;
  type: 'ooo' | 'oos' | 'hold';
  reason?: string;
  startDate: string;
  endDate: string;
}

export async function createRoomBlock(input: CreateRoomBlockInput): Promise<{ id: string }> {
  const response = await apiClient.post<{ data: { id: string } }>('/room-plan/blocks', input);
  return response.data.data;
}

export async function returnRoomBlock(blockId: string): Promise<{ id: string }> {
  const response = await apiClient.post<{ data: { id: string } }>(
    `/room-plan/blocks/${blockId}/return`
  );
  return response.data.data;
}
