/* apps/api/src/modules/rooms/rooms.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    room: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    property: { findFirst: vi.fn() },
    roomType: { findFirst: vi.fn() },
  },
}));

// NOTE: the service emits no events and writes no audit logs — the old
// room.events mocks/assertions were removed together with the service's
// use of them.

import { prisma } from '../../common/prisma.js';
import {
  listRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  updateRoomStatus,
  roomCreateSchema,
} from './rooms.service.js';

const mockRoom = prisma.room as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockProperty = prisma.property as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockRoomType = prisma.roomType as unknown as Record<string, ReturnType<typeof vi.fn>>;

const room = {
  id: 'r1',
  tenantId: 't1',
  propertyId: 'p1',
  roomTypeId: 'rt1',
  number: '205',
  floor: '2',
  status: 'clean',
  housekeepingStatus: 'ready',
};

const createInput = roomCreateSchema.parse({
  propertyId: 'p1',
  roomTypeId: 'rt1',
  number: '205',
});

beforeEach(() => vi.clearAllMocks());

describe('listRooms', () => {
  it('returns a paginated tenant-scoped list', async () => {
    mockRoom.count.mockResolvedValue(1);
    mockRoom.findMany.mockResolvedValue([room]);

    const result = await listRooms('t1', { page: 1, pageSize: 20 });

    expect(mockRoom.findMany.mock.calls[0][0].where).toEqual({ tenantId: 't1' });
    expect(result.data).toEqual([room]);
  });

  it('applies property, room type and status filters', async () => {
    mockRoom.count.mockResolvedValue(0);
    mockRoom.findMany.mockResolvedValue([]);

    await listRooms('t1', {
      page: 1,
      pageSize: 20,
      propertyId: 'p1',
      roomTypeId: 'rt1',
      status: 'dirty',
    });

    expect(mockRoom.findMany.mock.calls[0][0].where).toEqual({
      tenantId: 't1',
      propertyId: 'p1',
      roomTypeId: 'rt1',
      status: 'dirty',
    });
  });
});

describe('getRoom', () => {
  it('throws 404 for a room outside the tenant', async () => {
    mockRoom.findFirst.mockResolvedValue(null);
    await expect(getRoom('t1', 'r1')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('includes future stays and open housekeeping tasks', async () => {
    mockRoom.findFirst.mockResolvedValue(room);
    const result = await getRoom('t1', 'r1');
    const include = mockRoom.findFirst.mock.calls[0][0].include;
    expect(include.reservationStays.where.reservation.status.in).toEqual([
      'confirmed',
      'checked_in',
    ]);
    expect(include.housekeepingTasks.where.status.in).toEqual(['pending', 'in_progress']);
    expect(result).toEqual(room);
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

  it('throws 404 when the room type is outside the tenant', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockRoomType.findFirst.mockResolvedValue(null);

    await expect(createRoom('t1', createInput)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Room type not found',
    });
    expect(mockRoomType.findFirst.mock.calls[0][0].where).toEqual({
      id: 'rt1',
      tenantId: 't1',
    });
  });

  it('rejects a duplicate room number for the property', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockRoomType.findFirst.mockResolvedValue({ id: 'rt1' });
    mockRoom.findFirst.mockResolvedValue(room);

    await expect(createRoom('t1', createInput)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
    expect(mockRoom.findFirst.mock.calls[0][0].where).toEqual({
      propertyId: 'p1',
      number: '205',
    });
    expect(mockRoom.create).not.toHaveBeenCalled();
  });

  it('creates the room', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockRoomType.findFirst.mockResolvedValue({ id: 'rt1' });
    mockRoom.findFirst.mockResolvedValue(null);
    mockRoom.create.mockResolvedValue(room);

    const result = await createRoom('t1', createInput);

    expect(mockRoom.create.mock.calls[0][0].data).toMatchObject({
      tenantId: 't1',
      propertyId: 'p1',
      roomTypeId: 'rt1',
      number: '205',
      status: 'clean',
      housekeepingStatus: 'ready',
    });
    expect(result).toEqual(room);
  });
});

describe('updateRoom', () => {
  it('throws 404 for a room outside the tenant', async () => {
    mockRoom.findFirst.mockResolvedValue(null);
    await expect(updateRoom('t1', 'r1', { number: '206' })).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(mockRoom.update).not.toHaveBeenCalled();
  });

  it('updates the room without a duplicate-number guard', async () => {
    mockRoom.findFirst.mockResolvedValue(room);
    mockRoom.update.mockResolvedValue({ ...room, number: '206' });

    await updateRoom('t1', 'r1', { number: '206' });

    expect(mockRoom.update.mock.calls[0][0]).toEqual({
      where: { id: 'r1' },
      data: { number: '206' },
    });
  });
});

describe('updateRoomStatus', () => {
  it('throws 404 for a room outside the tenant', async () => {
    mockRoom.findFirst.mockResolvedValue(null);
    await expect(updateRoomStatus('t1', 'r1', 'dirty')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('updates only the fields that are provided', async () => {
    mockRoom.findFirst.mockResolvedValue(room);
    mockRoom.update.mockResolvedValue({ ...room, status: 'dirty' });

    await updateRoomStatus('t1', 'r1', 'dirty');

    expect(mockRoom.update.mock.calls[0][0].data).toEqual({ status: 'dirty' });
  });
});

describe('deleteRoom', () => {
  it('throws 404 for a room outside the tenant', async () => {
    mockRoom.findFirst.mockResolvedValue(null);
    await expect(deleteRoom('t1', 'r1')).rejects.toMatchObject({ statusCode: 404 });
    expect(mockRoom.delete).not.toHaveBeenCalled();
  });

  it('deletes the room (stay-count guard was removed from the service)', async () => {
    mockRoom.findFirst.mockResolvedValue(room);
    mockRoom.delete.mockResolvedValue(room);

    const result = await deleteRoom('t1', 'r1');

    expect(mockRoom.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
    expect(result).toEqual(room);
  });
});
