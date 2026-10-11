/* apps/api/src/modules/night-audit/night-audit.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    nightAudit: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    nightAuditSchedule: { findFirst: vi.fn() },
    property: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    reservation: { count: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    folio: { count: vi.fn(), findMany: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    folioItem: { create: vi.fn(), findFirst: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
    reservationStay: { findMany: vi.fn(), groupBy: vi.fn(), deleteMany: vi.fn() },
    room: { count: vi.fn(), findMany: vi.fn(), updateMany: vi.fn(), groupBy: vi.fn() },
    housekeepingTask: { findFirst: vi.fn(), create: vi.fn() },
    ratePlan: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

// The completion notification emails admins — keep the audit hermetic.
vi.mock('../../jobs/email.queue.js', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
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
const mockRoom = prisma.room as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockHousekeepingTask = prisma.housekeepingTask as unknown as Record<
  string,
  ReturnType<typeof vi.fn>
>;
const mockRatePlan = prisma.ratePlan as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockUser = prisma.user as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockAuditSchedule = prisma.nightAuditSchedule as unknown as Record<
  string,
  ReturnType<typeof vi.fn>
>;

const auditInput = nightAuditSchema.parse({
  propertyId: 'p1',
  auditDate: '2026-09-04',
});

/** All seven steps enabled + every model stubbed. */
function wireHappyPath() {
  mockProperty.findFirst.mockResolvedValue({ id: 'p1', name: 'Grand Hotel' });
  mockProperty.findUnique.mockResolvedValue({ name: 'Grand Hotel' });
  mockProperty.update.mockResolvedValue({});
  mockAudit.findFirst.mockResolvedValue(null);
  mockAudit.create.mockResolvedValue({ id: 'na1', status: 'in_progress', runBy: 'u1' });
  mockAudit.update.mockResolvedValue({ id: 'na1', status: 'completed' });

  // processNoShows: nothing due
  mockReservation.findMany.mockResolvedValue([]);
  mockReservation.update.mockResolvedValue({});

  // autoPostRoomCharges: one active stay with a folio, one without
  mockStay.findMany.mockResolvedValue([
    {
      date: new Date('2026-09-04'),
      rate: 120,
      roomId: 'r1',
      room: { id: 'r1' },
      reservation: { folio: { id: 'f1' } },
    },
    {
      date: new Date('2026-09-04'),
      rate: 90,
      roomId: 'r2',
      room: { id: 'r2' },
      reservation: { folio: null }, // no folio → skipped
    },
  ]);
  mockFolioItem.findFirst.mockResolvedValue(null); // no duplicate charge
  mockFolioItem.create.mockResolvedValue({ id: 'fi1' });
  mockFolio.update.mockResolvedValue({});
  mockFolio.findUnique.mockResolvedValue(null);

  // verifyAllBalances: one balanced folio, one with a discrepancy
  const folioGuest = { firstName: 'Jane', lastName: 'Doe' };
  mockFolio.findMany.mockResolvedValue([
    {
      id: 'f1',
      totalCharges: 120,
      totalPayments: 20,
      balance: 100,
      items: [
        { amount: 120, quantity: 1 },
        { amount: -20, quantity: 1 },
      ],
      reservation: { confirmationNumber: 'RSV-1', guest: folioGuest },
    },
    {
      id: 'f2',
      totalCharges: 100,
      totalPayments: 0,
      balance: 999,
      items: [{ amount: 100, quantity: 1 }],
      reservation: { confirmationNumber: 'RSV-2', guest: folioGuest },
    },
  ]);

  // generateDailyReports
  mockReservation.count
    .mockResolvedValueOnce(3) // arrivals
    .mockResolvedValueOnce(2) // departures
    .mockResolvedValueOnce(5) // in-house
    .mockResolvedValueOnce(0) // no-shows
    .mockResolvedValueOnce(0); // walk-ins
  mockFolioItem.aggregate.mockResolvedValue({ _sum: { amount: 450 } });
  mockFolioItem.groupBy.mockResolvedValue([]);
  mockStay.groupBy.mockResolvedValue([]);
  mockRoom.groupBy.mockResolvedValue([]);

  // updateRoomStatuses
  mockRoom.updateMany.mockResolvedValue({ count: 2 });
  mockRoom.findMany.mockResolvedValue([]); // no dirty rooms → no tasks
  mockHousekeepingTask.findFirst.mockResolvedValue(null);

  // loadRatesForNewDate
  mockRatePlan.findMany.mockResolvedValue([]);

  // sendAuditCompletionNotification
  mockUser.findMany.mockResolvedValue([]);
  mockAuditSchedule.findFirst.mockResolvedValue(null);
}

beforeEach(() => vi.clearAllMocks());

describe('getAuditStatus', () => {
  it('reports whether the audit can run based on pending checkouts and balances', async () => {
    mockAudit.findFirst.mockResolvedValue({
      auditDate: new Date('2026-09-03'),
      status: 'completed',
      property: { currentBusinessDate: new Date('2026-09-04'), name: 'Grand Hotel' },
    });
    mockReservation.count.mockResolvedValue(2);
    mockFolio.count.mockResolvedValue(1);
    mockStay.groupBy.mockResolvedValue([]);
    mockRoom.count.mockResolvedValue(20);

    const status = await getAuditStatus('t1');

    expect(status).toMatchObject({
      lastAuditStatus: 'completed',
      isDayClosed: false,
      pendingCheckouts: 2,
      unbalancedFolios: 1,
      canRunAudit: false,
    });
    expect(status.businessDate).toEqual(new Date('2026-09-04'));
    expect(status.propertyName).toBe('Grand Hotel');
  });

  it('allows the audit when there are no blockers and no previous audit', async () => {
    mockAudit.findFirst.mockResolvedValue(null);
    mockReservation.count.mockResolvedValue(0);
    mockFolio.count.mockResolvedValue(0);
    mockStay.groupBy.mockResolvedValue([]);
    mockRoom.count.mockResolvedValue(20);

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

    // The business-date roll is recorded on the property
    const rollCall = mockProperty.update.mock.calls.find(
      (c: unknown[]) => (c[0] as { data: { currentBusinessDate?: Date } }).data.currentBusinessDate
    );
    expect(rollCall).toBeDefined();

    // Completion record carries the results of every step
    const completion = mockAudit.update.mock.calls[0][0];
    expect(completion.data.status).toBe('completed');
    expect(completion.data.results).toMatchObject({
      roomChargesPosted: expect.objectContaining({ posted: 1, skipped: 1 }),
      balanceVerification: {
        verified: 1,
        discrepancies: [
          expect.objectContaining({ folioId: 'f2', expectedBalance: 100, actualBalance: 999 }),
        ],
      },
    });
    expect(completion.data.results.reportsGenerated).toMatchObject({
      date: '2026-09-04',
      arrivals: 3,
      departures: 2,
      inHouse: 5,
    });
    expect(completion.data.results.reportsGenerated.revenue.roomRevenue).toBe(450);
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
      processNoShows: false,
      updateRoomStatuses: false,
      loadRatesForNewDate: false,
    });

    await runNightAudit('t1', 'u1', input);

    expect(mockStay.findMany).not.toHaveBeenCalled();
    expect(mockFolio.findMany).not.toHaveBeenCalled();
    expect(mockFolioItem.aggregate).not.toHaveBeenCalled();
    expect(mockProperty.update).not.toHaveBeenCalled();
    // The notification step always runs and logs itself into results.stepLogs
    const results = mockAudit.update.mock.calls[0][0].data.results;
    expect(results.stepLogs).toHaveLength(1);
    expect(results.stepLogs[0].step).toBe('send_notification');
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
  // NOTE the argument order: (tenantId, auditId, userId)
  const completedAudit = {
    id: 'na1',
    status: 'completed',
    auditDate: new Date('2026-09-04'),
    property: { name: 'Grand Hotel' },
  };

  it('throws 404 when the audit is not in this tenant', async () => {
    mockAudit.findFirst.mockResolvedValue(null);
    await expect(rollbackNightAudit('t1', 'na1', 'u1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects rollback of an audit that is not completed', async () => {
    mockAudit.findFirst.mockResolvedValue({ ...completedAudit, status: 'failed' });
    await expect(rollbackNightAudit('t1', 'na1', 'u1')).rejects.toMatchObject({
      statusCode: 409,
      message: 'Can only rollback completed audits',
    });
  });

  it('rejects rollback of audits completed more than 24 hours ago', async () => {
    mockAudit.findFirst.mockResolvedValue({
      ...completedAudit,
      completedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    });
    await expect(rollbackNightAudit('t1', 'na1', 'u1')).rejects.toMatchObject({
      statusCode: 409,
      message: 'Cannot rollback audits older than 24 hours',
    });
  });

  it('marks a recently completed audit as rolled back', async () => {
    mockAudit.findFirst.mockResolvedValue({
      ...completedAudit,
      completedAt: new Date(Date.now() - 60 * 60 * 1000),
    });
    mockAudit.update.mockResolvedValue({ id: 'na1', status: 'rolled_back' });

    const result = await rollbackNightAudit('t1', 'na1', 'u1');

    expect(mockAudit.update).toHaveBeenCalledWith({
      where: { id: 'na1' },
      data: { status: 'rolled_back' },
    });
    expect(result.status).toBe('rolled_back');
  });
});

describe('getAuditHistory', () => {
  it('returns a paginated list of audits for the tenant', async () => {
    mockAudit.findMany.mockResolvedValue([{ id: 'na1' }]);

    const result = await getAuditHistory('t1');

    expect(mockAudit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 't1' }, take: 20, skip: 0 })
    );
    expect(result.data).toHaveLength(1);
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
