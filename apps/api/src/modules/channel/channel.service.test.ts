/* apps/api/src/modules/channel/channel.service.test.ts */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    property: { findFirst: vi.fn() },
    ratePlan: { findMany: vi.fn() },
    reservationStay: { count: vi.fn(), groupBy: vi.fn() },
    reservation: { findUnique: vi.fn(), create: vi.fn() },
    channelConnection: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../../common/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../common/env.js', () => ({
  env: { CHANNEL_API_TIMEOUT_MS: 15000 },
}));

import { prisma } from '../../common/prisma.js';
import {
  getChannelStatus,
  listChannels,
  connectChannel,
  disconnectChannel,
  pushAvailability,
  pushRates,
  syncReservations,
} from './channel.service.js';

const prismaAny = prisma as any;
const mockConnection = prismaAny.channelConnection as Record<string, ReturnType<typeof vi.fn>>;
const mockProperty = prisma.property as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockRatePlan = prisma.ratePlan as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockStay = prisma.reservationStay as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockReservation = prisma.reservation as unknown as Record<string, ReturnType<typeof vi.fn>>;

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function httpOk(body = '{}') {
  return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(body) });
}

function httpError(status: number, body = 'error') {
  return Promise.resolve({ ok: false, status, text: () => Promise.resolve(body) });
}

const connection = {
  id: 'ch1',
  tenantId: 't1',
  propertyId: 'p1',
  provider: 'custom',
  hotelId: 'H1',
  apiKey: 'key',
  apiSecret: 'secret',
  endpoint: 'https://channel.example.com/api',
  settings: {},
  status: 'active',
  lastSyncStatus: 'success',
  createdAt: new Date('2026-09-01'),
};

const connectInput = {
  provider: 'custom' as const,
  propertyId: 'p1',
  credentials: { apiKey: 'key', hotelId: 'H1', endpoint: 'https://channel.example.com/api' },
};

beforeEach(() => vi.clearAllMocks());

afterEach(() => {
  vi.useRealTimers();
});

describe('getChannelStatus', () => {
  it('summarises connections by status and last sync result', async () => {
    mockConnection.findMany.mockResolvedValue([
      { status: 'active', lastSyncStatus: 'success' },
      { status: 'active', lastSyncStatus: 'error' },
      { status: 'pending', lastSyncStatus: 'never' },
    ]);

    const result = await getChannelStatus('t1');

    expect(mockConnection.findMany.mock.calls[0][0].where).toEqual({ tenantId: 't1' });
    expect(result.stats).toEqual({ totalConnections: 3, active: 2, syncing: 1, failed: 1 });
  });
});

describe('listChannels', () => {
  it('attaches provider metadata to each connection', async () => {
    mockConnection.findMany.mockResolvedValue([
      { ...connection, provider: 'bookingcom' },
      { ...connection, id: 'ch2', provider: 'airbnb' },
    ]);

    const result = await listChannels('t1');

    expect(result[0].providerMeta.name).toBe('Booking.com');
    expect(result[0].providerMeta.supports).toContain('promotions');
    expect(result[1].providerMeta.name).toBe('Airbnb');
    expect(result[1].providerMeta.supports).not.toContain('content');
  });
});

describe('connectChannel', () => {
  it('throws 404 when the property is outside the tenant', async () => {
    mockProperty.findFirst.mockResolvedValue(null);
    await expect(connectChannel('t1', connectInput)).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('rejects a duplicate connection for the same provider and hotel', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockConnection.findFirst.mockResolvedValue(connection);

    await expect(connectChannel('t1', connectInput)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
    expect(mockConnection.create).not.toHaveBeenCalled();
  });

  it('activates the connection when credential validation succeeds', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockConnection.findFirst.mockResolvedValue(null);
    mockConnection.create.mockResolvedValue({ ...connection, status: 'pending' });
    mockConnection.update.mockResolvedValue({});
    fetchMock.mockImplementation(() => httpOk());

    const result = await connectChannel('t1', connectInput);

    expect(result.status).toBe('active');
    expect(mockConnection.update.mock.calls[0][0].data.status).toBe('active');
    // Validation hit the custom adapter's /ping endpoint
    expect(fetchMock.mock.calls[0][0]).toBe('https://channel.example.com/api/ping');
  });

  it('marks the connection as failed when the provider rejects the credentials', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockConnection.findFirst.mockResolvedValue(null);
    mockConnection.create.mockResolvedValue({ ...connection, status: 'pending' });
    mockConnection.update.mockResolvedValue({});
    fetchMock.mockImplementation(() => httpError(401));

    const result = await connectChannel('t1', connectInput);

    expect(result.status).toBe('failed');
    expect(mockConnection.update.mock.calls[0][0].data).toMatchObject({
      status: 'failed',
      lastSyncStatus: 'error',
    });
  });
});

describe('disconnectChannel', () => {
  it('throws 404 when the connection is not in this tenant', async () => {
    mockConnection.findFirst.mockResolvedValue(null);
    await expect(disconnectChannel('t1', 'ch1')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('marks the connection as disconnected', async () => {
    mockConnection.findFirst.mockResolvedValue(connection);
    mockConnection.update.mockResolvedValue({});

    await disconnectChannel('t1', 'ch1');

    expect(mockConnection.update.mock.calls[0][0]).toEqual({
      where: { id: 'ch1' },
      data: { status: 'disconnected', disconnectedAt: expect.any(Date) },
    });
  });
});

describe('pushAvailability', () => {
  const availabilityInput = {
    propertyId: 'p1',
    dateFrom: '2026-09-10',
    dateTo: '2026-09-11',
  };

  it('throws 404 when the property is outside the tenant', async () => {
    mockProperty.findFirst.mockResolvedValue(null);
    await expect(pushAvailability('t1', availabilityInput)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('computes per-day availability and pushes it to every active channel', async () => {
    mockProperty.findFirst.mockResolvedValue({
      id: 'p1',
      roomTypes: [{ id: 'rt1', code: 'DLXK' }],
      rooms: [
        { id: 'room1', roomTypeId: 'rt1' },
        { id: 'room2', roomTypeId: 'rt1' },
      ],
    });
    mockConnection.findMany.mockResolvedValue([connection]);
    // One occupied room on each of the two days (groupBy by ['date','roomId'])
    mockStay.groupBy.mockResolvedValue([
      { date: new Date('2026-09-10T00:00:00.000Z'), roomId: 'room1', _count: { _all: 1 } },
      { date: new Date('2026-09-11T00:00:00.000Z'), roomId: 'room1', _count: { _all: 1 } },
    ]);
    mockConnection.update.mockResolvedValue({});
    fetchMock.mockImplementation(() => httpOk());

    const result = await pushAvailability('t1', availabilityInput);

    // 1 room type × 2 days
    expect(result.availability).toHaveLength(2);
    expect(result.availability[0]).toMatchObject({
      date: '2026-09-10',
      roomTypeId: 'rt1',
      roomTypeCode: 'DLXK',
      available: 1,
      total: 2,
    });

    expect(result.pushedTo).toEqual([
      expect.objectContaining({ channelId: 'ch1', status: 'success', records: 2 }),
    ]);
    expect(mockConnection.update.mock.calls[0][0].data.lastSyncStatus).toBe('success');
  });

  it('records an error status when the channel push fails', async () => {
    mockProperty.findFirst.mockResolvedValue({
      id: 'p1',
      roomTypes: [{ id: 'rt1', code: 'DLXK' }],
      rooms: [{ id: 'room1', roomTypeId: 'rt1' }],
    });
    mockConnection.findMany.mockResolvedValue([connection]);
    mockStay.groupBy.mockResolvedValue([]);
    mockConnection.update.mockResolvedValue({});
    fetchMock.mockImplementation(() => httpError(500, 'upstream down'));

    const result = await pushAvailability('t1', availabilityInput);

    expect(result.pushedTo[0].status).toBe('error');
    expect(result.pushedTo[0].message).toContain('availability push to custom failed');
    expect(mockConnection.update.mock.calls[0][0].data.lastSyncStatus).toBe('error');
  });
});

describe('pushRates', () => {
  const ratesInput = { propertyId: 'p1', dateFrom: '2026-09-10', dateTo: '2026-09-10' };

  it('throws 404 when the property is outside the tenant', async () => {
    mockProperty.findFirst.mockResolvedValue(null);
    await expect(pushRates('t1', ratesInput)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('pushes one rate per plan per day and applies the channel rate multiplier', async () => {
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockConnection.findMany.mockResolvedValue([
      { ...connection, settings: { rateMultiplier: 1.2 } },
    ]);
    mockRatePlan.findMany.mockResolvedValue([
      {
        id: 'rp1',
        code: 'BAR',
        roomTypeId: 'rt1',
        baseRate: 100,
        currency: 'ZAR',
        roomType: { id: 'rt1', code: 'DLXK' },
      },
    ]);
    mockConnection.update.mockResolvedValue({});
    fetchMock.mockImplementation(() => httpOk());

    const result = await pushRates('t1', ratesInput);

    expect(result.rates).toHaveLength(1);
    expect(result.rates[0]).toMatchObject({
      date: '2026-09-10',
      ratePlanId: 'rp1',
      roomTypeCode: 'DLXK',
      rate: 100,
      currency: 'ZAR',
    });

    // The channel received the multiplied rate (100 × 1.2 = 120)
    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(sentBody.hotelId).toBe('H1');
    expect(sentBody.rates[0].rate).toBeCloseTo(120);
    expect(result.pushedTo[0]).toMatchObject({ status: 'success', records: 1 });
  });
});

describe('syncReservations', () => {
  const fetchedReservation = {
    confirmationNumber: 'CH-1001',
    guestId: 'g1',
    arrivalDate: '2026-09-20',
    departureDate: '2026-09-22',
    nights: 2,
    adults: 2,
    children: 0,
    totalAmount: 300,
  };

  it('imports new reservations and skips ones that already exist', async () => {
    mockConnection.findMany.mockResolvedValue([connection]);
    mockConnection.update.mockResolvedValue({});
    fetchMock.mockImplementation(() =>
      httpOk(
        JSON.stringify({
          reservations: [
            fetchedReservation,
            { ...fetchedReservation, confirmationNumber: 'CH-1002' },
          ],
        })
      )
    );
    mockReservation.findUnique
      .mockResolvedValueOnce(null) // CH-1001 is new
      .mockResolvedValueOnce({ id: 'existing' }); // CH-1002 already imported
    mockReservation.create.mockResolvedValue({});

    const result = await syncReservations('t1');

    expect(mockReservation.create).toHaveBeenCalledTimes(1);
    expect(mockReservation.create.mock.calls[0][0].data).toMatchObject({
      tenantId: 't1',
      propertyId: 'p1',
      confirmationNumber: 'CH-1001',
      status: 'confirmed',
      source: 'custom',
      nights: 2,
      adults: 2,
      totalAmount: 300,
      balance: 300,
    });
    expect(result).toEqual([{ channelId: 'ch1', provider: 'custom', fetched: 2, imported: 1 }]);
    expect(mockConnection.update.mock.calls[0][0].data.lastSyncStatus).toBe('success');
  });

  it('returns an empty result when the channel fetch fails', async () => {
    mockConnection.findMany.mockResolvedValue([connection]);
    mockConnection.update.mockResolvedValue({});
    fetchMock.mockImplementation(() => httpError(503));

    const result = await syncReservations('t1');

    expect(result).toEqual([{ channelId: 'ch1', provider: 'custom', fetched: 0, imported: 0 }]);
    expect(mockReservation.create).not.toHaveBeenCalled();
  });
});
