import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const slug = process.argv[2] ?? 'demo-hotel';
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug } });
  const property = await prisma.property.findFirstOrThrow({ where: { tenantId: tenant.id } });
  const r = await prisma.room.updateMany({
    where: { propertyId: property.id },
    data: {
      status: 'clean',
      serviceStatus: 'active',
      serviceReason: null,
      housekeepingStatus: 'clean',
    },
  });
  console.log('reset ' + r.count + ' rooms');
}
main().finally(() => prisma.$disconnect());
