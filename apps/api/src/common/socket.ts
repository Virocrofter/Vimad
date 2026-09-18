import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import { verifyToken, type TokenPayload } from '../modules/auth/auth.service.js';
import { logger } from './logger.js';
import { env } from './env.js';

let io: SocketIOServer | null = null;

export interface SocketUser extends TokenPayload {}

export interface AuthenticatedSocket extends Socket {
  user: SocketUser;
}

/**
 * Socket.IO authentication middleware.
 * Accepts a Bearer token from handshake.auth.token or the Authorization header.
 */
function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): void {
  const rawToken =
    (socket.handshake.auth?.token as string | undefined) ||
    (socket.handshake.headers.authorization as string | undefined);

  if (!rawToken) {
    next(new Error('Authentication required'));
    return;
  }

  const token = rawToken.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    next(new Error('Authentication required'));
    return;
  }

  try {
    const payload = verifyToken(token);
    (socket as AuthenticatedSocket).user = payload;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
}

/**
 * Initialize the Socket.IO server on the provided HTTP server.
 * Returns the Socket.IO server instance.
 */
export function createSocketServer(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGINS ?? env.WEB_URL ?? true,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const { userId, tenantId, role } = authSocket.user;

    logger.debug({ userId, tenantId, role }, 'socket connected');

    // Join scoped rooms for targeted broadcasts
    authSocket.join(`tenant:${tenantId}`);
    authSocket.join(`user:${userId}`);

    if (role === 'owner' || role === 'admin') {
      authSocket.join('admin');
    }

    authSocket.on('disconnect', () => {
      logger.debug({ userId, tenantId }, 'socket disconnected');
    });

    authSocket.on('error', (err: Error) => {
      logger.error({ err, userId, tenantId }, 'socket error');
    });
  });

  return io;
}

/**
 * Emit an event to all admin sockets.
 */
export function emitToAdmin<T = unknown>(event: string, payload: T): void {
  io?.to('admin').emit(event, payload);
}

/**
 * Emit an event to all sockets belonging to a tenant.
 */
export function emitToTenant<T = unknown>(tenantId: string, event: string, payload: T): void {
  io?.to(`tenant:${tenantId}`).emit(event, payload);
}

/**
 * Emit an event to a specific user's sockets.
 */
export function emitToUser<T = unknown>(userId: string, event: string, payload: T): void {
  io?.to(`user:${userId}`).emit(event, payload);
}

/**
 * Get the active Socket.IO server instance.
 */
export function getIO(): SocketIOServer | null {
  return io;
}
