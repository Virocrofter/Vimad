/* apps/api/src/modules/guest-portal/guest-portal.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = vi.hoisted(() => 'test-secret-test-secret-test-secret-32');

vi.mock('../../common/env.js', () => ({
  env: { JWT_SECRET },
}));

vi.mock('../../common/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    $transaction: vi.fn(),
    reservation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    guestDocument: { create: vi.fn() },
    guestPreference: { upsert: vi.fn() },
    housekeepingTask: { create: vi.fn() },
  },
}));

import { prisma } from '../../common/prisma.js';
import {
  lookupReservation,
  verifyIdentity,
  getStayDetails,
  submitCheckIn,
  getDigitalKey,
  requestService,
  updatePreferences,
} from './guest-portal.service.js';

const mockReservation = prisma.reservation as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockPreference = prisma.guestPreference as unknown as Record<
  string,
  ReturnType<typeof vi.fn>
>;
const mockTask = prisma.housekeepingTask as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

function portalToken(overrides: Record<string, unknown> = {}) {
  return jwt.sign(
    {
      scope: 'guest-portal',
      reservationId: 'r1',
      guestId: 'g1',
      tenantId: 't1',
      ...overrides,
    },
    JWT_SECRET,
    { expiresIn: 3600 }
  );
}

function reservationRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'r1',
    guestId: 'g1',
    tenantId: 't1',
    propertyId: 'p1',
    confirmationNumber: 'RSV-1001',
    status: 'confirmed',
    notes: '',
    arrivalDate: new Date('2026-09-10T00:00:00Z'),
    departureDate: new Date('2026-09-12T00:00:00Z'),
    guest: {
      firstName: 'Ada',
      lastName: 'Lovelace',
      passportNumber: 'P123456',
      documents: [{ number: 'D999' }],
    },
    property: { id: 'p1', name: 'Grand Hotel' },
    stays: [{ room: { id: 'rm1', number: '204' }, date: new Date('2026-09-10') }],
    ...overrides,
  };
}

beforeEach(() => vi.clearAllMocks());

describe('lookupReservation', () => {
  it('returns found:false with an empty payload for unknown confirmation numbers', async () => {
    mockReservation.findUnique.mockResolvedValue(null);

    const result = await lookupReservation('NOPE', 'Lovelace');

    expect(result).toEqual({
      found: false,
      confirmationNumber: 'NOPE',
      guestName: '',
      arrivalDate: '',
      departureDate: '',
    });
  });

  it('returns the same constant shape when the last name does not match', async () => {
    mockReservation.findUnique.mockResolvedValue(reservationRecord());

    const result = await lookupReservation('RSV-1001', 'WrongName');

    expect(result.found).toBe(false);
    expect(result.guestName).toBe('');
  });

  it('returns stay dates for a matching confirmation number and last name', async () => {
    mockReservation.findUnique.mockResolvedValue(reservationRecord());

    const result = await lookupReservation('RSV-1001', '  lovelace ');

    expect(result).toEqual({
      found: true,
      confirmationNumber: 'RSV-1001',
      guestName: 'Lovelace, Ada',
      arrivalDate: '2026-09-10',
      departureDate: '2026-09-12',
    });
  });
});

describe('verifyIdentity', () => {
  it('rejects when the last name does not match', async () => {
    mockReservation.findUnique.mockResolvedValue(reservationRecord());

    await expect(
      verifyIdentity({ confirmationNumber: 'RSV-1001', lastName: 'nope' })
    ).rejects.toMatchObject({ statusCode: 401, code: 'VERIFY_FAILED' });
  });

  it.each(['cancelled', 'no_show', 'checked_out'])(
    'rejects portal access for a %s reservation',
    async (status) => {
      mockReservation.findUnique.mockResolvedValue(reservationRecord({ status }));

      await expect(
        verifyIdentity({ confirmationNumber: 'RSV-1001', lastName: 'Lovelace' })
      ).rejects.toMatchObject({ statusCode: 403, code: 'RESERVATION_INACTIVE' });
    }
  );

  it('rejects when the supplied document matches neither passport nor stored documents', async () => {
    mockReservation.findUnique.mockResolvedValue(reservationRecord());

    await expect(
      verifyIdentity({
        confirmationNumber: 'RSV-1001',
        lastName: 'Lovelace',
        documentNumber: 'WRONGDOC',
      })
    ).rejects.toMatchObject({ statusCode: 401, code: 'VERIFY_FAILED' });
  });

  it('accepts a matching passport number and issues a portal token', async () => {
    mockReservation.findUnique.mockResolvedValue(reservationRecord());

    const result = await verifyIdentity({
      confirmationNumber: 'RSV-1001',
      lastName: 'Lovelace',
      documentNumber: 'P123456',
    });

    expect(result.verified).toBe(true);
    expect(result.guestName).toBe('Lovelace, Ada');

    const payload = jwt.verify(result.token, JWT_SECRET) as Record<string, unknown>;
    expect(payload).toMatchObject({
      scope: 'guest-portal',
      reservationId: 'r1',
      guestId: 'g1',
      tenantId: 't1',
    });
  });

  it('matches against stored guest documents too', async () => {
    mockReservation.findUnique.mockResolvedValue(reservationRecord());

    const result = await verifyIdentity({
      confirmationNumber: 'RSV-1001',
      lastName: 'Lovelace',
      documentNumber: 'D999',
    });

    expect(result.verified).toBe(true);
  });
});

describe('getStayDetails', () => {
  it('rejects an invalid or expired token', async () => {
    await expect(getStayDetails('not-a-token')).rejects.toMatchObject({
      statusCode: 401,
      code: 'PORTAL_TOKEN_INVALID',
    });
  });

  it('rejects a token with a different scope', async () => {
    const token = jwt.sign(
      { scope: 'something-else', reservationId: 'r1', guestId: 'g1', tenantId: 't1' },
      JWT_SECRET
    );
    await expect(getStayDetails(token)).rejects.toMatchObject({
      statusCode: 401,
      code: 'PORTAL_TOKEN_INVALID',
    });
  });

  it('returns stay details with the assigned room', async () => {
    mockReservation.findFirst.mockResolvedValue(reservationRecord({ status: 'checked_in' }));

    const details = await getStayDetails(portalToken());

    expect(details).toMatchObject({
      guestName: 'Lovelace, Ada',
      roomNumber: '204',
      arrivalDate: '2026-09-10',
      departureDate: '2026-09-12',
      checkedIn: true,
      digitalKeyReady: true,
    });
  });

  it('reports Unassigned and no digital key when no room is assigned', async () => {
    mockReservation.findFirst.mockResolvedValue(
      reservationRecord({ status: 'confirmed', stays: [] })
    );

    const details = await getStayDetails(portalToken());

    expect(details.roomNumber).toBe('Unassigned');
    expect(details.digitalKeyReady).toBe(false);
  });
});

describe('submitCheckIn', () => {
  it('is idempotent for an already checked-in reservation', async () => {
    mockReservation.findFirst.mockResolvedValue(reservationRecord({ status: 'checked_in' }));

    const result = await submitCheckIn({ token: portalToken() });

    expect(result.success).toBe(true);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('rejects check-in for a reservation that is not confirmed', async () => {
    mockReservation.findFirst.mockResolvedValue(reservationRecord({ status: 'checked_out' }));

    await expect(submitCheckIn({ token: portalToken() })).rejects.toMatchObject({
      statusCode: 409,
      code: 'CHECKIN_NOT_ALLOWED',
    });
  });

  it('updates the reservation and stores the ID document in a transaction', async () => {
    const record = reservationRecord({ notes: 'Late arrival' });
    mockReservation.findFirst.mockResolvedValue(record);

    const tx = {
      reservation: { update: vi.fn().mockResolvedValue({}) },
      guestDocument: { create: vi.fn().mockResolvedValue({}) },
    };
    mockTransaction.mockImplementation((cb: any) => cb(tx));

    const result = await submitCheckIn({
      token: portalToken(),
      estimatedArrivalTime: '22:00',
      idDocument: 'ID-777',
    });

    expect(tx.reservation.update.mock.calls[0][0].data.status).toBe('checked_in');
    expect(tx.reservation.update.mock.calls[0][0].data.notes).toBe('Late arrival\nETA: 22:00');
    expect(tx.guestDocument.create.mock.calls[0][0].data).toEqual({
      guestId: 'g1',
      type: 'id_card',
      number: 'ID-777',
    });
    expect(result.checkedIn).toBe(true);
  });
});

describe('getDigitalKey', () => {
  it('rejects when the guest has not checked in', async () => {
    mockReservation.findFirst.mockResolvedValue(reservationRecord({ status: 'confirmed' }));

    await expect(getDigitalKey(portalToken())).rejects.toMatchObject({
      statusCode: 409,
      code: 'KEY_NOT_READY',
    });
  });

  it('rejects when no room is assigned', async () => {
    mockReservation.findFirst.mockResolvedValue(
      reservationRecord({ status: 'checked_in', stays: [] })
    );

    await expect(getDigitalKey(portalToken())).rejects.toMatchObject({
      statusCode: 409,
      message: 'No room assigned yet — digital key unavailable',
    });
  });

  it('returns a deterministic 8-character key code with stay window', async () => {
    mockReservation.findFirst.mockResolvedValue(reservationRecord({ status: 'checked_in' }));

    const key1 = await getDigitalKey(portalToken());
    const key2 = await getDigitalKey(portalToken());

    expect(key1.keyCode).toMatch(/^[0-9A-F]{8}$/);
    expect(key1.keyCode).toBe(key2.keyCode);

    // Key window: 15:00 on arrival day until 11:00 on departure day (local time)
    const expectedFrom = new Date('2026-09-10T00:00:00Z');
    expectedFrom.setHours(15, 0, 0, 0);
    const expectedUntil = new Date('2026-09-12T00:00:00Z');
    expectedUntil.setHours(11, 0, 0, 0);
    expect(key1.activeFrom).toBe(expectedFrom.toISOString());
    expect(key1.activeUntil).toBe(expectedUntil.toISOString());
  });
});

describe('requestService', () => {
  it('creates a housekeeping task for housekeeping requests with an assigned room', async () => {
    mockReservation.findFirst.mockResolvedValue(reservationRecord());
    mockTask.create.mockResolvedValue({
      id: 'task1',
      createdAt: new Date('2026-09-05T10:00:00Z'),
    });

    const result = await requestService({
      token: portalToken(),
      type: 'housekeeping',
      message: 'Extra towels please',
    });

    expect(mockTask.create.mock.calls[0][0].data).toMatchObject({
      tenantId: 't1',
      propertyId: 'p1',
      roomId: 'rm1',
      type: 'cleaning',
      status: 'pending',
      notes: 'Guest portal request: Extra towels please',
    });
    expect(result).toMatchObject({ id: 'task1', status: 'received' });
    expect(mockReservation.update).not.toHaveBeenCalled();
  });

  it('maps maintenance requests to a maintenance task type', async () => {
    mockReservation.findFirst.mockResolvedValue(reservationRecord());
    mockTask.create.mockResolvedValue({ id: 'task2', createdAt: new Date() });

    await requestService({ token: portalToken(), type: 'maintenance', message: 'AC broken' });

    expect(mockTask.create.mock.calls[0][0].data.type).toBe('maintenance');
  });

  it('appends concierge requests to the reservation notes instead', async () => {
    mockReservation.findFirst.mockResolvedValue(reservationRecord({ notes: 'VIP guest' }));
    mockReservation.update.mockResolvedValue({});

    const result = await requestService({
      token: portalToken(),
      type: 'concierge',
      message: 'Book a restaurant',
    });

    expect(mockTask.create).not.toHaveBeenCalled();
    const notes = mockReservation.update.mock.calls[0][0].data.notes as string;
    expect(notes).toContain('VIP guest');
    expect(notes).toContain('Guest concierge request: Book a restaurant');
    expect(result.status).toBe('received');
  });
});

describe('updatePreferences', () => {
  it('upserts each preference under the portal category in a transaction', async () => {
    mockReservation.findFirst.mockResolvedValue(reservationRecord());
    mockPreference.upsert.mockImplementation((args: Record<string, unknown>) =>
      Promise.resolve(args)
    );
    mockTransaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));

    const result = await updatePreferences(portalToken(), {
      pillow: 'firm',
      floor: 'high',
    });

    expect(mockPreference.upsert).toHaveBeenCalledTimes(2);
    expect(mockPreference.upsert.mock.calls[0][0]).toMatchObject({
      where: { id: 'g1-portal-pillow' },
      create: {
        id: 'g1-portal-pillow',
        guestId: 'g1',
        category: 'portal',
        key: 'pillow',
        value: 'firm',
      },
      update: { value: 'firm' },
    });
    expect(result.preferences).toEqual({ pillow: 'firm', floor: 'high' });
  });
});
