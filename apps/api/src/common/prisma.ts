/* apps/api/src/common/prisma.ts */
import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';
import { env } from './env.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const logOptions =
  env.NODE_ENV === 'development' ? (['query', 'error', 'warn'] as const) : (['error'] as const);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logOptions.map((level) => ({ emit: 'event', level })),
  });

// Attach query logging with request correlation
if (env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: { query: string; params: string; duration: number }) => {
    logger.debug(
      {
        prisma: {
          query: e.query,
          params: e.params,
          durationMs: e.duration,
        },
      },
      'Prisma query executed'
    );
  });
}

prisma.$on('error' as never, (e: { message: string; code?: string }) => {
  logger.error({ prismaError: { message: e.message, code: e.code } }, 'Prisma error');
});

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
