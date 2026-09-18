/* apps/api/src/modules/folios/folios.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    $transaction: vi.fn(),
    reservation: { findFirst: vi.fn() },
    folio: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    folioItem: { create: vi.fn() },
  },
}));

import { prisma } from '../../common/prisma.js';
import {
  createFolio,
  postCharge,
  reverseCharge,
  postPayment,
  transferToCityLedger,
  deleteFolio,
} from './folios.service.js';

const mockFolio = prisma.folio as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockFolioItem = prisma.folioItem as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockReservation = prisma.reservation as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

function openFolio(overrides: Record<string, unknown> = {}) {
  return {
    id: 'f1',
    tenantId: 't1',
    reservationId: 'r1',
    status: 'open',
    totalCharges: 300,
    totalPayments: 0,
    balance: 300,
    items: [],
    ...overrides,
  };
}

// Array-style $transaction([p1, p2]) → resolve all
function mockArrayTransaction() {
  mockTransaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
}

beforeEach(() => vi.clearAllMocks());

describe('createFolio', () => {
  it('rejects when the reservation is not in this tenant', async () => {
    mockReservation.findFirst.mockResolvedValue(null);
    await expect(createFolio('t1', { reservationId: 'r1', type: 'guest' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('rejects a duplicate folio for the same reservation', async () => {
    mockReservation.findFirst.mockResolvedValue({ id: 'r1' });
    mockFolio.findUnique.mockResolvedValue({ id: 'f1' });
    await expect(createFolio('t1', { reservationId: 'r1', type: 'guest' })).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
  });

  it('creates a zeroed folio for a valid reservation', async () => {
    mockReservation.findFirst.mockResolvedValue({ id: 'r1' });
    mockFolio.findUnique.mockResolvedValue(null);
    mockFolio.create.mockResolvedValue(openFolio({ totalCharges: 0, balance: 0 }));

    await createFolio('t1', { reservationId: 'r1', type: 'guest' });
    expect(mockFolio.create.mock.calls[0][0].data).toMatchObject({
      tenantId: 't1',
      reservationId: 'r1',
      totalCharges: 0,
      totalPayments: 0,
      balance: 0,
    });
  });
});

describe('postCharge', () => {
  it('multiplies amount by quantity and increments totals', async () => {
    mockFolio.findFirst.mockResolvedValue(openFolio());
    mockFolioItem.create.mockResolvedValue({ id: 'i1' });
    mockFolio.update.mockResolvedValue({});
    mockArrayTransaction();

    await postCharge('t1', 'f1', {
      type: 'service',
      description: 'Airport shuttle',
      amount: 25,
      quantity: 2,
    });

    expect(mockFolioItem.create.mock.calls[0][0].data.amount).toBe(50);
    expect(mockFolio.update.mock.calls[0][0].data).toEqual({
      totalCharges: { increment: 50 },
      balance: { increment: 50 },
    });
  });

  it('refuses charges on a closed folio', async () => {
    mockFolio.findFirst.mockResolvedValue(openFolio({ status: 'closed' }));
    await expect(
      postCharge('t1', 'f1', { type: 'service', description: 'x', amount: 10, quantity: 1 })
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(mockFolioItem.create).not.toHaveBeenCalled();
  });
});

describe('reverseCharge', () => {
  const charge = { id: 'c1', type: 'service', description: 'Minibar', amount: 18, quantity: 1 };

  it('posts a negative adjustment and decrements totals', async () => {
    mockFolio.findFirst.mockResolvedValue(openFolio({ items: [charge] }));
    mockFolioItem.create.mockResolvedValue({ id: 'adj1' });
    mockFolio.update.mockResolvedValue({});
    mockArrayTransaction();

    await reverseCharge('t1', 'f1', 'c1', 'Guest dispute');

    const adj = mockFolioItem.create.mock.calls[0][0].data;
    expect(adj.type).toBe('adjustment');
    expect(adj.amount).toBe(-18);
    expect(adj.description).toContain('Guest dispute');
    expect(mockFolio.update.mock.calls[0][0].data).toEqual({
      totalCharges: { decrement: 18 },
      balance: { decrement: 18 },
    });
  });

  it('cannot reverse an adjustment (no double-reversal loophole)', async () => {
    mockFolio.findFirst.mockResolvedValue(
      openFolio({ items: [{ ...charge, id: 'a1', type: 'adjustment' }] })
    );
    await expect(reverseCharge('t1', 'f1', 'a1', 'why not')).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('404s when the charge is on a different folio', async () => {
    mockFolio.findFirst.mockResolvedValue(openFolio({ items: [] }));
    await expect(reverseCharge('t1', 'f1', 'c999', 'nope')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('postPayment', () => {
  it('decrements the balance for a normal payment', async () => {
    mockFolio.findFirst.mockResolvedValue(openFolio());
    mockFolioItem.create.mockResolvedValue({ id: 'p1' });
    mockFolio.update.mockResolvedValue({});
    mockArrayTransaction();

    await postPayment('t1', 'f1', { type: 'card', amount: 100 });

    expect(mockFolio.update.mock.calls[0][0].data).toEqual({
      totalPayments: { increment: 100 },
      balance: { decrement: 100 },
    });
  });

  it('treats refunds as negative payments (balance goes back up)', async () => {
    mockFolio.findFirst.mockResolvedValue(openFolio());
    mockFolioItem.create.mockResolvedValue({ id: 'p2' });
    mockFolio.update.mockResolvedValue({});
    mockArrayTransaction();

    await postPayment('t1', 'f1', { type: 'refund', amount: 40 });

    expect(mockFolio.update.mock.calls[0][0].data).toEqual({
      totalPayments: { decrement: 40 },
      balance: { increment: 40 },
    });
  });

  it('refuses payments on a closed folio', async () => {
    mockFolio.findFirst.mockResolvedValue(openFolio({ status: 'closed' }));
    await expect(postPayment('t1', 'f1', { type: 'cash', amount: 10 })).rejects.toMatchObject({
      statusCode: 409,
    });
  });
});

describe('transferToCityLedger / deleteFolio', () => {
  it('transfers an open folio', async () => {
    mockFolio.findFirst.mockResolvedValue(openFolio());
    mockFolio.update.mockResolvedValue(openFolio({ status: 'transferred' }));

    const result = await transferToCityLedger('t1', 'f1');
    expect((result as { status?: string }).status).toBe('transferred');
  });

  it('refuses to delete a folio with posted items', async () => {
    mockFolio.findFirst.mockResolvedValue(openFolio({ items: [{ id: 'i1' }] }));
    await expect(deleteFolio('t1', 'f1')).rejects.toMatchObject({ statusCode: 409 });
    expect(mockFolio.delete).not.toHaveBeenCalled();
  });

  it('deletes an empty folio', async () => {
    mockFolio.findFirst.mockResolvedValue(openFolio({ items: [] }));
    mockFolio.delete.mockResolvedValue({});
    await deleteFolio('t1', 'f1');
    expect(mockFolio.delete).toHaveBeenCalledWith({ where: { id: 'f1' } });
  });
});
