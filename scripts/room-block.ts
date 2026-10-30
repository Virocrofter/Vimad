import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const [mode, propertyId, roomTypeId, start, end] = process.argv.slice(2);
  if (mode === 'insert') {
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO room_blocks (id, "tenantId", "propertyId", "roomTypeId", type, status, reason, "startDate", "endDate", "createdAt", "updatedAt")
      SELECT ${id}, t.id, ${propertyId}, ${roomTypeId}, 'ooo', 'active', 'inventory gate', ${start}::date, ${end}::date, now(), now()
      FROM tenants t WHERE t.slug = 'demo-hotel'`;
    console.log(id);
  } else if (mode === 'cleanup') {
    const r = await prisma.$executeRaw`DELETE FROM room_blocks WHERE reason = 'inventory gate'`;
    console.log('cleaned ' + r + ' gate blocks');
  } else if (mode === 'delete') {
    await prisma.$executeRaw`DELETE FROM room_blocks WHERE id = ${process.argv[2]}`;
    console.log('deleted');
  }
}
main().finally(() => prisma.$disconnect());
