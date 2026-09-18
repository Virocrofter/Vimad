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
    roomType: { findFirst: vi.fn() },
  },
}));

vi.mock('../audit/audit.events.js', () => ({
  broadcastAuditEvent: vi.fn(),
}));

import { prisma } from '../../common/prisma.js';
import { broadcastAuditEvent } from '../audit/audit.events.js';
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
const mockBroadcast = broadcastAuditEvent as unknown as ReturnType<typeof vi.fn>;

const ratePlan = {
  id: 'rp1',
  tenantId: 't1',
  propertyId: 'p1',
  roomTypeId: 'rt1',
  name: 'BAR',
  code: 'BAR',
  baseRate: 150,
  currency: 'USD',
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

  it('maps the active filter to a status filter', async () => {
    mockRatePlan.count.mockResolvedValue(0);
    mockRatePlan.findMany.mockResolvedValue([]);

    await listRatePlans('t1', { page: 1, pageSize: 20, propertyId: 'p1', active: true });

    expect(mockRatePlan.findMany.mock.calls[0][0].where).toEqual({
      tenantId: 't1',
      propertyId: 'p1',
      status: 'active',
    });
  });

  it('maps active=false to status inactive', async () => {
    mockRatePlan.count.mockResolvedValue(0);
    mockRatePlan.findMany.mockResolvedValue([]);

    await listRatePlans('t1', { page: 1, pageSize: 20, active: false });

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

  it('throws 404 when the room type does not belong to the property', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockRoomType.findFirst.mockResolvedValue(null);

    await expect(createRatePlan('t1', createInput)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Room type not found for this property',
    });
    expect(mockRoomType.findFirst.mock.calls[0][0].where).toEqual({
      id: 'rt1',
      tenantId: 't1',
      propertyId: 'p1',
    });
  });

  it('rejects a duplicate plan code for the property', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockRoomType.findFirst.mockResolvedValue({ id: 'rt1' });
    mockRatePlan.findUnique.mockResolvedValue(ratePlan);

    await expect(createRatePlan('t1', createInput)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
    expect(mockRatePlan.create).not.toHaveBeenCalled();
  });

  it('creates the plan and broadcasts a low-severity audit event', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockRoomType.findFirst.mockResolvedValue({ id: 'rt1' });
    mockRatePlan.findUnique.mockResolvedValue(null);
    mockRatePlan.create.mockResolvedValue(ratePlan);

    const result = await createRatePlan('t1', createInput);

    expect(mockRatePlan.create.mock.calls[0][0].data).toMatchObject({
      tenantId: 't1',
      propertyId: 'p1',
      roomTypeId: 'rt1',
      code: 'BAR',
      baseRate: 150,
      currency: 'USD',
      closeToArrival: false,
      closeToDeparture: false,
    });
    expect(result).toEqual(ratePlan);
    expect(mockBroadcast.mock.calls[0][0]).toMatchObject({
      action: { type: 'create', category: 'rate_plan' },
      severity: 'low',
    });
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

  it('updates the plan and reports changed fields', async () => {
    mockRatePlan.findFirst.mockResolvedValue(ratePlan);
    mockRatePlan.update.mockResolvedValue({ ...ratePlan, baseRate: 200 });

    await updateRatePlan('t1', 'rp1', { baseRate: 200 });

    expect(mockRatePlan.update.mock.calls[0][0]).toEqual({
      where: { id: 'rp1' },
      data: { baseRate: 200 },
    });
    expect(mockBroadcast.mock.calls[0][0].metadata).toEqual({ changedFields: ['baseRate'] });
  });
});

describe('deleteRatePlan', () => {
  it('throws 404 when the plan is outside the tenant', async () => {
    mockRatePlan.findFirst.mockResolvedValue(null);
    await expect(deleteRatePlan('t1', 'rp1')).rejects.toMatchObject({ statusCode: 404 });
    expect(mockRatePlan.delete).not.toHaveBeenCalled();
  });

  it('deletes the plan and broadcasts a medium-severity event', async () => {
    mockRatePlan.findFirst.mockResolvedValue(ratePlan);
    mockRatePlan.delete.mockResolvedValue(ratePlan);

    const result = await deleteRatePlan('t1', 'rp1');

    expect(mockRatePlan.delete).toHaveBeenCalledWith({ where: { id: 'rp1' } });
    expect(result).toEqual(ratePlan);
    expect(mockBroadcast.mock.calls[0][0]).toMatchObject({
      action: { type: 'delete', category: 'rate_plan' },
      severity: 'medium',
    });
  });
});
