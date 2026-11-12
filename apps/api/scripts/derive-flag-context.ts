// Derives admin email + demo tenant id for the gate script.
import { prisma } from '../src/common/prisma';
(async () => {
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT u.email FROM users u JOIN tenants t ON t.id = u."tenantId"
     WHERE t.slug = 'vimad-internal' ORDER BY u."createdAt" ASC LIMIT 1`
  )) as any[];
  const demo = (await prisma.$queryRawUnsafe(
    `SELECT id FROM tenants WHERE slug = 'demo-hotel' LIMIT 1`
  )) as any[];
  console.log((rows[0]?.email || '').trim());
  console.log((demo[0]?.id || '').trim());
  await prisma.$disconnect();
})().catch(() => {
  console.log('');
  console.log('');
  process.exit(0);
});
