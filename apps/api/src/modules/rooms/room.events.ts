import { emitToTenant, emitToAdmin } from '../../common/socket.js';

export interface RoomStatusEvent {
  roomId: string;
  propertyId: string;
  tenantId: string;
  number: string;
  status: string;
  housekeepingStatus: string;
  previousStatus?: string;
  previousHousekeepingStatus?: string;
  changedBy: string;
  changedAt: string;
}

export function broadcastRoomStatusChanged(event: RoomStatusEvent): void {
  emitToTenant(event.tenantId, 'room:status_changed', event);

  if (event.status === 'maintenance' || event.status === 'dirty') {
    emitToAdmin('room:status_alert', event);
  }
}

export function broadcastRoomCreated(
  tenantId: string,
  room: {
    id: string;
    propertyId: string;
    number: string;
    status: string;
    housekeepingStatus: string;
  }
): void {
  emitToTenant(tenantId, 'room:created', {
    tenantId,
    ...room,
    createdAt: new Date().toISOString(),
  });
}

export function broadcastRoomUpdated(
  tenantId: string,
  room: {
    id: string;
    propertyId: string;
    number: string;
    status: string;
    housekeepingStatus: string;
  }
): void {
  emitToTenant(tenantId, 'room:updated', {
    tenantId,
    ...room,
    updatedAt: new Date().toISOString(),
  });
}

export function broadcastRoomDeleted(tenantId: string, roomId: string): void {
  emitToTenant(tenantId, 'room:deleted', { tenantId, roomId, deletedAt: new Date().toISOString() });
}
