import { z } from 'zod';

export const updateGuestCrmSchema = z.object({
  tags: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  vipStatus: z.string().trim().max(20).optional(),
});

export const createNoteSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  pinned: z.boolean().optional(),
});

export const updateNoteSchema = z.object({
  body: z.string().trim().min(1).max(5000).optional(),
  pinned: z.boolean().optional(),
});

export const segmentRuleSchema = z
  .object({
    minStays: z.number().int().min(0).optional(),
    minSpend: z.number().min(0).optional(),
    maxRecencyDays: z.number().int().min(1).optional(),
    vipOnly: z.boolean().optional(),
    tagAny: z.array(z.string()).optional(),
    tagAll: z.array(z.string()).optional(),
  })
  .refine((r) => Object.values(r).some((v) => v !== undefined), {
    message: 'rule must contain at least one condition',
  });
export type SegmentRule = z.infer<typeof segmentRuleSchema>;

export const createSegmentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(500).optional(),
  rule: segmentRuleSchema,
});

export const updateSegmentSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  rule: segmentRuleSchema.optional(),
  isActive: z.boolean().optional(),
});

export const createFollowUpSchema = z.object({
  guestId: z.string().min(1),
  assigneeId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  dueAt: z.coerce.date().optional(),
});

export const updateFollowUpSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  assigneeId: z.string().min(1).optional(),
  dueAt: z.coerce.date().nullable().optional(),
  done: z.boolean().optional(),
});

export const createCorporateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  contactName: z.string().max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(40).optional(),
  negotiatedRate: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
  scClientId: z.string().optional(),
});

export const updateCorporateSchema = createCorporateSchema.partial().extend({
  isActive: z.boolean().optional(),
  scClientId: z.string().nullable().optional(),
});

export const emailSegmentSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10000),
});
