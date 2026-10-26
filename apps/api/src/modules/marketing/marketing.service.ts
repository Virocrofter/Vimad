import { Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import {
  createCampaignSchema,
  updateCampaignSchema,
  createWorkflowSchema,
  updateWorkflowSchema,
  createTemplateSchema,
  updateTemplateSchema,
  createSegmentSchema,
} from './marketing.validation.js';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

type Range = { from?: Date; to?: Date };

const dateFilter = (r: Range) =>
  r.from || r.to
    ? { createdAt: { ...(r.from ? { gte: r.from } : {}), ...(r.to ? { lte: r.to } : {}) } }
    : {};

const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);

// ─── Analytics ────────────────────────────────────────────────────

export async function getOverview(tenantId: string, range: Range) {
  const evWhere = { tenantId, ...dateFilter(range) };
  const campWhere = { tenantId, ...dateFilter(range) };

  const [
    typeCounts,
    campaigns,
    devices,
    convBySegment,
    totalBySegment,
    spendAgg,
    segments,
    byCampaignType,
  ] = await Promise.all([
    prisma.marketingEvent.groupBy({ by: ['type'], where: evWhere, _count: { _all: true } }),
    prisma.marketingCampaign.findMany({ where: campWhere, orderBy: { createdAt: 'desc' } }),
    prisma.marketingEvent.groupBy({ by: ['device'], where: evWhere, _count: { _all: true } }),
    prisma.marketingEvent.groupBy({
      by: ['segmentId'],
      where: { ...evWhere, type: 'conversion', segmentId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { segmentId: 'desc' } },
      take: 5,
    }),
    prisma.marketingEvent.groupBy({
      by: ['segmentId'],
      where: { ...evWhere, segmentId: { not: null } },
      _count: { _all: true },
    }),
    prisma.marketingCampaign.aggregate({
      where: campWhere,
      _sum: { spend: true, revenue: true, budget: true },
    }),
    prisma.marketingSegment.findMany({ where: { tenantId } }),
    prisma.marketingEvent.groupBy({
      by: ['campaignId', 'type'],
      where: evWhere,
      _count: { _all: true },
    }),
  ]);

  const countOf = (t: string) => typeCounts.find((c) => c.type === t)?._count._all ?? 0;
  const impressions = countOf('impression');
  const clicks = countOf('click');
  const conversions = countOf('conversion');

  // pivot per-campaign event counts
  const campMap = new Map<string, Record<string, number>>();
  for (const row of byCampaignType) {
    const m = campMap.get(row.campaignId) ?? {};
    m[row.type] = row._count._all;
    campMap.set(row.campaignId, m);
  }

  const campaignPerformance = campaigns.map((c) => {
    const ev = campMap.get(c.id) ?? {};
    const imp = ev['impression'] ?? 0;
    const clk = ev['click'] ?? 0;
    const conv = ev['conversion'] ?? 0;
    return {
      id: c.id,
      name: c.name,
      channel: c.channel,
      status: c.status,
      segmentId: c.segmentId,
      impressions: imp,
      clicks: clk,
      conversions: conv,
      ctr: +pct(clk, imp).toFixed(2),
      cvr: +pct(conv, clk).toFixed(2),
      spend: c.spend,
      revenue: c.revenue,
      roi: c.spend > 0 ? +(((c.revenue - c.spend) / c.spend) * 100).toFixed(2) : 0,
    };
  });

  const totalEvents = devices.reduce((s, d) => s + d._count._all, 0);
  const deviceBreakdown = devices
    .map((d) => ({
      device: d.device,
      count: d._count._all,
      pct: +pct(d._count._all, totalEvents).toFixed(1),
    }))
    .sort((a, b) => b.count - a.count);

  const segName = new Map(segments.map((s) => [s.id, s.name]));
  const segTotal = new Map(totalBySegment.map((s) => [s.segmentId!, s._count._all]));
  const topSegments = convBySegment.map((s) => ({
    id: s.segmentId,
    name: segName.get(s.segmentId!) ?? 'Segment',
    conversions: s._count._all,
    events: segTotal.get(s.segmentId!) ?? 0,
    cvr: +pct(s._count._all, segTotal.get(s.segmentId!) ?? 0).toFixed(2),
  }));

  const channelAgg = new Map<string, { conversions: number; revenue: number; spend: number }>();
  for (const c of campaigns) {
    const a = channelAgg.get(c.channel) ?? { conversions: 0, revenue: 0, spend: 0 };
    const ev = campMap.get(c.id) ?? {};
    a.conversions += ev['conversion'] ?? 0;
    a.revenue += c.revenue;
    a.spend += c.spend;
    channelAgg.set(c.channel, a);
  }
  const channelBreakdown = [...channelAgg.entries()].map(([channel, v]) => ({
    channel,
    ...v,
    roi: v.spend > 0 ? +(((v.revenue - v.spend) / v.spend) * 100).toFixed(2) : 0,
  }));

  const spend = spendAgg._sum.spend ?? 0;
  const revenue = spendAgg._sum.revenue ?? 0;

  return {
    kpis: {
      campaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      impressions,
      clicks,
      conversions,
      ctr: +pct(clicks, impressions).toFixed(2),
      cvr: +pct(conversions, clicks).toFixed(2),
      spend,
      revenue,
      roi: spend > 0 ? +(((revenue - spend) / spend) * 100).toFixed(2) : 0,
      budget: spendAgg._sum.budget ?? 0,
    },
    campaignPerformance,
    deviceBreakdown,
    topSegments,
    channelBreakdown,
  };
}

// ─── Campaigns ────────────────────────────────────────────────────

export async function listCampaigns(tenantId: string) {
  const [campaigns, segments] = await Promise.all([
    prisma.marketingCampaign.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } }),
    prisma.marketingSegment.findMany({ where: { tenantId } }),
  ]);
  const segName = new Map(segments.map((s) => [s.id, s.name]));
  return campaigns.map((c) => ({
    ...c,
    segmentName: c.segmentId ? (segName.get(c.segmentId) ?? null) : null,
  }));
}

export async function createCampaign(tenantId: string, body: unknown) {
  const data = createCampaignSchema.parse(body);
  return prisma.marketingCampaign.create({
    data: {
      tenantId,
      name: data.name,
      channel: data.channel,
      status: data.status ?? 'draft',
      segmentId: data.segmentId ?? null,
      budget: data.budget ?? 0,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });
}

export async function updateCampaign(tenantId: string, id: string, body: unknown) {
  const data = updateCampaignSchema.parse(body);
  const existing = await prisma.marketingCampaign.findFirst({ where: { id, tenantId } });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Campaign not found');
  return prisma.marketingCampaign.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.channel !== undefined ? { channel: data.channel } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.segmentId !== undefined ? { segmentId: data.segmentId } : {}),
      ...(data.budget !== undefined ? { budget: data.budget } : {}),
      ...(data.startDate !== undefined
        ? { startDate: data.startDate ? new Date(data.startDate) : null }
        : {}),
      ...(data.endDate !== undefined
        ? { endDate: data.endDate ? new Date(data.endDate) : null }
        : {}),
    },
  });
}

export async function deleteCampaign(tenantId: string, id: string) {
  const existing = await prisma.marketingCampaign.findFirst({ where: { id, tenantId } });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Campaign not found');
  await prisma.marketingCampaign.delete({ where: { id } });
  return { deleted: true };
}

export async function campaignStats(tenantId: string, id: string) {
  const campaign = await prisma.marketingCampaign.findFirst({ where: { id, tenantId } });
  if (!campaign) throw new HttpError(404, 'NOT_FOUND', 'Campaign not found');
  const since = new Date(Date.now() - 30 * 86400_000);
  const events = await prisma.marketingEvent.findMany({
    where: { tenantId, campaignId: id, createdAt: { gte: since } },
    select: { type: true, createdAt: true },
  });
  const days: Record<string, { impression: number; click: number; conversion: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    days[d] = { impression: 0, click: 0, conversion: 0 };
  }
  for (const e of events) {
    const d = e.createdAt.toISOString().slice(0, 10);
    if (days[d] && e.type in days[d]) (days[d] as any)[e.type] += 1;
  }
  return {
    campaign,
    series: Object.entries(days).map(([date, v]) => ({ date, ...v })),
  };
}

// ─── Workflows (automation) ───────────────────────────────────────

export async function listWorkflows(tenantId: string) {
  return prisma.marketingWorkflow.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: { runs: { orderBy: { createdAt: 'desc' }, take: 5 } },
  });
}

export async function createWorkflow(tenantId: string, body: unknown) {
  const data = createWorkflowSchema.parse(body);
  return prisma.marketingWorkflow.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description ?? null,
      trigger: data.trigger,
      actions: data.actions as unknown as Prisma.InputJsonValue,
      active: data.active ?? false,
    },
  });
}

export async function updateWorkflow(tenantId: string, id: string, body: unknown) {
  const data = updateWorkflowSchema.parse(body);
  const existing = await prisma.marketingWorkflow.findFirst({ where: { id, tenantId } });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Workflow not found');
  return prisma.marketingWorkflow.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.trigger !== undefined ? { trigger: data.trigger } : {}),
      ...(data.actions !== undefined
        ? { actions: data.actions as unknown as Prisma.InputJsonValue }
        : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
    },
  });
}

export async function toggleWorkflow(tenantId: string, id: string) {
  const existing = await prisma.marketingWorkflow.findFirst({ where: { id, tenantId } });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Workflow not found');
  return prisma.marketingWorkflow.update({ where: { id }, data: { active: !existing.active } });
}

/**
 * Executes workflow actions. Provider calls (SendGrid / Twilio / WhatsApp / webhook)
 * are intentionally stubbed: wire your providers here. Every execution is recorded
 * as a MarketingWorkflowRun with a full action plan, visible in the UI run history.
 */
async function executeActions(actions: any[]): Promise<string> {
  const plan = actions.map((a) => a.type).join(', ');
  // TODO(provider): dispatch send_email via SendGrid, send_sms via Twilio, etc.
  return `${actions.length} action(s) dispatched: ${plan}`;
}

export async function runWorkflow(tenantId: string, id: string) {
  const wf = await prisma.marketingWorkflow.findFirst({ where: { id, tenantId } });
  if (!wf) throw new HttpError(404, 'NOT_FOUND', 'Workflow not found');
  const actions = wf.actions as any[];
  const detail = await executeActions(actions);
  const run = await prisma.marketingWorkflowRun.create({
    data: { tenantId, workflowId: id, status: 'success', detail },
  });
  await prisma.marketingWorkflow.update({
    where: { id },
    data: { lastRunAt: new Date(), runCount: { increment: 1 } },
  });
  return run;
}

export async function deleteWorkflow(tenantId: string, id: string) {
  const existing = await prisma.marketingWorkflow.findFirst({ where: { id, tenantId } });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Workflow not found');
  await prisma.marketingWorkflow.delete({ where: { id } });
  return { deleted: true };
}

// ─── Templates ────────────────────────────────────────────────────

export async function listTemplates(tenantId: string) {
  return prisma.marketingTemplate.findMany({
    where: { OR: [{ tenantId }, { tenantId: null }] },
    orderBy: [{ tenantId: 'asc' }, { usageCount: 'desc' }],
  });
}

export async function createTemplate(tenantId: string, body: unknown) {
  const data = createTemplateSchema.parse(body);
  return prisma.marketingTemplate.create({
    data: {
      tenantId,
      name: data.name,
      category: data.category,
      subject: data.subject ?? null,
      body: data.body,
      tags: data.tags ?? [],
    },
  });
}

export async function updateTemplate(tenantId: string, id: string, body: unknown) {
  const data = updateTemplateSchema.parse(body);
  const existing = await prisma.marketingTemplate.findFirst({
    where: { id, OR: [{ tenantId }, { tenantId: null }] },
  });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Template not found');
  if (existing.tenantId === null)
    throw new HttpError(
      403,
      'FORBIDDEN',
      'System templates cannot be edited — duplicate them instead'
    );
  return prisma.marketingTemplate.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.subject !== undefined ? { subject: data.subject } : {}),
      ...(data.body !== undefined ? { body: data.body } : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
    },
  });
}

export async function deleteTemplate(tenantId: string, id: string) {
  const existing = await prisma.marketingTemplate.findFirst({
    where: { id, OR: [{ tenantId }, { tenantId: null }] },
  });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Template not found');
  if (existing.tenantId === null)
    throw new HttpError(403, 'FORBIDDEN', 'System templates cannot be deleted');
  await prisma.marketingTemplate.delete({ where: { id } });
  return { deleted: true };
}

export async function duplicateTemplate(tenantId: string, id: string) {
  const existing = await prisma.marketingTemplate.findFirst({
    where: { id, OR: [{ tenantId }, { tenantId: null }] },
  });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Template not found');
  return prisma.marketingTemplate.create({
    data: {
      tenantId,
      name: `${existing.name} (copy)`,
      category: existing.category,
      subject: existing.subject,
      body: existing.body,
      tags: existing.tags,
    },
  });
}

const TEMPLATE_CHANNEL: Record<string, string> = {
  email: 'email',
  sms: 'sms',
  whatsapp: 'whatsapp',
  social: 'social',
};

export async function applyTemplate(tenantId: string, id: string) {
  const tpl = await prisma.marketingTemplate.findFirst({
    where: { id, OR: [{ tenantId }, { tenantId: null }] },
  });
  if (!tpl) throw new HttpError(404, 'NOT_FOUND', 'Template not found');
  const campaign = await prisma.marketingCampaign.create({
    data: {
      tenantId,
      name: `${tpl.name} — ${new Date().toISOString().slice(0, 10)}`,
      channel: TEMPLATE_CHANNEL[tpl.category] ?? 'email',
      status: 'draft',
    },
  });
  await prisma.marketingTemplate.update({ where: { id }, data: { usageCount: { increment: 1 } } });
  return campaign;
}

// ─── Segments ─────────────────────────────────────────────────────

export async function listSegments(tenantId: string) {
  return prisma.marketingSegment.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
}

export async function createSegment(tenantId: string, body: unknown) {
  const data = createSegmentSchema.parse(body);
  return prisma.marketingSegment.create({
    data: {
      tenantId,
      name: data.name,
      criteria: (data.criteria ?? {}) as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function refreshSegment(tenantId: string, id: string) {
  const seg = await prisma.marketingSegment.findFirst({ where: { id, tenantId } });
  if (!seg) throw new HttpError(404, 'NOT_FOUND', 'Segment not found');
  const c = (seg.criteria ?? {}) as { hasEmail?: boolean; hasPhone?: boolean };
  const guestCount = await prisma.guest.count({
    where: {
      tenantId,
      ...(c.hasEmail ? { email: { not: null } } : {}),
      ...(c.hasPhone ? { phone: { not: null } } : {}),
    },
  });
  return prisma.marketingSegment.update({ where: { id }, data: { guestCount } });
}

export async function deleteSegment(tenantId: string, id: string) {
  const existing = await prisma.marketingSegment.findFirst({ where: { id, tenantId } });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Segment not found');
  await prisma.marketingSegment.delete({ where: { id } });
  return { deleted: true };
}
