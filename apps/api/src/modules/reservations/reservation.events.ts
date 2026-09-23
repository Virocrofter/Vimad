// Socket emits disabled to break circular dependency: socket.js → auth.service.ts → prisma.js
// TODO: re-enable after socket.js is decoupled from auth.service.ts

function emitToTenant(_tenantId: string, _event: string, _payload: unknown): void {
  // no-op
}
function emitToAdmin(_event: string, _payload: unknown): void {
  // no-op
}

export interface ReservationEventPayload {
  id: string;
  tenantId: string;
  propertyId: string;
  guestId: string;
  confirmationNumber: string;
  status: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  adults: number;
  children: number;
  totalAmount: number;
  balance: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export function broadcastReservationCreated(payload: ReservationEventPayload): void {
  emitToTenant(payload.tenantId, 'reservation:created', payload);
  emitToAdmin('reservation:created', payload);
}

export function broadcastReservationUpdated(payload: ReservationEventPayload): void {
  emitToTenant(payload.tenantId, 'reservation:updated', payload);
  emitToAdmin('reservation:updated', payload);
}

export function broadcastReservationCancelled(payload: ReservationEventPayload): void {
  emitToTenant(payload.tenantId, 'reservation:cancelled', payload);
  emitToAdmin('reservation:cancelled', payload);
}

export function broadcastReservationCheckedIn(payload: ReservationEventPayload): void {
  emitToTenant(payload.tenantId, 'reservation:checked_in', payload);
  emitToAdmin('reservation:checked_in', payload);
}

export function broadcastReservationCheckedOut(payload: ReservationEventPayload): void {
  emitToTenant(payload.tenantId, 'reservation:checked_out', payload);
  emitToAdmin('reservation:checked_out', payload);
}
