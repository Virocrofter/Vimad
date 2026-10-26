/* apps/api/src/modules/ar/ar.routes.ts */
import { Router, type Request, type Response } from 'express';
import { z } from '../../common/zod.js';
import {
  authMiddleware,
  requirePermission,
  tenantScope,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import { arService } from './ar.service.js';

const tenantOf = (req: Request) => (req as AuthenticatedRequest).auth.tenantId;
const userOf = (req: Request) => (req as AuthenticatedRequest).auth.user.id;

export const arRouter = Router();
arRouter.use(authMiddleware, tenantScope);

// ─── Schemas ───

const accountCreateSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  taxNumber: z.string().optional(),
  billingContact: z.string().optional(),
  billingEmail: z.string().email().optional().or(z.literal('')),
  billingAddress: z.string().optional(),
  creditLimit: z.number().positive().optional(),
  paymentTermsDays: z.number().int().min(0).max(365).optional(),
  negotiatedRate: z.number().positive().optional(),
  notes: z.string().optional(),
});

const accountUpdateSchema = accountCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
  creditLimit: z.number().positive().nullable().optional(),
  negotiatedRate: z.number().positive().nullable().optional(),
});

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().optional(),
  folioId: z.string().optional(),
  reservationId: z.string().optional(),
  guestId: z.string().optional(),
});

const invoiceCreateSchema = z.object({
  corporateAccountId: z.string().min(1),
  propertyId: z.string().optional(),
  vatRate: z.number().min(0).max(100).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1),
});

const paymentCreateSchema = z.object({
  corporateAccountId: z.string().min(1),
  invoiceId: z.string().optional(),
  amount: z.number().positive(),
  method: z.enum(['bank_transfer', 'card', 'cash', 'other']).optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
  receivedAt: z.string().optional(),
});

const listQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.string().optional(),
  aging: z.string().optional(),
  accountId: z.string().optional(),
  invoiceId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  includeInactive: z.coerce.boolean().optional(),
});

const statementQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

// ─── Summary ───

arRouter.get('/summary', requirePermission('ar', 'read'), async (req: Request, res: Response) => {
  res.json(await arService.summary(tenantOf(req)));
});

// ─── Accounts ───

arRouter.get(
  '/accounts',
  requirePermission('ar', 'read'),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    res.json(await arService.listAccounts(tenantOf(req), req.validatedQuery as any));
  }
);

arRouter.post(
  '/accounts',
  requirePermission('ar', 'manage'),
  validateBody(accountCreateSchema),
  async (req: Request, res: Response) => {
    res.status(201).json(await arService.createAccount(tenantOf(req), req.validatedBody as any));
  }
);

arRouter.get(
  '/accounts/:id',
  requirePermission('ar', 'read'),
  async (req: Request, res: Response) => {
    res.json(await arService.getAccount(tenantOf(req), req.params.id as string));
  }
);

arRouter.put(
  '/accounts/:id',
  requirePermission('ar', 'manage'),
  validateBody(accountUpdateSchema),
  async (req: Request, res: Response) => {
    res.json(
      await arService.updateAccount(
        tenantOf(req),
        req.params.id as string,
        req.validatedBody as any
      )
    );
  }
);

arRouter.get(
  '/accounts/:id/statement',
  requirePermission('ar', 'read'),
  validateQuery(statementQuerySchema),
  async (req: Request, res: Response) => {
    const q = req.validatedQuery as any;
    res.json(await arService.statement(tenantOf(req), req.params.id as string, q.from, q.to));
  }
);

arRouter.get(
  '/accounts/:id/statement.csv',
  requirePermission('ar', 'read'),
  validateQuery(statementQuerySchema),
  async (req: Request, res: Response) => {
    const q = req.validatedQuery as any;
    const csv = await arService.statementCsv(tenantOf(req), req.params.id as string, q.from, q.to);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="statement-${req.params.id}.csv"`);
    res.send(csv);
  }
);

// ─── Invoices ───

arRouter.get(
  '/invoices',
  requirePermission('ar', 'read'),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    res.json(await arService.listInvoices(tenantOf(req), req.validatedQuery as any));
  }
);

arRouter.post(
  '/invoices',
  requirePermission('ar', 'manage'),
  validateBody(invoiceCreateSchema),
  async (req: Request, res: Response) => {
    res
      .status(201)
      .json(await arService.createInvoice(tenantOf(req), userOf(req), req.validatedBody as any));
  }
);

arRouter.get(
  '/invoices/:id',
  requirePermission('ar', 'read'),
  async (req: Request, res: Response) => {
    res.json(await arService.getInvoice(tenantOf(req), req.params.id as string));
  }
);

arRouter.post(
  '/invoices/:id/send',
  requirePermission('ar', 'manage'),
  async (req: Request, res: Response) => {
    res.json(await arService.sendInvoice(tenantOf(req), userOf(req), req.params.id as string));
  }
);

arRouter.post(
  '/invoices/:id/cancel',
  requirePermission('ar', 'manage'),
  validateBody(z.object({ reason: z.string().optional() })),
  async (req: Request, res: Response) => {
    const { reason } = req.validatedBody as { reason?: string };
    res.json(
      await arService.cancelInvoice(tenantOf(req), userOf(req), req.params.id as string, reason)
    );
  }
);

// ─── Payments ───

arRouter.get(
  '/payments',
  requirePermission('ar', 'read'),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    res.json(await arService.listPayments(tenantOf(req), req.validatedQuery as any));
  }
);

arRouter.post(
  '/payments',
  requirePermission('ar', 'manage'),
  validateBody(paymentCreateSchema),
  async (req: Request, res: Response) => {
    res
      .status(201)
      .json(await arService.recordPayment(tenantOf(req), userOf(req), req.validatedBody as any));
  }
);

arRouter.post(
  '/payments/:id/reverse',
  requirePermission('ar', 'manage'),
  validateBody(z.object({ reason: z.string().optional() })),
  async (req: Request, res: Response) => {
    const { reason } = req.validatedBody as { reason?: string };
    res.json(
      await arService.reversePayment(tenantOf(req), userOf(req), req.params.id as string, reason)
    );
  }
);
