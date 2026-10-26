/**
 * seed-marketing.ts — demo data for the marketing module.
 * Run: npx tsx scripts/seed-marketing.ts   (from apps/api)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEVICES = ['mobile', 'desktop', 'tablet', 'other'];
const WEIGHTS = [0.62, 0.27, 0.08, 0.03];

function pickDevice(): string {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < DEVICES.length; i++) {
    acc += WEIGHTS[i];
    if (r <= acc) return DEVICES[i];
  }
  return 'mobile';
}

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'demo-hotel' } });
  if (!tenant) {
    console.error('Tenant demo-hotel not found. Run the main seed first.');
    process.exit(1);
  }
  const tenantId = tenant.id;

  // idempotent: wipe module tables for this tenant
  await prisma.marketingEvent.deleteMany({ where: { tenantId } });
  await prisma.marketingCampaign.deleteMany({ where: { tenantId } });
  await prisma.marketingWorkflowRun.deleteMany({ where: { tenantId } });
  await prisma.marketingWorkflow.deleteMany({ where: { tenantId } });
  await prisma.marketingTemplate.deleteMany({ where: { tenantId } });
  await prisma.marketingSegment.deleteMany({ where: { tenantId } });

  // segments
  const vip = await prisma.marketingSegment.create({
    data: { tenantId, name: 'VIP repeat guests', criteria: { hasEmail: true, hasPhone: true } },
  });
  const emailOnly = await prisma.marketingSegment.create({
    data: { tenantId, name: 'Email subscribers', criteria: { hasEmail: true } },
  });
  const sms = await prisma.marketingSegment.create({
    data: { tenantId, name: 'SMS reachable', criteria: { hasPhone: true } },
  });
  const segments = [vip, emailOnly, sms];

  // templates (system: tenantId null)
  const tplData = [
    {
      name: 'Welcome email',
      category: 'email',
      subject: 'Welcome to {{hotelName}}',
      body: 'Dear {{guestName}},\n\nThank you for choosing {{hotelName}}. We look forward to hosting you.\n\nWarm regards,\nThe {{hotelName}} team',
      tags: ['onboarding'],
    },
    {
      name: 'Win-back offer',
      category: 'email',
      subject: 'We miss you, {{guestName}}',
      body: 'It has been a while since your last stay. Enjoy 15% off your next booking with code WELCOME15.',
      tags: ['winback', 'offer'],
    },
    {
      name: 'Booking confirmation SMS',
      category: 'sms',
      body: 'Hi {{guestName}}, your booking {{bookingRef}} at {{hotelName}} is confirmed for {{checkIn}}.',
      tags: ['transactional'],
    },
    {
      name: 'Pre-arrival WhatsApp',
      category: 'whatsapp',
      body: 'Hello {{guestName}}! Your stay at {{hotelName}} starts tomorrow. Check-in from 14:00. Reply HELP for assistance.',
      tags: ['pre-arrival'],
    },
    {
      name: 'Summer promo',
      category: 'social',
      body: 'Summer in {{city}} starts at {{hotelName}}. Book direct for the best rate. #SummerEscape',
      tags: ['promo', 'social'],
    },
  ];
  for (const t of tplData) {
    await prisma.marketingTemplate.create({ data: { ...t, tenantId: null } });
  }

  // campaigns + events (30 days of history)
  const channels = ['email', 'sms', 'whatsapp', 'social'];
  for (let i = 0; i < 6; i++) {
    const channel = channels[i % channels.length];
    const seg = segments[i % segments.length];
    const budget = 2000 + i * 750;
    const spend = budget * (0.55 + Math.random() * 0.45);
    const revenue = spend * (0.8 + Math.random() * 1.6);
    const campaign = await prisma.marketingCampaign.create({
      data: {
        tenantId,
        name: `${channel[0].toUpperCase() + channel.slice(1)} campaign ${i + 1}`,
        channel,
        status: i < 3 ? 'active' : i === 3 ? 'paused' : 'completed',
        segmentId: seg.id,
        budget,
        spend: +spend.toFixed(2),
        revenue: +revenue.toFixed(2),
        startDate: new Date(Date.now() - (30 - i * 4) * 86400_000),
      },
    });

    const impressions = 400 + Math.floor(Math.random() * 900);
    const events: {
      campaignId: string;
      tenantId: string;
      type: string;
      device: string;
      segmentId: string;
      createdAt: Date;
    }[] = [];
    for (let j = 0; j < impressions; j++) {
      events.push({
        campaignId: campaign.id,
        tenantId,
        type: 'impression',
        device: pickDevice(),
        segmentId: seg.id,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400_000),
      });
    }
    const clicks = Math.floor(impressions * (0.08 + Math.random() * 0.12));
    for (let j = 0; j < clicks; j++) {
      events.push({
        campaignId: campaign.id,
        tenantId,
        type: 'click',
        device: pickDevice(),
        segmentId: seg.id,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400_000),
      });
    }
    const conversions = Math.floor(clicks * (0.05 + Math.random() * 0.15));
    for (let j = 0; j < conversions; j++) {
      events.push({
        campaignId: campaign.id,
        tenantId,
        type: 'conversion',
        device: pickDevice(),
        segmentId: seg.id,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400_000),
      });
    }
    await prisma.marketingEvent.createMany({ data: events });
  }

  // workflows
  const birthdayTpl = await prisma.marketingTemplate.findFirst({
    where: { name: 'Win-back offer', tenantId: null },
  });
  const wf1 = await prisma.marketingWorkflow.create({
    data: {
      tenantId,
      name: 'Birthday surprise',
      description: 'Sends a birthday discount to guests 7 days before their birthday.',
      trigger: 'guest.birthday',
      active: true,
      actions: [
        { type: 'send_email', templateId: birthdayTpl?.id },
        { type: 'delay', minutes: 1440 },
      ],
    },
  });
  await prisma.marketingWorkflow.create({
    data: {
      tenantId,
      name: 'Post-stay thank you',
      description: 'Thank-you message 24h after checkout with review link.',
      trigger: 'guest.checked_out',
      active: false,
      actions: [{ type: 'send_whatsapp', message: 'Thank you for staying with us!' }],
    },
  });
  await prisma.marketingWorkflowRun.create({
    data: {
      tenantId,
      workflowId: wf1.id,
      status: 'success',
      detail: '2 action(s) dispatched: send_email, delay',
    },
  });

  // refresh segment counts against real guests
  for (const s of segments) {
    const c = s.criteria as { hasEmail?: boolean; hasPhone?: boolean };
    const guestCount = await prisma.guest.count({
      where: {
        tenantId,
        ...(c.hasEmail ? { email: { not: null } } : {}),
        ...(c.hasPhone ? { phone: { not: null } } : {}),
      },
    });
    await prisma.marketingSegment.update({ where: { id: s.id }, data: { guestCount } });
  }

  console.log('Marketing seed complete: 6 campaigns, 5 templates, 3 workflows, 3 segments.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
