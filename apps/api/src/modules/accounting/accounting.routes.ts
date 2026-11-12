/* C6-prime remainder: accounting export config + Xero/Pastel CSV formatters.
 * Config maps journal account prefixes (REV:<type> / RCV:<channel>) to the
 * property's real ledger codes; unmapped accounts pass through raw.
 * Export reuses the proven accounting_journal runner (persisted as a
 * TenantReportRun — audit trail by design) and formats its rows.
 * NOTE (tracker): Pastel import layouts vary by version/client — this emits
 * the common transactions layout; conform at client onboarding. */
import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../common/prisma.js';
import { authMiddleware, tenantScope, requirePermission } from '../auth/auth.middleware.js';
import { runReport } from '../reports/reports.service.js';

export const accountingRouter = Router();
accountingRouter.use(authMiddleware, tenantScope);

function esc(v: unknown): string {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function mapAccount(prefixAccount: string, mappings: Record<string, string>): string {
  return (
    mappings[prefixAccount] ??
    mappings[prefixAccount.split(':').slice(0, 2).join(':')] ??
    prefixAccount
  );
}

export function toXeroCsv(
  rows: Record<string, unknown>[],
  mappings: Record<string, string>
): string {
  const lines = ['JournalDate,JournalNumber,Reference,AccountCode,Description,Debits,Credits'];
  let n = 0;
  for (const r of rows) {
    n++;
    lines.push(
      [
        esc(r.date),
        'VMD-' + n,
        esc(r.reference),
        esc(mapAccount(String(r.account), mappings)),
        esc(r.description),
        Number(r.debit).toFixed(2),
        Number(r.credit).toFixed(2),
      ].join(',')
    );
  }
  return lines.join('\n');
}

export function toPastelCsv(
  rows: Record<string, unknown>[],
  mappings: Record<string, string>
): string {
  const lines = ['Date,Account,Reference,Description,Debit,Credit,VatIndicator'];
  for (const r of rows) {
    const acct = mapAccount(String(r.account), mappings);
    const vat = String(r.account).startsWith('REV:') ? 'Y' : 'N';
    lines.push(
      [
        esc(r.date),
        esc(acct),
        esc(r.reference),
        esc(r.description),
        Number(r.debit).toFixed(2),
        Number(r.credit).toFixed(2),
        vat,
      ].join(',')
    );
  }
  return lines.join('\n');
}

accountingRouter.get(
  '/config',
  requirePermission('report', 'export'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const propertyId = String((req.query as any).propertyId ?? '');
      if (!propertyId)
        return res
          .status(400)
          .json({ error: { code: 'VALIDATION_ERROR', message: 'propertyId is required' } });
      const row = await prisma.accountingConfig.findUnique({ where: { propertyId } });
      return res.json({ data: row ?? { propertyId, mappings: {} } });
    } catch (err) {
      return next(err);
    }
  }
);

accountingRouter.put(
  '/config',
  requirePermission('report', 'export'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId, mappings } = (req.body ?? {}) as any;
      if (
        !propertyId ||
        typeof mappings !== 'object' ||
        mappings === null ||
        Array.isArray(mappings)
      ) {
        return res
          .status(400)
          .json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'propertyId and a mappings object are required',
            },
          });
      }
      const row = await prisma.accountingConfig.upsert({
        where: { propertyId: String(propertyId) },
        update: { mappings, updatedById: (req as any).auth?.user?.id ?? null },
        create: {
          propertyId: String(propertyId),
          mappings,
          updatedById: (req as any).auth?.user?.id ?? null,
        },
      });
      return res.json({ data: row });
    } catch (err) {
      return next(err);
    }
  }
);

accountingRouter.post(
  '/export',
  requirePermission('report', 'export'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId, format, dateFrom, dateTo } = (req.body ?? {}) as any;
      if (!propertyId || !['xero', 'pastel'].includes(format) || !dateFrom || !dateTo) {
        return res
          .status(400)
          .json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'propertyId, format (xero|pastel), dateFrom, dateTo are required',
            },
          });
      }
      const tenantId = (req as any).tenantId ?? (req as any).auth?.user?.tenantId;
      const run = await runReport(
        prisma,
        tenantId,
        (req as any).auth?.user?.id,
        'accounting_journal',
        {
          dateFrom: String(dateFrom),
          dateTo: String(dateTo),
          propertyId: String(propertyId),
        }
      );
      if (run.status !== 'COMPLETED') {
        return res
          .status(422)
          .json({ error: { code: 'REPORT_FAILED', message: run.error ?? 'journal run failed' } });
      }
      const cfg = await prisma.accountingConfig.findUnique({
        where: { propertyId: String(propertyId) },
      });
      const mappings = (cfg?.mappings as Record<string, string>) ?? {};
      const rows = ((run.result as any)?.rows ?? []) as Record<string, unknown>[];
      const csv = format === 'xero' ? toXeroCsv(rows, mappings) : toPastelCsv(rows, mappings);
      return res.json({ data: { csv, rowCount: rows.length, runId: run.id } });
    } catch (err) {
      return next(err);
    }
  }
);
