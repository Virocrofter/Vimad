// Production dead-man's switch for every cron loop in the system.
// installHeartbeatPatch() monkey-patches node-cron.schedule at boot so EVERY
// scheduled loop checks in, named by its verified start order in index.ts.
// Unknown loops are still caught and labelled by expression (self-learning).
import cron from 'node-cron';
import { logger } from './logger.js';
import { prisma } from './prisma.js';

export interface LoopDef {
  label: string;
  expectedMs: number; // stale threshold = 2x expected
}

// Order verified against apps/api/src/index.ts scheduler starts (2026-11-04).
export const LOOPS: LoopDef[] = [
  { label: 'night-audit', expectedMs: 120_000 },
  { label: 'payment-requests', expectedMs: 600_000 },
  { label: 'transactional-email', expectedMs: 3_600_000 },
  { label: 'task-rules', expectedMs: 120_000 },
  { label: 'concierge-generators', expectedMs: 1_800_000 },
  { label: 'wakeup-digest', expectedMs: 86_400_000 },
  { label: 'task-push', expectedMs: 120_000 },
  { label: 'flight-status', expectedMs: 600_000 },
  { label: 'hk-stagnant', expectedMs: 3_600_000 },
  { label: 'hk-overnight', expectedMs: 86_400_000 },
  { label: 'group-billing', expectedMs: 1_800_000 },
  { label: 'groups-cutoff', expectedMs: 3_600_000 },
  { label: 'inventory-cache', expectedMs: 86_400_000 },
  { label: 'overbooking-alerts', expectedMs: 21_600_000 },
  { label: 'meal-posting', expectedMs: 1_800_000 },
  { label: 'ticket-sla', expectedMs: 600_000 },
  { label: 'ar-dunning', expectedMs: 21_600_000 },
  { label: 'abandoned-deposits', expectedMs: 3_600_000 },
  { label: 'dlq-alerts', expectedMs: 3_600_000 },
  { label: 'scheduled-reports', expectedMs: 120_000 },
];

let scheduleCounter = 0;
let installed = false;

async function persistBeat(name: string, durationMs: number, error: string | null, items = 0) {
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "scheduler_heartbeats" ("name","ranAt","durationMs","itemsProcessed","error","createdAt")
       VALUES ($1, now(), $2, $3, $4, now())
       ON CONFLICT ("name") DO UPDATE SET "ranAt" = now(), "durationMs" = $2,
         "itemsProcessed" = $3, "error" = $4`,
      name,
      durationMs,
      items,
      error
    );
  } catch (err) {
    logger.warn({ err, name }, 'heartbeat persist failed');
  }
}

export function hbBeat(name: string, itemsProcessed = 0) {
  return persistBeat(name, 0, null, itemsProcessed);
}

export function installHeartbeatPatch() {
  if (installed) return;
  installed = true;
  const original = cron.schedule.bind(cron);
  (cron as any).schedule = (expression: string, fn: any, options?: any) => {
    const def = LOOPS[scheduleCounter];
    const name = def ? def.label : `cron:${expression}#${scheduleCounter + 1}`;
    scheduleCounter += 1;
    const wrapped = async (...args: any[]) => {
      const t0 = Date.now();
      try {
        const r = await fn(...args);
        await persistBeat(name, Date.now() - t0, null);
        return r;
      } catch (err: any) {
        await persistBeat(name, Date.now() - t0, String(err?.message || err));
        throw err;
      }
    };
    logger.info({ name, expression }, 'heartbeat armed for cron loop');
    return original(expression, wrapped, options);
  };
  logger.info('heartbeat patch installed: every cron loop will check in');
}
