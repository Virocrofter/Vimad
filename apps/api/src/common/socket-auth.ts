/* apps/api/src/common/socket-auth.ts
 * Standalone JWT verification for the Socket.IO handshake.
 *
 * Why this file exists: socket.ts used to import verifyToken from
 * auth.service.ts, and auth.service.ts imports prisma.js — which made
 * socket.js part of a circular import chain at boot. Verifying the token
 * here (jsonwebtoken + env only, no prisma, no auth.service) breaks that
 * cycle and lets the real-time layer start.
 */
import jwt from 'jsonwebtoken';
import { env } from './env.js';

export interface SocketTokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

export interface SocketGuestPayload extends SocketTokenPayload {
  scope: 'guest-portal';
  guestReservationId: string;
}

export type SocketIdentity = SocketTokenPayload | SocketGuestPayload;

export function verifySocketToken(token: string): SocketIdentity {
  const payload = jwt.verify(token, env.JWT_SECRET) as SocketTokenPayload & {
    scope?: string;
    reservationId?: string;
  };

  // Guest-portal sockets: same JWT, guest scope. Kept prisma-free (see header).
  if (payload.scope === 'guest-portal' && payload.reservationId) {
    return {
      userId: payload.reservationId,
      tenantId: payload.tenantId,
      email: 'guest@portal',
      role: 'guest',
      scope: 'guest-portal',
      guestReservationId: payload.reservationId,
    } as SocketGuestPayload;
  }

  return payload;
}
