/* apps/api/src/modules/night-audit/night-audit.service.ts */
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { logAuditEvent } from '../audit/audit.service.js';
import { resolveNightAuditTasks } from '../tasks/tasks.service.js';
import { sendEmail } from '../../jobs/email.queue.js';
import type { AuthenticatedRequest } from '../auth/auth.middleware.js';

export const nightAuditSchema = z.object({
  propertyId: z.string(),
  auditDate: z.coerce.date(),
  autoPostRoomCharges: z.boolean().default(true),
  verifyBalances: z.boolean().default(true),
  generateReports: z.boolean().default(true),
  closeDay: z.boolean().default(true),
  processNoShows: z.boolean().default(true),
  updateRoomStatuses: z.boolean().default(true),
  loadRatesForNewDate: z.boolean().default(true),
});

export const nightAuditScheduleSchema = z.object({
  propertyId: z.string(),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format'),
  timezone: z.string().default('UTC'),
  isActive: z.boolean().default(true),
  autoRun: z.boolean().default(false),
  steps: z
    .object({
      autoPostRoomCharges: z.boolean().default(true),
      verifyBalances: z.boolean().default(true),
      generateReports: z.boolean().default(true),
      closeDay: z.boolean().default(true),
      processNoShows: z.boolean().default(true),
      updateRoomStatuses: z.boolean().default(true),
      loadRatesForNewDate: z.boolean().default(true),
    })
    .default({}),
  notifyEmails: z.array(z.string().email()).default([]),
});

// ─── Pre-Audit Checklist ───

export async function getPreAuditChecks(tenantId: string, propertyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const [
    pendingArrivals,
    pendingDepartures,
    noShows,
    unpostedCharges,
    unbalancedFolios,
    dirtyRoomsNeedingInspection,
    oooRooms,

    lastAudit,
    property,
  ] = await Promise.all([
    // Arrivals not yet checked in
    prisma.reservation!.count({
      where: {
        tenantId,
        propertyId,
        status: 'confirmed',
        arrivalDate: { gte: today, lte: endOfDay },
      },
    }),
    // Departures not yet checked out
    prisma.reservation!.count({
      where: {
        tenantId,
        propertyId,
        status: 'checked_in',
        departureDate: { lte: endOfDay },
      },
    }),
    // No-shows from today
    prisma.reservation!.count({
      where: {
        tenantId,
        propertyId,
        status: 'confirmed',
        arrivalDate: { lte: endOfDay },
      },
    }),
    // Stays without posted charges for today
    prisma.reservationStay.count({
      where: {
        date: { gte: today, lte: endOfDay },
        reservation: {
          tenantId,
          propertyId,
          status: { in: ['confirmed', 'checked_in'] },
          folio: {
            items: { none: { postedAt: { gte: today, lte: endOfDay }, type: 'room_charge' } },
          },
        },
      },
    }),
    // Open folios with non-zero balance
    prisma.folio.count({
      where: {
        tenantId,
        status: 'open',
        balance: { not: 0 },
        reservation: { propertyId },
      },
    }),
    // Rooms that are dirty and need inspection
    prisma.room.count({
      where: {
        tenantId,
        propertyId,
        housekeepingStatus: 'dirty',
      },
    }),
    // Out of order rooms
    prisma.room.count({
      where: {
        tenantId,
        propertyId,
        status: 'ooo',
      },
    }),

    prisma.nightAudit.findFirst({
      where: { tenantId, propertyId },
      orderBy: { auditDate: 'desc' },
    }),
    prisma.property.findFirst({
      where: { id: propertyId, tenantId },
      select: { currentBusinessDate: true, name: true },
    }),
  ]);

  const isDayClosed = lastAudit?.status === 'completed' && lastAudit?.auditDate >= today;

  const checklist = [
    {
      id: 'arrivals',
      label: 'Verify all arrivals have been checked in',
      detail:
        pendingArrivals > 0
          ? `${pendingArrivals} arrival${pendingArrivals > 1 ? 's' : ''} pending check-in`
          : 'All arrivals checked in',
      severity: pendingArrivals > 0 ? 'warning' : 'success',
      count: pendingArrivals,
      autoResolvable: false,
    },
    {
      id: 'departures',
      label: 'Verify all departures have been checked out',
      detail:
        pendingDepartures > 0
          ? `${pendingDepartures} departure${pendingDepartures > 1 ? 's' : ''} pending check-out`
          : 'All departures checked out',
      severity: pendingDepartures > 0 ? 'warning' : 'success',
      count: pendingDepartures,
      autoResolvable: false,
    },
    {
      id: 'no-shows',
      label: 'Review no-show reservations',
      detail:
        noShows > 0
          ? `${noShows} reservation${noShows > 1 ? 's' : ''} flagged as potential no-show`
          : 'No no-shows to process',
      severity: noShows > 0 ? 'info' : 'success',
      count: noShows,
      autoResolvable: true,
    },
    {
      id: 'charges',
      label: 'Confirm all room charges have been posted',
      detail:
        unpostedCharges > 0
          ? `${unpostedCharges} unposted room charge${unpostedCharges > 1 ? 's' : ''} detected`
          : 'All room charges posted',
      severity: unpostedCharges > 0 ? 'danger' : 'success',
      count: unpostedCharges,
      autoResolvable: true,
    },
    {
      id: 'folios',
      label: 'Verify folio balances',
      detail:
        unbalancedFolios > 0
          ? `${unbalancedFolios} open folio${unbalancedFolios > 1 ? 's' : ''} with outstanding balance`
          : 'All folios balanced',
      severity: unbalancedFolios > 0 ? 'warning' : 'success',
      count: unbalancedFolios,
      autoResolvable: false,
    },
    {
      id: 'rooms',
      label: 'Confirm room status updates',
      detail: `${dirtyRoomsNeedingInspection} dirty, ${oooRooms} out of order`,
      severity: 'info',
      count: dirtyRoomsNeedingInspection + oooRooms,
      autoResolvable: true,
    },
    {
      id: 'day-status',
      label: 'Business day status',
      detail: isDayClosed
        ? `Day already closed for ${property?.currentBusinessDate?.toISOString().split('T')[0]}`
        : `Business date: ${property?.currentBusinessDate?.toISOString().split('T')[0]}`,
      severity: isDayClosed ? 'warning' : 'success',
      count: 0,
      autoResolvable: false,
    },
  ];

  const blockers = checklist.filter(
    (c) => c.severity === 'danger' && c.count > 0 && !c.autoResolvable
  );
  const warnings = checklist.filter(
    (c) => c.severity === 'warning' && c.count > 0 && !c.autoResolvable
  );

  return {
    checklist,
    summary: {
      pendingArrivals,
      pendingDepartures,
      noShows,
      unpostedCharges,
      unbalancedFolios,
      dirtyRooms: dirtyRoomsNeedingInspection,
      oooRooms,
      isDayClosed,
      businessDate: property?.currentBusinessDate,
      propertyName: property?.name,
    },
    canRunAudit: blockers.length === 0,
    blockerCount: blockers.length,
    warningCount: warnings.length,
  };
}

// ─── Audit Status ───

export async function getAuditStatus(tenantId: string, propertyId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const whereClause: Record<string, unknown> = { tenantId };
  if (propertyId) whereClause.propertyId = propertyId;

  const lastAudit = await prisma.nightAudit.findFirst({
    where: whereClause,
    orderBy: { auditDate: 'desc' },
    include: { property: { select: { id: true, name: true, currentBusinessDate: true } } },
  });

  const pendingCheckouts = await prisma.reservation!.count({
    where: {
      tenantId,
      ...(propertyId && { propertyId }),
      status: 'checked_in',
      departureDate: { lte: today },
    },
  });

  const unbalancedFolios = await prisma.folio.count({
    where: {
      tenantId,
      status: 'open',
      balance: { not: 0 },
      ...(propertyId && { reservation: { propertyId } }),
    },
  });

  // Get today's stats
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const [arrivalsToday, departuresToday, inHouseCount, occupiedRooms] = await Promise.all([
    prisma.reservation!.count({
      where: {
        tenantId,
        ...(propertyId && { propertyId }),
        arrivalDate: { gte: today, lte: endOfDay },
      },
    }),
    prisma.reservation!.count({
      where: {
        tenantId,
        ...(propertyId && { propertyId }),
        departureDate: { gte: today, lte: endOfDay },
      },
    }),
    prisma.reservation!.count({
      where: {
        tenantId,
        ...(propertyId && { propertyId }),
        status: 'checked_in',
      },
    }),
    prisma.reservationStay.groupBy({
      by: ['roomId'],
      where: {
        date: { gte: today, lte: endOfDay },
        reservation: {
          tenantId,
          ...(propertyId && { propertyId }),
          status: { in: ['confirmed', 'checked_in'] },
        },
      },
    }),
  ]);

  const totalRooms = await prisma.room.count({
    where: {
      tenantId,
      ...(propertyId && { propertyId }),
      status: { not: 'ooo' },
    },
  });

  return {
    lastAuditDate: lastAudit?.auditDate ?? null,
    lastAuditStatus: lastAudit?.status ?? null,
    lastAuditId: lastAudit?.id ?? null,
    isDayClosed: lastAudit?.status === 'completed' && lastAudit?.auditDate >= today,
    pendingCheckouts,
    unbalancedFolios,
    canRunAudit: pendingCheckouts === 0,
    businessDate: lastAudit?.property?.currentBusinessDate ?? null,
    propertyName: lastAudit?.property?.name ?? null,
    todayStats: {
      arrivals: arrivalsToday,
      departures: departuresToday,
      inHouse: inHouseCount,
      occupiedRooms: occupiedRooms.length,
      totalRooms,
      occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms.length / totalRooms) * 100) : 0,
    },
  };
}

// ─── Run Night Audit ───

export async function runNightAudit(
  tenantId: string,
  userId: string,
  input: z.infer<typeof nightAuditSchema>,
  req?: Pick<AuthenticatedRequest, 'auth' | 'ip'>
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

  // Use existing in_progress audit or create new
  let audit;
  if (existingAudit?.status === 'in_progress') {
    audit = existingAudit;
  } else {
    audit = await prisma.nightAudit.create({
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
          processNoShows: input.processNoShows,
          updateRoomStatuses: input.updateRoomStatuses,
          loadRatesForNewDate: input.loadRatesForNewDate,
        },
      },
    });
  }

  const results: Record<string, unknown> = {};
  const stepLogs: { step: string; status: string; message: string; durationMs: number }[] = [];

  const runStep = async (stepName: string, stepFn: () => Promise<unknown>): Promise<unknown> => {
    const start = Date.now();
    try {
      const result = await stepFn();
      stepLogs.push({
        step: stepName,
        status: 'completed',
        message: `${stepName} completed successfully`,
        durationMs: Date.now() - start,
      });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      stepLogs.push({
        step: stepName,
        status: 'failed',
        message: `${stepName} failed: ${message}`,
        durationMs: Date.now() - start,
      });
      throw err;
    }
  };

  try {
    // Step 1: Process No-Shows
    if (input.processNoShows) {
      results.noShowsProcessed = await runStep('process_no_shows', () =>
        processNoShows(tenantId, input.propertyId, input.auditDate)
      );
    }

    // Step 2: Auto-post room charges
    if (input.autoPostRoomCharges) {
      results.roomChargesPosted = await runStep('post_room_charges', () =>
        autoPostRoomCharges(tenantId, input.propertyId, input.auditDate)
      );
    }

    // Step 3: Verify balances
    if (input.verifyBalances) {
      results.balanceVerification = await runStep('verify_balances', () =>
        verifyAllBalances(tenantId, input.propertyId)
      );
    }

    // Step 4: Update room statuses
    if (input.updateRoomStatuses) {
      results.roomStatusUpdates = await runStep('update_room_statuses', () =>
        updateRoomStatuses(tenantId, input.propertyId, input.auditDate)
      );
    }

    // Step 5: Generate reports
    if (input.generateReports) {
      results.reportsGenerated = await runStep('generate_reports', () =>
        generateDailyReports(tenantId, input.propertyId, input.auditDate)
      );
    }

    // Step 6: Load rates for new business date
    if (input.loadRatesForNewDate) {
      results.ratesLoaded = await runStep('load_rates', () =>
        loadRatesForNewDate(tenantId, input.propertyId, input.auditDate)
      );
    }

    // Step 7: Roll business date
    if (input.closeDay) {
      results.businessDateRolled = await runStep('roll_business_date', () =>
        rollBusinessDate(tenantId, input.propertyId, input.auditDate)
      );
    }

    // Step 7b: close stale "Business date NOT rolled" tasks — the roll above
    // resolved the condition they were raised for
    if (results.businessDateRolled) {
      results.auditTasksResolved = await runStep('resolve_audit_tasks', () =>
        resolveNightAuditTasks(tenantId, input.propertyId)
      );
    }

    // Step 8: Send completion notification
    await runStep('send_notification', () =>
      sendAuditCompletionNotification(tenantId, input.propertyId, audit.id, results)
    );

    // Log audit event
    await logAuditEvent({
      req,
      tenantId,
      action: 'night_audit.run',
      category: 'operations',
      label: 'Night Audit Completed',
      description: `Night audit completed for ${property.name} on ${input.auditDate.toISOString().split('T')[0]}`,
      entityType: 'night_audit',
      entityId: audit.id,
      severity: 'high',
      metadata: {
        propertyName: property.name,
        auditDate: input.auditDate.toISOString().split('T')[0],
        results,
        stepLogs,
      },
    });

    const completed = await prisma.nightAudit.update({
      where: { id: audit.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        results: {
          ...results,
          stepLogs,
          propertyName: property.name,
          completedBy: req?.auth?.user
            ? `${req.auth.user.firstName ?? ''} ${req.auth.user.lastName ?? ''}`.trim() ||
              req.auth.user.email
            : 'system',
        } as Prisma.InputJsonValue,
      },
      include: {
        property: { select: { id: true, name: true, currentBusinessDate: true } },
      },
    });

    return completed;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await prisma.nightAudit.update({
      where: { id: audit.id },
      data: {
        status: 'failed',
        completedAt: new Date(),
        errorMessage,
        results: { stepLogs } as Prisma.InputJsonValue,
      },
    });

    // Log failure
    await logAuditEvent({
      req,
      tenantId,
      action: 'night_audit.failed',
      category: 'operations',
      label: 'Night Audit Failed',
      description: `Night audit failed for ${property.name}: ${errorMessage}`,
      entityType: 'night_audit',
      entityId: audit.id,
      severity: 'critical',
      metadata: { propertyName: property.name, error: errorMessage, stepLogs },
    }).catch(() => {});

    throw error;
  }
}

// ─── Step Implementations ───

async function processNoShows(tenantId: string, propertyId: string, auditDate: Date) {
  const endOfDay = new Date(auditDate);
  endOfDay.setHours(23, 59, 59, 999);

  const noShowCandidates = await prisma.reservation!.findMany({
    where: {
      tenantId,
      propertyId,
      status: 'confirmed',
      arrivalDate: { lte: endOfDay },
    },
    include: { guest: true, folio: true },
  });

  let processed = 0;
  let charged = 0;

  for (const reservation of noShowCandidates) {
    // Mark as no_show
    await prisma.reservation!.update({
      where: { id: reservation.id },
      data: { status: 'no_show' },
    });

    // Post no-show fee if folio exists
    if (reservation.folio) {
      const noShowFee = Math.min(Number(reservation.totalAmount) * 0.1, 100); // 10% or max $100
      await prisma.folioItem.create({
        data: {
          folioId: reservation.folio.id,
          type: 'no_show_fee',
          description: `No-show fee - ${reservation.confirmationNumber}`,
          amount: noShowFee,
          quantity: 1,
          postedAt: auditDate,
        },
      });

      await prisma.folio.update({
        where: { id: reservation.folio.id },
        data: {
          totalCharges: { increment: noShowFee },
          balance: { increment: noShowFee },
        },
      });
      charged++;
    }

    // Free up the room
    await prisma.reservationStay.deleteMany({
      where: { reservationId: reservation.id },
    });

    processed++;
  }

  return { processed, charged };
}

async function autoPostRoomCharges(tenantId: string, propertyId: string, auditDate: Date) {
  const startOfDay = new Date(auditDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(auditDate);
  endOfDay.setHours(23, 59, 59, 999);

  const activeStays = await prisma.reservationStay.findMany({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
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
  let skipped = 0;
  const details: { folioId: string; room: string; amount: number }[] = [];

  for (const stay of activeStays) {
    if (!stay.reservation!.folio) {
      skipped++;
      continue;
    }

    // Check if already posted
    const existingCharge = await prisma.folioItem.findFirst({
      where: {
        folioId: stay.reservation!.folio.id,
        type: 'room_charge',
        postedAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existingCharge) {
      skipped++;
      continue;
    }

    await prisma.folioItem.create({
      data: {
        folioId: stay.reservation!.folio.id,
        type: 'room_charge',
        description: `Room charge - ${stay.room.number} - Night of ${auditDate.toISOString().split('T')[0]}`,
        amount: stay.rate,
        quantity: 1,
        postedAt: auditDate,
      },
    });

    await prisma.folio.update({
      where: { id: stay.reservation!.folio.id },
      data: {
        totalCharges: { increment: stay.rate },
        balance: { increment: stay.rate },
      },
    });

    details.push({
      folioId: stay.reservation!.folio.id,
      room: stay.room.number,
      amount: Number(stay.rate),
    });
    posted++;
  }

  return { posted, skipped, details };
}

async function verifyAllBalances(tenantId: string, propertyId: string) {
  const folios = await prisma.folio.findMany({
    where: {
      tenantId,
      reservation: { propertyId },
      status: 'open',
    },
    include: {
      items: true,
      reservation: {
        select: {
          confirmationNumber: true,
          guest: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  const verified: string[] = [];
  const discrepancies: {
    folioId: string;
    confirmationNumber: string;
    guestName: string;
    expectedBalance: number;
    actualBalance: number;
  }[] = [];

  for (const folio of folios) {
    const calculatedCharges = folio.items
      .filter((i) => Number(i.amount) > 0)
      .reduce((sum, i) => sum + Number(i.amount) * i.quantity, 0);
    const calculatedPayments = folio.items
      .filter((i) => Number(i.amount) < 0)
      .reduce((sum, i) => sum + Math.abs(Number(i.amount)) * i.quantity, 0);
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
        confirmationNumber: folio.reservation!.confirmationNumber,
        guestName: `${folio.reservation!.guest.firstName} ${folio.reservation!.guest.lastName}`,
        expectedBalance: Math.round(calculatedBalance * 100) / 100,
        actualBalance: Number(folio.balance),
      });
    }
  }

  return {
    verified: verified.length,
    total: folios.length,
    discrepancies,
    hasDiscrepancies: discrepancies.length > 0,
  };
}

async function updateRoomStatuses(tenantId: string, propertyId: string, auditDate: Date) {
  // Mark rooms of departed guests as dirty
  const endOfDay = new Date(auditDate);
  endOfDay.setHours(23, 59, 59, 999);

  const departedStays = await prisma.reservationStay.findMany({
    where: {
      date: { lte: endOfDay },
      reservation: {
        tenantId,
        propertyId,
        status: 'checked_out',
        departureDate: { lte: endOfDay },
      },
    },
    select: { roomId: true },
    distinct: ['roomId'],
  });

  const roomIds = departedStays.map((s) => s.roomId);

  if (roomIds.length > 0) {
    await prisma.room.updateMany({
      where: { id: { in: roomIds } },
      data: { housekeepingStatus: 'dirty' },
    });
  }

  // Create housekeeping tasks for dirty rooms
  const dirtyRooms = await prisma.room.findMany({
    where: {
      tenantId,
      propertyId,
      housekeepingStatus: 'dirty',
    },
  });

  let tasksCreated = 0;
  for (const room of dirtyRooms) {
    const existingTask = await prisma.housekeepingTask.findFirst({
      where: {
        roomId: room.id,
        status: { in: ['pending', 'in_progress'] },
        type: 'cleaning',
      },
    });

    if (!existingTask) {
      await prisma.housekeepingTask.create({
        data: {
          tenantId,
          propertyId,
          roomId: room.id,
          type: 'cleaning',
          priority: 'normal',
          status: 'pending',
          scheduledAt: new Date(auditDate.getTime() + 8 * 60 * 60 * 1000), // 8 AM next day
          estimatedDuration: 30,
          checklist: ['Make bed', 'Restock towels', 'Vacuum', 'Clean bathroom'],
        },
      });
      tasksCreated++;
    }
  }

  return {
    roomsMarkedDirty: roomIds.length,
    tasksCreated,
  };
}

async function generateDailyReports(tenantId: string, propertyId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const [
    arrivals,
    departures,
    inHouse,
    roomRevenue,
    totalRevenue,
    paymentBreakdown,
    noShows,
    walkIns,
    occupancy,
    roomCounts,
  ] = await Promise.all([
    prisma.reservation!.count({
      where: {
        tenantId,
        propertyId,
        arrivalDate: { gte: startOfDay, lte: endOfDay },
      },
    }),
    prisma.reservation!.count({
      where: {
        tenantId,
        propertyId,
        departureDate: { gte: startOfDay, lte: endOfDay },
      },
    }),
    prisma.reservation!.count({
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
    prisma.folioItem.aggregate({
      where: {
        folio: { reservation: { tenantId, propertyId } },
        postedAt: { gte: startOfDay, lte: endOfDay },
      },
      _sum: { amount: true },
    }),
    prisma.folioItem.groupBy({
      by: ['type'],
      where: {
        folio: { reservation: { tenantId, propertyId } },
        postedAt: { gte: startOfDay, lte: endOfDay },
        amount: { lt: 0 },
      },
      _sum: { amount: true },
    }),
    prisma.reservation!.count({
      where: {
        tenantId,
        propertyId,
        status: 'no_show',
        arrivalDate: { gte: startOfDay, lte: endOfDay },
      },
    }),
    prisma.reservation!.count({
      where: {
        tenantId,
        propertyId,
        source: 'walkin',
        arrivalDate: { gte: startOfDay, lte: endOfDay },
      },
    }),
    prisma.reservationStay.groupBy({
      by: ['roomId'],
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        reservation: {
          tenantId,
          propertyId,
          status: { in: ['confirmed', 'checked_in'] },
        },
      },
    }),
    prisma.room.groupBy({
      by: ['status'],
      where: { tenantId, propertyId },
      _count: { status: true },
    }),
  ]);

  const totalRooms = roomCounts.reduce((sum, r) => sum + r._count.status, 0);
  const occupiedRooms = occupancy.length;
  const oooRooms = roomCounts.find((r) => r.status === 'ooo')?._count.status ?? 0;
  const availableRooms = totalRooms - occupiedRooms - oooRooms;

  return {
    date: date.toISOString().split('T')[0],
    arrivals,
    departures,
    inHouse,
    noShows,
    walkIns,
    occupancy: {
      totalRooms,
      occupied: occupiedRooms,
      available: availableRooms,
      ooo: oooRooms,
      rate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
    },
    revenue: {
      roomRevenue: Number(roomRevenue._sum.amount ?? 0),
      totalRevenue: Number(totalRevenue._sum.amount ?? 0),
      revPAR:
        totalRooms > 0
          ? Math.round((Number(totalRevenue._sum.amount ?? 0) / totalRooms) * 100) / 100
          : 0,
    },
    payments: paymentBreakdown.map((p) => ({
      type: p.type,
      amount: Math.abs(Number(p._sum.amount ?? 0)),
    })),
  };
}

async function loadRatesForNewDate(tenantId: string, propertyId: string, auditDate: Date) {
  const nextDay = new Date(auditDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const ratePlans = await prisma.ratePlan.findMany({
    where: {
      tenantId,
      propertyId,
      status: 'active',
    },
    include: { roomType: { select: { name: true, code: true } } },
  });

  return {
    newBusinessDate: nextDay.toISOString().split('T')[0],
    activeRatePlans: ratePlans.length,
    ratePlans: ratePlans.map((rp) => ({
      id: rp.id,
      code: rp.code,
      name: rp.name,
      roomType: rp.roomType.name,
      baseRate: Number(rp.baseRate),
    })),
  };
}

async function rollBusinessDate(_tenantId: string, propertyId: string, date: Date) {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(0, 0, 0, 0);

  await prisma.property.update({
    where: { id: propertyId },
    data: { currentBusinessDate: nextDay },
  });

  return {
    previousDate: date.toISOString().split('T')[0],
    newDate: nextDay.toISOString().split('T')[0],
  };
}

async function sendAuditCompletionNotification(
  tenantId: string,
  propertyId: string,
  auditId: string,
  results: Record<string, unknown>
) {
  try {
    // Get admin users for this tenant
    const adminUsers = await prisma.user.findMany({
      where: {
        tenantId,
        role: { in: ['owner', 'admin'] },
        status: 'active',
      },
      select: { email: true, firstName: true },
    });

    // Get schedule config for additional emails
    const schedule = await prisma.nightAuditSchedule.findFirst({
      where: { tenantId, propertyId, isActive: true },
    });

    const allEmails = new Set<string>();
    adminUsers.forEach((u) => allEmails.add(u.email));
    ((schedule?.notifyEmails as string[]) ?? []).forEach((e) => allEmails.add(e));

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { name: true },
    });

    for (const email of allEmails) {
      await sendEmail({
        to: email,
        subject: `Night Audit Completed - ${property?.name ?? 'Property'}`,
        template: 'generic',
        payload: {
          message:
            `Night audit has been completed for ${property?.name}.\n\n` +
            `Audit ID: ${auditId}\n` +
            `Room charges posted: ${(results.roomChargesPosted as { posted?: number })?.posted ?? 0}\n` +
            `No-shows processed: ${(results.noShowsProcessed as { processed?: number })?.processed ?? 0}\n` +
            `Business date rolled to: ${(results.businessDateRolled as { newDate?: string })?.newDate ?? 'N/A'}\n\n` +
            `View details: ${process.env.WEB_URL}/app/night-audit`,
        },
      });
    }

    return { emailsSent: allEmails.size };
  } catch (err) {
    logger.warn({ err, tenantId }, 'Failed to send audit completion notification');
    return { emailsSent: 0 };
  }
}

// ─── Rollback ───

export async function rollbackNightAudit(
  tenantId: string,
  auditId: string,
  userId: string,
  req?: Pick<AuthenticatedRequest, 'auth' | 'ip'>
) {
  const audit = await prisma.nightAudit.findFirst({
    where: { id: auditId, tenantId },
    include: { property: { select: { name: true } } },
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

  const results = audit.results as Record<string, unknown> | null;

  // Reverse room charges if they were posted
  if (results?.roomChargesPosted) {
    const chargeDetails =
      (results.roomChargesPosted as { details?: { folioId: string; amount: number }[] }).details ??
      [];
    for (const charge of chargeDetails) {
      // Create reversal entry
      await prisma.folioItem.create({
        data: {
          folioId: charge.folioId,
          type: 'reversal',
          description: `Night audit rollback - reversing room charge`,
          amount: -charge.amount,
          quantity: 1,
          postedAt: new Date(),
        },
      });

      await prisma.folio.update({
        where: { id: charge.folioId },
        data: {
          totalCharges: { decrement: charge.amount },
          balance: { decrement: charge.amount },
        },
      });
    }
  }

  // Reverse no-show charges
  if (results?.noShowsProcessed) {
    // Reset no-show reservations back to confirmed
    const auditDate = new Date(audit.auditDate);
    auditDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(auditDate);
    endOfDay.setHours(23, 59, 59, 999);

    await prisma.reservation!.updateMany({
      where: {
        tenantId,
        propertyId: audit.propertyId,
        status: 'no_show',
        arrivalDate: { gte: auditDate, lte: endOfDay },
      },
      data: { status: 'confirmed' },
    });
  }

  // Roll back business date
  if (results?.businessDateRolled) {
    const rolledResult = results.businessDateRolled as { previousDate?: string };
    if (rolledResult.previousDate) {
      await prisma.property.update({
        where: { id: audit.propertyId },
        data: { currentBusinessDate: new Date(rolledResult.previousDate) },
      });
    }
  }

  const updated = await prisma.nightAudit.update({
    where: { id: auditId },
    data: { status: 'rolled_back' },
  });

  // Log rollback
  await logAuditEvent({
    req,
    tenantId,
    action: 'night_audit.rollback',
    category: 'operations',
    label: 'Night Audit Rolled Back',
    description: `Night audit for ${audit.property.name} on ${audit.auditDate.toISOString().split('T')[0]} was rolled back`,
    entityType: 'night_audit',
    entityId: auditId,
    severity: 'critical',
    metadata: {
      propertyName: audit.property.name,
      originalAuditDate: audit.auditDate.toISOString().split('T')[0],
      rolledBackBy: userId,
    },
  });

  return updated;
}

// ─── History ───

export async function getAuditHistory(
  tenantId: string,
  propertyId?: string,
  page: number = 1,
  pageSize: number = 20
) {
  const where: Record<string, unknown> = { tenantId };
  if (propertyId) where.propertyId = propertyId;

  const [total, audits] = await Promise.all([
    prisma.nightAudit.count({ where }),
    prisma.nightAudit.findMany({
      where,
      orderBy: { auditDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        property: { select: { id: true, name: true, code: true } },
      },
    }),
  ]);

  return {
    data: audits,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ─── Report ───

export async function generateAuditReport(tenantId: string, auditId: string) {
  const audit = await prisma.nightAudit.findFirst({
    where: { id: auditId, tenantId },
    include: {
      property: { select: { id: true, name: true, code: true, currentBusinessDate: true } },
    },
  });
  if (!audit) {
    throw new AppError(404, 'Night audit not found', 'NOT_FOUND');
  }

  const results = audit.results as Record<string, unknown> | null;

  return {
    audit,
    summary: results,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Scheduling ───

export async function getAuditSchedule(tenantId: string, propertyId: string) {
  const schedule = await prisma.nightAuditSchedule.findFirst({
    where: { tenantId, propertyId },
  });

  return schedule;
}

export async function upsertAuditSchedule(
  tenantId: string,
  input: z.infer<typeof nightAuditScheduleSchema>
) {
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, tenantId },
  });
  if (!property) {
    throw new AppError(404, 'Property not found', 'NOT_FOUND');
  }

  // Calculate next run time
  const [hours, minutes] = input.scheduledTime.split(':').map(Number);
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const existing = await prisma.nightAuditSchedule.findFirst({
    where: { tenantId, propertyId: input.propertyId },
  });

  if (existing) {
    return prisma.nightAuditSchedule.update({
      where: { id: existing.id },
      data: {
        scheduledTime: input.scheduledTime,
        timezone: input.timezone,
        isActive: input.isActive,
        autoRun: input.autoRun,
        steps: input.steps as Prisma.InputJsonValue,
        notifyEmails: input.notifyEmails,
        nextRunAt: input.isActive ? nextRun : null,
      },
    });
  }

  return prisma.nightAuditSchedule.create({
    data: {
      tenantId,
      propertyId: input.propertyId,
      scheduledTime: input.scheduledTime,
      timezone: input.timezone,
      isActive: input.isActive,
      autoRun: input.autoRun,
      steps: input.steps as Prisma.InputJsonValue,
      notifyEmails: input.notifyEmails,
      nextRunAt: input.isActive ? nextRun : null,
    },
  });
}
