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
    reservation: {
      count: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

import { prisma } from '../../common/prisma.js';
import {
  listGuests,
  getGuestStats,
  getGuest,
  createGuest,
  updateGuest,
  deleteGuest,
} from './guests.service.js';

const mockGuest = prisma.guest as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockReservation = prisma.reservation as unknown as Record<string, ReturnType<typeof vi.fn>>;

const guest = {
  id: 'g1',
  tenantId: 't1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: '+27123456789',
  passportNumber: 'P1234567',
  vipStatus: 'gold',
  blacklisted: false,
};

beforeEach(() => vi.clearAllMocks());

describe('listGuests', () => {
  it('returns a paginated tenant-scoped list', async () => {
    mockGuest.count.mockResolvedValue(1);
    mockGuest.findMany.mockResolvedValue([guest]);

    const result = await listGuests('t1', { page: 1, pageSize: 20 });

    expect(mockGuest.findMany.mock.calls[0][0].where.tenantId).toBe('t1');
    expect(result.data).toEqual([guest]);
    expect(result.meta.total).toBe(1);
  });

  it('applies case-insensitive search across name, email, phone and passport', async () => {
    mockGuest.count.mockResolvedValue(0);
    mockGuest.findMany.mockResolvedValue([]);

    await listGuests('t1', { page: 1, pageSize: 20, search: 'jane' });

    const where = mockGuest.findMany.mock.calls[0][0].where;
    expect(where.OR).toHaveLength(5);
    expect(where.OR[0].firstName).toEqual({ contains: 'jane', mode: 'insensitive' });
    expect(where.OR[1].lastName).toEqual({ contains: 'jane', mode: 'insensitive' });
    expect(where.OR[2].email).toEqual({ contains: 'jane', mode: 'insensitive' });
    expect(where.OR[3].phone).toEqual({ contains: 'jane', mode: 'insensitive' });
    expect(where.OR[4].passportNumber).toEqual({ contains: 'jane', mode: 'insensitive' });
  });

  it('maps vipStatus=vip to a non-empty check and vipStatus=none to null-or-empty', async () => {
    mockGuest.count.mockResolvedValue(0);
    mockGuest.findMany.mockResolvedValue([]);

    await listGuests('t1', { page: 1, pageSize: 20, vipStatus: 'vip' });
    expect(mockGuest.findMany.mock.calls[0][0].where.vipStatus).toEqual({ notIn: [''] });

    await listGuests('t1', { page: 1, pageSize: 20, vipStatus: 'none' });
    expect(mockGuest.findMany.mock.calls[1][0].where.OR).toEqual([
      { vipStatus: null },
      { vipStatus: '' },
    ]);
  });

  it('filters by blacklisted=true', async () => {
    mockGuest.count.mockResolvedValue(0);
    mockGuest.findMany.mockResolvedValue([]);

    await listGuests('t1', { page: 1, pageSize: 20, blacklisted: 'true' });

    expect(mockGuest.findMany.mock.calls[0][0].where.blacklisted).toBe(true);
  });

  it('falls back to createdAt sort for an unknown sortBy', async () => {
    mockGuest.count.mockResolvedValue(0);
    mockGuest.findMany.mockResolvedValue([]);

    await listGuests('t1', { page: 1, pageSize: 20, sortBy: 'hacked', sortDir: 'asc' });

    expect(mockGuest.findMany.mock.calls[0][0].orderBy).toEqual({ createdAt: 'asc' });
  });
});

describe('getGuestStats', () => {
  it('aggregates the five stat buckets', async () => {
    mockGuest.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(2) // vip
      .mockResolvedValueOnce(1) // new this month
      .mockResolvedValueOnce(3); // blacklisted
    mockReservation.findMany.mockResolvedValue([{ guestId: 'g1' }, { guestId: 'g2' }]);

    const result = await getGuestStats('t1');

    expect(result).toEqual({ total: 10, vip: 2, newThisMonth: 1, inHouse: 2, blacklisted: 3 });
  });
});

describe('getGuest', () => {
  it('throws 404 for a guest outside the tenant', async () => {
    mockGuest.findFirst.mockResolvedValue(null);
    await expect(getGuest('t1', 'g1')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('returns the profile with stay statistics', async () => {
    mockGuest.findFirst.mockResolvedValue({ ...guest, guestNotes: [] });
    mockReservation.aggregate.mockResolvedValue({
      _count: { id: 4 },
      _sum: { nights: 12, totalAmount: 4800 },
    });

    const result = await getGuest('t1', 'g1');

    expect(result.totalStays).toBe(4);
    expect(result.totalNights).toBe(12);
    expect(result.totalRevenue).toBe(4800);
  });
});

describe('createGuest', () => {
  it('creates the guest in the tenant', async () => {
    mockGuest.create.mockResolvedValue(guest);

    await createGuest('t1', { firstName: 'Jane', lastName: 'Doe' });

    expect(mockGuest.create.mock.calls[0][0].data).toMatchObject({
      tenantId: 't1',
      firstName: 'Jane',
      lastName: 'Doe',
    });
  });
});

describe('updateGuest', () => {
  it('throws 404 for a guest outside the tenant', async () => {
    mockGuest.findFirst.mockResolvedValue(null);
    await expect(updateGuest('t1', 'g1', { firstName: 'X' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('clears the blacklist reason when un-blacklisting', async () => {
    mockGuest.findFirst.mockResolvedValue(guest);
    mockGuest.update.mockResolvedValue(guest);

    await updateGuest('t1', 'g1', { blacklisted: false });

    expect(mockGuest.update.mock.calls[0][0].data).toMatchObject({
      blacklisted: false,
      blacklistReason: null,
    });
  });
});

describe('deleteGuest', () => {
  it('throws 404 for a guest outside the tenant', async () => {
    mockGuest.findFirst.mockResolvedValue(null);
    await expect(deleteGuest('t1', 'g1')).rejects.toMatchObject({ statusCode: 404 });
    expect(mockGuest.delete).not.toHaveBeenCalled();
  });

  it('refuses to delete a guest with reservation history', async () => {
    mockGuest.findFirst.mockResolvedValue(guest);
    mockReservation.count.mockResolvedValue(2);

    await expect(deleteGuest('t1', 'g1')).rejects.toMatchObject({
      statusCode: 409,
      code: 'GUEST_HAS_HISTORY',
    });
    expect(mockGuest.delete).not.toHaveBeenCalled();
  });

  it('deletes a guest with no reservation history', async () => {
    mockGuest.findFirst.mockResolvedValue(guest);
    mockReservation.count.mockResolvedValue(0);
    mockGuest.delete.mockResolvedValue(guest);

    const result = await deleteGuest('t1', 'g1');

    expect(mockReservation.count.mock.calls[0][0].where).toEqual({ guestId: 'g1' });
    expect(mockGuest.delete).toHaveBeenCalledWith({ where: { id: 'g1' } });
    expect(result).toEqual(guest);
  });
});
