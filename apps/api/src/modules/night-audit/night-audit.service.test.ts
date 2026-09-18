/* apps/api/src/modules/night-audit/night-audit.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    nightAudit: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    property: { findFirst: vi.fn(), update: vi.fn() },
    reservation: { count: vi.fn() },
    folio: { count: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    folioItem: { create: vi.fn(), aggregate: vi.fn() },
    reservationStay: { findMany: vi.fn() },
  },
}));

import { prisma } from '../../common/prisma.js';
import {
  getAuditStatus,
  runNightAudit,
  rollbackNightAudit,
  getAuditHistory,
  generateAuditReport,
  nightAuditSchema,
} from './night-audit.service.js';

const mockAudit = prisma.nightAudit as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockProperty = prisma.property as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockReservation = prisma.reservation as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockFolio = prisma.folio as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockFolioItem = prisma.folioItem as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockStay = prisma.reservationStay as unknown as Record<string, ReturnType<typeof vi.fn>>;

const auditInput = nightAuditSchema.parse({
  propertyId: 'p1',
  auditDate: '2026-09-04',
});

function wireHappyPath() {
  mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
  mockAudit.findFirst.mockResolvedValue(null);
  mockAudit.create.mockResolvedValue({ id: 'na1', status: 'in_progress' });
  // autoPostRoomCharges: one active stay with a folio
  mockStay.findMany.mockResolvedValue([
    {
      date: new Date('2026-09-04'),
      rate: 120,
      room: { id: 'r1' },
      reservation: { folio: { id: 'f1' } },
    },
    {
      date: new Date('2026-09-04'),
      rate: 90,
      room: { id: 'r2' },
      reservation: { folio: null }, // no folio → skipped
    },
  ]);
  mockFolioItem.create.mockResolvedValue({ id: 'fi1' });
  mockFolio.update.mockResolvedValue({});
  // verifyAllBalances: one balanced folio, one with a discrepancy
  mockFolio.findMany.mockResolvedValue([
    {
      id: 'f1',
      totalCharges: 120,
      totalPayments: 20,
      balance: 100,
      items: [{ amount: 120 }, { amount: -20 }],
    },
    {
      id: 'f2',
      totalCharges: 100,
      totalPayments: 0,
      balance: 999,
      items: [{ amount: 100 }],
    },
  ]);
  // generateDailyReports
  mockReservation.count
    .mockResolvedValueOnce(3) // arrivals
    .mockResolvedValueOnce(2) // departures
    .mockResolvedValueOnce(5); // in-house
  mockFolioItem.aggregate.mockResolvedValue({ _sum: { amount: 450 } });
  mockProperty.update.mockResolvedValue({});
  mockAudit.update.mockResolvedValue({ id: 'na1', status: 'completed' });
}

beforeEach(() => vi.clearAllMocks());

describe('getAuditStatus', () => {
  it('reports whether the audit can run based on pending checkouts and balances', async () => {
    mockAudit.findFirst.mockResolvedValue({
      auditDate: new Date('2026-09-03'),
      status: 'completed',
    });
    mockReservation.count.mockResolvedValue(2);
    mockFolio.count.mockResolvedValue(1);

    const status = await getAuditStatus('t1');

    expect(status).toMatchObject({
      lastAuditStatus: 'completed',
      isDayClosed: false,
      pendingCheckouts: 2,
      unbalancedFolios: 1,
      canRunAudit: false,
    });
  });

  it('allows the audit when there are no blockers and no previous audit', async () => {
    mockAudit.findFirst.mockResolvedValue(null);
    mockReservation.count.mockResolvedValue(0);
    mockFolio.count.mockResolvedValue(0);

    const status = await getAuditStatus('t1');

    expect(status.lastAuditDate).toBeNull();
    expect(status.canRunAudit).toBe(true);
  });
});

describe('runNightAudit', () => {
  it('throws 404 when the property is outside the tenant', async () => {
    mockProperty.findFirst.mockResolvedValue(null);
    await expect(runNightAudit('t1', 'u1', auditInput)).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('rejects when the audit for that date is already completed', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockAudit.findFirst.mockResolvedValue({ id: 'na0', status: 'completed' });

    await expect(runNightAudit('t1', 'u1', auditInput)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
    expect(mockAudit.create).not.toHaveBeenCalled();
  });

  it('posts room charges, verifies balances, generates reports and closes the day', async () => {
    wireHappyPath();

    const result = await runNightAudit('t1', 'u1', auditInput);

    // Room charge posted only for the stay that has a folio
    expect(mockFolioItem.create).toHaveBeenCalledTimes(1);
    expect(mockFolioItem.create.mock.calls[0][0].data).toMatchObject({
      folioId: 'f1',
      type: 'room_charge',
      amount: 120,
      quantity: 1,
    });
    expect(mockFolio.update.mock.calls[0][0].data).toEqual({
      totalCharges: { increment: 120 },
      balance: { increment: 120 },
    });

    // Business date rolled to the next day
    const rolled = mockProperty.update.mock.calls[0][0].data.currentBusinessDate as Date;
    expect(rolled.toISOString().startsWith('2026-09-05')).toBe(true);

    // Completion record carries the results of every step
    const completion = mockAudit.update.mock.calls[0][0];
    expect(completion.data.status).toBe('completed');
    expect(completion.data.results).toMatchObject({
      roomChargesPosted: 1,
      balanceVerification: {
        verified: 1,
        discrepancies: [{ folioId: 'f2', expectedBalance: 100, actualBalance: 999 }],
      },
      reportsGenerated: {
        date: '2026-09-04',
        arrivals: 3,
        departures: 2,
        inHouse: 5,
        roomRevenue: 450,
      },
    });
    expect(result).toEqual({ id: 'na1', status: 'completed' });
  });

  it('skips disabled steps', async () => {
    wireHappyPath();
    const input = nightAuditSchema.parse({
      propertyId: 'p1',
      auditDate: '2026-09-04',
      autoPostRoomCharges: false,
      verifyBalances: false,
      generateReports: false,
      closeDay: false,
    });

    await runNightAudit('t1', 'u1', input);

    expect(mockStay.findMany).not.toHaveBeenCalled();
    expect(mockFolio.findMany).not.toHaveBeenCalled();
    expect(mockFolioItem.aggregate).not.toHaveBeenCalled();
    expect(mockProperty.update).not.toHaveBeenCalled();
    expect(mockAudit.update.mock.calls[0][0].data.results).toEqual({});
  });

  it('marks the audit as failed and rethrows when a step errors', async () => {
    wireHappyPath();
    mockStay.findMany.mockRejectedValue(new Error('db exploded'));

    await expect(runNightAudit('t1', 'u1', auditInput)).rejects.toThrow('db exploded');

    const failure = mockAudit.update.mock.calls[0][0];
    expect(failure.data).toMatchObject({
      status: 'failed',
      errorMessage: 'db exploded',
    });
  });
});

describe('rollbackNightAudit', () => {
  it('throws 404 when the audit is not in this tenant', async () => {
    mockAudit.findFirst.mockResolvedValue(null);
    await expect(rollbackNightAudit('t1', 'na1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects rollback of an audit that is not completed', async () => {
    mockAudit.findFirst.mockResolvedValue({ id: 'na1', status: 'failed' });
    await expect(rollbackNightAudit('t1', 'na1')).rejects.toMatchObject({
      statusCode: 409,
      message: 'Can only rollback completed audits',
    });
  });

  it('rejects rollback of audits completed more than 24 hours ago', async () => {
    mockAudit.findFirst.mockResolvedValue({
      id: 'na1',
      status: 'completed',
      completedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    });
    await expect(rollbackNightAudit('t1', 'na1')).rejects.toMatchObject({
      statusCode: 409,
      message: 'Cannot rollback audits older than 24 hours',
    });
  });

  it('marks a recently completed audit as rolled back', async () => {
    mockAudit.findFirst.mockResolvedValue({
      id: 'na1',
      status: 'completed',
      completedAt: new Date(Date.now() - 60 * 60 * 1000),
    });
    mockAudit.update.mockResolvedValue({ id: 'na1', status: 'rolled_back' });

    const result = await rollbackNightAudit('t1', 'na1');

    expect(mockAudit.update).toHaveBeenCalledWith({
      where: { id: 'na1' },
      data: { status: 'rolled_back' },
    });
    expect(result.status).toBe('rolled_back');
  });
});

describe('getAuditHistory', () => {
  it('returns the 30 most recent audits for the tenant', async () => {
    mockAudit.findMany.mockResolvedValue([{ id: 'na1' }]);

    const result = await getAuditHistory('t1');

    expect(mockAudit.findMany.mock.calls[0][0]).toMatchObject({
      where: { tenantId: 't1' },
      orderBy: { auditDate: 'desc' },
      take: 30,
    });
    expect(result).toHaveLength(1);
  });
});

describe('generateAuditReport', () => {
  it('throws 404 when the audit is not in this tenant', async () => {
    mockAudit.findFirst.mockResolvedValue(null);
    await expect(generateAuditReport('t1', 'na1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns the audit with its stored results as the summary', async () => {
    mockAudit.findFirst.mockResolvedValue({
      id: 'na1',
      status: 'completed',
      results: { roomChargesPosted: 5 },
      property: { id: 'p1', name: 'Grand Hotel' },
    });

    const report = await generateAuditReport('t1', 'na1');

    expect(report.audit.id).toBe('na1');
    expect(report.summary).toEqual({ roomChargesPosted: 5 });
    expect(typeof report.generatedAt).toBe('string');
  });
});
