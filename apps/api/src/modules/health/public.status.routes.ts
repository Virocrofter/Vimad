// Public service-status feed — powers /status (marketing), /guest-portal/status
// and the in-app StatusBanner + /app/support/status. Unauthenticated, read-only.
// Optional ?tenantId= scopes incidents to that hotel (affectedTenantIds JSONB)
// and maintenance to that tenant's announcements; public pages omit it and get
// the platform-wide view.
import { Router } from 'express';
import { prisma } from '../../common/prisma.js';

export const publicStatusRouter = Router();

publicStatusRouter.get('/', async (req, res) => {
  try {
    const tenantId =
      typeof req.query.tenantId === 'string' && req.query.tenantId ? req.query.tenantId : null;

    const incidents = tenantId
      ? await prisma.$queryRawUnsafe<any[]>(
          `SELECT "id","severity","title","status","timeline","startedAt","resolvedAt"
           FROM "incidents"
           WHERE "startedAt" > now() - interval '14 days'
             AND ("affectedTenantIds" = '[]'::jsonb OR "affectedTenantIds" @> to_jsonb($1::text))
           ORDER BY "startedAt" DESC LIMIT 50`,
          tenantId
        )
      : await prisma.$queryRawUnsafe<any[]>(
          `SELECT "id","severity","title","status","timeline","startedAt","resolvedAt"
           FROM "incidents" WHERE "startedAt" > now() - interval '14 days'
           ORDER BY "startedAt" DESC LIMIT 50`
        );

    const probes = await prisma.$queryRawUnsafe<any[]>(
      `SELECT DISTINCT ON ("probe") "probe","status","detail","ranAt" FROM "health_checks"
       ORDER BY "probe", "ranAt" DESC`
    );
    const staleLoops = await prisma.$queryRawUnsafe<any[]>(
      `SELECT count(*)::int AS c FROM "scheduler_heartbeats" WHERE "ranAt" < now() - interval '1 hour'`
    );
    const maintenance = tenantId
      ? await prisma.$queryRawUnsafe<any[]>(
          `SELECT "title","body","publishAt" FROM "announcements"
           WHERE "status" = 'published' AND "publishAt" > now() AND ("tenantId" = $1 OR "tenantId" IS NULL)
           ORDER BY "publishAt" ASC LIMIT 5`,
          tenantId
        )
      : await prisma.$queryRawUnsafe<any[]>(
          `SELECT "title","body","publishAt" FROM "announcements"
           WHERE "status" = 'published' AND "publishAt" > now() ORDER BY "publishAt" ASC LIMIT 5`
        );

    const open = incidents.filter((i) => !['resolved', 'closed'].includes(i.status));
    const overall = open.some((i) => i.severity === 'critical')
      ? 'critical'
      : open.length > 0
        ? 'degraded'
        : 'operational';

    const probeMap = Object.fromEntries(probes.map((p) => [p.probe, p]));
    const svc = (key: string, name: string): any => {
      const p = probeMap[key];
      return {
        key,
        name,
        status: p
          ? p.status === 'pass'
            ? 'operational'
            : p.status === 'warn'
              ? 'degraded'
              : 'outage'
          : 'operational',
        detail: p?.detail ?? null,
        checkedAt: p?.ranAt ?? null,
      };
    };
    const services = [
      svc('booking-engine', 'Booking Engine'),
      svc('payments-webhook', 'Payment Processing'),
      svc('guest-portal', 'Guest Portal'),
      {
        key: 'scheduler',
        name: 'Scheduler & Automation',
        status: staleLoops[0].c > 0 ? 'degraded' : 'operational',
        detail:
          staleLoops[0].c > 0
            ? `${staleLoops[0].c} background loops behind schedule`
            : 'all background jobs on time',
        checkedAt: null,
      },
      {
        key: 'core',
        name: 'Core API & Platform',
        status: overall === 'operational' ? 'operational' : overall,
        detail: null,
        checkedAt: null,
      },
    ];

    res.json({
      data: {
        overall,
        scoped: !!tenantId,
        updatedAt: new Date().toISOString(),
        services,
        activeIncidents: open,
        recentIncidents: incidents
          .filter((i) => ['resolved', 'closed'].includes(i.status))
          .slice(0, 10),
        maintenance,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'status error' });
  }
});
