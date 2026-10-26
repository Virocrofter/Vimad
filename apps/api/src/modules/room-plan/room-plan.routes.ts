import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { env } from '../../common/env.js';
import { AppError } from '../../common/errors.js';
import { getRoomPlan, createRoomBlock, returnRoomBlock } from './room-plan.service.js';

interface TokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

function requireTenant(req: { headers: Record<string, unknown> }): TokenPayload {
  const header = String(req.headers.authorization ?? '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch {
    throw new AppError(401, 'Invalid or expired token', 'UNAUTHORIZED');
  }
}

function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const detail = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new AppError(400, `Validation failed — ${detail}`, 'VALIDATION_ERROR');
  }
  return result.data;
}

const router = Router();

const planQuerySchema = z.object({
  propertyId: z.string().min(1),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

router.get('/', async (req, res, next) => {
  try {
    const auth = requireTenant(req);
    const { propertyId, from, to } = parse(planQuerySchema, req.query);
    const data = await getRoomPlan({ tenantId: auth.tenantId, propertyId, from, to });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

const blockCreateSchema = z.object({
  propertyId: z.string().min(1),
  roomId: z.string().optional(),
  roomTypeId: z.string().optional(),
  type: z.enum(['ooo', 'oos', 'hold']),
  reason: z.string().max(500).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

router.post('/blocks', async (req, res, next) => {
  try {
    const auth = requireTenant(req);
    const body = parse(blockCreateSchema, req.body);
    const result = await createRoomBlock({
      tenantId: auth.tenantId,
      propertyId: body.propertyId,
      roomId: body.roomId,
      roomTypeId: body.roomTypeId,
      type: body.type,
      reason: body.reason,
      startDate: body.startDate,
      endDate: body.endDate,
      createdById: auth.userId,
    });
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/blocks/:id/return', async (req, res, next) => {
  try {
    const auth = requireTenant(req);
    const result = await returnRoomBlock(auth.tenantId, req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
