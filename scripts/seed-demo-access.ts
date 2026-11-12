import * as svc from '../apps/api/src/modules/admin/admin.demo-access.service';
import { prisma } from '../apps/api/src/common/prisma';

const approveIfPending = async (id: string, opts: { days: number; grantedBy: string }) => {
  const cur = await prisma.demoSession.findUnique({ where: { id } });
  if (!cur) throw new Error('session missing');
  if (cur.status !== 'pending') return { session: cur } as any;
  return svc.approveSession(id, opts);
};

async function main() {
  const mk = (email: string, extra: object) =>
    svc.requestDemo({ email, ...extra }).then((r: any) => r.session);
  await mk('naledi@proteahotel.co.za', {
    name: 'Naledi K',
    company: 'Protea Stay',
    hotelName: 'Protea Stay Umhlanga',
    roomCount: 42,
    currentPms: 'Cloudbeds',
    preferredSlot: 'Tue 10:00',
    phone: '+27 82 000 1111',
  });
  await mk('manager@drakensberglodge.co.za', {
    name: 'Sipho M',
    company: 'Drakensberg Lodge',
    hotelName: 'Drakensberg Mountain Lodge',
    roomCount: 18,
    currentPms: 'None / Manual',
    preferredSlot: 'Wed 14:00',
  });
  await mk('ops@sunsetguesthouse.co.za', {
    name: 'Ayesha P',
    company: 'Sunset Guesthouse',
    roomCount: 9,
    currentPms: 'eZee FrontDesk',
    preferredSlot: 'Fri 09:30',
  });

  const a = await svc.requestDemo({
    email: 'bookings@tablebayhotel.co.za',
    company: 'Table Bay Hotel',
    hotelName: 'Table Bay Hotel',
    roomCount: 120,
    currentPms: 'Oracle OPERA 5',
  });
  const ap = await approveIfPending(a.session.id, { days: 14, grantedBy: 'populate' });
  const inv = await svc.inviteSession(a.session.id, 'populate');
  await svc.enterDemo(inv.token);
  const tid = ap.session.tenantId!;
  for (let i = 0; i < 6; i++) {
    await prisma.auditLog.create({
      data: {
        tenantId: tid,
        action: 'view',
        entity: 'reservation',
        createdAt: new Date(Date.now() - i * 2 * 3600_000),
      },
    });
  }

  const b = await svc.requestDemo({
    email: 'frontdesk@krugerparkinn.co.za',
    company: 'Kruger Park Inn',
    hotelName: 'Kruger Park Inn',
    roomCount: 64,
    currentPms: 'Protel',
  });
  await approveIfPending(b.session.id, { days: 10, grantedBy: 'populate' });

  const c = await svc.requestDemo({
    email: 'gm@gardenrouteinn.co.za',
    company: 'Garden Route Inn',
    hotelName: 'Garden Route Inn',
    roomCount: 30,
    currentPms: 'Mews',
  });
  await approveIfPending(c.session.id, { days: 3, grantedBy: 'populate' });

  const d = await svc.requestDemo({
    email: 'owner@bloubergchalets.co.za',
    company: 'Blouberg Chalets',
    hotelName: 'Blouberg Beach Chalets',
    roomCount: 12,
    currentPms: 'None / Manual',
  });
  const dp = await approveIfPending(d.session.id, { days: 1, grantedBy: 'populate' });
  await prisma.demoSession.update({
    where: { id: dp.session.id },
    data: { expiresAt: new Date(Date.now() - 20 * 86400_000) },
  });
  await svc.sweepExpired();

  const e = await svc.requestDemo({
    email: 'info@highveldresort.co.za',
    company: 'Highveld Resort',
    hotelName: 'Highveld Resort',
    roomCount: 80,
    currentPms: 'Hilton OnQ',
  });
  const ep = await approveIfPending(e.session.id, { days: 7, grantedBy: 'populate' });
  await svc.revokeSession(ep.session.id, { reason: 'Duplicate request', by: 'populate' });

  console.log('POPULATED. Stats:', JSON.stringify(await svc.getStats()));
}
main()
  .then(() => {
    console.log('SEED DONE');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
