import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: 'demo-hotel' } });
  const r = await prisma.reservation.findFirst({
    where: { tenantId: tenant.id, confirmationNumber: 'DEMO-4202' },
  });
  if (!r) {
    console.log('not-found');
    return;
  }
  await prisma.reservation.update({
    where: { id: r.id },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy: 'gate-seed',
      cancelReason: 'gate: cancellation lead-time sample',
    },
  });
  console.log('seeded-cancellation');
}
main().finally(() => prisma.$disconnect());
