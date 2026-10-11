/* apps/api/src/modules/rates/rates.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    ratePlan: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    property: { findFirst: vi.fn() },
    roomType: { findFirst: vi.fn(), findMany: vi.fn() },
    room: { findMany: vi.fn() },
    reservationStay: { findMany: vi.fn() },
  },
}));

import { prisma } from '../../common/prisma.js';
import {
  listRatePlans,
  getRatePlan,
  createRatePlan,
  updateRatePlan,
  deleteRatePlan,
  ratePlanCreateSchema,
} from './rates.service.js';

const mockRatePlan = prisma.ratePlan as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockProperty = prisma.property as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockRoomType = prisma.roomType as unknown as Record<string, ReturnType<typeof vi.fn>>;

const ratePlan = {
  id: 'rp1',
  tenantId: 't1',
  propertyId: 'p1',
  roomTypeId: 'rt1',
  name: 'BAR',
  code: 'BAR',
  baseRate: 150,
  currency: 'ZAR',
  status: 'active',
};

const createInput = ratePlanCreateSchema.parse({
  propertyId: 'p1',
  roomTypeId: 'rt1',
  name: 'BAR',
  code: 'BAR',
  baseRate: 150,
});

beforeEach(() => vi.clearAllMocks());

describe('listRatePlans', () => {
  it('returns paginated plans for the tenant', async () => {
    mockRatePlan.count.mockResolvedValue(2);
    mockRatePlan.findMany.mockResolvedValue([ratePlan]);

    const result = await listRatePlans('t1', { page: 1, pageSize: 20 });

    expect(mockRatePlan.count.mock.calls[0][0].where).toEqual({ tenantId: 't1' });
    expect(result.meta.total).toBe(2);
  });

  it('passes propertyId and status filters through to the where clause', async () => {
    mockRatePlan.count.mockResolvedValue(0);
    mockRatePlan.findMany.mockResolvedValue([]);

    await listRatePlans('t1', { page: 1, pageSize: 20, propertyId: 'p1', status: 'active' });

    expect(mockRatePlan.findMany.mock.calls[0][0].where).toEqual({
      tenantId: 't1',
      propertyId: 'p1',
      status: 'active',
    });
  });

  it('maps status=inactive through to the where clause', async () => {
    mockRatePlan.count.mockResolvedValue(0);
    mockRatePlan.findMany.mockResolvedValue([]);

    await listRatePlans('t1', { page: 1, pageSize: 20, status: 'inactive' });

    expect(mockRatePlan.findMany.mock.calls[0][0].where.status).toBe('inactive');
  });
});

describe('getRatePlan', () => {
  it('throws 404 when the plan is not in this tenant', async () => {
    mockRatePlan.findFirst.mockResolvedValue(null);
    await expect(getRatePlan('t1', 'rp1')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('returns the plan when found', async () => {
    mockRatePlan.findFirst.mockResolvedValue(ratePlan);
    expect(await getRatePlan('t1', 'rp1')).toEqual(ratePlan);
  });
});

describe('createRatePlan', () => {
  it('throws 404 when the property is outside the tenant', async () => {
    mockProperty.findFirst.mockResolvedValue(null);
    await expect(createRatePlan('t1', createInput)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Property not found',
    });
  });

  it('throws 404 when the room type does not belong to the tenant', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockRoomType.findFirst.mockResolvedValue(null);

    await expect(createRatePlan('t1', createInput)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Room type not found',
    });
    expect(mockRoomType.findFirst.mock.calls[0][0].where).toEqual({
      id: 'rt1',
      tenantId: 't1',
    });
  });

  it('rejects a duplicate plan code for the property', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockRoomType.findFirst.mockResolvedValue({ id: 'rt1' });
    mockRatePlan.findFirst.mockResolvedValue(ratePlan);

    await expect(createRatePlan('t1', createInput)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
    expect(mockRatePlan.create).not.toHaveBeenCalled();
  });

  it('creates the plan with schema defaults', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockRoomType.findFirst.mockResolvedValue({ id: 'rt1' });
    mockRatePlan.findFirst.mockResolvedValue(null);
    mockRatePlan.create.mockResolvedValue(ratePlan);

    const result = await createRatePlan('t1', createInput);

    expect(mockRatePlan.create.mock.calls[0][0].data).toMatchObject({
      tenantId: 't1',
      propertyId: 'p1',
      roomTypeId: 'rt1',
      code: 'BAR',
      baseRate: 150,
      currency: 'ZAR',
      calculationMethod: 'fixed',
      status: 'active',
      closeToArrival: false,
      closeToDeparture: false,
    });
    expect(result).toEqual(ratePlan);
  });
});

describe('updateRatePlan', () => {
  it('throws 404 when the plan is outside the tenant', async () => {
    mockRatePlan.findFirst.mockResolvedValue(null);
    await expect(updateRatePlan('t1', 'rp1', { baseRate: 200 })).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(mockRatePlan.update).not.toHaveBeenCalled();
  });

  it('updates the plan', async () => {
    mockRatePlan.findFirst.mockResolvedValue(ratePlan);
    mockRatePlan.update.mockResolvedValue({ ...ratePlan, baseRate: 200 });

    await updateRatePlan('t1', 'rp1', { baseRate: 200 });

    expect(mockRatePlan.update.mock.calls[0][0]).toEqual({
      where: { id: 'rp1' },
      data: { baseRate: 200 },
    });
  });
});

describe('deleteRatePlan', () => {
  it('throws 404 when the plan is outside the tenant', async () => {
    mockRatePlan.findFirst.mockResolvedValue(null);
    await expect(deleteRatePlan('t1', 'rp1')).rejects.toMatchObject({ statusCode: 404 });
    expect(mockRatePlan.delete).not.toHaveBeenCalled();
  });

  it('deletes the plan', async () => {
    mockRatePlan.findFirst.mockResolvedValue(ratePlan);
    mockRatePlan.delete.mockResolvedValue(ratePlan);

    const result = await deleteRatePlan('t1', 'rp1');

    expect(mockRatePlan.delete).toHaveBeenCalledWith({ where: { id: 'rp1' } });
    expect(result).toEqual(ratePlan);
  });
});
