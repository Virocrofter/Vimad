/* apps/api/scripts/production/guest-dedupe-merge-repoint.ts
 * PRODUCTION PRE-FLIGHT for migration 20261031025000_guest_tenant_email_unique.
 * The migration adds CREATE UNIQUE INDEX "guests_tenantId_email_key". If any
 * live database still holds duplicate (tenantId, email) guest rows, that
 * statement fails with 23505 and the deploy wedges (P3009/P3018). Run this
 * script FIRST on any environment whose database predates the constraint.
 *
 * Method: merge-repoint, not delete. For each duplicate group the oldest row
 * (lowest ctid) is kept; EVERY foreign-key reference to the other rows is
 * re-pointed (discovered dynamically from pg_catalog, so no table can be
 * missed, including app-level references with no DB-level FK such as
 * chat_threads.guestId), then the extras are deleted. No child data is lost.
 *
 * Usage:
 *   npx tsx scripts/production/guest-dedupe-merge-repoint.ts --dry-run   # ledger only
 *   npx tsx scripts/production/guest-dedupe-merge-repoint.ts             # apply
 * Idempotent: a clean database reports "no duplicate groups" and exits 0.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

interface FkCol {
  tbl: string;
  col: string;
}

(async () => {
  const fks: FkCol[] = await prisma.$queryRaw`
    SELECT c.conrelid::regclass::text AS tbl, a.attname::text AS col
    FROM pg_constraint c
    JOIN LATERAL unnest(c.conkey) AS k(attnum) ON true
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
    WHERE c.contype = 'f' AND c.confrelid = 'public.guests'::regclass`;
  const manual: FkCol[] = [{ tbl: 'chat_threads', col: 'guestId' }]; // app-level ref, no DB FK
  const all = fks.concat(manual);
  console.log('FK columns discovered:', all.length, dryRun ? '(dry-run)' : '');

  if (dryRun) {
    const dups: any[] = await prisma.$queryRaw`
      SELECT "tenantId", email, count(*)::int AS n
      FROM guests WHERE email IS NOT NULL
      GROUP BY 1,2 HAVING count(*) > 1`;
    console.log('duplicate groups:', dups.length);
    for (const d of dups)
      console.log('  would merge', d.email, '(tenant', d.tenantId + ',', d.n, 'rows)');
    return;
  }

  await prisma.$transaction(async (tx: any) => {
    const groups: any[] = await tx.$queryRaw`
      SELECT "tenantId", email, array_agg(id ORDER BY ctid) AS ids
      FROM guests WHERE email IS NOT NULL
      GROUP BY 1,2 HAVING count(*) > 1`;
    console.log('duplicate groups:', groups.length);
    for (const g of groups) {
      const keeper = g.ids[0];
      for (const loser of g.ids.slice(1)) {
        let moved = 0;
        for (const fk of all) {
          moved += await tx.$executeRawUnsafe(
            'UPDATE "' + fk.tbl + '" SET "' + fk.col + '" = $1 WHERE "' + fk.col + '" = $2',
            keeper,
            loser
          );
        }
        await tx.$executeRaw`DELETE FROM guests WHERE id = ${loser}`;
        console.log('merged', g.email, '-> keeper', keeper, '| rows repointed:', moved);
      }
    }
  });

  const remaining: any[] = await prisma.$queryRaw`
    SELECT count(*)::int AS n FROM (
      SELECT 1 FROM guests WHERE email IS NOT NULL GROUP BY "tenantId", email HAVING count(*) > 1
    ) x`;
  if (remaining[0]?.n > 0) throw new Error('duplicates remain: ' + remaining[0].n);
  console.log('CLEAN — safe to apply migration 20261031025000.');
  await prisma.$disconnect();
})().catch((e) => {
  console.error('DEDUPE FAILED:', e.message);
  process.exit(1);
});
