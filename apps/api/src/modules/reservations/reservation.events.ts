import { emitToTenant, emitToAdmin } from '../../common/socket.js';
import { logger } from '../../common/logger.js';

export interface ReservationEventPayload {
  id: string;
  confirmationNumber: string;
  guestName: string;
  propertyId: string;
  propertyName: string;
  arrivalDate: string;
  departureDate: string;
  status: string;
  source?: string;
  previousStatus?: string;
}

export interface ReservationCheckInPayload {
  id: string;
  confirmationNumber: string;
  guestName: string;
  propertyId: string;
  propertyName: string;
  roomNumber?: string;
  checkedInAt: string;
}

export interface ReservationCheckOutPayload {
  id: string;
  confirmationNumber: string;
  guestName: string;
  propertyId: string;
  propertyName: string;
  checkedOutAt: string;
}

export interface ReservationCancelledPayload {
  id: string;
  confirmationNumber: string;
  guestName: string;
  propertyId: string;
  propertyName: string;
  cancelledAt: string;
  reason?: string;
}

export function broadcastReservationCreated(
  tenantId: string,
  payload: ReservationEventPayload
): void {
  emitToTenant(tenantId, 'reservation:created', {
    ...payload,
    event: 'reservation:created',
    timestamp: new Date().toISOString(),
  });
  emitToAdmin('reservation:created', {
    ...payload,
    event: 'reservation:created',
    tenantId,
    timestamp: new Date().toISOString(),
  });
  logger.debug({ reservationId: payload.id }, 'reservation:created event broadcast');
}

export function broadcastReservationUpdated(
  tenantId: string,
  payload: ReservationEventPayload
): void {
  emitToTenant(tenantId, 'reservation:updated', {
    ...payload,
    event: 'reservation:updated',
    timestamp: new Date().toISOString(),
  });
  logger.debug({ reservationId: payload.id }, 'reservation:updated event broadcast');
}

export function broadcastReservationCheckedIn(
  tenantId: string,
  payload: ReservationCheckInPayload
): void {
  emitToTenant(tenantId, 'reservation:checked_in', {
    ...payload,
    event: 'reservation:checked_in',
    timestamp: new Date().toISOString(),
  });
  emitToAdmin('reservation:checked_in', {
    ...payload,
    event: 'reservation:checked_in',
    tenantId,
    timestamp: new Date().toISOString(),
  });
  logger.debug({ reservationId: payload.id }, 'reservation:checked_in event broadcast');
}

export function broadcastReservationCheckedOut(
  tenantId: string,
  payload: ReservationCheckOutPayload
): void {
  emitToTenant(tenantId, 'reservation:checked_out', {
    ...payload,
    event: 'reservation:checked_out',
    timestamp: new Date().toISOString(),
  });
  emitToAdmin('reservation:checked_out', {
    ...payload,
    event: 'reservation:checked_out',
    tenantId,
    timestamp: new Date().toISOString(),
  });
  logger.debug({ reservationId: payload.id }, 'reservation:checked_out event broadcast');
}

export function broadcastReservationCancelled(
  tenantId: string,
  payload: ReservationCancelledPayload
): void {
  emitToTenant(tenantId, 'reservation:cancelled', {
    ...payload,
    event: 'reservation:cancelled',
    timestamp: new Date().toISOString(),
  });
  emitToAdmin('reservation:cancelled', {
    ...payload,
    event: 'reservation:cancelled',
    tenantId,
    timestamp: new Date().toISOString(),
  });
  logger.debug({ reservationId: payload.id }, 'reservation:cancelled event broadcast');
}
