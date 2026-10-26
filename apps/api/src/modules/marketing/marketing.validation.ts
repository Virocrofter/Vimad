import { z } from 'zod';

export const campaignChannel = z.enum(['email', 'sms', 'whatsapp', 'social', 'display']);
export const campaignStatus = z.enum(['draft', 'active', 'paused', 'completed']);

export const createCampaignSchema = z.object({
  name: z.string().min(2).max(120),
  channel: campaignChannel,
  status: campaignStatus.optional(),
  segmentId: z.string().optional().nullable(),
  budget: z.number().min(0).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const workflowTrigger = z.enum([
  'booking.created',
  'guest.checked_in',
  'guest.checked_out',
  'booking.no_show',
  'guest.birthday',
  'guest.idle_14d',
  'manual',
]);

export const workflowAction = z.object({
  type: z.enum(['send_email', 'send_sms', 'send_whatsapp', 'webhook', 'delay']),
  templateId: z.string().optional(),
  to: z.string().optional(),
  url: z.string().url().optional(),
  minutes: z.number().int().min(0).optional(),
  message: z.string().max(1000).optional(),
});

export const createWorkflowSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  trigger: workflowTrigger,
  actions: z.array(workflowAction).min(1).max(10),
  active: z.boolean().optional(),
});

export const updateWorkflowSchema = createWorkflowSchema.partial().extend({
  actions: z.array(workflowAction).min(1).max(10).optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.enum(['email', 'sms', 'whatsapp', 'social']),
  subject: z.string().max(200).optional().nullable(),
  body: z.string().min(1).max(5000),
  tags: z.array(z.string()).optional(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const createSegmentSchema = z.object({
  name: z.string().min(2).max(120),
  criteria: z
    .object({
      hasEmail: z.boolean().optional(),
      hasPhone: z.boolean().optional(),
    })
    .optional(),
});
