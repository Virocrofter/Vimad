import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const tenant = await prisma.tenant.findUnique({ where: { slug: 'demo-hotel' } });
if (!tenant) throw new Error('demo tenant missing');
const property = await prisma.property.findFirst({ where: { tenantId: tenant.id } });
if (!property) throw new Error('demo property missing');
const room = await prisma.room.findFirst({ where: { propertyId: property.id } });
if (!room) throw new Error('no rooms seeded for demo property');
const guest = await prisma.guest.upsert({
  where: { id: 'gp0-gate-guest' },
  update: {},
  create: { id: 'gp0-gate-guest', tenantId: tenant.id, firstName: 'Gate', lastName: 'Runner', email: 'gp0@example.com' },
});
const arrival = new Date(); arrival.setHours(12, 0, 0, 0);
const departure = new Date(arrival); departure.setDate(departure.getDate() + 2);
const res = await prisma.reservation.upsert({
  where: { confirmationNumber: process.env.CONF! },
  update: { status: 'confirmed', checkedInAt: null, cancelledAt: null },
  create: {
    tenantId: tenant.id,
    propertyId: property.id,
    guestId: guest.id,
    confirmationNumber: process.env.CONF!,
    status: 'confirmed',
    source: 'direct',
    arrivalDate: arrival,
    departureDate: departure,
    nights: 2,
    adults: 2,
    totalAmount: 500,
    balance: 0,
  },
});
await prisma.reservationStay.deleteMany({ where: { reservationId: res.id } });
await prisma.reservationStay.createMany({
  data: [0, 1].map((i) => {
    const d = new Date(arrival); d.setDate(d.getDate() + i);
    return { reservationId: res.id, roomId: room.id, date: d, rate: 250 };
  }),
});
console.log('SEEDED ' + process.env.CONF + ' room ' + room.number);
await prisma.$disconnect();
