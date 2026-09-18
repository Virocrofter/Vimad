/* apps/api/src/modules/room-types/room-types.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    roomType: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    property: { findFirst: vi.fn() },
    room: { count: vi.fn() },
  },
}));

vi.mock('../audit/audit.events.js', () => ({
  broadcastAuditEvent: vi.fn(),
}));

import { prisma } from '../../common/prisma.js';
import { broadcastAuditEvent } from '../audit/audit.events.js';
import {
  listRoomTypes,
  getRoomType,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  roomTypeCreateSchema,
} from './room-types.service.js';

const mockRoomType = prisma.roomType as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockProperty = prisma.property as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockRoom = prisma.room as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockBroadcast = broadcastAuditEvent as unknown as ReturnType<typeof vi.fn>;

const roomType = {
  id: 'rt1',
  tenantId: 't1',
  propertyId: 'p1',
  name: 'Deluxe King',
  code: 'DLXK',
  baseOccupancy: 2,
  maxOccupancy: 4,
};

const createInput = roomTypeCreateSchema.parse({
  propertyId: 'p1',
  name: 'Deluxe King',
  code: 'DLXK',
});

beforeEach(() => vi.clearAllMocks());

describe('listRoomTypes', () => {
  it('returns paginated room types for the tenant', async () => {
    mockRoomType.count.mockResolvedValue(1);
    mockRoomType.findMany.mockResolvedValue([roomType]);

    const result = await listRoomTypes('t1', { page: 1, pageSize: 20 });

    expect(mockRoomType.findMany.mock.calls[0][0].where).toEqual({ tenantId: 't1' });
    expect(result.data).toEqual([roomType]);
    expect(result.meta.total).toBe(1);
  });

  it('filters by property when propertyId is given', async () => {
    mockRoomType.count.mockResolvedValue(0);
    mockRoomType.findMany.mockResolvedValue([]);

    await listRoomTypes('t1', { page: 1, pageSize: 20, propertyId: 'p1' });

    expect(mockRoomType.findMany.mock.calls[0][0].where).toEqual({
      tenantId: 't1',
      propertyId: 'p1',
    });
  });
});

describe('getRoomType', () => {
  it('throws 404 when the room type is not in this tenant', async () => {
    mockRoomType.findFirst.mockResolvedValue(null);
    await expect(getRoomType('t1', 'rt1')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('includes rooms when found', async () => {
    mockRoomType.findFirst.mockResolvedValue({ ...roomType, rooms: [] });
    const result = await getRoomType('t1', 'rt1');
    expect(mockRoomType.findFirst.mock.calls[0][0].include.rooms).toEqual({
      select: { id: true, number: true, status: true },
    });
    expect(result.id).toBe('rt1');
  });
});

describe('createRoomType', () => {
  it('throws 404 when the property is outside the tenant', async () => {
    mockProperty.findFirst.mockResolvedValue(null);
    await expect(createRoomType('t1', createInput)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Property not found',
    });
  });

  it('rejects a duplicate code for the property', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockRoomType.findUnique.mockResolvedValue(roomType);

    await expect(createRoomType('t1', createInput)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
    expect(mockRoomType.create).not.toHaveBeenCalled();
  });

  it('creates the room type with schema defaults and broadcasts an audit event', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockRoomType.findUnique.mockResolvedValue(null);
    mockRoomType.create.mockResolvedValue(roomType);

    const result = await createRoomType('t1', createInput);

    expect(mockRoomType.create.mock.calls[0][0].data).toMatchObject({
      tenantId: 't1',
      propertyId: 'p1',
      code: 'DLXK',
      baseOccupancy: 2,
      maxOccupancy: 4,
    });
    expect(result).toEqual(roomType);
    expect(mockBroadcast.mock.calls[0][0]).toMatchObject({
      action: { type: 'create', category: 'room_type' },
      severity: 'low',
    });
  });
});

describe('updateRoomType', () => {
  it('throws 404 when the room type is outside the tenant', async () => {
    mockRoomType.findFirst.mockResolvedValue(null);
    await expect(updateRoomType('t1', 'rt1', { name: 'x' })).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(mockRoomType.update).not.toHaveBeenCalled();
  });

  it('updates the room type and reports changed fields', async () => {
    mockRoomType.findFirst.mockResolvedValue(roomType);
    mockRoomType.update.mockResolvedValue({ ...roomType, name: 'Deluxe King Plus' });

    await updateRoomType('t1', 'rt1', { name: 'Deluxe King Plus' });

    expect(mockRoomType.update.mock.calls[0][0]).toEqual({
      where: { id: 'rt1' },
      data: { name: 'Deluxe King Plus' },
    });
    expect(mockBroadcast.mock.calls[0][0].metadata).toEqual({
      changedFields: ['name'],
    });
  });
});

describe('deleteRoomType', () => {
  it('throws 404 when the room type is outside the tenant', async () => {
    mockRoomType.findFirst.mockResolvedValue(null);
    await expect(deleteRoomType('t1', 'rt1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('refuses to delete a room type that still has rooms', async () => {
    mockRoomType.findFirst.mockResolvedValue(roomType);
    mockRoom.count.mockResolvedValue(3);

    await expect(deleteRoomType('t1', 'rt1')).rejects.toMatchObject({
      statusCode: 409,
      message: 'Cannot delete room type with associated rooms',
    });
    expect(mockRoomType.delete).not.toHaveBeenCalled();
  });

  it('deletes the room type when no rooms are attached', async () => {
    mockRoomType.findFirst.mockResolvedValue(roomType);
    mockRoom.count.mockResolvedValue(0);
    mockRoomType.delete.mockResolvedValue(roomType);

    const result = await deleteRoomType('t1', 'rt1');

    expect(mockRoom.count).toHaveBeenCalledWith({ where: { roomTypeId: 'rt1' } });
    expect(mockRoomType.delete).toHaveBeenCalledWith({ where: { id: 'rt1' } });
    expect(result).toEqual(roomType);
    expect(mockBroadcast.mock.calls[0][0]).toMatchObject({
      action: { type: 'delete', category: 'room_type' },
      severity: 'medium',
    });
  });
});
