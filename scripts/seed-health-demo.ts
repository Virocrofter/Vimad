// Populate System Health demo data: backfills heartbeat rows for every known
// loop + historical probe runs. Run: npx tsx scripts/seed-health-demo.ts
import { LOOPS } from '../apps/api/src/common/heartbeat.js';
import { prisma } from '../apps/api/src/common/prisma.js';

async function main() {
  for (const l of LOOPS) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "scheduler_heartbeats" ("name","ranAt","durationMs","itemsProcessed","error","createdAt")
       VALUES ($1, now() - make_interval(secs => (random() * $2)::int), 40 + (random()*400)::int, 0, NULL, now())
       ON CONFLICT ("name") DO UPDATE SET "ranAt" = EXCLUDED."ranAt"`,
      l.label,
      Math.max(30, Math.round(l.expectedMs / 1000))
    );
  }
  for (const p of ['booking-engine', 'guest-portal', 'payments-webhook']) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "health_checks" ("id","probe","status","latencyMs","detail","error","ranAt")
       VALUES (gen_random_uuid()::text, $1, 'pass', 12 + (random()*80)::int, 'seeded historical run', NULL,
               now() - make_interval(secs => (random()*3600)::int))`,
      p
    );
  }
  console.log('HEALTH SEED OK:', LOOPS.length, 'loops + 3 probes');
  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
