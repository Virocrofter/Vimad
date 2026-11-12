// apps/api/src/jobs/contracts.renewal.job.ts
// [CONTRACTS] Daily renewal window scan (PDF §4: alert deal owner at
// 90/60/30 days; never silently expire). Self-starts on import (node-cron),
// consistent with the "workers start on import" pattern in index.ts.
import { randomUUID } from 'crypto';
import cron from 'node-cron';
import { prisma } from '../common/prisma.js';
import { logger } from '../common/logger.js';

const WINDOWS = [90, 60, 30];
const DAY_MS = 86400000;

async function raiseRenewalException(contract: any, windowDays: number, expires: boolean) {
  const key = 'contract-renewal:' + contract.id + ':' + (expires ? 'expired' : 'w' + windowDays);
  const daysLeft = Math.max(0, Math.ceil((contract.endDate.getTime() - Date.now()) / DAY_MS));
  await prisma.exception.upsert({
    where: { tenantId_dedupeKey: { tenantId: contract.tenantId, dedupeKey: key } },
    update: {},
    create: {
      id: randomUUID(),
      tenantId: contract.tenantId,
      type: 'contract_renewal',
      severity: expires ? 'high' : windowDays <= 30 ? 'high' : windowDays <= 60 ? 'medium' : 'low',
      title: expires
        ? `Contract expired — ${contract.tenant?.name ?? contract.legalEntity}`
        : `Contract renews in ${daysLeft} days — ${contract.tenant?.name ?? contract.legalEntity}`,
      detail: JSON.stringify({
        contractId: contract.id,
        legalEntity: contract.legalEntity,
        endDate: contract.endDate,
        daysLeft,
        autoRenew: contract.autoRenew,
        netFee: Number(contract.netFee),
        renewalNoticeDays: contract.renewalNoticeDays,
      }),
      recommendedAction: expires
        ? 'Contact the tenant to renew or offboard. Auto-renew is off or missed.'
        : contract.autoRenew
          ? 'Auto-renew is on — confirm terms still apply, else amend before renewal.'
          : 'Start the renewal conversation and record intent in the contract.',
      actionUrl: '/admin/billing/contracts',
      dedupeKey: key,
      slaDueAt: new Date(Date.now() + 7 * DAY_MS),
    },
  });
}

export async function scanContractRenewals() {
  const now = new Date();
  const contracts = await prisma.contract.findMany({
    where: { status: { in: ['active', 'renewed'] } },
    include: { tenant: { select: { id: true, name: true } } },
  });

  let touched = 0;
  for (const c of contracts) {
    const daysLeft = Math.ceil((c.endDate.getTime() - now.getTime()) / DAY_MS);

    if (daysLeft < 0) {
      await prisma.contract.update({ where: { id: c.id }, data: { status: 'expired' } });
      await prisma.contractEvent.create({
        data: {
          id: randomUUID(),
          contractId: c.id,
          type: 'expired',
          actor: 'system:renewal-scan',
          payload: { endDate: c.endDate.toISOString() },
        },
      });
      await raiseRenewalException(c, 0, true);
      touched++;
      continue;
    }

    const window = WINDOWS.find((w) => daysLeft <= w);
    if (window) {
      await raiseRenewalException(c, window, false);
      touched++;
    }
  }
  logger.info({ touched, total: contracts.length }, '[contracts] renewal scan complete');
  return { touched, total: contracts.length };
}

// Self-start (same pattern as the module-level workers in index.ts).
cron.schedule('15 6 * * *', () => {
  scanContractRenewals().catch((err) => logger.error({ err }, '[contracts] renewal scan failed'));
});
