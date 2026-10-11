/* apps/web/src/types/index.ts */

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  loyaltyPoints?: number;
  vipStatus?: string;
}

export type ReservationStatus =
  'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export type RoomStatus = 'clean' | 'dirty' | 'inspected' | 'out_of_order';

export type HousekeepingStatus = 'ready' | 'in_progress' | 'attention' | 'out_of_service';

export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'refunded' | 'failed';

export interface Reservation {
  id: string;
  tenantId: string;
  propertyId: string;
  guestId: string;
  guestName: string;
  guestEmail?: string | null;
  roomNumber?: string | null;
  roomTypeName?: string | null;
  rate?: number;
  confirmationNumber: string;
  status: string;
  source: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  adults: number;
  children: number;
  totalAmount: number;
  balance: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  guest?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    vipStatus?: string;
    nationality?: string;
    address?: string;
    city?: string;
    country?: string;
    passportNumber?: string;
  };
  property?: { id: string; name: string; code: string; currency?: string };
  stays?: Array<{
    id: string;
    roomId: string;
    date: string;
    rate: number;
    room?: {
      id: string;
      number: string;
      roomType?: { id?: string; name?: string; code?: string };
    };
  }>;
  folio?: {
    id: string;
    status: string;
    totalCharges?: number;
    totalPayments?: number;
    balance: number;
    items?: Array<{
      id: string;
      type: string;
      description: string;
      amount: number;
      quantity?: number;
      postedAt: string;
    }>;
  } | null;
}

export interface Room {
  id: string;
  tenantId?: string;
  propertyId: string;
  roomTypeId: string;
  number: string;
  floor?: string | number;
  status: string;
  housekeepingStatus: string;
}

export interface RoomType {
  id: string;
  propertyId: string;
  name: string;
  code: string;
  baseOccupancy: number;
  maxOccupancy: number;
  baseRate?: number;
  status: string;
}

export interface RatePlan {
  id: string;
  propertyId: string;
  roomTypeId: string;
  name: string;
  code: string;
  baseRate: number;
  currency: string;
  status: string;
}

export interface Availability {
  date: string;
  roomTypeId: string;
  roomTypeCode: string;
  available: number;
  total: number;
}

export interface Property {
  id: string;
  name: string;
  code: string;
  city?: string;
  country?: string;
  timezone: string;
  currency: string;
  status: string;
}

export interface Folio {
  id: string;
  reservationId: string;
  status: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
