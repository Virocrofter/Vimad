import { Router } from 'express';
import { prisma } from '../../common/prisma.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const timestamp = new Date().toISOString();

  const database = await (async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch {
      return 'error';
    }
  })();

  const overallStatus = database === 'ok' ? 'ok' : 'degraded';

  res.status(overallStatus === 'ok' ? 200 : 503).json({
    status: overallStatus,
    timestamp,
    version: process.env.npm_package_version ?? '0.0.0',
    dependencies: {
      database,
    },
  });
});
