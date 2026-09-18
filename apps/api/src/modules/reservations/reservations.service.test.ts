/* apps/api/src/modules/reservations/reservations.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    $transaction: vi.fn(),
    reservation: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Socket broadcasts are side effects — silence them in unit tests.
vi.mock('./reservation.events.js', () => ({
  broadcastReservationCreated: vi.fn(),
  broadcastReservationUpdated: vi.fn(),
  broadcastReservationDeleted: vi.fn(),
  broadcastReservationStatusChanged: vi.fn(),
}));

import { prisma } from '../../common/prisma.js';
import {
  broadcastReservationCreated,
  broadcastReservationStatusChanged,
} from './reservation.events.js';
import {
  listReservations,
  getReservation,
  createReservation,
  updateReservation,
} from './reservations.service.js';

const mockReservation = prisma.reservation as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

const sampleReservation = {
  id: 'r1',
  tenantId: 't1',
  propertyId: 'p1',
  guestId: 'g1',
  confirmationNumber: 'RES-ABC-1',
  status: 'confirmed',
  nights: 2,
  totalAmount: 300,
  balance: 300,
  notes: null,
  stays: [],
  folio: { id: 'f1', items: [] },
};

beforeEach(() => vi.clearAllMocks());

describe('listReservations', () => {
  it('filters by status/property/guest within the tenant', async () => {
    mockReservation.count.mockResolvedValue(1);
    mockReservation.findMany.mockResolvedValue([sampleReservation]);

    const result = await listReservations('t1', {
      page: 1,
      pageSize: 20,
      status: 'confirmed',
      propertyId: 'p1',
      guestId: 'g1',
    });

    expect(result.data).toHaveLength(1);
    expect(mockReservation.findMany.mock.calls[0][0].where).toEqual({
      tenantId: 't1',
      status: 'confirmed',
      propertyId: 'p1',
      guestId: 'g1',
    });
  });
});

describe('getReservation', () => {
  it('throws 404 for unknown or cross-tenant ids', async () => {
    mockReservation.findFirst.mockResolvedValue(null);
    await expect(getReservation('t1', 'r1')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('createReservation', () => {
  const input = {
    propertyId: 'p1',
    guestId: 'g1',
    arrivalDate: new Date('2026-10-01'),
    departureDate: new Date('2026-10-03'),
    nights: 2,
    rate: 150,
    adults: 2,
    children: 0,
    source: 'direct',
  };

  function txMock(overrides: { guest?: unknown; property?: unknown } = {}) {
    return {
      guest: {
        findFirst: vi
          .fn()
          .mockResolvedValue(overrides.guest === undefined ? { id: 'g1' } : overrides.guest),
      },
      property: {
        findFirst: vi
          .fn()
          .mockResolvedValue(overrides.property === undefined ? { id: 'p1' } : overrides.property),
      },
      reservation: {
        create: vi.fn().mockResolvedValue({ ...sampleReservation, folio: { id: 'f1' } }),
      },
      folioItem: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
    };
  }

  it('computes totals, creates folio and nightly charges in one transaction', async () => {
    const tx = txMock();
    mockTransaction.mockImplementation((fn: (t: unknown) => unknown) => fn(tx));
    mockReservation.findFirst.mockResolvedValue(sampleReservation); // getReservation after create

    const result = await createReservation('t1', input);

    const createData = tx.reservation.create.mock.calls[0][0].data;
    expect(createData.totalAmount).toBe(300); // 150 × 2 nights
    expect(createData.balance).toBe(300);
    expect(createData.folio.create.totalCharges).toBe(300);
    expect(createData.confirmationNumber).toMatch(/^RES-/);
    expect(tx.folioItem.createMany.mock.calls[0][0].data).toHaveLength(2);
    expect(result.id).toBe('r1');
    expect(broadcastReservationCreated).toHaveBeenCalled();
  });

  it('rejects when the guest belongs to another tenant', async () => {
    const tx = txMock({ guest: null });
    mockTransaction.mockImplementation((fn: (t: unknown) => unknown) => fn(tx));

    await expect(createReservation('t1', input)).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
    expect(tx.reservation.create).not.toHaveBeenCalled();
  });

  it('rejects when the property belongs to another tenant', async () => {
    const tx = txMock({ property: null });
    mockTransaction.mockImplementation((fn: (t: unknown) => unknown) => fn(tx));

    await expect(createReservation('t1', input)).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
    expect(tx.reservation.create).not.toHaveBeenCalled();
  });
});

describe('updateReservation', () => {
  it('broadcasts a status change when the status transitions', async () => {
    mockReservation.findFirst.mockResolvedValue(sampleReservation);
    mockReservation.update.mockResolvedValue({ ...sampleReservation, status: 'checked_in' });

    await updateReservation('t1', 'r1', { status: 'checked_in' });

    expect(broadcastReservationStatusChanged).toHaveBeenCalledWith(
      't1',
      'r1',
      'confirmed',
      'checked_in',
      'system'
    );
  });

  it('keeps the existing status when none is provided', async () => {
    mockReservation.findFirst.mockResolvedValue(sampleReservation);
    mockReservation.update.mockResolvedValue(sampleReservation);

    await updateReservation('t1', 'r1', { notes: 'Late arrival' });

    expect(mockReservation.update.mock.calls[0][0].data.status).toBe('confirmed');
    expect(broadcastReservationStatusChanged).not.toHaveBeenCalled();
  });

  it('rejects updates to reservations outside the tenant', async () => {
    mockReservation.findFirst.mockResolvedValue(null);
    await expect(updateReservation('t1', 'r1', { status: 'cancelled' })).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(mockReservation.update).not.toHaveBeenCalled();
  });
});
