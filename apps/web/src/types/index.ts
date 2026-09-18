/* ─────────────────────────────────────────
   Shared domain types for Unified PMS
   These mirror the backend Prisma schema shape.
   ───────────────────────────────────────── */

export type ReservationStatus =
  'confirmed' | 'checked_in' | 'checked_out' | 'no_show' | 'cancelled';

export type RoomStatus =
  'clean' | 'dirty' | 'inspected' | 'occupied' | 'maintenance' | 'out_of_order';

export type HousekeepingStatus = 'clean' | 'dirty' | 'in_progress' | 'inspected';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export type Source = 'Direct' | 'Booking.com' | 'Expedia' | 'Airbnb' | 'WalkIn' | 'Phone';

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface Property {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  country: string | null;
  timezone: string;
  currency: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface RoomType {
  id: string;
  tenantId: string;
  propertyId: string;
  name: string;
  code: string;
  description?: string | null;
  baseRate: number;
  maxOccupancy: number;
  bedConfig: string;
  amenities: string[];
  imageUrl?: string | null;
  status: 'active' | 'inactive';
}

export interface Room {
  id: string;
  tenantId: string;
  propertyId: string;
  roomTypeId: string;
  number: string;
  floor: number;
  status: RoomStatus;
  housekeepingStatus: HousekeepingStatus;
  notes?: string | null;
}

export interface Guest {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  passportNumber: string | null;
  loyaltyPoints: number;
  vipStatus: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  tenantId: string;
  propertyId: string;
  guestId: string;
  guest: Pick<Guest, 'id' | 'firstName' | 'lastName' | 'email' | 'phone'>;
  roomId: string | null;
  roomNumber: string | null;
  roomType: string;
  arrival: string;
  departure: string;
  nights: number;
  status: ReservationStatus;
  rate: number;
  balance: number;
  source: Source;
  adults: number;
  children: number;
  createdAt: string;
  updatedAt: string;
  // Fields returned by the real API (see apps/api reservations routes). Optional
  // because mock data and older shapes don't carry them.
  confirmationNumber?: string;
  arrivalDate?: string;
  departureDate?: string;
  totalAmount?: number;
}

export interface Availability {
  date: string;
  roomTypeId: string;
  total: number;
  sold: number;
  available: number;
}

export interface FolioItem {
  id: string;
  reservationId: string;
  date: string;
  description: string;
  amount: number;
  category: 'room' | 'dining' | 'spa' | 'services' | 'tax' | 'fee' | 'payment';
}

export interface RatePlan {
  id: string;
  tenantId: string;
  propertyId: string;
  name: string;
  roomTypeIds: string[];
  baseRate: number;
  startDate: string;
  endDate: string;
  restrictions?: string[];
}
