import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: 'demo-hotel' } });
  const plan = await prisma.ratePlan.findFirstOrThrow({
    where: { tenantId: tenant.id, code: 'STD-Q-RACK' },
  });
  let guest = await prisma.guest.findFirst({
    where: { tenantId: tenant.id, email: 'netpricing@gate.demo' },
  });
  if (!guest)
    guest = await prisma.guest.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Net',
        lastName: 'Pricing',
        email: 'netpricing@gate.demo',
      },
    });
  const exists = await prisma.reservation.findFirst({
    where: { tenantId: tenant.id, confirmationNumber: 'GATE-NET-1' },
  });
  if (!exists) {
    const arrival = new Date();
    arrival.setDate(arrival.getDate() + 10);
    arrival.setHours(12, 0, 0, 0);
    const departure = new Date(arrival);
    departure.setDate(departure.getDate() + 2);
    await prisma.reservation.create({
      data: {
        tenantId: tenant.id,
        propertyId: plan.propertyId,
        guestId: guest.id,
        confirmationNumber: 'GATE-NET-1',
        status: 'confirmed',
        source: 'bookingcom',
        arrivalDate: arrival,
        departureDate: departure,
        nights: 2,
        adults: 2,
        totalAmount: 1000,
        balance: 1000,
        ratePlanId: plan.id,
      },
    });
  }
  console.log('seeded-netbooking');
}
main().finally(() => prisma.$disconnect());
