import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

export const nightAuditSchema = z.object({
  propertyId: z.string(),
  auditDate: z.coerce.date(),
  autoPostRoomCharges: z.boolean().default(true),
  verifyBalances: z.boolean().default(true),
  generateReports: z.boolean().default(true),
  closeDay: z.boolean().default(true),
});

export async function getAuditStatus(tenantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastAudit = await prisma.nightAudit.findFirst({
    where: { tenantId },
    orderBy: { auditDate: 'desc' },
  });

  const pendingCheckouts = await prisma.reservation.count({
    where: {
      tenantId,
      status: 'checked_in',
      departureDate: { lte: today },
    },
  });

  const unbalancedFolios = await prisma.folio.count({
    where: {
      tenantId,
      status: 'open',
      balance: { not: 0 },
    },
  });

  return {
    lastAuditDate: lastAudit?.auditDate ?? null,
    lastAuditStatus: lastAudit?.status ?? null,
    isDayClosed: lastAudit?.status === 'completed' && lastAudit?.auditDate >= today,
    pendingCheckouts,
    unbalancedFolios,
    canRunAudit: pendingCheckouts === 0 && unbalancedFolios === 0,
  };
}

export async function runNightAudit(
  tenantId: string,
  userId: string,
  input: z.infer<typeof nightAuditSchema>
) {
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, tenantId },
  });
  if (!property) {
    throw new AppError(404, 'Property not found', 'NOT_FOUND');
  }

  const existingAudit = await prisma.nightAudit.findFirst({
    where: {
      tenantId,
      propertyId: input.propertyId,
      auditDate: input.auditDate,
    },
  });
  if (existingAudit?.status === 'completed') {
    throw new AppError(409, 'Night audit already completed for this date', 'CONFLICT');
  }

  const audit = await prisma.nightAudit.create({
    data: {
      tenantId,
      propertyId: input.propertyId,
      auditDate: input.auditDate,
      runBy: userId,
      status: 'in_progress',
      steps: {
        autoPostRoomCharges: input.autoPostRoomCharges,
        verifyBalances: input.verifyBalances,
        generateReports: input.generateReports,
        closeDay: input.closeDay,
      },
    },
  });

  const results: Record<string, unknown> = {};

  try {
    if (input.autoPostRoomCharges) {
      results.roomChargesPosted = await autoPostRoomCharges(
        tenantId,
        input.propertyId,
        input.auditDate
      );
    }

    if (input.verifyBalances) {
      results.balanceVerification = await verifyAllBalances(tenantId, input.propertyId);
    }

    if (input.generateReports) {
      results.reportsGenerated = await generateDailyReports(
        tenantId,
        input.propertyId,
        input.auditDate
      );
    }

    if (input.closeDay) {
      await rollBusinessDate(tenantId, input.propertyId, input.auditDate);
    }

    const completed = await prisma.nightAudit.update({
      where: { id: audit.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        results: results as Prisma.InputJsonValue,
      },
    });

    return completed;
  } catch (error) {
    await prisma.nightAudit.update({
      where: { id: audit.id },
      data: {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }
}

async function autoPostRoomCharges(tenantId: string, propertyId: string, auditDate: Date) {
  const activeStays = await prisma.reservationStay.findMany({
    where: {
      date: auditDate,
      reservation: {
        tenantId,
        propertyId,
        status: { in: ['confirmed', 'checked_in'] },
      },
    },
    include: {
      reservation: {
        include: { folio: true },
      },
      room: true,
    },
  });

  let posted = 0;

  for (const stay of activeStays) {
    if (!stay.reservation.folio) continue;

    await prisma.folioItem.create({
      data: {
        folioId: stay.reservation.folio.id,
        type: 'room_charge',
        description: `Room charge - Night ${stay.date.toISOString().split('T')[0]}`,
        amount: stay.rate,
        quantity: 1,
        postedAt: auditDate,
      },
    });

    await prisma.folio.update({
      where: { id: stay.reservation.folio.id },
      data: {
        totalCharges: { increment: stay.rate },
        balance: { increment: stay.rate },
      },
    });

    posted++;
  }

  return posted;
}

async function verifyAllBalances(tenantId: string, propertyId: string) {
  const folios = await prisma.folio.findMany({
    where: {
      tenantId,
      reservation: { propertyId },
      status: 'open',
    },
    include: { items: true },
  });

  const verified = [];
  const discrepancies = [];

  for (const folio of folios) {
    const calculatedCharges = folio.items
      .filter((i) => Number(i.amount) > 0)
      .reduce((sum, i) => sum + Number(i.amount), 0);
    const calculatedPayments = folio.items
      .filter((i) => Number(i.amount) < 0)
      .reduce((sum, i) => sum + Math.abs(Number(i.amount)), 0);
    const calculatedBalance = calculatedCharges - calculatedPayments;

    const isValid =
      Math.abs(calculatedCharges - Number(folio.totalCharges)) < 0.01 &&
      Math.abs(calculatedPayments - Number(folio.totalPayments)) < 0.01 &&
      Math.abs(calculatedBalance - Number(folio.balance)) < 0.01;

    if (isValid) {
      verified.push(folio.id);
    } else {
      discrepancies.push({
        folioId: folio.id,
        expectedBalance: calculatedBalance,
        actualBalance: folio.balance,
      });
    }
  }

  return { verified: verified.length, discrepancies };
}

async function generateDailyReports(tenantId: string, propertyId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const [arrivals, departures, inHouse, revenue] = await Promise.all([
    prisma.reservation.count({
      where: {
        tenantId,
        propertyId,
        arrivalDate: { gte: startOfDay, lte: endOfDay },
      },
    }),
    prisma.reservation.count({
      where: {
        tenantId,
        propertyId,
        departureDate: { gte: startOfDay, lte: endOfDay },
      },
    }),
    prisma.reservation.count({
      where: {
        tenantId,
        propertyId,
        status: 'checked_in',
      },
    }),
    prisma.folioItem.aggregate({
      where: {
        folio: { reservation: { tenantId, propertyId } },
        postedAt: { gte: startOfDay, lte: endOfDay },
        type: 'room_charge',
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    date: date.toISOString().split('T')[0],
    arrivals,
    departures,
    inHouse,
    roomRevenue: revenue._sum.amount ?? 0,
  };
}

async function rollBusinessDate(_tenantId: string, propertyId: string, date: Date) {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  await prisma.property.update({
    where: { id: propertyId },
    data: { currentBusinessDate: nextDay },
  });

  return { previousDate: date, newDate: nextDay };
}

export async function rollbackNightAudit(tenantId: string, auditId: string) {
  const audit = await prisma.nightAudit.findFirst({
    where: { id: auditId, tenantId },
  });
  if (!audit) {
    throw new AppError(404, 'Night audit not found', 'NOT_FOUND');
  }
  if (audit.status !== 'completed') {
    throw new AppError(409, 'Can only rollback completed audits', 'CONFLICT');
  }

  const hoursSinceCompletion = (Date.now() - audit.completedAt!.getTime()) / (1000 * 60 * 60);
  if (hoursSinceCompletion > 24) {
    throw new AppError(409, 'Cannot rollback audits older than 24 hours', 'CONFLICT');
  }

  return prisma.nightAudit.update({
    where: { id: auditId },
    data: { status: 'rolled_back' },
  });
}

export async function getAuditHistory(tenantId: string) {
  return prisma.nightAudit.findMany({
    where: { tenantId },
    orderBy: { auditDate: 'desc' },
    take: 30,
    include: {
      property: { select: { id: true, name: true } },
    },
  });
}

export async function generateAuditReport(tenantId: string, auditId: string) {
  const audit = await prisma.nightAudit.findFirst({
    where: { id: auditId, tenantId },
    include: {
      property: { select: { id: true, name: true } },
    },
  });
  if (!audit) {
    throw new AppError(404, 'Night audit not found', 'NOT_FOUND');
  }

  return {
    audit,
    summary: audit.results,
    generatedAt: new Date().toISOString(),
  };
}
