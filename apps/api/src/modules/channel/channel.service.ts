import { z } from 'zod';
import type { Reservation } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { env } from '../../common/env.js';

export const channelConnectSchema = z.object({
  provider: z.enum(['bookingcom', 'expedia', 'airbnb', 'agoda', 'tripcom', 'vrbo', 'custom']),
  propertyId: z.string(),
  credentials: z.object({
    apiKey: z.string(),
    apiSecret: z.string().optional(),
    hotelId: z.string(),
    endpoint: z.string().url().optional(),
  }),
  settings: z
    .object({
      syncInterval: z.number().int().min(1).default(5),
      autoConfirm: z.boolean().default(false),
      rateMultiplier: z.coerce.number().min(0.5).max(2).default(1),
      minStaySync: z.boolean().default(true),
      restrictionsSync: z.boolean().default(true),
    })
    .optional(),
});

export const availabilityPushSchema = z.object({
  propertyId: z.string(),
  channelIds: z.array(z.string()).optional(),
  dateFrom: z.string(),
  dateTo: z.string(),
  roomTypes: z.array(z.string()).optional(),
});

export const ratesPushSchema = z.object({
  propertyId: z.string(),
  channelIds: z.array(z.string()).optional(),
  dateFrom: z.string(),
  dateTo: z.string(),
  ratePlans: z.array(z.string()).optional(),
});

type ChannelProvider =
  'bookingcom' | 'expedia' | 'airbnb' | 'agoda' | 'tripcom' | 'vrbo' | 'custom';

const providerMeta: Record<ChannelProvider, { name: string; logo: string; supports: string[] }> = {
  bookingcom: {
    name: 'Booking.com',
    logo: '/logos/bookingcom.svg',
    supports: ['ari', 'reservations', 'content', 'promotions'],
  },
  expedia: {
    name: 'Expedia Group',
    logo: '/logos/expedia.svg',
    supports: ['ari', 'reservations', 'content'],
  },
  airbnb: {
    name: 'Airbnb',
    logo: '/logos/airbnb.svg',
    supports: ['ari', 'reservations'],
  },
  agoda: {
    name: 'Agoda',
    logo: '/logos/agoda.svg',
    supports: ['ari', 'reservations', 'content'],
  },
  tripcom: {
    name: 'Trip.com',
    logo: '/logos/tripcom.svg',
    supports: ['ari', 'reservations'],
  },
  vrbo: {
    name: 'VRBO',
    logo: '/logos/vrbo.svg',
    supports: ['ari', 'reservations'],
  },
  custom: {
    name: 'Custom Integration',
    logo: '/logos/custom.svg',
    supports: ['ari', 'reservations'],
  },
};

export async function getChannelStatus(tenantId: string) {
  const connections = await (prisma as any).channelConnection.findMany({
    where: { tenantId },
    include: { property: { select: { id: true, name: true } } },
  });

  const stats = {
    totalConnections: connections.length,
    active: connections.filter((c: { status: string }) => c.status === 'active').length,
    syncing: connections.filter((c: { lastSyncStatus: string }) => c.lastSyncStatus === 'success')
      .length,
    failed: connections.filter((c: { lastSyncStatus: string }) => c.lastSyncStatus === 'error')
      .length,
  };

  return { connections, stats };
}

export async function listChannels(tenantId: string) {
  const connections = await (prisma as any).channelConnection.findMany({
    where: { tenantId },
    include: {
      property: { select: { id: true, name: true } },
      mappings: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return connections.map((conn: { provider: string }) => ({
    ...conn,
    providerMeta: providerMeta[conn.provider as ChannelProvider],
  }));
}

export async function connectChannel(
  tenantId: string,
  input: z.infer<typeof channelConnectSchema>
) {
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, tenantId },
  });
  if (!property) {
    throw new AppError(404, 'Property not found', 'NOT_FOUND');
  }

  const _existing = await (prisma as any).channelConnection.findFirst({
    where: {
      tenantId,
      propertyId: input.propertyId,
      provider: input.provider,
      hotelId: input.credentials.hotelId,
    },
  });
  if (_existing) {
    throw new AppError(409, 'Channel connection already exists', 'CONFLICT');
  }

  const connection = await (prisma as any).channelConnection.create({
    data: {
      tenantId,
      propertyId: input.propertyId,
      provider: input.provider,
      hotelId: input.credentials.hotelId,
      apiKey: input.credentials.apiKey,
      apiSecret: input.credentials.apiSecret,
      endpoint: input.credentials.endpoint,
      settings: input.settings ?? {},
      status: 'pending',
    },
  });

  const validated = await validateConnection(connection);

  if (validated) {
    await (prisma as any).channelConnection.update({
      where: { id: connection.id },
      data: { status: 'active', connectedAt: new Date() },
    });
  } else {
    await (prisma as any).channelConnection.update({
      where: { id: connection.id },
      data: { status: 'failed', lastSyncStatus: 'error' },
    });
  }

  return { ...connection, status: validated ? 'active' : 'failed' };
}

/**
 * Real credential validation: asks the provider for the hotel's own info.
 * Returns false on 401/403/404 or network failure — never throws.
 */
async function validateConnection(connection: {
  id: string;
  provider: string;
  apiKey: string;
  apiSecret?: string | null;
  hotelId: string;
  endpoint?: string | null;
}): Promise<boolean> {
  try {
    const adapter = getAdapter(connection.provider as ChannelProvider);
    await adapter.validate(connection);
    logger.info(
      { channelId: connection.id, provider: connection.provider },
      'channel credentials validated'
    );
    return true;
  } catch (err) {
    logger.warn(
      { err, channelId: connection.id, provider: connection.provider },
      'channel credential validation failed'
    );
    return false;
  }
}

export async function disconnectChannel(tenantId: string, channelId: string) {
  const connection = await (prisma as any).channelConnection.findFirst({
    where: { id: channelId, tenantId },
  });
  if (!connection) {
    throw new AppError(404, 'Channel connection not found', 'NOT_FOUND');
  }

  await (prisma as any).channelConnection.update({
    where: { id: channelId },
    data: { status: 'disconnected', disconnectedAt: new Date() },
  });
}

export async function pushAvailability(
  tenantId: string,
  input: z.infer<typeof availabilityPushSchema>
) {
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, tenantId },
    include: { rooms: true, roomTypes: true },
  });
  if (!property) {
    throw new AppError(404, 'Property not found', 'NOT_FOUND');
  }

  const connections = await (prisma as any).channelConnection.findMany({
    where: {
      tenantId,
      propertyId: input.propertyId,
      status: 'active',
      ...(input.channelIds?.length ? { id: { in: input.channelIds } } : {}),
    },
  });

  const dateFrom = new Date(input.dateFrom);
  const dateTo = new Date(input.dateTo);

  // ─── N+1 FIX: one grouped query for the whole range instead of
  // roomTypes × days individual count() round-trips ───
  const roomTypeIds = property.roomTypes
    .filter((rt) => (input.roomTypes ? input.roomTypes.includes(rt.id) : true))
    .map((rt) => rt.id);

  const occupiedRows = roomTypeIds.length
    ? await prisma.reservationStay.groupBy({
        by: ['date', 'roomId'],
        where: {
          date: { gte: dateFrom, lte: dateTo },
          room: { roomTypeId: { in: roomTypeIds } },
          reservation: {
            tenantId,
            propertyId: input.propertyId,
            status: { in: ['confirmed', 'checked_in'] },
          },
        },
        _count: { _all: true },
      })
    : [];

  // Occupied count per (roomTypeId, dateKey)
  const occupiedByTypeAndDate = new Map<string, number>();
  const roomTypeByRoomId = new Map(property.rooms.map((r) => [r.id, r.roomTypeId]));
  for (const row of occupiedRows) {
    const rtId = roomTypeByRoomId.get(row.roomId);
    if (!rtId) continue;
    const dateKey = row.date.toISOString().split('T')[0];
    const k = `${rtId}:${dateKey}`;
    occupiedByTypeAndDate.set(k, (occupiedByTypeAndDate.get(k) ?? 0) + row._count._all);
  }

  const availability = [];

  for (const roomType of property.roomTypes.filter((rt) =>
    input.roomTypes ? input.roomTypes.includes(rt.id) : true
  )) {
    const rooms = property.rooms.filter((r) => r.roomTypeId === roomType.id);
    const totalRooms = rooms.length;

    for (let d = new Date(dateFrom); d <= dateTo; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const occupied = occupiedByTypeAndDate.get(`${roomType.id}:${dateKey}`) ?? 0;

      availability.push({
        date: dateKey,
        roomTypeId: roomType.id,
        roomTypeCode: roomType.code,
        available: totalRooms - occupied,
        total: totalRooms,
      });
    }
  }

  const results = [];
  for (const connection of connections) {
    const result = await sendToChannel(connection, 'availability', availability);
    results.push({
      channelId: connection.id,
      provider: connection.provider,
      status: result.success ? 'success' : 'error',
      message: result.message,
      records: availability.length,
    });

    await (prisma as any).channelConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: result.success ? 'success' : 'error',
      },
    });
  }

  return { availability, pushedTo: results };
}

export async function pushRates(tenantId: string, input: z.infer<typeof ratesPushSchema>) {
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, tenantId },
  });
  if (!property) {
    throw new AppError(404, 'Property not found', 'NOT_FOUND');
  }

  const connections = await (prisma as any).channelConnection.findMany({
    where: {
      tenantId,
      propertyId: input.propertyId,
      status: 'active',
      ...(input.channelIds?.length ? { id: { in: input.channelIds } } : {}),
    },
  });

  const ratePlans = await prisma.ratePlan.findMany({
    where: {
      tenantId,
      propertyId: input.propertyId,
      status: 'active',
      ...(input.ratePlans?.length ? { id: { in: input.ratePlans } } : {}),
    },
    include: { roomType: { select: { id: true, code: true } } },
  });

  const dateFrom = new Date(input.dateFrom);
  const dateTo = new Date(input.dateTo);
  const rates = [];

  for (const plan of ratePlans) {
    for (let d = new Date(dateFrom); d <= dateTo; d.setDate(d.getDate() + 1)) {
      rates.push({
        date: d.toISOString().split('T')[0],
        ratePlanId: plan.id,
        ratePlanCode: plan.code,
        roomTypeId: plan.roomTypeId,
        roomTypeCode: plan.roomType.code,
        rate: plan.baseRate,
        currency: plan.currency,
      });
    }
  }

  const results = [];
  for (const connection of connections) {
    const multiplier = (connection.settings as Record<string, unknown>)?.rateMultiplier ?? 1;
    const adjustedRates = rates.map((r) => ({
      ...r,
      rate: Number(r.rate) * Number(multiplier),
    }));

    const result = await sendToChannel(connection, 'rates', adjustedRates);
    results.push({
      channelId: connection.id,
      provider: connection.provider,
      status: result.success ? 'success' : 'error',
      message: result.message,
      records: adjustedRates.length,
    });

    await (prisma as any).channelConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: result.success ? 'success' : 'error',
      },
    });
  }

  return { rates, pushedTo: results };
}

export async function syncReservations(tenantId: string, channelId?: string) {
  const where: Record<string, unknown> = {
    tenantId,
    status: 'active',
  };
  if (channelId) where.id = channelId;

  const connections = await (prisma as any).channelConnection.findMany({ where });

  const results = [];
  for (const connection of connections) {
    const fetched = await fetchFromChannel(connection, 'reservations');

    let imported = 0;
    for (const rawReservation of fetched.reservations ?? []) {
      const reservation = rawReservation as Reservation & { guestId?: string };
      const _existing = await prisma.reservation.findUnique({
        where: { confirmationNumber: reservation.confirmationNumber },
      });

      if (!_existing) {
        await prisma.reservation.create({
          data: {
            tenantId,
            propertyId: connection.propertyId,
            guestId: reservation.guestId,
            confirmationNumber: reservation.confirmationNumber,
            status: 'confirmed',
            source: connection.provider,
            arrivalDate: new Date(reservation.arrivalDate),
            departureDate: new Date(reservation.departureDate),
            nights: reservation.nights,
            adults: reservation.adults,
            children: reservation.children ?? 0,
            totalAmount: reservation.totalAmount,
            balance: reservation.totalAmount,
          },
        });
        imported++;
      }
    }

    await (prisma as any).channelConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date(), lastSyncStatus: 'success' },
    });

    results.push({
      channelId: connection.id,
      provider: connection.provider,
      fetched: fetched.reservations?.length ?? 0,
      imported,
    });
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════
// Phase 2A.2 — Real channel manager HTTP adapters
// ═══════════════════════════════════════════════════════════════════

interface ChannelConnectionLike {
  id: string;
  provider: string;
  apiKey: string;
  apiSecret?: string | null;
  hotelId: string;
  endpoint?: string | null;
}

interface ChannelAdapter {
  /** Default base URL when the connection has no custom endpoint. */
  defaultEndpoint: string | null;
  /** Auth headers for the provider (credential-based). */
  authHeaders(conn: ChannelConnectionLike): Record<string, string>;
  /** Lightweight call used to validate credentials on connect. */
  validate(conn: ChannelConnectionLike): Promise<void>;
  /** Push availability records. */
  pushAvailability(conn: ChannelConnectionLike, data: unknown[]): Promise<string>;
  /** Push rate records. */
  pushRates(conn: ChannelConnectionLike, data: unknown[]): Promise<string>;
  /** Fetch reservations from the channel. */
  fetchReservations(conn: ChannelConnectionLike): Promise<unknown[]>;
}

// ─── Shared HTTP helper ───

async function channelRequest(
  conn: ChannelConnectionLike,
  adapter: ChannelAdapter,
  path: string,
  init: { method: string; body?: string; contentType?: string }
): Promise<{ status: number; body: string }> {
  const base = conn.endpoint ?? adapter.defaultEndpoint;
  if (!base) {
    throw new AppError(
      400,
      `No endpoint configured for provider "${conn.provider}" — set credentials.endpoint`,
      'CHANNEL_ENDPOINT_MISSING'
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.CHANNEL_API_TIMEOUT_MS);

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}${path}`, {
      method: init.method,
      headers: {
        ...adapter.authHeaders(conn),
        ...(init.contentType ? { 'Content-Type': init.contentType } : {}),
        Accept: 'application/json, application/xml, text/xml',
      },
      body: init.body,
      signal: controller.signal,
    });

    const body = await res.text();

    if (!res.ok) {
      // Surface provider error text (truncated) so sync results are actionable.
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
    }

    return { status: res.status, body };
  } finally {
    clearTimeout(timeout);
  }
}

function basicAuth(username: string, password?: string | null): string {
  return `Basic ${Buffer.from(`${username}:${password ?? ''}`).toString('base64')}`;
}

function escapeXml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── Booking.com Connectivity API (XML over HTTPS, basic auth) ───

const bookingcomAdapter: ChannelAdapter = {
  defaultEndpoint: 'https://supply-xml.booking.com/hotels',

  authHeaders: (conn) => ({
    Authorization: basicAuth(conn.apiKey, conn.apiSecret),
  }),

  async validate(conn) {
    // B.XML "hotel info" is the lightest authenticated call.
    await channelRequest(conn, bookingcomAdapter, '/xml/hotelinfo', {
      method: 'POST',
      contentType: 'application/xml',
      body: `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <hotel_id>${escapeXml(conn.hotelId)}</hotel_id>
</request>`,
    });
  },

  async pushAvailability(conn, data) {
    const rows = data as { date: string; roomTypeCode: string; available: number }[];
    const byRoom = new Map<string, { date: string; available: number }[]>();
    for (const r of rows) {
      const list = byRoom.get(r.roomTypeCode) ?? [];
      list.push(r);
      byRoom.set(r.roomTypeCode, list);
    }

    const roomBlocks = [...byRoom.entries()]
      .map(([roomCode, dates]) => {
        const sorted = [...dates].sort((a, b) => a.date.localeCompare(b.date));
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const inventory = sorted
          .map(
            (d) =>
              `<date from="${d.date}" to="${d.date}"><room_id>${escapeXml(roomCode)}</room_id><rooms_to_sell>${d.available}</rooms_to_sell></date>`
          )
          .join('');
        return `<room id="${escapeXml(roomCode)}" date_from="${first.date}" date_to="${last.date}">${inventory}</room>`;
      })
      .join('');

    const { body } = await channelRequest(conn, bookingcomAdapter, '/xml/availability', {
      method: 'POST',
      contentType: 'application/xml',
      body: `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <hotel_id>${escapeXml(conn.hotelId)}</hotel_id>
  <version>1.0</version>
  ${roomBlocks}
</request>`,
    });

    if (body.includes('<fault>') || body.includes('<ruid>') === false) {
      throw new Error(`Booking.com rejected availability push: ${body.slice(0, 300)}`);
    }
    return 'availability accepted by Booking.com';
  },

  async pushRates(conn, data) {
    const rows = data as {
      date: string;
      roomTypeCode: string;
      ratePlanCode: string;
      rate: number | string;
      currency: string;
    }[];

    const rateBlocks = rows
      .map(
        (r) =>
          `<rate room_id="${escapeXml(r.roomTypeCode)}" rate_id="${escapeXml(
            r.ratePlanCode
          )}" date="${r.date}" price1="${Number(r.rate).toFixed(2)}" currency="${escapeXml(r.currency)}"/>`
      )
      .join('');

    const { body } = await channelRequest(conn, bookingcomAdapter, '/xml/rates', {
      method: 'POST',
      contentType: 'application/xml',
      body: `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <hotel_id>${escapeXml(conn.hotelId)}</hotel_id>
  <version>1.0</version>
  ${rateBlocks}
</request>`,
    });

    if (body.includes('<fault>')) {
      throw new Error(`Booking.com rejected rates push: ${body.slice(0, 300)}`);
    }
    return 'rates accepted by Booking.com';
  },

  async fetchReservations(conn) {
    const { body } = await channelRequest(conn, bookingcomAdapter, '/xml/reservations', {
      method: 'POST',
      contentType: 'application/xml',
      body: `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <hotel_id>${escapeXml(conn.hotelId)}</hotel_id>
  <last_change>${new Date(Date.now() - 24 * 3600 * 1000).toISOString()}</last_change>
</request>`,
    });

    // Minimal parse of the B.XML reservations response.
    const reservations: unknown[] = [];
    const resBlocks = body.match(/<reservation>[\s\S]*?<\/reservation>/g) ?? [];
    for (const block of resBlocks) {
      const pick = (tag: string) => block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1] ?? '';
      const firstName = pick('first_name');
      const lastName = pick('last_name');
      const arrival = pick('arrival_date');
      const departure = pick('departure_date');
      const price = pick('totalprice');
      const id = pick('id');

      if (!id || !arrival || !departure) continue;

      // Channel reservations need a guest record before import.
      const guest = await prisma.guest.create({
        data: {
          tenantId: await tenantForConnection(conn),
          firstName: firstName || 'Channel',
          lastName: lastName || 'Guest',
        },
      });

      const nights = Math.max(
        1,
        Math.round((new Date(departure).getTime() - new Date(arrival).getTime()) / 86400000)
      );

      reservations.push({
        guestId: guest.id,
        confirmationNumber: `BCOM-${id}`,
        arrivalDate: arrival,
        departureDate: departure,
        nights,
        adults: 2,
        children: 0,
        totalAmount: Number(price) || 0,
      });
    }
    return reservations;
  },
};

// ─── Expedia Quick Connect (REST JSON, basic auth) ───

const expediaAdapter: ChannelAdapter = {
  defaultEndpoint: 'https://services.expediapartnercentral.com',

  authHeaders: (conn) => ({
    Authorization: basicAuth(conn.apiKey, conn.apiSecret),
  }),

  async validate(conn) {
    await channelRequest(
      conn,
      expediaAdapter,
      `/products/expedia_quick_connect/v3/properties/${encodeURIComponent(conn.hotelId)}`,
      { method: 'GET' }
    );
  },

  async pushAvailability(conn, data) {
    const rows = data as { date: string; roomTypeCode: string; available: number }[];
    const payload = {
      property_id: conn.hotelId,
      availability: rows.map((r) => ({
        room_type_id: r.roomTypeCode,
        date: r.date,
        available: r.available,
      })),
    };

    await channelRequest(
      conn,
      expediaAdapter,
      `/products/expedia_quick_connect/v3/properties/${encodeURIComponent(conn.hotelId)}/availability`,
      { method: 'PUT', contentType: 'application/json', body: JSON.stringify(payload) }
    );
    return 'availability accepted by Expedia';
  },

  async pushRates(conn, data) {
    const rows = data as {
      date: string;
      roomTypeCode: string;
      ratePlanCode: string;
      rate: number | string;
      currency: string;
    }[];
    const payload = {
      property_id: conn.hotelId,
      rates: rows.map((r) => ({
        room_type_id: r.roomTypeCode,
        rate_plan_id: r.ratePlanCode,
        date: r.date,
        amount: Number(Number(r.rate).toFixed(2)),
        currency: r.currency,
      })),
    };

    await channelRequest(
      conn,
      expediaAdapter,
      `/products/expedia_quick_connect/v3/properties/${encodeURIComponent(conn.hotelId)}/rates`,
      { method: 'PUT', contentType: 'application/json', body: JSON.stringify(payload) }
    );
    return 'rates accepted by Expedia';
  },

  async fetchReservations(conn) {
    const { body } = await channelRequest(
      conn,
      expediaAdapter,
      `/products/expedia_quick_connect/v3/properties/${encodeURIComponent(conn.hotelId)}/reservations`,
      { method: 'GET' }
    );

    const parsed = JSON.parse(body) as {
      reservations?: {
        reservation_id: string;
        primary_guest?: { given_name?: string; surname?: string };
        checkin_date: string;
        checkout_date: string;
        adult_count?: number;
        child_count?: number;
        total_amount?: { value?: number };
      }[];
    };

    const reservations: unknown[] = [];
    for (const r of parsed.reservations ?? []) {
      const guest = await prisma.guest.create({
        data: {
          tenantId: await tenantForConnection(conn),
          firstName: r.primary_guest?.given_name || 'Channel',
          lastName: r.primary_guest?.surname || 'Guest',
        },
      });

      const nights = Math.max(
        1,
        Math.round(
          (new Date(r.checkout_date).getTime() - new Date(r.checkin_date).getTime()) / 86400000
        )
      );

      reservations.push({
        guestId: guest.id,
        confirmationNumber: `EXP-${r.reservation_id}`,
        arrivalDate: r.checkin_date,
        departureDate: r.checkout_date,
        nights,
        adults: r.adult_count ?? 2,
        children: r.child_count ?? 0,
        totalAmount: r.total_amount?.value ?? 0,
      });
    }
    return reservations;
  },
};

// ─── Generic/custom adapter (endpoint-driven, bearer or basic auth) ───

const customAdapter: ChannelAdapter = {
  defaultEndpoint: null,

  authHeaders: (conn) =>
    conn.apiSecret
      ? { Authorization: basicAuth(conn.apiKey, conn.apiSecret) }
      : { Authorization: `Bearer ${conn.apiKey}` },

  async validate(conn) {
    await channelRequest(conn, customAdapter, '/ping', { method: 'GET' });
  },

  async pushAvailability(conn, data) {
    await channelRequest(conn, customAdapter, '/availability', {
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify({ hotelId: conn.hotelId, availability: data }),
    });
    return 'availability accepted';
  },

  async pushRates(conn, data) {
    await channelRequest(conn, customAdapter, '/rates', {
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify({ hotelId: conn.hotelId, rates: data }),
    });
    return 'rates accepted';
  },

  async fetchReservations(conn) {
    const { body } = await channelRequest(conn, customAdapter, '/reservations', {
      method: 'GET',
    });
    const parsed = JSON.parse(body) as { reservations?: unknown[] };
    return parsed.reservations ?? [];
  },
};

// Airbnb / Agoda / Trip.com / VRBO don't offer open ARI APIs — they require
// partnership programs. Route them through the custom adapter shape so a
// tenant-supplied endpoint (e.g. a switch/middleware partner) still works.
const adapters: Record<ChannelProvider, ChannelAdapter> = {
  bookingcom: bookingcomAdapter,
  expedia: expediaAdapter,
  airbnb: customAdapter,
  agoda: customAdapter,
  tripcom: customAdapter,
  vrbo: customAdapter,
  custom: customAdapter,
};

function getAdapter(provider: ChannelProvider): ChannelAdapter {
  return adapters[provider] ?? customAdapter;
}

const tenantIdCache = new Map<string, string>();
async function tenantForConnection(conn: ChannelConnectionLike): Promise<string> {
  const cached = tenantIdCache.get(conn.id);
  if (cached) return cached;
  const row = await (prisma as any).channelConnection.findUniqueOrThrow({
    where: { id: conn.id },
    select: { tenantId: true },
  });
  tenantIdCache.set(conn.id, row.tenantId);
  return row.tenantId;
}

// ─── send/fetch entry points (same signatures as the old stubs) ───

async function sendToChannel(
  connection: ChannelConnectionLike,
  type: string,
  data: unknown
): Promise<{ success: boolean; message: string }> {
  const adapter = getAdapter(connection.provider as ChannelProvider);
  const records = Array.isArray(data) ? data : [data];

  try {
    let message: string;
    if (type === 'availability') {
      message = await adapter.pushAvailability(connection, records);
    } else if (type === 'rates') {
      message = await adapter.pushRates(connection, records);
    } else {
      throw new Error(`Unsupported push type "${type}"`);
    }

    logger.info(
      { channelId: connection.id, provider: connection.provider, type, records: records.length },
      'channel push succeeded'
    );
    return { success: true, message };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(
      { err, channelId: connection.id, provider: connection.provider, type },
      'channel push failed'
    );
    return { success: false, message: `${type} push to ${connection.provider} failed: ${message}` };
  }
}

async function fetchFromChannel(
  connection: ChannelConnectionLike,
  type: string
): Promise<{ reservations?: unknown[] }> {
  const adapter = getAdapter(connection.provider as ChannelProvider);

  if (type !== 'reservations') {
    throw new AppError(400, `Unsupported fetch type "${type}"`, 'CHANNEL_FETCH_UNSUPPORTED');
  }

  try {
    const reservations = await adapter.fetchReservations(connection);
    logger.info(
      { channelId: connection.id, provider: connection.provider, fetched: reservations.length },
      'channel fetch succeeded'
    );
    return { reservations };
  } catch (err) {
    logger.error(
      { err, channelId: connection.id, provider: connection.provider },
      'channel fetch failed'
    );
    await (prisma as any).channelConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date(), lastSyncStatus: 'error' },
    });
    return { reservations: [] };
  }
}
