/* apps/api/src/modules/meals/meals.service.ts — T7: Meal plans
 * Board-basis packages (RO/BB/HB/FB/AI/UAI) assignable to reservations.
 * The auto-poster creates one MealPlanPosting per assignment per day; the
 * unique(assignmentId, date) key plus the folioItemId re-post guard make
 * repeated runs safe. Child pricing is percentage-based per age band.
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { paginate, type PaginationInput } from '../../common/pagination.js';
import { postCharge } from '../folios/folios.service.js';

// ─── Child pricing ───
const CHILD_PCT: Record<string, number> = {
  free: 0,
  '0': 0,
  '50': 0.5,
  '75': 0.75,
  full: 1,
  '100': 1,
  'n/a': 0,
};

function childPct(policy: string): number {
  return CHILD_PCT[policy] ?? 1;
}

/** Daily charge for an assignment, honouring per-age-band child pricing. */
export function computeDailyAmount(
  plan: { price: Prisma.Decimal | number },
  adults: number,
  children: number,
  childPolicies: { u6: string; u12: string; u16: string }
): number {
  // Children split evenly across the age bands for a conservative default;
  // per-child age data lives on the guest profile, not the reservation, so
  // the reservation-level figure uses the under-12 band.
  const price = Number(plan.price);
  const childRate = price * childPct(childPolicies.u12);
  return Math.round((adults * price + children * childRate) * 100) / 100;
}

function dayOnly(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function planInSeason(
  plan: { isActive: boolean; startDate: Date | null; endDate: Date | null },
  date: Date
): boolean {
  if (!plan.isActive) return false;
  const t = dayOnly(date).getTime();
  if (plan.startDate && t < dayOnly(plan.startDate).getTime()) return false;
  if (plan.endDate && t > dayOnly(plan.endDate).getTime()) return false;
  return true;
}

// ─── Meal plans CRUD ───

export async function listMealPlans(
  tenantId: string,
  query: PaginationInput & {
    propertyId?: string;
    boardBasis?: string;
    isActive?: string;
    search?: string;
  }
) {
  const where: Prisma.MealPlanWhereInput = {
    tenantId,
    ...(query.propertyId ? { propertyId: query.propertyId } : {}),
    ...(query.boardBasis ? { boardBasis: query.boardBasis } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { code: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.mealPlan.count({ where }),
    prisma.mealPlan.findMany({
      where,
      include: {
        restaurant: { select: { id: true, name: true, type: true } },
        _count: { select: { assignments: { where: { status: 'active' } } } },
      },
      orderBy: { name: 'asc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return paginate(rows, total, query);
}

export interface MealPlanInput {
  propertyId: string;
  name: string;
  code: string;
  boardBasis: string;
  price: number;
  currency?: string;
  taxInclusive?: boolean;
  autoPost?: boolean;
  postTime?: string;
  restaurantId?: string | null;
  description?: string;
  inclusions?: string[];
  exclusions?: string[];
  childUnder6?: string;
  childUnder12?: string;
  childUnder16?: string;
  seasonality?: string;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
}

const BOARD_BASES = ['RO', 'BB', 'HB', 'FB', 'AI', 'UAI'];

export async function createMealPlan(tenantId: string, input: MealPlanInput) {
  if (!BOARD_BASES.includes(input.boardBasis)) {
    throw new AppError(
      400,
      `boardBasis must be one of ${BOARD_BASES.join(', ')}`,
      'VALIDATION_ERROR'
    );
  }
  await assertProperty(tenantId, input.propertyId);

  if (input.restaurantId) await assertRestaurant(tenantId, input.restaurantId);

  const dup = await prisma.mealPlan.findUnique({
    where: { propertyId_code: { propertyId: input.propertyId, code: input.code } },
  });
  if (dup)
    throw new AppError(409, `Code ${input.code} already exists at this property`, 'CONFLICT');

  return prisma.mealPlan.create({
    data: {
      tenantId,
      propertyId: input.propertyId,
      name: input.name,
      code: input.code,
      boardBasis: input.boardBasis,
      price: input.price,
      currency: input.currency ?? 'ZAR',
      taxInclusive: input.taxInclusive ?? true,
      autoPost: input.autoPost ?? true,
      postTime: input.postTime ?? '06:00',
      restaurantId: input.restaurantId ?? null,
      description: input.description ?? null,
      inclusions: input.inclusions ?? [],
      exclusions: input.exclusions ?? [],
      childUnder6: input.childUnder6 ?? 'free',
      childUnder12: input.childUnder12 ?? '50',
      childUnder16: input.childUnder16 ?? '75',
      seasonality: input.seasonality ?? 'year-round',
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateMealPlan(tenantId: string, id: string, input: Partial<MealPlanInput>) {
  const plan = await prisma.mealPlan.findFirst({ where: { id, tenantId } });
  if (!plan) throw new AppError(404, 'Meal plan not found', 'NOT_FOUND');

  if (input.code && input.code !== plan.code) {
    const dup = await prisma.mealPlan.findUnique({
      where: { propertyId_code: { propertyId: plan.propertyId, code: input.code } },
    });
    if (dup)
      throw new AppError(409, `Code ${input.code} already exists at this property`, 'CONFLICT');
  }

  return prisma.mealPlan.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.code !== undefined ? { code: input.code } : {}),
      ...(input.boardBasis !== undefined ? { boardBasis: input.boardBasis } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.taxInclusive !== undefined ? { taxInclusive: input.taxInclusive } : {}),
      ...(input.autoPost !== undefined ? { autoPost: input.autoPost } : {}),
      ...(input.postTime !== undefined ? { postTime: input.postTime } : {}),
      ...(input.restaurantId !== undefined ? { restaurantId: input.restaurantId } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.inclusions !== undefined ? { inclusions: input.inclusions } : {}),
      ...(input.exclusions !== undefined ? { exclusions: input.exclusions } : {}),
      ...(input.childUnder6 !== undefined ? { childUnder6: input.childUnder6 } : {}),
      ...(input.childUnder12 !== undefined ? { childUnder12: input.childUnder12 } : {}),
      ...(input.childUnder16 !== undefined ? { childUnder16: input.childUnder16 } : {}),
      ...(input.seasonality !== undefined ? { seasonality: input.seasonality } : {}),
      ...(input.startDate !== undefined
        ? { startDate: input.startDate ? new Date(input.startDate) : null }
        : {}),
      ...(input.endDate !== undefined
        ? { endDate: input.endDate ? new Date(input.endDate) : null }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
}

export async function deleteMealPlan(tenantId: string, id: string) {
  const plan = await prisma.mealPlan.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { assignments: { where: { status: 'active' } } } } },
  });
  if (!plan) throw new AppError(404, 'Meal plan not found', 'NOT_FOUND');

  if (plan._count.assignments > 0) {
    // Historical postings reference this plan's assignments — deactivate
    // instead of deleting so folio history stays intact.
    await prisma.mealPlan.update({ where: { id }, data: { isActive: false } });
    return { deleted: false, deactivated: true };
  }

  await prisma.mealPlan.delete({ where: { id } });
  return { deleted: true, deactivated: false };
}

// ─── Summary (stat cards) ───

export async function mealPlanSummary(tenantId: string, propertyId?: string) {
  // Each model scopes to property differently — no shared spread.
  const planScope: Prisma.MealPlanWhereInput = {
    tenantId,
    ...(propertyId ? { propertyId } : {}),
  };
  const assignmentScope: Prisma.MealPlanAssignmentWhereInput = propertyId
    ? { tenantId, reservation: { propertyId } }
    : { tenantId };
  const postingScope: Prisma.MealPlanPostingWhereInput = propertyId
    ? { tenantId, assignment: { reservation: { propertyId } } }
    : { tenantId };

  const [activePlans, activeAssignments, todayPosted, todayFailed, monthRevenue] =
    await Promise.all([
      prisma.mealPlan.count({ where: { ...planScope, isActive: true } }),
      prisma.mealPlanAssignment.count({ where: { ...assignmentScope, status: 'active' } }),
      prisma.mealPlanPosting.count({
        where: { ...postingScope, status: 'posted', date: dayOnly(new Date()) },
      }),
      prisma.mealPlanPosting.count({
        where: { ...postingScope, status: 'failed', date: dayOnly(new Date()) },
      }),
      prisma.mealPlanPosting.aggregate({
        where: {
          ...postingScope,
          status: 'posted',
          date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        _sum: { amount: true },
      }),
    ]);

  return {
    activePlans,
    activeAssignments,
    postedToday: todayPosted,
    failedToday: todayFailed,
    monthRevenue: Number(monthRevenue._sum.amount ?? 0),
    currency: 'ZAR',
  };
}

// ─── Restaurants CRUD ───

export async function listRestaurants(tenantId: string, propertyId?: string) {
  return prisma.restaurant.findMany({
    where: { tenantId, ...(propertyId ? { propertyId } : {}), isActive: true },
    include: { _count: { select: { mealPlans: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function createRestaurant(
  tenantId: string,
  input: {
    propertyId: string;
    name: string;
    type?: string;
    cuisine?: string;
    capacity?: number;
    operatingHours?: string;
    location?: string;
  }
) {
  await assertProperty(tenantId, input.propertyId);
  return prisma.restaurant.create({
    data: {
      tenantId,
      propertyId: input.propertyId,
      name: input.name,
      type: input.type ?? 'main',
      cuisine: input.cuisine ?? null,
      capacity: input.capacity ?? 50,
      operatingHours: input.operatingHours ?? null,
      location: input.location ?? null,
    },
  });
}

export async function updateRestaurant(
  tenantId: string,
  id: string,
  input: Partial<{
    name: string;
    type: string;
    cuisine: string;
    capacity: number;
    operatingHours: string;
    location: string;
    isActive: boolean;
  }>
) {
  const existing = await prisma.restaurant.findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppError(404, 'Restaurant not found', 'NOT_FOUND');
  return prisma.restaurant.update({ where: { id }, data: input });
}

// ─── Assignments ───

export async function listAssignments(
  tenantId: string,
  query: { propertyId?: string; date?: string; status?: string } & PaginationInput
) {
  const date = query.date ? dayOnly(new Date(query.date)) : null;

  const where: Prisma.MealPlanAssignmentWhereInput = {
    tenantId,
    ...(query.propertyId ? { reservation: { propertyId: query.propertyId } } : {}),
    ...(query.status ? { status: query.status } : { status: 'active' }),
    ...(date
      ? {
          AND: [{ startDate: { lte: date } }, { endDate: { gte: date } }],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.mealPlanAssignment.count({ where }),
    prisma.mealPlanAssignment.findMany({
      where,
      include: {
        mealPlan: {
          select: {
            id: true,
            name: true,
            code: true,
            boardBasis: true,
            price: true,
            currency: true,
          },
        },
        reservation: {
          select: {
            id: true,
            confirmationNumber: true,
            arrivalDate: true,
            departureDate: true,
            status: true,
            adults: true,
            children: true,
            guest: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                preferences: { where: { category: 'dietary' }, select: { key: true, value: true } },
              },
            },
          },
        },
      },
      orderBy: { startDate: 'asc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return paginate(rows, total, query);
}

export async function createAssignment(
  tenantId: string,
  _userId: string,
  input: {
    reservationId: string;
    mealPlanId: string;
    startDate: string;
    endDate: string;
    adults?: number;
    children?: number;
  }
) {
  const reservation = await prisma.reservation.findFirst({
    where: { id: input.reservationId, tenantId },
  });
  if (!reservation) throw new AppError(404, 'Reservation not found', 'NOT_FOUND');

  const plan = await prisma.mealPlan.findFirst({ where: { id: input.mealPlanId, tenantId } });
  if (!plan) throw new AppError(404, 'Meal plan not found', 'NOT_FOUND');
  if (!plan.isActive) throw new AppError(409, 'Meal plan is inactive', 'CONFLICT');

  const start = dayOnly(new Date(input.startDate));
  const end = dayOnly(new Date(input.endDate));

  if (end < start)
    throw new AppError(400, 'endDate must be on or after startDate', 'VALIDATION_ERROR');
  if (start < dayOnly(reservation.arrivalDate) || end > dayOnly(reservation.departureDate)) {
    throw new AppError(
      400,
      'Assignment dates must fall within the reservation stay',
      'VALIDATION_ERROR'
    );
  }
  if (!planInSeason(plan, start) || !planInSeason(plan, end)) {
    throw new AppError(409, 'Meal plan is outside its seasonal window for those dates', 'CONFLICT');
  }

  const overlap = await prisma.mealPlanAssignment.findFirst({
    where: {
      reservationId: reservation.id,
      status: 'active',
      AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
    },
  });
  if (overlap) {
    throw new AppError(
      409,
      'Reservation already has an overlapping meal plan assignment',
      'CONFLICT'
    );
  }

  const adults = input.adults ?? reservation.adults;
  const children = input.children ?? reservation.children;

  return prisma.mealPlanAssignment.create({
    data: {
      tenantId,
      reservationId: reservation.id,
      mealPlanId: plan.id,
      startDate: start,
      endDate: end,
      adults,
      children,
      dailyRate: computeDailyAmount(plan, adults, children, {
        u6: plan.childUnder6,
        u12: plan.childUnder12,
        u16: plan.childUnder16,
      }),
    },
  });
}

export async function cancelAssignment(tenantId: string, id: string) {
  const assignment = await prisma.mealPlanAssignment.findFirst({ where: { id, tenantId } });
  if (!assignment) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
  if (assignment.status !== 'active') {
    throw new AppError(409, 'Assignment is already cancelled', 'CONFLICT');
  }

  // Future postings that never hit the folio are voided; posted days stay
  // (the guest already ate — the folio charge is legitimate history).
  const today = dayOnly(new Date());
  await prisma.mealPlanPosting.updateMany({
    where: { assignmentId: id, status: { in: ['pending', 'failed'] }, date: { gte: today } },
    data: { status: 'skipped', error: 'Assignment cancelled before posting' },
  });

  return prisma.mealPlanAssignment.update({
    where: { id },
    data: { status: 'cancelled', cancelledAt: new Date() },
  });
}

// ─── Covers forecast — kitchen prep sheet for a given day ───

export async function coversForecast(tenantId: string, propertyId: string, date: string) {
  const day = dayOnly(new Date(date));

  const assignments = await prisma.mealPlanAssignment.findMany({
    where: {
      tenantId,
      status: 'active',
      reservation: { propertyId },
      AND: [{ startDate: { lte: day } }, { endDate: { gte: day } }],
    },
    include: {
      mealPlan: {
        select: {
          id: true,
          name: true,
          code: true,
          boardBasis: true,
          restaurant: { select: { name: true } },
        },
      },
      reservation: {
        select: {
          confirmationNumber: true,
          status: true,
          adults: true,
          children: true,
          guest: {
            select: {
              firstName: true,
              lastName: true,
              preferences: { where: { category: 'dietary' }, select: { key: true, value: true } },
            },
          },
        },
      },
    },
  });

  const byPlan = new Map<string, any>();
  let totalAdults = 0;
  let totalChildren = 0;
  const dietaryFlags: string[] = [];

  for (const a of assignments) {
    const key = a.mealPlan.id;
    if (!byPlan.has(key)) {
      byPlan.set(key, {
        plan: a.mealPlan,
        covers: 0,
        adults: 0,
        children: 0,
        reservations: [],
      });
    }
    const bucket = byPlan.get(key);
    bucket.covers += a.adults + a.children;
    bucket.adults += a.adults;
    bucket.children += a.children;
    bucket.reservations.push({
      confirmationNumber: a.reservation.confirmationNumber,
      status: a.reservation.status,
      guest: `${a.reservation.guest.firstName} ${a.reservation.guest.lastName}`,
      adults: a.adults,
      children: a.children,
      dietary: a.reservation.guest.preferences.map((p) => `${p.key}: ${p.value}`),
    });
    totalAdults += a.adults;
    totalChildren += a.children;
    for (const p of a.reservation.guest.preferences) {
      dietaryFlags.push(
        `${a.reservation.guest.firstName} ${a.reservation.guest.lastName} — ${p.value}`
      );
    }
  }

  return {
    date: day.toISOString().slice(0, 10),
    propertyId,
    totalCovers: totalAdults + totalChildren,
    totalAdults,
    totalChildren,
    planBreakdown: Array.from(byPlan.values()),
    dietaryFlags,
  };
}

// ─── Posting log ───

export async function listPostings(
  tenantId: string,
  query: { status?: string; date?: string } & PaginationInput
) {
  const where: Prisma.MealPlanPostingWhereInput = {
    tenantId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.date ? { date: dayOnly(new Date(query.date)) } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.mealPlanPosting.count({ where }),
    prisma.mealPlanPosting.findMany({
      where,
      include: {
        assignment: {
          include: {
            mealPlan: { select: { id: true, name: true, code: true, currency: true } },
            reservation: {
              select: {
                id: true,
                confirmationNumber: true,
                guest: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return paginate(rows, total, query);
}

// ─── The poster — idempotent per (assignment, date) ───

async function postOne(postingId: string): Promise<'posted' | 'failed' | 'skipped'> {
  const posting = await prisma.mealPlanPosting.findUnique({
    where: { id: postingId },
    include: {
      assignment: {
        include: {
          mealPlan: true,
          reservation: { include: { folio: true } },
        },
      },
    },
  });
  if (!posting) return 'skipped';
  if (posting.status === 'posted' || posting.folioItemId) return 'posted'; // re-post guard

  const { assignment } = posting;
  const { reservation, mealPlan } = assignment;

  if (assignment.status !== 'active' || reservation.status !== 'checked_in') {
    await prisma.mealPlanPosting.update({
      where: { id: postingId },
      data: { status: 'skipped', error: 'Reservation not checked in or assignment cancelled' },
    });
    return 'skipped';
  }

  if (!reservation.folio || reservation.folio.status !== 'open') {
    await prisma.mealPlanPosting.update({
      where: { id: postingId },
      data: {
        status: 'failed',
        error: 'No open folio on the reservation',
        retryCount: { increment: 1 },
      },
    });
    return 'failed';
  }

  try {
    const item = await postCharge(assignment.tenantId, reservation.folio.id, {
      type: 'service',
      description: `Meal plan — ${mealPlan.name} (${dayOnly(posting.date).toISOString().slice(0, 10)})`,
      amount: Number(posting.amount),
      quantity: 1,
      postedAt: new Date(),
    });

    await prisma.$transaction([
      prisma.mealPlanPosting.update({
        where: { id: postingId },
        data: { status: 'posted', folioItemId: item.id, error: null, postedAt: new Date() },
      }),
      prisma.reservation.update({
        where: { id: reservation.id },
        data: { balance: { increment: Number(posting.amount) } },
      }),
    ]);

    return 'posted';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.mealPlanPosting.update({
      where: { id: postingId },
      data: { status: 'failed', error: message.slice(0, 500), retryCount: { increment: 1 } },
    });
    return 'failed';
  }
}

/** Retry a single failed/skipped posting (manual action from the log). */
export async function retryPosting(tenantId: string, postingId: string) {
  const posting = await prisma.mealPlanPosting.findFirst({ where: { id: postingId, tenantId } });
  if (!posting) throw new AppError(404, 'Posting not found', 'NOT_FOUND');
  if (posting.status === 'posted') {
    throw new AppError(409, 'Posting already posted', 'CONFLICT');
  }
  await postOne(postingId);
  return prisma.mealPlanPosting.findUnique({
    where: { id: postingId },
    include: {
      assignment: {
        include: {
          mealPlan: { select: { id: true, name: true, code: true, currency: true } },
          reservation: {
            select: {
              id: true,
              confirmationNumber: true,
              guest: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  });
}

/**
 * Scan and post. For every active assignment whose window covers the
 * property's current business date, ensure a posting row exists, then post
 * it if the plan is configured for auto-post and in season. Safe to call
 * repeatedly — the unique key absorbs duplicates.
 */
export async function postDueMeals(tenantId?: string, propertyId?: string) {
  const properties = await prisma.property.findMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
      ...(propertyId ? { id: propertyId } : {}),
      status: 'active',
    },
    select: { id: true, tenantId: true, currentBusinessDate: true },
  });

  let created = 0;
  let posted = 0;
  let failed = 0;
  let skipped = 0;

  for (const property of properties) {
    const businessDate = dayOnly(property.currentBusinessDate);

    const assignments = await prisma.mealPlanAssignment.findMany({
      where: {
        tenantId: property.tenantId,
        status: 'active',
        reservation: { propertyId: property.id, status: 'checked_in' },
        AND: [{ startDate: { lte: businessDate } }, { endDate: { gte: businessDate } }],
      },
      include: { mealPlan: true },
    });

    for (const assignment of assignments) {
      const amount = computeDailyAmount(
        assignment.mealPlan,
        assignment.adults,
        assignment.children,
        {
          u6: assignment.mealPlan.childUnder6,
          u12: assignment.mealPlan.childUnder12,
          u16: assignment.mealPlan.childUnder16,
        }
      );

      const posting = await prisma.mealPlanPosting.upsert({
        where: {
          assignmentId_date: { assignmentId: assignment.id, date: businessDate },
        },
        update: {},
        create: {
          tenantId: property.tenantId,
          assignmentId: assignment.id,
          date: businessDate,
          amount,
          status: 'pending',
        },
      });
      if (posting.status === 'posted') continue;
      if (posting.createdAt.getTime() === posting.updatedAt.getTime()) created++;

      if (!assignment.mealPlan.autoPost) {
        skipped++;
        continue;
      }
      if (!planInSeason(assignment.mealPlan, businessDate)) {
        skipped++;
        continue;
      }

      const outcome = await postOne(posting.id);
      if (outcome === 'posted') posted++;
      else if (outcome === 'failed') failed++;
      else skipped++;
    }
  }

  const summary = { created, posted, failed, skipped };
  if (posted > 0 || failed > 0) {
    logger.info(summary, 'meal auto-post scan complete');
  }
  return summary;
}

// ─── Assertions ───

async function assertProperty(tenantId: string, propertyId: string) {
  const property = await prisma.property.findFirst({ where: { id: propertyId, tenantId } });
  if (!property) throw new AppError(404, 'Property not found', 'NOT_FOUND');
}

async function assertRestaurant(tenantId: string, restaurantId: string) {
  const restaurant = await prisma.restaurant.findFirst({ where: { id: restaurantId, tenantId } });
  if (!restaurant) throw new AppError(404, 'Restaurant not found', 'NOT_FOUND');
}
