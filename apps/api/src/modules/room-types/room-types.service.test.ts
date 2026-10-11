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
  },
}));

// NOTE: the service no longer guards deletes by room count (FK cascade
// handles it) and no longer emits audit events.

import { prisma } from '../../common/prisma.js';
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

  it('includes property, rooms and rate plans when found', async () => {
    mockRoomType.findFirst.mockResolvedValue({ ...roomType, rooms: [], ratePlans: [] });
    const result = await getRoomType('t1', 'rt1');
    expect(mockRoomType.findFirst.mock.calls[0][0].include).toEqual({
      property: true,
      rooms: true,
      ratePlans: true,
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
    mockRoomType.findFirst.mockResolvedValue(roomType);

    await expect(createRoomType('t1', createInput)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
    expect(mockRoomType.create).not.toHaveBeenCalled();
  });

  it('creates the room type with schema defaults', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockRoomType.findFirst.mockResolvedValue(null);
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

  it('updates the room type', async () => {
    mockRoomType.findFirst.mockResolvedValue(roomType);
    mockRoomType.update.mockResolvedValue({ ...roomType, name: 'Deluxe King Plus' });

    await updateRoomType('t1', 'rt1', { name: 'Deluxe King Plus' });

    expect(mockRoomType.update.mock.calls[0][0]).toEqual({
      where: { id: 'rt1' },
      data: { name: 'Deluxe King Plus' },
    });
  });
});

describe('deleteRoomType', () => {
  it('throws 404 when the room type is outside the tenant', async () => {
    mockRoomType.findFirst.mockResolvedValue(null);
    await expect(deleteRoomType('t1', 'rt1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('deletes the room type', async () => {
    mockRoomType.findFirst.mockResolvedValue(roomType);
    mockRoomType.delete.mockResolvedValue(roomType);

    const result = await deleteRoomType('t1', 'rt1');

    expect(mockRoomType.delete).toHaveBeenCalledWith({ where: { id: 'rt1' } });
    expect(result).toEqual(roomType);
  });
});
