import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: 'demo-hotel' } });
  const res = await prisma.reservation.findFirstOrThrow({
    where: { tenantId: tenant.id, confirmationNumber: 'DEMO-4101' },
  });
  const folio = await prisma.folio.findFirstOrThrow({ where: { reservationId: res.id } });
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const existing = await prisma.folioItem.findFirst({
    where: {
      folioId: folio.id,
      type: 'room_charge',
      description: 'Room charge - gate TOMSA sample',
      postedAt: { gte: start },
    },
  });
  if (existing) {
    console.log('already-seeded');
    return;
  }
  const item = await prisma.folioItem.create({
    data: {
      folioId: folio.id,
      type: 'room_charge',
      description: 'Room charge - gate TOMSA sample',
      amount: 1000,
      quantity: 1,
    },
  });
  console.log('seeded-roomcharge:' + item.id);
}
main().finally(() => prisma.$disconnect());
