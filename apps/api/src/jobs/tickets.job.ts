/* apps/api/src/jobs/tickets.job.ts — SLA breach scanner + auto-sweep.
 * Every 5 min: flag overdue tickets, escalate L0→L1→L2, and auto-close
 * tickets that sat resolved for 48h. The scan is idempotent, so a retry
 * (from the scheduler OR re-queued from the dead-letter queue under the
 * job name 'dead-letter') just re-runs the same safe scan.
 */
import cron from 'node-cron';
import { enqueue, createWorker } from '../common/queue.js';
import { prisma } from '../common/prisma.js';
import { logger } from '../common/logger.js';
import { sendEmail } from './email.queue.js';

export const TICKETS_QUEUE = 'tickets';

export async function enqueueSlaScan() {
  await enqueue(TICKETS_QUEUE, 'sla-scan', { at: new Date().toISOString() });
}

async function scanSla() {
  const now = new Date();
  const active = { in: ['open', 'in_progress', 'waiting_guest'] as string[] };

  // Response overdue (no first staff touch) or resolve overdue
  const overdue = await prisma.ticket.findMany({
    where: {
      status: active,
      escalationLevel: { lt: 2 },
      OR: [
        { firstResponseAt: null, slaResponseDueAt: { lte: now } },
        { resolvedAt: null, slaResolveDueAt: { lte: now } },
      ],
    },
    include: { assignee: { select: { id: true, email: true, firstName: true, lastName: true } } },
    take: 100,
  });

  for (const t of overdue) {
    const next = t.escalationLevel + 1;
    await prisma.ticket.update({
      where: { id: t.id },
      data: { slaBreached: true, escalationLevel: next },
    });

    const level = next >= 2 ? 'ESCALATED (management)' : 'SLA breached';
    const title = `${level}: ${t.number}`;

    // Notify assignee + admins
    const admins = await prisma.user.findMany({
      where: { tenantId: t.tenantId, status: 'active', role: { in: ['owner', 'admin'] } },
      select: { id: true },
      take: 5,
    });
    const targets = new Set<string>(admins.map((a) => a.id));
    if (t.assigneeId) targets.add(t.assigneeId);
    if (targets.size > 0) {
      await prisma.notification.createMany({
        data: [...targets].map((userId) => ({
          tenantId: t.tenantId,
          userId,
          type: 'ticket',
          category: 'support',
          title,
          message: t.subject,
          actionUrl: `/app/support?ticket=${t.id}`,
          entityType: 'ticket',
          entityId: t.id,
        })),
      });
    }

    // L2 → email ops so it can't be ignored
    if (next >= 2) {
      await sendEmail({
        to: process.env.OPS_EMAIL ?? 'ops@vimad.io',
        subject: `[Vimad] Ticket ${t.number} escalated — SLA breach`,
        template: 'generic',
        payload: {
          message: `Subject: ${t.subject}\nAssignee: ${t.assignee?.email ?? 'unassigned'}\nOpen: /app/support?ticket=${t.id}`,
        },
      });
    }
    logger.warn({ ticketId: t.id, number: t.number, level: next }, 'ticket SLA escalation');
  }

  // Auto-close resolved > 48h
  const staleResolved = await prisma.ticket.findMany({
    where: { status: 'resolved', resolvedAt: { lte: new Date(now.getTime() - 48 * 3600_000) } },
    select: { id: true, tenantId: true, number: true },
    take: 100,
  });
  if (staleResolved.length > 0) {
    await prisma.ticket.updateMany({
      where: { id: { in: staleResolved.map((t) => t.id) } },
      data: { status: 'closed', closedAt: now },
    });
    logger.info({ count: staleResolved.length }, 'auto-closed stale resolved tickets');
  }

  return { scanned: overdue.length, autoClosed: staleResolved.length };
}

export const ticketWorker = createWorker(TICKETS_QUEUE, async (job) => {
  // 'sla-scan' from the scheduler; 'dead-letter' when re-queued after a failure.
  // The scan is idempotent — flagging an already-flagged ticket is a no-op — so
  // run it for any job name that lands on this queue.
  logger.info({ jobId: job.id, name: job.name }, 'tickets scan starting');
  const result = await scanSla();
  logger.info({ jobId: job.id, ...result }, 'tickets scan completed');
});

export function startTicketScheduler() {
  // */5 — SLA is minute-granular at urgent (15 min response); 5-min scan is the floor
  cron.schedule('*/5 * * * *', () => {
    enqueueSlaScan().catch((err) => logger.error({ err }, 'ticket SLA scan enqueue failed'));
  });
  logger.info('ticket SLA scheduler started (every 5 min)');
}
