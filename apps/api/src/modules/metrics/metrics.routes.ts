/* apps/api/src/modules/metrics/metrics.routes.ts */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { register, collectDbMetrics } from '../../common/metrics.js';

export const metricsRouter = Router();

// Optional shared-secret protection for the scrape endpoint. In production
// prefer network-level controls (internal ingress / security groups); this
// is a lightweight second layer. Set METRICS_BEARER_TOKEN to enable.
function metricsAuth(req: Request, res: Response, next: NextFunction) {
  const token = process.env.METRICS_BEARER_TOKEN;
  if (!token) return next(); // not configured → rely on network controls
  if (req.headers.authorization === `Bearer ${token}`) return next();
  res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid metrics token' } });
}

metricsRouter.get('/', metricsAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Refresh DB pool stats on every scrape — always current, no stale gauges
    await collectDbMetrics();
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  } catch (err) {
    next(err);
  }
});

// Prometheus scrape config example (see README):
//   - job_name: vimad-api
//     scrape_interval: 15s
//     metrics_path: /metrics
//     static_configs: [{ targets: ['api:3001'] }]
