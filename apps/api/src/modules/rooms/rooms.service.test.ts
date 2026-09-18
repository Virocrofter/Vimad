/* apps/api/src/modules/rooms/rooms.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    room: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    property: { findFirst: vi.fn() },
    roomType: { findFirst: vi.fn() },
    reservationStay: { count: vi.fn() },
  },
}));

vi.mock('./room.events.js', () => ({
  broadcastRoomCreated: vi.fn(),
  broadcastRoomDeleted: vi.fn(),
  broadcastRoomStatusChanged: vi.fn(),
  broadcastRoomUpdated: vi.fn(),
}));

vi.mock('../audit/audit.events.js', () => ({
  broadcastAuditEvent: vi.fn(),
}));

import { prisma } from '../../common/prisma.js';
import {
  broadcastRoomCreated,
  broadcastRoomDeleted,
  broadcastRoomStatusChanged,
  broadcastRoomUpdated,
} from './room.events.js';
import { broadcastAuditEvent } from '../audit/audit.events.js';
import {
  listRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  roomCreateSchema,
} from './rooms.service.js';

const mockRoom = prisma.room as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockProperty = prisma.property as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockRoomType = prisma.roomType as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockStay = prisma.reservationStay as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockCreated = broadcastRoomCreated as unknown as ReturnType<typeof vi.fn>;
const mockDeleted = broadcastRoomDeleted as unknown as ReturnType<typeof vi.fn>;
const mockStatusChanged = broadcastRoomStatusChanged as unknown as ReturnType<typeof vi.fn>;
const mockUpdated = broadcastRoomUpdated as unknown as ReturnType<typeof vi.fn>;
const mockAudit = broadcastAuditEvent as unknown as ReturnType<typeof vi.fn>;

const room = {
  id: 'r1',
  tenantId: 't1',
  propertyId: 'p1',
  roomTypeId: 'rt1',
  number: '204',
  floor: '2',
  status: 'clean',
  housekeepingStatus: 'ready',
};

const createInput = roomCreateSchema.parse({
  propertyId: 'p1',
  roomTypeId: 'rt1',
  number: '204',
});

beforeEach(() => vi.clearAllMocks());

describe('listRooms', () => {
  it('returns paginated rooms for the tenant', async () => {
    mockRoom.count.mockResolvedValue(1);
    mockRoom.findMany.mockResolvedValue([room]);

    const result = await listRooms('t1', { page: 1, pageSize: 20 });

    expect(mockRoom.findMany.mock.calls[0][0].where).toEqual({ tenantId: 't1' });
    expect(result.data).toEqual([room]);
  });

  it('builds an OR filter for search across number and floor', async () => {
    mockRoom.count.mockResolvedValue(0);
    mockRoom.findMany.mockResolvedValue([]);

    await listRooms('t1', { page: 1, pageSize: 20, status: 'dirty', search: '20' });

    expect(mockRoom.findMany.mock.calls[0][0].where).toEqual({
      tenantId: 't1',
      status: 'dirty',
      OR: [
        { number: { contains: '20', mode: 'insensitive' } },
        { floor: { contains: '20', mode: 'insensitive' } },
      ],
    });
  });
});

describe('getRoom', () => {
  it('throws 404 when the room is not in this tenant', async () => {
    mockRoom.findFirst.mockResolvedValue(null);
    await expect(getRoom('t1', 'r1')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });
});

describe('createRoom', () => {
  it('throws 404 when the property is outside the tenant', async () => {
    mockProperty.findFirst.mockResolvedValue(null);
    await expect(createRoom('t1', createInput)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Property not found',
    });
  });

  it('throws 404 when the room type does not belong to the property', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockRoomType.findFirst.mockResolvedValue(null);

    await expect(createRoom('t1', createInput)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Room type not found for this property',
    });
  });

  it('rejects a duplicate room number for the property', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockRoomType.findFirst.mockResolvedValue({ id: 'rt1' });
    mockRoom.findUnique.mockResolvedValue(room);

    await expect(createRoom('t1', createInput)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
    expect(mockRoom.create).not.toHaveBeenCalled();
  });

  it('creates the room and broadcasts room + audit events', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1', name: 'Grand Hotel' });
    mockRoomType.findFirst.mockResolvedValue({ id: 'rt1' });
    mockRoom.findUnique.mockResolvedValue(null);
    mockRoom.create.mockResolvedValue(room);

    const result = await createRoom('t1', createInput);

    expect(mockRoom.create.mock.calls[0][0].data).toMatchObject({
      tenantId: 't1',
      propertyId: 'p1',
      roomTypeId: 'rt1',
      number: '204',
      status: 'clean',
      housekeepingStatus: 'ready',
    });
    expect(result).toEqual(room);
    expect(mockCreated).toHaveBeenCalledWith('t1', {
      id: 'r1',
      propertyId: 'p1',
      number: '204',
      status: 'clean',
      housekeepingStatus: 'ready',
    });
    expect(mockAudit.mock.calls[0][0]).toMatchObject({
      action: { type: 'create', category: 'room' },
      severity: 'low',
    });
  });
});

describe('updateRoom', () => {
  it('throws 404 when the room is outside the tenant', async () => {
    mockRoom.findFirst.mockResolvedValue(null);
    await expect(updateRoom('t1', 'r1', { floor: '3' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('rejects renaming to a number that already exists on the property', async () => {
    mockRoom.findFirst.mockResolvedValue(room);
    mockRoom.findUnique.mockResolvedValue({ id: 'r2' });

    await expect(updateRoom('t1', 'r1', { number: '205' })).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
    expect(mockRoom.update).not.toHaveBeenCalled();
  });

  it('broadcasts a status-change event when status or housekeeping status changes', async () => {
    mockRoom.findFirst.mockResolvedValue(room);
    const updated = { ...room, status: 'dirty' };
    mockRoom.update.mockResolvedValue(updated);

    const result = await updateRoom('t1', 'r1', { status: 'dirty' });

    expect(mockStatusChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: 'r1',
        status: 'dirty',
        previousStatus: 'clean',
        previousHousekeepingStatus: 'ready',
      })
    );
    expect(mockUpdated).not.toHaveBeenCalled();
    expect(mockAudit.mock.calls[0][0].action.label).toBe('Room Status Changed');
    expect(result).toEqual(updated);
  });

  it('broadcasts a plain update event when only other fields change', async () => {
    mockRoom.findFirst.mockResolvedValue(room);
    const updated = { ...room, floor: '3' };
    mockRoom.update.mockResolvedValue(updated);

    await updateRoom('t1', 'r1', { floor: '3' });

    expect(mockUpdated).toHaveBeenCalledWith('t1', {
      id: 'r1',
      propertyId: 'p1',
      number: '204',
      status: 'clean',
      housekeepingStatus: 'ready',
    });
    expect(mockStatusChanged).not.toHaveBeenCalled();
    expect(mockAudit.mock.calls[0][0].action.label).toBe('Room Updated');
  });
});

describe('deleteRoom', () => {
  it('throws 404 when the room is outside the tenant', async () => {
    mockRoom.findFirst.mockResolvedValue(null);
    await expect(deleteRoom('t1', 'r1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('refuses to delete a room with reservation stays', async () => {
    mockRoom.findFirst.mockResolvedValue(room);
    mockStay.count.mockResolvedValue(2);

    await expect(deleteRoom('t1', 'r1')).rejects.toMatchObject({
      statusCode: 409,
      message: 'Cannot delete room with associated reservation stays',
    });
    expect(mockRoom.delete).not.toHaveBeenCalled();
  });

  it('deletes the room and broadcasts deletion events', async () => {
    mockRoom.findFirst.mockResolvedValue(room);
    mockStay.count.mockResolvedValue(0);
    mockRoom.delete.mockResolvedValue(room);

    const result = await deleteRoom('t1', 'r1');

    expect(mockRoom.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
    expect(mockDeleted).toHaveBeenCalledWith('t1', 'r1');
    expect(mockAudit.mock.calls[0][0]).toMatchObject({
      action: { type: 'delete', category: 'room' },
      severity: 'medium',
    });
    expect(result).toEqual(room);
  });
});
