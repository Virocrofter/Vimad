import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: 'demo-hotel' } });
  const property = await prisma.property.findFirstOrThrow({
    where: { tenantId: tenant.id, code: 'DEMO-01' },
  });
  const existing = await prisma.channelConnection.findFirst({
    where: { tenantId: tenant.id, propertyId: property.id, provider: 'bookingcom' },
  });
  if (existing) {
    await prisma.channelConnection.update({
      where: { id: existing.id },
      data: { apiSecret: 'b1-test-secret', status: 'active', hotelId: 'DEMO-HOTEL-B1' },
    });
    console.log('channel:' + existing.id);
    return;
  }
  const c = await prisma.channelConnection.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      provider: 'bookingcom',
      hotelId: 'DEMO-HOTEL-B1',
      apiKey: 'b1-key',
      apiSecret: 'b1-test-secret',
      status: 'active',
      lastSyncStatus: 'success',
      connectedAt: new Date(),
    },
  });
  console.log('channel:' + c.id);
}
main().finally(() => prisma.$disconnect());
