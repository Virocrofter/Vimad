/* apps/api/src/modules/properties/properties.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    property: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../audit/audit.events.js', () => ({
  broadcastAuditEvent: vi.fn(),
}));

import { prisma } from '../../common/prisma.js';
import { broadcastAuditEvent } from '../audit/audit.events.js';
import {
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  propertyCreateSchema,
} from './properties.service.js';

const mockProperty = prisma.property as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockBroadcast = broadcastAuditEvent as unknown as ReturnType<typeof vi.fn>;

const property = {
  id: 'p1',
  tenantId: 't1',
  name: 'Grand Hotel',
  code: 'GH-01',
  timezone: 'UTC',
  currency: 'USD',
};

beforeEach(() => vi.clearAllMocks());

describe('listProperties', () => {
  it('returns a paginated result scoped to the tenant', async () => {
    mockProperty.count.mockResolvedValue(1);
    mockProperty.findMany.mockResolvedValue([property]);

    const result = await listProperties('t1', { page: 1, pageSize: 20 });

    expect(mockProperty.count.mock.calls[0][0].where).toEqual({ tenantId: 't1' });
    expect(result.data).toEqual([property]);
    expect(result.meta).toMatchObject({ page: 1, pageSize: 20, total: 1, totalPages: 1 });
  });

  it('applies skip/take for later pages', async () => {
    mockProperty.count.mockResolvedValue(50);
    mockProperty.findMany.mockResolvedValue([]);

    await listProperties('t1', { page: 3, pageSize: 10 });

    expect(mockProperty.findMany.mock.calls[0][0]).toMatchObject({ skip: 20, take: 10 });
  });
});

describe('getProperty', () => {
  it('throws 404 when the property is not in this tenant', async () => {
    mockProperty.findFirst.mockResolvedValue(null);
    await expect(getProperty('t1', 'p1')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('returns the property with room types and rooms', async () => {
    mockProperty.findFirst.mockResolvedValue({ ...property, roomTypes: [], rooms: [] });
    const result = await getProperty('t1', 'p1');
    expect(result.id).toBe('p1');
    expect(mockProperty.findFirst.mock.calls[0][0].include).toEqual({
      roomTypes: true,
      rooms: true,
    });
  });
});

describe('createProperty', () => {
  const input = propertyCreateSchema.parse({ name: 'Grand Hotel', code: 'GH-01' });

  it('rejects a duplicate code within the tenant', async () => {
    mockProperty.findUnique.mockResolvedValue(property);
    await expect(createProperty('t1', input)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
    expect(mockProperty.create).not.toHaveBeenCalled();
  });

  it('creates the property and broadcasts a medium-severity audit event', async () => {
    mockProperty.findUnique.mockResolvedValue(null);
    mockProperty.create.mockResolvedValue(property);

    const result = await createProperty('t1', input);

    expect(mockProperty.create.mock.calls[0][0].data).toMatchObject({
      tenantId: 't1',
      name: 'Grand Hotel',
      code: 'GH-01',
      timezone: 'UTC',
      currency: 'USD',
    });
    expect(result).toEqual(property);
    expect(mockBroadcast.mock.calls[0][0]).toMatchObject({
      action: { type: 'create', category: 'property' },
      target: { type: 'property', id: 'p1' },
      severity: 'medium',
    });
  });
});

describe('updateProperty', () => {
  it('throws 404 when updating a property outside the tenant', async () => {
    mockProperty.findFirst.mockResolvedValue(null);
    await expect(updateProperty('t1', 'p1', { name: 'x' })).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(mockProperty.update).not.toHaveBeenCalled();
  });

  it('updates and reports the changed fields', async () => {
    mockProperty.findFirst.mockResolvedValue(property);
    mockProperty.update.mockResolvedValue({ ...property, name: 'Grand Hotel renamed' });

    await updateProperty('t1', 'p1', { name: 'Grand Hotel renamed' });

    expect(mockProperty.update.mock.calls[0][0]).toEqual({
      where: { id: 'p1' },
      data: { name: 'Grand Hotel renamed' },
    });
    expect(mockBroadcast.mock.calls[0][0]).toMatchObject({
      action: { type: 'update', category: 'property' },
      severity: 'low',
      metadata: { changedFields: ['name'] },
    });
  });
});

describe('deleteProperty', () => {
  it('throws 404 when deleting a property outside the tenant', async () => {
    mockProperty.findFirst.mockResolvedValue(null);
    await expect(deleteProperty('t1', 'p1')).rejects.toMatchObject({ statusCode: 404 });
    expect(mockProperty.delete).not.toHaveBeenCalled();
  });

  it('deletes the property and broadcasts a high-severity event', async () => {
    mockProperty.findFirst.mockResolvedValue(property);
    mockProperty.delete.mockResolvedValue(property);

    const result = await deleteProperty('t1', 'p1');

    expect(mockProperty.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    expect(result).toEqual(property);
    expect(mockBroadcast.mock.calls[0][0]).toMatchObject({
      action: { type: 'delete', category: 'property' },
      severity: 'high',
    });
  });
});
