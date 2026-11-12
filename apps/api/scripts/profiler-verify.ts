/* apps/api/scripts/profiler-verify.ts — gate hook: proves data flowed end-to-end */
import 'dotenv/config';
import { prisma } from '../src/common/prisma.js';
async function main() {
  const snaps = await prisma.profilerQuerySnapshot.count();
  const events = await prisma.profilerSlowQuery.count();
  const costs = await prisma.profilerTenantCost.count();
  console.log(`VERIFY snaphots=${snaps} events=${events} tenantCosts=${costs}`);
  if (snaps > 0 && events > 0 && costs > 0) console.log('VERIFY_OK');
  else console.log('VERIFY_EMPTY');
}
main().finally(() => prisma.$disconnect());
