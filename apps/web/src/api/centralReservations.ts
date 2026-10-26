/* apps/web/src/api/centralReservations.ts — C4 central reservations desk */
import { apiGet, apiPost } from './client';

export interface AvailabilityRoomType {
  id: string;
  name: string;
  total: number;
  sellable: number;
  minRemaining: number;
  available: boolean;
  rate: number | null;
  currency: string;
}
export interface AvailabilityProperty {
  id: string;
  name: string;
  code: string;
  city?: string | null;
  currency: string;
  roomTypes: AvailabilityRoomType[];
}
export interface CentralAvailability {
  from: string;
  to: string;
  nights: number;
  properties: AvailabilityProperty[];
}

export interface CentralReservation {
  id: string;
  confirmationNumber: string;
  status: string;
  source: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  adults: number;
  children: number;
  totalAmount: number;
  property: { id: string; name: string; code: string; city?: string | null };
  guest: { id: string; firstName: string; lastName: string };
  roomType: { id: string; name: string } | null;
  stayCount: number;
  createdAt?: string;
}

export interface CreateBookingInput {
  propertyId: string;
  roomTypeId?: string;
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children: number;
  guestId?: string;
  guest?: { firstName: string; lastName: string; email?: string; phone?: string };
  notes?: string;
}

export async function getAvailability(from: string, to: string): Promise<CentralAvailability> {
  const res = await apiGet<{ data: CentralAvailability }>('/v1/central-reservations/availability', {
    from,
    to,
  });
  return res.data;
}
export async function listCentralReservations(): Promise<CentralReservation[]> {
  const res = await apiGet<{ data: CentralReservation[] }>('/v1/central-reservations');
  return res.data;
}
export async function createCentralBooking(input: CreateBookingInput): Promise<CentralReservation> {
  const res = await apiPost<{ data: CentralReservation }>('/v1/central-reservations', input);
  return res.data;
}
export async function moveCentralReservation(
  id: string,
  input: { propertyId: string; roomTypeId?: string }
): Promise<CentralReservation> {
  const res = await apiPost<{ data: CentralReservation }>(
    `/v1/central-reservations/${id}/move`,
    input
  );
  return res.data;
}
