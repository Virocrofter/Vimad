// Socket emits disabled to break circular dependency: socket.js → auth.service.ts → prisma.js
// TODO: re-enable after socket.js is decoupled from auth.service.ts

function emitToTenant(_tenantId: string, _event: string, _payload: unknown): void {
  // no-op
}
function emitToAdmin(_event: string, _payload: unknown): void {
  // no-op
}

export interface RoomEventPayload {
  id: string;
  tenantId: string;
  propertyId: string;
  roomTypeId: string;
  number: string;
  floor?: string;
  status: string;
  housekeepingStatus: string;
  updatedAt: string;
}

export function broadcastRoomStatusChanged(payload: RoomEventPayload): void {
  emitToTenant(payload.tenantId, 'room:status_changed', payload);
  emitToAdmin('room:status_changed', payload);
}

export function broadcastRoomCreated(payload: RoomEventPayload): void {
  emitToTenant(payload.tenantId, 'room:created', payload);
  emitToAdmin('room:created', payload);
}

export function broadcastRoomUpdated(payload: RoomEventPayload): void {
  emitToTenant(payload.tenantId, 'room:updated', payload);
  emitToAdmin('room:updated', payload);
}
