import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const tenantSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
});

export type TenantInput = z.infer<typeof tenantSchema>;

export const userSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['owner', 'admin', 'manager', 'staff']),
  tenantId: z.string(),
});

export type UserInput = z.infer<typeof userSchema>;
