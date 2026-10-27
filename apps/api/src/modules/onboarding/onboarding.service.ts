/* apps/api/src/modules/onboarding/onboarding.service.ts */
import { Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { parseCsv } from './onboarding.csv.js';

const CODE_RE = /^[A-Z0-9][A-Z0-9-]{1,19}$/;
const CURRENCY_RE = /^[A-Z]{3}$/;

const toStr = (v: unknown) => String(v ?? '').trim();
const toNum = (v: unknown): number | null => {
  const raw = String(v ?? '').trim();
  if (raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const isP2002 = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2002';

export interface CsvRowRec {
  rowNumber: number;
  propertyCode: string;
  propertyName: string;
  city: string;
  country: string;
  timezone: string;
  currency: string;
  roomTypeCode: string;
  roomTypeName: string;
  baseOccupancy: number;
  maxOccupancy: number;
  roomNumber: string;
  floor: string;
  ratePlanCode: string;
  ratePlanName: string;
  baseRate: number | null;
}

interface TemplateRoom {
  number?: string | null;
  floor?: string | null;
}

interface TemplateRatePlan {
  code: string;
  name?: string;
  baseRate?: number;
  currency?: string;
}

interface TemplateRoomType {
  code: string;
  name?: string;
  baseOccupancy?: number;
  maxOccupancy?: number;
  rooms?: TemplateRoom[];
  ratePlans?: TemplateRatePlan[];
}

export interface TemplateConfig {
  property?: {
    timezone?: string;
    currency?: string;
    address?: string | null;
    city?: string | null;
    country?: string | null;
  };
  roomTypes: TemplateRoomType[];
}

function assertConfig(config: unknown): TemplateConfig {
  const c = config as TemplateConfig | null;
  if (!c || typeof c !== 'object' || !Array.isArray(c.roomTypes)) {
    throw new AppError(
      400,
      'config must look like { property?, roomTypes: [...] }',
      'VALIDATION_ERROR'
    );
  }
  return c;
}

// ─── CSV import staging ───

export async function createImport(
  tenantId: string,
  userId: string | undefined,
  fileName: string,
  csv: string
) {
  const grid = parseCsv(csv);
  if (grid.length < 2) {
    throw new AppError(400, 'CSV has a header row but no data rows', 'CSV_EMPTY');
  }

  const header = grid[0].map((h) => h.toLowerCase());
  const idx = new Map<string, number>();
  header.forEach((h, i) => {
    if (h && !idx.has(h)) idx.set(h, i);
  });

  const required = ['propertycode', 'propertyname', 'roomtypecode', 'roomnumber'];
  const missingCols = required.filter((h) => !idx.has(h));
  if (missingCols.length > 0) {
    throw new AppError(400, `Missing required columns: ${missingCols.join(', ')}`, 'CSV_HEADERS');
  }

  const pick = (row: string[], key: string, def = ''): string => {
    const i = idx.get(key);
    return i === undefined ? def : toStr(row[i]);
  };

  const recs: (CsvRowRec & { errors: string[] })[] = [];
  grid.slice(1).forEach((row, i) => {
    if (row.every((c) => c === '')) return;
    const rowNumber = i + 2;
    const rec = {
      rowNumber,
      propertyCode: pick(row, 'propertycode').toUpperCase(),
      propertyName: pick(row, 'propertyname'),
      city: pick(row, 'city'),
      country: pick(row, 'country'),
      timezone: pick(row, 'timezone', 'UTC'),
      currency: pick(row, 'currency', 'ZAR').toUpperCase(),
      roomTypeCode: pick(row, 'roomtypecode').toUpperCase(),
      roomTypeName: pick(row, 'roomtypename') || pick(row, 'roomtypecode').toUpperCase(),
      baseOccupancy: toNum(row[idx.get('baseoccupancy')!]) ?? 2,
      maxOccupancy: toNum(row[idx.get('maxoccupancy')!]) ?? 4,
      roomNumber: pick(row, 'roomnumber'),
      floor: pick(row, 'floor'),
      ratePlanCode: pick(row, 'rateplancode').toUpperCase(),
      ratePlanName: pick(row, 'rateplanname') || pick(row, 'rateplancode').toUpperCase(),
      baseRate: toNum(row[idx.get('baserate')!]),
      errors: [] as string[],
    };

    if (!CODE_RE.test(rec.propertyCode))
      rec.errors.push('propertyCode must be 2-20 chars (letters, numbers, dashes)');
    if (!rec.propertyName) rec.errors.push('propertyName is required');
    if (!rec.roomTypeCode) rec.errors.push('roomTypeCode is required');
    if (!rec.roomNumber) rec.errors.push('roomNumber is required');
    if (!CURRENCY_RE.test(rec.currency))
      rec.errors.push('currency must be a 3-letter code (e.g. ZAR)');
    if (rec.baseOccupancy < 1 || rec.baseOccupancy > 20)
      rec.errors.push('baseOccupancy must be between 1 and 20');
    if (rec.maxOccupancy < rec.baseOccupancy)
      rec.errors.push('maxOccupancy must be >= baseOccupancy');
    if (rec.ratePlanCode && (rec.baseRate === null || rec.baseRate <= 0)) {
      rec.errors.push('baseRate must be a positive number when ratePlanCode is set');
    }
    recs.push(rec);
  });

  // duplicate room numbers inside the same property within the file
  const seen = new Map<string, (typeof recs)[number][]>();
  for (const r of recs) {
    if (!r.propertyCode || !r.roomNumber) continue;
    const k = `${r.propertyCode}|${r.roomNumber}`;
    const arr = seen.get(k) ?? [];
    arr.push(r);
    seen.set(k, arr);
  }
  for (const arr of seen.values()) {
    if (arr.length > 1) {
      for (const r of arr) {
        r.errors.push(
          `Duplicate roomNumber ${r.roomNumber} for property ${r.propertyCode} inside the CSV`
        );
      }
    }
  }

  // rate plan price consistency per property + rate plan code
  const rpPrice = new Map<string, number>();
  for (const r of recs) {
    if (!r.ratePlanCode || r.baseRate === null) continue;
    const k = `${r.propertyCode}|${r.ratePlanCode}`;
    const prev = rpPrice.get(k);
    if (prev === undefined) {
      rpPrice.set(k, r.baseRate);
    } else if (prev !== r.baseRate) {
      r.errors.push(
        `ratePlan ${r.ratePlanCode} has conflicting baseRate values (${prev} vs ${r.baseRate})`
      );
    }
  }

  // conflicts with properties already on the tenant
  const codes = [...new Set(recs.map((r) => r.propertyCode).filter(Boolean))];
  const existing = await prisma.property.findMany({
    where: { tenantId, code: { in: codes } },
    select: { code: true },
  });
  const existingSet = new Set(existing.map((p) => p.code));
  for (const r of recs) {
    if (existingSet.has(r.propertyCode)) {
      r.errors.push(`Property code ${r.propertyCode} already exists`);
    }
  }

  const valid = recs.filter((r) => r.errors.length === 0);
  const stats = {
    properties: new Set(valid.map((r) => r.propertyCode)).size,
    roomTypes: new Set(valid.map((r) => `${r.propertyCode}|${r.roomTypeCode}`)).size,
    rooms: valid.length,
    ratePlans: new Set(
      valid.filter((r) => r.ratePlanCode).map((r) => `${r.propertyCode}|${r.ratePlanCode}`)
    ).size,
    errorRows: recs.length - valid.length,
  };

  const imp = await prisma.onboardingImport.create({
    data: {
      tenantId,
      type: 'csv',
      status: 'ready',
      fileName: fileName.slice(0, 255),
      mapping: { headers: grid[0] } as unknown as Prisma.InputJsonValue,
      stats: stats as unknown as Prisma.InputJsonValue,
      createdById: userId,
      rows: {
        create: recs.map((r) => {
          const { errors, ...rest } = r;
          return {
            rowNumber: r.rowNumber,
            status: errors.length ? 'error' : 'pending',
            error: errors.length ? errors.join('; ') : null,
            data: rest as unknown as Prisma.InputJsonValue,
          };
        }),
      },
    },
    include: { rows: { orderBy: { rowNumber: 'asc' } } },
  });

  logger.info({ tenantId, importId: imp.id, stats }, 'onboarding import staged');
  return imp;
}

export async function listImports(tenantId: string) {
  return prisma.onboardingImport.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      type: true,
      status: true,
      fileName: true,
      stats: true,
      createdAt: true,
    },
  });
}

export async function getImport(tenantId: string, importId: string) {
  const imp = await prisma.onboardingImport.findFirst({
    where: { id: importId, tenantId },
    include: { rows: { orderBy: { rowNumber: 'asc' } } },
  });
  if (!imp) throw new AppError(404, 'Import not found', 'NOT_FOUND');
  return imp;
}

// ─── CSV import execution (one property per transaction) ───

export async function executeImport(tenantId: string, importId: string) {
  const imp = await prisma.onboardingImport.findFirst({
    where: { id: importId, tenantId },
    include: { rows: { orderBy: { rowNumber: 'asc' } } },
  });
  if (!imp) throw new AppError(404, 'Import not found', 'NOT_FOUND');
  if (imp.status === 'completed')
    throw new AppError(409, 'This import has already been executed', 'ALREADY_EXECUTED');

  const claimed = await prisma.onboardingImport.updateMany({
    where: { id: imp.id, status: { notIn: ['completed', 'importing'] } },
    data: { status: 'importing' },
  });
  if (claimed.count === 0) throw new AppError(409, 'Import is already running', 'IN_PROGRESS');

  const pending = imp.rows.filter((row) => row.status === 'pending');
  const groups = new Map<string, typeof pending>();
  for (const row of pending) {
    const d = row.data as unknown as CsvRowRec;
    const arr = groups.get(d.propertyCode) ?? [];
    arr.push(row);
    groups.set(d.propertyCode, arr);
  }

  const result = { properties: 0, roomTypes: 0, rooms: 0, ratePlans: 0, errors: 0 };

  for (const [code, rows] of groups) {
    try {
      const counts = await prisma.$transaction(async (tx) => {
        const first = rows[0].data as unknown as CsvRowRec;
        const property = await tx.property.create({
          data: {
            tenantId,
            name: first.propertyName,
            code,
            city: first.city || null,
            country: first.country || null,
            timezone: first.timezone || 'UTC',
            currency: first.currency || 'ZAR',
          },
        });

        const rtMap = new Map<string, string>();
        const rpSet = new Set<string>();
        let rooms = 0;

        for (const row of rows) {
          const d = row.data as unknown as CsvRowRec;
          let roomTypeId = rtMap.get(d.roomTypeCode);
          if (!roomTypeId) {
            const rt = await tx.roomType.create({
              data: {
                tenantId,
                propertyId: property.id,
                name: d.roomTypeName || d.roomTypeCode,
                code: d.roomTypeCode,
                baseOccupancy: d.baseOccupancy,
                maxOccupancy: d.maxOccupancy,
              },
            });
            roomTypeId = rt.id;
            rtMap.set(d.roomTypeCode, roomTypeId);
          }

          const roomExists = await tx.room.findFirst({
            where: { propertyId: property.id, number: d.roomNumber },
          });
          if (!roomExists) {
            await tx.room.create({
              data: {
                tenantId,
                propertyId: property.id,
                roomTypeId,
                number: d.roomNumber,
                floor: d.floor || null,
              },
            });
            rooms++;
          }

          const rpKey = `${d.roomTypeCode}|${d.ratePlanCode}`;
          if (d.ratePlanCode && !rpSet.has(rpKey)) {
            rpSet.add(rpKey);
            await tx.ratePlan.create({
              data: {
                tenantId,
                propertyId: property.id,
                roomTypeId,
                name: d.ratePlanName || d.ratePlanCode,
                code: d.ratePlanCode,
                baseRate: new Prisma.Decimal(d.baseRate ?? 0),
                currency: d.currency || 'ZAR',
              },
            });
          }
        }
        return { roomTypes: rtMap.size, rooms, ratePlans: rpSet.size };
      });

      result.properties += 1;
      result.roomTypes += counts.roomTypes;
      result.rooms += counts.rooms;
      result.ratePlans += counts.ratePlans;
      await prisma.onboardingImportRow.updateMany({
        where: { id: { in: rows.map((r2) => r2.id) } },
        data: { status: 'created', error: null },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors += rows.length;
      await prisma.onboardingImportRow.updateMany({
        where: { id: { in: rows.map((r2) => r2.id) } },
        data: { status: 'error', error: msg.slice(0, 500) },
      });
      logger.error({ err, tenantId, importId, code }, 'onboarding property import failed');
    }
  }

  const completed = await prisma.onboardingImport.update({
    where: { id: imp.id },
    data: {
      status: 'completed',
      stats: { ...(imp.stats as object), executed: result } as unknown as Prisma.InputJsonValue,
    },
    include: { rows: { orderBy: { rowNumber: 'asc' } } },
  });
  return completed;
}

// ─── Templates ───

export async function listTemplates(tenantId: string) {
  return prisma.propertyTemplate.findMany({
    where: { tenantId, isChainStandard: false },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createTemplate(
  tenantId: string,
  userId: string | undefined,
  name: string,
  config: unknown
) {
  assertConfig(config);
  try {
    return await prisma.propertyTemplate.create({
      data: {
        tenantId,
        name: name.slice(0, 120),
        config: config as unknown as Prisma.InputJsonValue,
        createdById: userId,
      },
    });
  } catch (e) {
    if (isP2002(e))
      throw new AppError(409, 'A template with this name already exists', 'DUPLICATE');
    throw e;
  }
}

export async function deleteTemplate(tenantId: string, id: string) {
  const r = await prisma.propertyTemplate.deleteMany({ where: { id, tenantId } });
  if (r.count === 0) throw new AppError(404, 'Template not found', 'NOT_FOUND');
  return { deleted: true };
}

async function captureConfig(tenantId: string, propertyId: string): Promise<TemplateConfig> {
  const p = await prisma.property.findFirst({
    where: { id: propertyId, tenantId },
    include: {
      roomTypes: {
        include: {
          rooms: { orderBy: { number: 'asc' } },
          ratePlans: true,
        },
      },
    },
  });
  if (!p) throw new AppError(404, 'Property not found', 'NOT_FOUND');

  return {
    property: {
      timezone: p.timezone,
      currency: p.currency,
      address: p.address,
      city: p.city,
      country: p.country,
    },
    roomTypes: p.roomTypes.map((rt) => ({
      code: rt.code,
      name: rt.name,
      baseOccupancy: rt.baseOccupancy,
      maxOccupancy: rt.maxOccupancy,
      rooms: rt.rooms.map((r) => ({ number: r.number, floor: r.floor })),
      ratePlans: rt.ratePlans.map((rp) => ({
        code: rp.code,
        name: rp.name,
        baseRate: Number(rp.baseRate),
        currency: rp.currency,
      })),
    })),
  };
}

export async function captureTemplateFromProperty(
  tenantId: string,
  userId: string | undefined,
  propertyId: string,
  name: string
) {
  const config = await captureConfig(tenantId, propertyId);
  return createTemplate(tenantId, userId, name, config);
}

interface PropertyCreateInput {
  name: string;
  code: string;
  city?: string;
  country?: string;
}

async function createPropertyFromConfig(
  tenantId: string,
  cfg: TemplateConfig,
  input: PropertyCreateInput,
  userId: string | undefined
) {
  const code = input.code.toUpperCase();
  if (!CODE_RE.test(code)) {
    throw new AppError(
      400,
      'code must be 2-20 chars (letters, numbers, dashes)',
      'VALIDATION_ERROR'
    );
  }
  if (!input.name?.trim()) throw new AppError(400, 'name is required', 'VALIDATION_ERROR');

  const clash = await prisma.property.findFirst({
    where: { tenantId, code },
    select: { id: true },
  });
  if (clash) throw new AppError(409, `Property code ${code} already exists`, 'DUPLICATE');

  const out = await prisma.$transaction(async (tx) => {
    const p = await tx.property.create({
      data: {
        tenantId,
        name: input.name.trim(),
        code,
        address: cfg.property?.address ?? null,
        city: input.city ?? cfg.property?.city ?? null,
        country: input.country ?? cfg.property?.country ?? null,
        timezone: cfg.property?.timezone || 'UTC',
        currency: cfg.property?.currency || 'ZAR',
      },
    });

    let rooms = 0;
    let ratePlans = 0;
    for (const rt of cfg.roomTypes) {
      const roomType = await tx.roomType.create({
        data: {
          tenantId,
          propertyId: p.id,
          name: rt.name || rt.code,
          code: rt.code,
          baseOccupancy: rt.baseOccupancy ?? 2,
          maxOccupancy: rt.maxOccupancy ?? 4,
        },
      });
      for (const r of rt.rooms ?? []) {
        if (!r.number) continue;
        const dup = await tx.room.findFirst({ where: { propertyId: p.id, number: r.number } });
        if (!dup) {
          await tx.room.create({
            data: {
              tenantId,
              propertyId: p.id,
              roomTypeId: roomType.id,
              number: r.number,
              floor: r.floor ?? null,
            },
          });
          rooms++;
        }
      }
      for (const rp of rt.ratePlans ?? []) {
        if (!rp.code) continue;
        const rpDup = await tx.ratePlan.findFirst({ where: { propertyId: p.id, code: rp.code } });
        if (!rpDup) {
          await tx.ratePlan.create({
            data: {
              tenantId,
              propertyId: p.id,
              roomTypeId: roomType.id,
              name: rp.name || rp.code,
              code: rp.code,
              baseRate: new Prisma.Decimal(rp.baseRate ?? 0),
              currency: rp.currency || cfg.property?.currency || 'ZAR',
            },
          });
          ratePlans++;
        }
      }
    }
    return { property: p, roomTypes: cfg.roomTypes.length, rooms, ratePlans };
  });

  logger.info(
    { tenantId, propertyId: out.property.id, code, userId },
    'property created via onboarding'
  );
  return out;
}

export async function applyTemplate(
  tenantId: string,
  userId: string | undefined,
  templateId: string,
  input: PropertyCreateInput
) {
  const t = await prisma.propertyTemplate.findFirst({ where: { id: templateId, tenantId } });
  if (!t) throw new AppError(404, 'Template not found', 'NOT_FOUND');
  return createPropertyFromConfig(tenantId, assertConfig(t.config), input, userId);
}

export async function cloneProperty(
  tenantId: string,
  userId: string | undefined,
  sourcePropertyId: string,
  input: PropertyCreateInput
) {
  const cfg = await captureConfig(tenantId, sourcePropertyId);
  return createPropertyFromConfig(tenantId, cfg, input, userId);
}

// ─── Chain-standard config ───

export async function getChainStandard(tenantId: string) {
  return prisma.propertyTemplate.findFirst({ where: { tenantId, isChainStandard: true } });
}

export async function saveChainStandard(
  tenantId: string,
  userId: string | undefined,
  input: { propertyId?: string; name?: string; config?: unknown }
) {
  let config = input.config;
  if (!config && input.propertyId) {
    config = await captureConfig(tenantId, input.propertyId);
  }
  if (!config) {
    throw new AppError(
      400,
      'Provide propertyId (capture from a property) or a config object',
      'VALIDATION_ERROR'
    );
  }
  assertConfig(config);

  const existing = await prisma.propertyTemplate.findFirst({
    where: { tenantId, isChainStandard: true },
  });
  if (existing) {
    return prisma.propertyTemplate.update({
      where: { id: existing.id },
      data: {
        config: config as unknown as Prisma.InputJsonValue,
        name: (input.name ?? existing.name).slice(0, 120),
      },
    });
  }
  try {
    return await prisma.propertyTemplate.create({
      data: {
        tenantId,
        name: (input.name ?? 'Chain Standard').slice(0, 120),
        isChainStandard: true,
        config: config as unknown as Prisma.InputJsonValue,
        createdById: userId,
      },
    });
  } catch (e) {
    if (isP2002(e)) {
      return prisma.propertyTemplate.create({
        data: {
          tenantId,
          name: `${(input.name ?? 'Chain Standard').slice(0, 100)} ${Date.now().toString(36)}`,
          isChainStandard: true,
          config: config as unknown as Prisma.InputJsonValue,
          createdById: userId,
        },
      });
    }
    throw e;
  }
}
