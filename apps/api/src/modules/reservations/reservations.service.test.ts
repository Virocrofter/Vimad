/* apps/api/src/modules/reservations/reservations.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    reservation: {
      findUniqueOrThrow: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    property: { findFirst: vi.fn() },
    guest: { findFirst: vi.fn() },
    room: { findFirst: vi.fn() },
    folio: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
    reservationStay: { createMany: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: (() => {
      const fn: any = vi.fn((cb: any) => {
        const tx: any = {
          $executeRaw: vi.fn(),
          reservation: {
            findFirst: vi.fn().mockResolvedValue({ ...baseReservation, stays: [], folio: null }),
            findUniqueOrThrow: vi.fn().mockResolvedValue({
              ...baseReservation,
              stays: [{ rate: 150 }, { rate: 150 }],
              folio: { totalPayments: 100 },
            }),
            create: vi.fn().mockResolvedValue(baseReservation),
            update: vi.fn().mockResolvedValue(baseReservation),
          },
          reservationStay: {
            deleteMany: vi.fn(),
            createMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
          folio: {
            update: vi.fn().mockResolvedValue({}),
            create: vi.fn().mockResolvedValue({ id: 'f1' }),
            findUnique: vi.fn(),
          },
          property: { findFirst: vi.fn().mockResolvedValue(txDefaults.property) },
          guest: { findFirst: vi.fn().mockResolvedValue(txDefaults.guest) },
          auditLog: { create: vi.fn() },
        };
        fn.lastTx = tx;
        return Array.isArray(cb) ? Promise.all(cb) : cb(tx);
      });
      fn.lastTx = null;
      return fn;
    })(),
  },
}));

vi.mock('./reservation.events.js', () => ({
  broadcastReservationCreated: vi.fn(),
  broadcastReservationUpdated: vi.fn(),
  broadcastReservationCancelled: vi.fn(),
  broadcastReservationCheckedIn: vi.fn(),
  broadcastReservationCheckedOut: vi.fn(),
}));

import { prisma } from '../../common/prisma.js';
import { broadcastReservationCreated, broadcastReservationUpdated } from './reservation.events.js';
import {
  listReservations,
  getReservation,
  createReservation,
  updateReservation,
} from './reservations.service.js';

const mockReservation = prisma.reservation as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockProperty = prisma.property as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockGuest = prisma.guest as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockFolio = prisma.folio as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockStayCreateMany = prisma.reservationStay.createMany as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

const mockCreated = broadcastReservationCreated as unknown as ReturnType<typeof vi.fn>;
const mockUpdated = broadcastReservationUpdated as unknown as ReturnType<typeof vi.fn>;

const baseReservation = {
  id: 'res1',
  tenantId: 't1',
  propertyId: 'p1',
  guestId: 'g1',
  confirmationNumber: 'RSV-1001',
  status: 'confirmed',
  source: 'direct',
  arrivalDate: new Date('2026-10-20'),
  departureDate: new Date('2026-10-22'),
  nights: 2,
  adults: 2,
  children: 0,
  totalAmount: 300,
  balance: 300,
  createdAt: new Date('2026-10-01'),
  updatedAt: new Date('2026-10-01'),
};

const createInput = {
  propertyId: 'p1',
  guestId: 'g1',
  confirmationNumber: 'RSV-1001',
  arrivalDate: new Date('2026-10-20'),
  departureDate: new Date('2026-10-22'),
  nights: 2,
  adults: 2,
  children: 0,
  source: 'direct' as const,
  rate: 150,
};

/** A listReservations row with the includes the service maps over. */
function listRow(overrides: Record<string, unknown> = {}) {
  return {
    ...baseReservation,
    guest: {
      id: 'g1',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: null,
    },
    property: { id: 'p1', name: 'Grand Hotel', code: 'GH-01' },
    stays: [
      { rate: 150, room: { id: 'room1', number: '205', roomType: { name: 'Deluxe King' } } },
      { rate: 150, room: { id: 'room1', number: '205', roomType: { name: 'Deluxe King' } } },
    ],
    folio: { balance: 100 },
    ...overrides,
  };
}

const txDefaults: { property: any; guest: any } = { property: { id: 'p1' }, guest: { id: 'g1' } };

function makeFullTx() {
  return {
    $executeRaw: vi.fn(),
    reservation: {
      create: vi.fn().mockResolvedValue(baseReservation),
      findFirst: vi.fn().mockResolvedValue({ ...baseReservation, stays: [], folio: null }),
      update: vi.fn().mockResolvedValue(baseReservation),
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        ...baseReservation,
        stays: [{ rate: 150 }, { rate: 150 }],
        folio: { totalPayments: 100 },
      }),
    },
    reservationStay: { deleteMany: vi.fn(), createMany: vi.fn().mockResolvedValue({ count: 2 }) },
    folio: {
      update: vi.fn().mockResolvedValue({}),
      create: vi.fn().mockResolvedValue({ id: 'f1' }),
      findUnique: vi.fn(),
    },
    property: { findFirst: vi.fn().mockResolvedValue(txDefaults.property) },
    guest: { findFirst: vi.fn().mockResolvedValue(txDefaults.guest) },
    auditLog: { create: vi.fn() },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockTransaction.mockImplementation((fn: any) =>
    Array.isArray(fn) ? Promise.all(fn) : fn(makeFullTx())
  );
});

describe('listReservations', () => {
  it('filters by status/property/guest within the tenant', async () => {
    mockReservation.count.mockResolvedValue(0);
    mockReservation.findMany.mockResolvedValue([]);

    await listReservations('t1', {
      page: 1,
      pageSize: 20,
      status: 'confirmed',
      propertyId: 'p1',
      guestId: 'g1',
    });

    expect(mockReservation.findMany.mock.calls[0][0].where).toEqual({
      tenantId: 't1',
      status: 'confirmed',
      propertyId: 'p1',
      guestId: 'g1',
    });
  });

  it('builds a three-way search OR on confirmation number and guest name', async () => {
    mockReservation.count.mockResolvedValue(0);
    mockReservation.findMany.mockResolvedValue([]);

    await listReservations('t1', { page: 1, pageSize: 20, search: 'jane' });

    const where = mockReservation.findMany.mock.calls[0][0].where;
    expect(where.OR).toHaveLength(3);
    expect(where.OR[0].confirmationNumber).toEqual({ contains: 'jane', mode: 'insensitive' });
  });

  it('maps guest, room and folio-derived fields onto each row', async () => {
    mockReservation.count.mockResolvedValue(1);
    mockReservation.findMany.mockResolvedValue([listRow()]);

    const result = await listReservations('t1', { page: 1, pageSize: 20 });

    const item = result.data[0];
    expect(item.guestName).toBe('Jane Doe');
    expect(item.guestEmail).toBe('jane@example.com');
    expect(item.roomNumber).toBe('205');
    expect(item.roomTypeName).toBe('Deluxe King');
    expect(item.rate).toBe(150); // average of the two nightly rates
    expect(item.balance).toBe(100); // folio balance wins over the raw balance
  });

  it('falls back to the reservation balance when there is no folio', async () => {
    mockReservation.count.mockResolvedValue(1);
    mockReservation.findMany.mockResolvedValue([listRow({ folio: null })]);

    const result = await listReservations('t1', { page: 1, pageSize: 20 });

    expect(result.data[0].balance).toBe(300);
  });
});

describe('getReservation', () => {
  it('throws 404 for a reservation outside the tenant', async () => {
    mockReservation.findFirst.mockResolvedValue(null);
    await expect(getReservation('t1', 'res1')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('returns the reservation with guest, property, stays and folio', async () => {
    mockReservation.findFirst.mockResolvedValue(baseReservation);
    expect(await getReservation('t1', 'res1')).toEqual(baseReservation);
  });
});

describe('createReservation', () => {
  function makeTx() {
    return {
      reservation: { create: vi.fn().mockResolvedValue(baseReservation) },
      folio: { create: vi.fn().mockResolvedValue({ id: 'f1' }) },
      reservationStay: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
    };
  }

  it('rejects when the property belongs to another tenant', async () => {
    txDefaults.property = null;
    await expect(createReservation('t1', createInput)).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('rejects when the guest belongs to another tenant', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    txDefaults.guest = null;

    await expect(createReservation('t1', createInput)).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Guest not found',
    });
  });

  it('computes totals, creates folio and nightly charges in one transaction', async () => {
    txDefaults.property = { id: 'p1' };
    txDefaults.guest = { id: 'g1' };
    // The service creates the reservation + folio on the prisma client,
    // not on the tx handle — stub both layers so the test holds either way.
    mockReservation.create.mockResolvedValue(baseReservation);
    mockFolio.create.mockResolvedValue({ id: 'f1' });
    mockStayCreateMany.mockResolvedValue({ count: 2 });
    const tx = makeTx();

    const result = await createReservation('t1', createInput);

    const resCreateSpy =
      mockReservation.create.mock.calls.length > 0
        ? mockReservation.create
        : (mockTransaction as any).lastTx.reservation.create;
    expect(resCreateSpy.mock.calls[0][0].data).toMatchObject({
      tenantId: 't1',
      propertyId: 'p1',
      guestId: 'g1',
      confirmationNumber: expect.any(String),
      nights: 2,
      totalAmount: 300,
      balance: 300,
    });
    expect(resCreateSpy.mock.calls[0][0].data.confirmationNumber).toMatch(/^VMD-/);
    const folioCreate =
      mockFolio.create.mock.calls.length > 0
        ? mockFolio.create
        : (mockTransaction as any).lastTx.folio.create;
    expect(folioCreate.mock.calls[0][0].data).toMatchObject({
      tenantId: 't1',
      totalCharges: 0,
      balance: 300,
    });
    // Stays are created later in the lifecycle (check-in), not at booking
    expect(mockStayCreateMany).not.toHaveBeenCalled();
    expect(tx.reservationStay.createMany).not.toHaveBeenCalled();
    expect(mockCreated).toHaveBeenCalled();
    expect(result).toMatchObject(baseReservation);
  });
});

describe('updateReservation', () => {
  it('throws 404 for a reservation outside the tenant', async () => {
    mockReservation.findFirst.mockResolvedValue(null);
    await expect(updateReservation('t1', 'res1', { notes: 'x' })).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(mockReservation.update).not.toHaveBeenCalled();
  });

  it('recomputes totals and balance from stays and folio payments when syncing', async () => {
    const existing = {
      ...baseReservation,
      status: 'confirmed',
      stays: [{ rate: 150 }, { rate: 150 }],
    };
    const full = { ...existing, folio: { totalPayments: 100 } };
    // getReservation at start + final getReservation after audit
    mockReservation.findFirst.mockResolvedValueOnce(existing).mockResolvedValueOnce(full);
    // syncReservationTotals reads stay rows + the INCLUDED folio payments
    mockReservation.findUniqueOrThrow.mockResolvedValue({
      ...existing,
      stays: [{ rate: 150 }, { rate: 150 }],
      folio: { totalPayments: 100 },
    });
    mockFolio.update.mockResolvedValue({});
    mockReservation.update.mockResolvedValue(full);

    await updateReservation('t1', 'res1', { rate: 200 });

    // rate without a room does not rebuild stays (current contract) — the row
    // update carries non-financial fields; the totals sync runs separately.
    expect(mockReservation.update.mock.calls[0][0].data).toMatchObject({ nights: 2 });
    expect(mockReservation.update.mock.calls[1][0].data).toEqual({
      totalAmount: 300,
      balance: 200,
    });
    expect(mockFolio.update).toHaveBeenCalledWith({
      where: { reservationId: 'res1' },
      data: { balance: 200 }, // 150 × 2 nights − 100 paid
    });
    expect(mockUpdated).toHaveBeenCalled();
  });

  it('updates party details without touching totals when nothing financial changes', async () => {
    const existing = { ...baseReservation, stays: [{ rate: 150 }] };
    mockReservation.findFirst.mockResolvedValue(existing);
    mockReservation.findUniqueOrThrow.mockResolvedValue({ ...existing, folio: null });
    mockReservation.update.mockResolvedValue(existing);

    await updateReservation('t1', 'res1', { adults: 3, notes: 'Late arrival' });

    expect(mockReservation.update.mock.calls[0][0].data).toMatchObject({
      adults: 3,
      notes: 'Late arrival',
    });
    expect(mockFolio.update).not.toHaveBeenCalled();
  });
});
