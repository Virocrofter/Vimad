/* apps/api/src/modules/guests/guests.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    guest: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '../../common/prisma.js';
import { listGuests, getGuest, createGuest, updateGuest, deleteGuest } from './guests.service.js';

const mockGuest = prisma.guest as unknown as Record<string, ReturnType<typeof vi.fn>>;

const sampleGuest = {
  id: 'g1',
  tenantId: 't1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
};

beforeEach(() => vi.clearAllMocks());

describe('listGuests', () => {
  it('returns paginated results scoped to the tenant', async () => {
    mockGuest.count.mockResolvedValue(1);
    mockGuest.findMany.mockResolvedValue([sampleGuest]);

    const result = await listGuests('t1', { page: 1, pageSize: 20 });

    expect(result.data).toEqual([sampleGuest]);
    expect(result.meta).toMatchObject({ page: 1, pageSize: 20, total: 1, totalPages: 1 });
    expect(mockGuest.findMany.mock.calls[0][0].where).toEqual({ tenantId: 't1' });
  });

  it('applies case-insensitive search across name/email/phone', async () => {
    mockGuest.count.mockResolvedValue(0);
    mockGuest.findMany.mockResolvedValue([]);

    await listGuests('t1', { page: 1, pageSize: 20, search: 'jane' });

    const where = mockGuest.findMany.mock.calls[0][0].where;
    expect(where.OR).toHaveLength(4);
    expect(where.OR[0].firstName).toEqual({ contains: 'jane', mode: 'insensitive' });
  });

  it('computes skip/take for later pages', async () => {
    mockGuest.count.mockResolvedValue(100);
    mockGuest.findMany.mockResolvedValue([]);

    const result = await listGuests('t1', { page: 3, pageSize: 10 });

    expect(mockGuest.findMany.mock.calls[0][0]).toMatchObject({ skip: 20, take: 10 });
    expect(result.meta.totalPages).toBe(10);
  });
});

describe('getGuest', () => {
  it('throws 404 when the guest does not exist in this tenant', async () => {
    mockGuest.findFirst.mockResolvedValue(null);
    await expect(getGuest('t1', 'nope')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('never returns a guest from another tenant', async () => {
    mockGuest.findFirst.mockResolvedValue(null); // tenant filter excludes it
    await expect(getGuest('other-tenant', 'g1')).rejects.toMatchObject({ statusCode: 404 });
    expect(mockGuest.findFirst.mock.calls[0][0].where).toEqual({
      id: 'g1',
      tenantId: 'other-tenant',
    });
  });
});

describe('createGuest', () => {
  it('persists the guest under the tenant', async () => {
    mockGuest.create.mockResolvedValue(sampleGuest);
    const result = await createGuest('t1', { firstName: 'Jane', lastName: 'Doe' });
    expect(result).toEqual(sampleGuest);
    expect(mockGuest.create.mock.calls[0][0].data.tenantId).toBe('t1');
  });
});

describe('updateGuest', () => {
  it('verifies tenant ownership before updating', async () => {
    mockGuest.findFirst.mockResolvedValue(sampleGuest);
    mockGuest.update.mockResolvedValue({ ...sampleGuest, vipStatus: 'gold' });

    const result = await updateGuest('t1', 'g1', { vipStatus: 'gold' });
    expect(result.vipStatus).toBe('gold');
  });

  it('refuses to update a guest outside the tenant', async () => {
    mockGuest.findFirst.mockResolvedValue(null);
    await expect(updateGuest('t1', 'g1', { vipStatus: 'gold' })).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(mockGuest.update).not.toHaveBeenCalled();
  });
});

describe('deleteGuest', () => {
  it('verifies tenant ownership before deleting', async () => {
    mockGuest.findFirst.mockResolvedValue(sampleGuest);
    mockGuest.delete.mockResolvedValue(sampleGuest);

    await deleteGuest('t1', 'g1');
    expect(mockGuest.delete).toHaveBeenCalledWith({ where: { id: 'g1' } });
  });

  it('refuses to delete a guest outside the tenant', async () => {
    mockGuest.findFirst.mockResolvedValue(null);
    await expect(deleteGuest('t1', 'g1')).rejects.toMatchObject({ statusCode: 404 });
    expect(mockGuest.delete).not.toHaveBeenCalled();
  });
});
