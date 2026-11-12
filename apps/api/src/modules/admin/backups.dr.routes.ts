/* apps/api/src/modules/admin/backups.dr.routes.ts
 * Backups & DR — production-grade program.
 * Real pg_dump/pg_restore executor (host binary or docker exec), checksums,
 * scratch-verify writes restoreTested*, DR drills measure real RTO,
 * stale-backup detector feeds the exceptions queue, downloads are audit-trailed.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { spawn, execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
} from 'node:fs';
import { readFile, unlink, stat } from 'node:fs/promises';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import cron from 'node-cron';
import { Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { logger } from '../../common/logger.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { requireAdminRole } from './admin.middleware.js';

export const backupsDrRouter = Router();
import { appendFileSync } from 'node:fs';
const bk = (s: string) => {
  appendFileSync('/tmp/bk-debug.log', new Date().toISOString() + ' ' + s + '\n');
  logger.info('BK-' + s);
};
backupsDrRouter.use((req, _res, next) => {
  bk(`ROUTER ${req.method} ${req.path}`);
  next();
});
backupsDrRouter.use(authMiddleware, requireAdminRole);

// ─────────────────────────── config ───────────────────────────

const BACKUP_DIR = path.resolve(process.cwd(), 'storage', 'backups');
mkdirSync(BACKUP_DIR, { recursive: true });

interface DbCreds {
  user: string;
  pass: string;
  host: string;
  port: string;
  db: string;
}
function dbCreds(): DbCreds {
  const m = (process.env.DATABASE_URL || '').match(
    /postgresql(?:ql)??:\/\/([^:]+):([^@]*)@([^:/]+):(\d+)\/([^?]+)/
  );
  if (!m) throw new Error('DATABASE_URL not parseable');
  return { user: m[1], pass: m[2], host: m[3], port: m[4], db: m[5] };
}

let dockerDbId: string | null | undefined;
function dbContainer(): string | null {
  if (dockerDbId !== undefined) return dockerDbId;
  try {
    const out = execFileSync('docker', ['ps', '--filter', 'publish=5432', '--format', '{{.ID}}'], {
      encoding: 'utf-8',
    });
    dockerDbId = out.trim().split('\n')[0] || null;
  } catch {
    dockerDbId = null;
  }
  return dockerDbId;
}
function hasPgBin(bin: string): boolean {
  try {
    execFileSync('bash', ['-lc', `command -v ${bin}`], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
/** Run a pg client binary; auto-falls back to `docker exec` into the DB container. */
function pg(bin: string, args: string[], envExtra: NodeJS.ProcessEnv = {}) {
  const c = dbCreds();
  const env = { ...process.env, PGPASSWORD: c.pass, ...envExtra } as NodeJS.ProcessEnv;
  if (hasPgBin(bin)) return spawn(bin, args, { env });
  const id = dbContainer();
  if (!id) throw new Error(`${bin} not on host and no docker DB container found`);
  return spawn('docker', ['exec', '-i', '-e', `PGPASSWORD=${c.pass}`, id, bin, ...args], { env });
}

const CORE_TABLES = [
  'tenants',
  'users',
  'properties',
  'guests',
  'reservations',
  'folios',
  'folio_items',
  'rooms',
  'room_types',
  'rate_plans',
  'payments',
  'payment_requests',
  'audit_logs',
  'loyalty_transactions',
];

// ─────────────────────────── helpers ──────────────────────────

const now = () => new Date();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function run(strings: TemplateStringsArray, ...vals: any[]) {
  return prisma.$executeRaw(Prisma.sql(strings as unknown as TemplateStringsArray, ...vals));
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function q(strings: TemplateStringsArray, ...vals: any[]) {
  return prisma.$queryRaw(Prisma.sql(strings as unknown as TemplateStringsArray, ...vals));
}

async function audit(
  req: Request,
  action: string,
  entity: string,
  entityId: string,
  reason?: string
) {
  const email = (req as unknown as { user?: { email?: string } }).user?.email || 'unknown';
  const ip = req.ip || req.socket.remoteAddress || '';
  await run`INSERT INTO "platform_audit_events" ("id","actorEmail","action","entity","entityId","reason","source","ipAddress","createdAt")
    VALUES (${randomUUID()}, ${email}, ${action}, ${entity}, ${entityId}, ${reason ?? null}, ${'admin_console'}, ${ip}, ${now()})`;
}

// ─────────────────────────── executor ─────────────────────────

async function hashFile(p: string): Promise<string> {
  const h = createHash('sha256');
  h.update(await readFile(p));
  return h.digest('hex');
}

interface BackupOpts {
  name?: string;
  type?: string;
  tables?: string[];
  retentionDays?: number;
  storage?: string;
  actor?: string;
}

async function executeBackup(opts: BackupOpts & { id?: string }): Promise<string> {
  const id = opts.id ?? randomUUID();
  const type =
    opts.type === 'incremental' ? 'incremental' : opts.type === 'schema' ? 'schema' : 'full';
  const name = opts.name || `manual-${type}-${new Date().toISOString().slice(0, 16)}`;
  const retention = opts.retentionDays ?? 30;
  const storage = process.env.BACKUP_S3_BUCKET ? (opts.storage ?? 'local') : 'local';
  const startedAt = now();

  bk('INSERT start');
  await run`INSERT INTO "backup_runs" ("id","kind","status","destination","startedAt","actor","name","type","tables","retentionDays","storage")
    VALUES (${id}, ${type}, 'running', ${BACKUP_DIR}, ${startedAt}, ${opts.actor ?? 'system'}, ${name}, ${type}, ${JSON.stringify(opts.tables ?? [])}::jsonb, ${retention}, ${storage})`;
  bk('INSERT done');

  setImmediate(async () => {
    const c = dbCreds();
    const rawPath = path.join(BACKUP_DIR, `${id}.dump`);
    const gzPath = `${rawPath}.gz`;
    try {
      const args = [
        '-U',
        c.user,
        '-h',
        c.host,
        '-p',
        c.port,
        '-Fc',
        '--no-owner',
        '--no-privileges',
      ];
      if (type === 'schema') args.push('--schema-only');
      if (opts.tables?.length) for (const t of opts.tables) args.push('-t', t);
      args.push(c.db);
      const dump = pg('pg_dump', args);
      await pipeline(dump.stdout as NodeJS.ReadableStream, createGzip(), createWriteStream(gzPath));
      let settled = false;
      const code = await new Promise<number | null>((res) => {
        dump.on('close', (c) => {
          if (!settled) {
            settled = true;
            res(c);
          }
        });
        dump.on('exit', (c) => {
          if (!settled) {
            settled = true;
            res(c);
          }
        });
        dump.on('error', () => {
          if (!settled) {
            settled = true;
            res(null);
          }
        });
      });
      if (code !== 0) throw new Error(`pg_dump exited ${code}`);

      const checksum = await hashFile(gzPath);
      const sizeBytes = BigInt((await stat(gzPath)).size);
      let destination = gzPath;
      if (storage === 's3' && process.env.BACKUP_S3_BUCKET) {
        const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
        const s3 = new S3Client({
          region: process.env.S3_REGION || process.env.AWS_REGION || 'af-south-1',
        });
        const key = `backups/${new Date().toISOString().slice(0, 10)}/${path.basename(gzPath)}`;
        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.BACKUP_S3_BUCKET!,
            Key: key,
            Body: await readFile(gzPath),
          })
        );
        destination = `s3://${process.env.BACKUP_S3_BUCKET}/${key}`;
        await unlink(gzPath).catch(() => {});
      }
      await run`UPDATE "backup_runs" SET "status"='completed', "destination"=${destination}, "sizeBytes"=${sizeBytes},
      "checksum"=${checksum}, "finishedAt"=${now()} WHERE "id"=${id}`;
      logger.info({ id, sizeBytes: sizeBytes.toString(), destination }, 'backup completed');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await run`UPDATE "backup_runs" SET "status"='failed', "error"=${msg}, "finishedAt"=${now()} WHERE "id"=${id}`;
      logger.error({ id, err: msg }, 'backup failed');
      throw e;
    } finally {
      if (existsSync(rawPath)) unlinkSync(rawPath);
    }
  });
  return id;
}

// ───────────────────── verify / restore ───────────────────────

async function restoreIntoScratch(
  file: string
): Promise<{ checks: Array<{ check: string; passed: boolean; detail: string }> }> {
  const c = dbCreds();
  const scratchDb = `vimad_verify_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const checks: Array<{ check: string; passed: boolean; detail: string }> = [];

  const createdb = pg('createdb', ['-U', c.user, '-h', c.host, '-p', c.port, scratchDb]);
  await new Promise<void>((res, rej) => {
    createdb.on('close', (code) => (code === 0 ? res() : rej(new Error('createdb failed'))));
  });

  try {
    const restore = pg('pg_restore', [
      '-U',
      c.user,
      '-h',
      c.host,
      '-p',
      c.port,
      '-d',
      scratchDb,
      '--no-owner',
      '--no-privileges',
      file,
    ]);
    const rcode = await new Promise<number | null>((res) => restore.on('close', res));
    checks.push({
      check: 'pg_restore exits cleanly',
      passed: rcode === 0,
      detail: `exit code ${rcode}`,
    });

    for (const t of CORE_TABLES.slice(0, 8)) {
      const live =
        (await q`SELECT count(*)::int AS n FROM ${Prisma.raw(`"${t}"`)}`) as unknown as Array<{
          n: number;
        }>;
      const ps = pg('psql', [
        '-U',
        c.user,
        '-h',
        c.host,
        '-p',
        c.port,
        '-d',
        scratchDb,
        '-tAc',
        `SELECT count(*) FROM "${t}"`,
      ]);
      const out = await new Promise<string>((res) => {
        let b = '';
        ps.stdout!.on('data', (d) => (b += d));
        ps.on('close', () => res(b.trim()));
      });
      const scratchN = parseInt(out || '0', 10);
      const liveN = live?.[0]?.n ?? 0;
      checks.push({
        check: `table "${t}" row parity`,
        passed: scratchN === liveN,
        detail: `backup ${scratchN} vs live ${liveN}`,
      });
    }
  } finally {
    const drop = pg('dropdb', ['-U', c.user, '-h', c.host, '-p', c.port, '--force', scratchDb]);
    await new Promise<void>((res) => drop.on('close', () => res()));
  }
  return { checks };
}

async function verifyBackup(
  backupId: string,
  createdBy?: string
): Promise<{
  jobId: string;
  checks: Array<{ check: string; passed: boolean; detail: string }>;
  passed: boolean;
}> {
  const jobId = randomUUID();
  const t0 = Date.now();
  await run`INSERT INTO "dr_restore_jobs" ("id","backupId","target","verify","status","createdBy") VALUES (${jobId}, ${backupId}, 'scratch', true, 'running', ${createdBy ?? null})`;
  try {
    const rows =
      (await q`SELECT "destination" FROM "backup_runs" WHERE "id"=${backupId}`) as unknown as Array<{
        destination: string;
      }>;
    const dest = rows[0]?.destination;
    if (!dest || !existsSync(dest))
      throw new Error('backup file missing (S3-hosted files must be re-downloaded to verify)');

    const { checks } = await restoreIntoScratch(dest);
    const passed = checks.every((c) => c.passed);
    const status = passed ? 'passed' : 'failed';
    const log = checks
      .map((c) => `${c.passed ? 'PASS' : 'FAIL'} ${c.check}: ${c.detail}`)
      .join('\n');

    await run`UPDATE "backup_runs" SET "restoreTestedAt"=${now()}, "restoreTestedStatus"=${status}, "restoreTestedLog"=${log}, "verified"=${passed} WHERE "id"=${backupId}`;
    await run`UPDATE "dr_restore_jobs" SET "status"=${status}, "checks"=${JSON.stringify(checks)}::jsonb, "finishedAt"=${now()}, "durationMs"=${Date.now() - t0} WHERE "id"=${jobId}`;
    return { jobId, checks, passed };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await run`UPDATE "backup_runs" SET "restoreTestedAt"=${now()}, "restoreTestedStatus"='failed', "restoreTestedLog"=${msg} WHERE "id"=${backupId}`;
    await run`UPDATE "dr_restore_jobs" SET "status"='failed', "error"=${msg}, "finishedAt"=${now()}, "durationMs"=${Date.now() - t0} WHERE "id"=${jobId}`;
    throw e;
  }
}

// ─────────────────────── schedules engine ─────────────────────

function cronFieldMatch(field: string, v: number): boolean {
  if (field === '*') return true;
  return field.split(',').some((x) => {
    if (x.includes('/')) {
      const [base, step] = x.split('/');
      if (base !== '*' && !cronFieldMatch(base, v)) return false;
      return v % parseInt(step, 10) === 0;
    }
    if (x.includes('-')) {
      const [a, b] = x.split('-').map(Number);
      return v >= a && v <= b;
    }
    return parseInt(x, 10) === v;
  });
}

function nextRun(cronExpr: string): Date | null {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const d = new Date();
  d.setSeconds(0, 0);
  for (let i = 0; i < 366 * 24 * 60; i++) {
    d.setMinutes(d.getMinutes() + 1);
    const [mi, h, dom, mo, dow] = parts;
    if (
      cronFieldMatch(mi, d.getMinutes()) &&
      cronFieldMatch(h, d.getHours()) &&
      cronFieldMatch(dom, d.getDate()) &&
      cronFieldMatch(mo, d.getMonth() + 1) &&
      (dow === '*' ? true : cronFieldMatch(dow, d.getDay()))
    )
      return d;
  }
  return null;
}

async function runDueSchedules() {
  try {
    const due =
      (await q`SELECT * FROM "backup_schedules" WHERE "isActive"=true AND "nextRunAt" IS NOT NULL AND "nextRunAt" <= ${now()}`) as Array<
        Record<string, unknown>
      >;
    for (const s of due) {
      await executeBackup({
        name: s.name as string,
        type: s.type as string,
        tables: (s.tables as string[]) ?? [],
        retentionDays: s.retentionDays as number,
        storage: s.storage as string,
        actor: `schedule:${s.name}`,
      });
      await run`UPDATE "backup_schedules" SET "lastRunAt"=${now()}, "nextRunAt"=${nextRun(s.cron as string)}, "updatedAt"=${now()} WHERE "id"=${s.id}`;
    }
  } catch (e) {
    logger.error({ err: e }, 'schedule sweep failed');
  }
}

async function detectStale() {
  const settings =
    (await q`SELECT "rpoTargetMinutes" FROM "backup_settings" WHERE "id"='default'`) as Array<{
      rpoTargetMinutes: number;
    }>;
  const targetMin = settings[0]?.rpoTargetMinutes ?? 1440;
  const last =
    (await q`SELECT "finishedAt" FROM "backup_runs" WHERE "status"='completed' ORDER BY "finishedAt" DESC LIMIT 1`) as Array<{
      finishedAt: Date | null;
    }>;
  const lastAt: Date | null = last[0]?.finishedAt ?? null;
  const ageMin = lastAt ? (Date.now() - new Date(lastAt).getTime()) / 60000 : Infinity;
  if (ageMin > targetMin * 1.5) {
    await run`INSERT INTO "exceptions" ("id","tenantId","type","severity","title","detail","recommendedAction","dedupeKey","status","slaDueAt","createdAt","updatedAt")
      VALUES (${randomUUID()}, null, 'backup_stale', 'critical', 'No successful backup within 1.5× RPO target',
      ${`Last completed backup: ${lastAt ? lastAt.toISOString() : 'never'}. Age ${Math.round(ageMin)} min vs target ${targetMin} min.`},
      'Run a manual backup and investigate the schedule engine', 'backup-stale', 'open', ${new Date(Date.now() + 2 * 3600 * 1000)}, ${now()}, ${now()})
      ON CONFLICT ("tenantId","dedupeKey") DO UPDATE SET "detail"=EXCLUDED."detail", "updatedAt"=${now()}`;
    return { stale: true, ageMin: Math.round(ageMin), targetMin };
  }
  return { stale: false, ageMin: Math.round(ageMin), targetMin };
}

// ─────────────────────────── stats ────────────────────────────

async function buildStats() {
  const [tot, size, last, rate, verified] = await Promise.all([
    q`SELECT count(*)::int AS n FROM "backup_runs"` as Promise<Array<{ n: number }>>,
    q`SELECT coalesce(sum("sizeBytes"),0)::text AS n FROM "backup_runs" WHERE "status"='completed'` as Promise<
      Array<{ n: string }>
    >,
    q`SELECT "finishedAt" FROM "backup_runs" WHERE "status"='completed' ORDER BY "finishedAt" DESC LIMIT 1` as Promise<
      Array<{ finishedAt: Date }>
    >,
    q`SELECT count(*) FILTER (WHERE "status"='completed')::float / nullif(count(*),0) AS r FROM "backup_runs" WHERE "startedAt" > ${new Date(Date.now() - 30 * 864e5)}` as Promise<
      Array<{ r: number | null }>
    >,
    q`SELECT "restoreTestedAt","restoreTestedStatus" FROM "backup_runs" WHERE "restoreTestedStatus" IS NOT NULL ORDER BY "restoreTestedAt" DESC LIMIT 1` as Promise<
      Array<{ restoreTestedAt: Date; restoreTestedStatus: string }>
    >,
  ]);
  let dirBytes = 0;
  try {
    for (const f of readdirSync(BACKUP_DIR)) {
      try {
        dirBytes += statSync(path.join(BACKUP_DIR, f)).size;
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
  const settings =
    (await q`SELECT "rpoTargetMinutes","rtoTargetHours" FROM "backup_settings" WHERE "id"='default'`) as Array<{
      rpoTargetMinutes: number;
      rtoTargetHours: number;
    }>;
  const lastAt: Date | null = last[0]?.finishedAt ?? null;
  const rpoActualMinutes = lastAt
    ? Math.round((Date.now() - new Date(lastAt).getTime()) / 60000)
    : null;
  const drills =
    (await q`SELECT "rtoSeconds" FROM "dr_drills" WHERE "status"='completed' ORDER BY "startedAt" DESC LIMIT 1`) as Array<{
      rtoSeconds: number;
    }>;
  const running =
    (await q`SELECT count(*)::int AS n FROM "backup_runs" WHERE "status"='running'`) as Array<{
      n: number;
    }>;
  return {
    totalBackups: tot[0]?.n ?? 0,
    totalSize: Number(size[0]?.n ?? 0),
    storageUsed: dirBytes,
    lastBackupAt: lastAt,
    successRate: rate[0]?.r == null ? null : Math.round(rate[0].r * 100),
    lastVerified: verified[0] ?? null,
    rpoTargetMinutes: settings[0]?.rpoTargetMinutes ?? 1440,
    rtoTargetHours: settings[0]?.rtoTargetHours ?? 4,
    rpoActualMinutes,
    rtoActualSeconds: drills[0]?.rtoSeconds ?? null,
    running: running[0]?.n ?? 0,
  };
}

async function coverage() {
  const t = async (table: string) =>
    (
      (await q`SELECT count(*)::int AS n FROM ${Prisma.raw(`"${table}"`)}`) as Array<{ n: number }>
    )[0]?.n ?? 0;
  const [tenants, properties, guests, reservations, folios, payments, users] = await Promise.all([
    t('tenants'),
    t('properties'),
    t('guests'),
    t('reservations'),
    t('folios'),
    t('payments'),
    t('users'),
  ]);
  return {
    tenants,
    properties,
    guests,
    reservations,
    folios,
    payments,
    users,
    coreTables: CORE_TABLES.length,
  };
}

// ─────────────────────────── routes ───────────────────────────

backupsDrRouter.get('/backups', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const runs =
      (await q`SELECT "id","name","kind","type","status","destination","sizeBytes","checksum","actor",
      "restoreTestedAt","restoreTestedStatus","verified","retentionDays","storage","error","startedAt","finishedAt","tables"
      FROM "backup_runs" ORDER BY "startedAt" DESC LIMIT 100`) as Array<Record<string, unknown>>;
    res.json({
      data: runs.map((r) => ({
        ...r,
        sizeBytes: r.sizeBytes == null ? null : Number(r.sizeBytes),
      })),
    });
  } catch (e) {
    next(e);
  }
});

backupsDrRouter.post('/backups', async (req: Request, res: Response, next: NextFunction) => {
  try {
    bk('POST enter');
    const { name, type, tables, retentionDays, storage } = (req.body ?? {}) as Record<
      string,
      unknown
    >;
    if (
      tables &&
      (!Array.isArray(tables) ||
        tables.some((t) => typeof t !== 'string' || !/^[a-z_]+$/.test(t as string)))
    ) {
      res.status(400).json({ error: 'tables must be an array of snake_case table names' });
      return;
    }
    const email = (req as unknown as { user?: { email?: string } }).user?.email;
    bk('POST pre-exec');
    const id = await executeBackup({
      name: name as string,
      type: type as string,
      tables: tables as string[],
      retentionDays: retentionDays as number,
      storage: storage as string,
      actor: `manual:${email}`,
    });
    bk('POST sending 202');
    res.status(202).json({ data: { id } });
  } catch (e) {
    next(e);
  }
});

backupsDrRouter.get('/backups/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: await buildStats() });
  } catch (e) {
    next(e);
  }
});

backupsDrRouter.get(
  '/backups/coverage',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await coverage() });
    } catch (e) {
      next(e);
    }
  }
);

backupsDrRouter.get('/backups/retention', (_req: Request, res: Response) => {
  res.json({
    data: [
      {
        tier: 'Daily',
        cadence: 'Every day',
        keepFor: '30 days',
        enforcement: 'backup_runs.retentionDays + manual purge',
      },
      {
        tier: 'Weekly',
        cadence: 'Sundays 02:00',
        keepFor: '12 weeks',
        enforcement: 'schedule + retentionDays',
      },
      {
        tier: 'Monthly',
        cadence: '1st 02:00',
        keepFor: '12 months',
        enforcement: 'schedule + retentionDays',
      },
      {
        tier: 'Legal hold',
        cadence: 'On demand',
        keepFor: 'Until released',
        enforcement: 'retention_policies.legalHold (honoured by purge job)',
      },
    ],
  });
});

backupsDrRouter.get(
  '/backups/settings',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: ((await q`SELECT * FROM "backup_settings" WHERE "id"='default'`) as any[])[0],
      });
    } catch (e) {
      next(e);
    }
  }
);
backupsDrRouter.put(
  '/backups/settings',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rpo = Math.max(
        1,
        parseInt((req.body as Record<string, unknown>)?.rpoTargetMinutes as string, 10) || 1440
      );
      const rto = Math.max(
        1,
        parseInt((req.body as Record<string, unknown>)?.rtoTargetHours as string, 10) || 4
      );
      await run`UPDATE "backup_settings" SET "rpoTargetMinutes"=${rpo}, "rtoTargetHours"=${rto}, "updatedAt"=${now()} WHERE "id"='default'`;
      res.json({ data: { rpoTargetMinutes: rpo, rtoTargetHours: rto } });
    } catch (e) {
      next(e);
    }
  }
);

backupsDrRouter.get(
  '/backups/schedules',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await q`SELECT * FROM "backup_schedules" ORDER BY "createdAt" DESC` });
    } catch (e) {
      next(e);
    }
  }
);
backupsDrRouter.post(
  '/backups/schedules',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        name,
        type,
        cron: expr,
        tables,
        retentionDays,
        storage,
        isActive,
      } = (req.body ?? {}) as Record<string, unknown>;
      if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'name required' });
        return;
      }
      if (!expr || !cron.validate(expr as string)) {
        res.status(400).json({ error: 'invalid cron expression' });
        return;
      }
      const id = randomUUID();
      await run`INSERT INTO "backup_schedules" ("id","name","type","cron","tables","retentionDays","storage","isActive","nextRunAt")
      VALUES (${id}, ${name as string}, ${(type as string) ?? 'full'}, ${expr as string}, ${JSON.stringify((tables as string[]) ?? [])}::jsonb, ${(retentionDays as number) ?? 30}, ${(storage as string) ?? 'local'}, ${isActive !== false}, ${nextRun(expr as string)})`;
      res.status(201).json({ data: { id } });
    } catch (e) {
      next(e);
    }
  }
);
backupsDrRouter.patch(
  '/backups/schedules/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const cur = (await q`SELECT * FROM "backup_schedules" WHERE "id"=${id}`) as Array<
        Record<string, unknown>
      >;
      if (!cur[0]) {
        res.status(404).json({ error: 'not found' });
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s: any = { ...cur[0], ...(req.body as Record<string, unknown>) };
      if (!cron.validate(s.cron as string)) {
        res.status(400).json({ error: 'invalid cron expression' });
        return;
      }
      await run`UPDATE "backup_schedules" SET "name"=${s.name as string}, "type"=${s.type as string}, "cron"=${s.cron as string}, "tables"=${JSON.stringify((s.tables as string[]) ?? [])}::jsonb,
      "retentionDays"=${(s.retentionDays as number) ?? 30}, "storage"=${(s.storage as string) ?? 'local'}, "isActive"=${!!s.isActive}, "nextRunAt"=${nextRun(s.cron as string)}, "updatedAt"=${now()} WHERE "id"=${id}`;
      res.json({ data: { id } });
    } catch (e) {
      next(e);
    }
  }
);
backupsDrRouter.delete(
  '/backups/schedules/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await run`DELETE FROM "backup_schedules" WHERE "id"=${req.params.id}`;
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  }
);
backupsDrRouter.post(
  '/backups/schedules/:id/run',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const s = (await q`SELECT * FROM "backup_schedules" WHERE "id"=${req.params.id}`) as Array<
        Record<string, unknown>
      >;
      if (!s[0]) {
        res.status(404).json({ error: 'not found' });
        return;
      }
      const id = await executeBackup({
        name: s[0].name as string,
        type: s[0].type as string,
        tables: (s[0].tables as string[]) ?? [],
        retentionDays: s[0].retentionDays as number,
        storage: s[0].storage as string,
        actor: `schedule:${s[0].name}`,
      });
      await run`UPDATE "backup_schedules" SET "lastRunAt"=${now()}, "nextRunAt"=${nextRun(s[0].cron as string)}, "updatedAt"=${now()} WHERE "id"=${s[0].id as string}`;
      res.status(202).json({ data: { id } });
    } catch (e) {
      next(e);
    }
  }
);

backupsDrRouter.get(
  '/backups/restores',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await q`SELECT * FROM "dr_restore_jobs" ORDER BY "createdAt" DESC LIMIT 50`,
      });
    } catch (e) {
      next(e);
    }
  }
);
backupsDrRouter.post(
  '/backups/restores',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { backupId, target } = (req.body ?? {}) as Record<string, unknown>;
      if (target === 'production') {
        res
          .status(409)
          .json({
            error:
              'Production restore is intentionally manual. Restore to scratch, verify, then promote via psql.',
          });
        return;
      }
      const email = (req as unknown as { user?: { email?: string } }).user?.email;
      const r = await verifyBackup(backupId as string, email);
      res.status(202).json({ data: r });
    } catch (e) {
      next(e);
    }
  }
);
backupsDrRouter.post(
  '/backups/test-restore',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = (req as unknown as { user?: { email?: string } }).user?.email;
      const r = await verifyBackup(
        (req.body as Record<string, unknown>)?.backupId as string,
        email
      );
      res.json({ data: r });
    } catch (e) {
      next(e);
    }
  }
);

backupsDrRouter.get('/backups/drills', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: await q`SELECT * FROM "dr_drills" ORDER BY "startedAt" DESC LIMIT 20` });
  } catch (e) {
    next(e);
  }
});
backupsDrRouter.post(
  '/backups/drills/run',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const id = randomUUID();
      await run`INSERT INTO "dr_drills" ("id","status") VALUES (${id}, 'running')`;
      setImmediate(async () => {
        const t0 = Date.now();
        try {
          const last =
            (await q`SELECT "id" FROM "backup_runs" WHERE "status"='completed' ORDER BY "finishedAt" DESC LIMIT 1`) as Array<{
              id: string;
            }>;
          if (!last[0]) throw new Error('no completed backup to drill against');
          const r = await verifyBackup(last[0].id, 'drill');
          await run`UPDATE "dr_drills" SET "status"='completed', "backupId"=${last[0].id}, "rtoSeconds"=${Math.round((Date.now() - t0) / 1000)}, "checks"=${JSON.stringify(r.checks)}::jsonb, "finishedAt"=${now()} WHERE "id"=${id}`;
        } catch (e) {
          await run`UPDATE "dr_drills" SET "status"='failed', "notes"=${e instanceof Error ? e.message : String(e)}, "finishedAt"=${now()} WHERE "id"=${id}`;
        }
      });
      res.status(202).json({ data: { id } });
    } catch (e) {
      next(e);
    }
  }
);

backupsDrRouter.get(
  '/backups/tenants',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = (await q`SELECT t."id", t."name", t."slug", t."plan", t."status",
        (SELECT count(*)::int FROM "properties" p WHERE p."tenantId"=t."id") AS "properties",
        (SELECT count(*)::int FROM "guests" g WHERE g."tenantId"=t."id") AS "guests",
        (SELECT count(*)::int FROM "reservations" r WHERE r."tenantId"=t."id") AS "reservations"
      FROM "tenants" t ORDER BY t."createdAt"`) as unknown[];
      res.json({ data: rows });
    } catch (e) {
      next(e);
    }
  }
);
backupsDrRouter.post(
  '/backups/tenants/:tenantId/export',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const ten = (await q`SELECT * FROM "tenants" WHERE "id"=${tenantId}`) as Array<{
        id: string;
        slug: string;
      }>;
      if (!ten[0]) {
        res.status(404).json({ error: 'tenant not found' });
        return;
      }
      const out = path.join(BACKUP_DIR, `tenant-${ten[0].slug}-${Date.now()}.json`);
      const tables = [
        'properties',
        'users',
        'guests',
        'guest_preferences',
        'guest_documents',
        'guest_notes',
        'room_types',
        'rooms',
        'rate_plans',
        'reservations',
        'reservation_stays',
        'folios',
        'folio_items',
        'payments',
        'payment_requests',
        'loyalty_transactions',
      ];
      const dump: Record<string, unknown> = {};
      for (const t of tables) {
        try {
          dump[t] = await q`SELECT * FROM ${Prisma.raw(`"${t}"`)} WHERE "tenantId"=${tenantId}`;
        } catch {
          /* tables without tenantId column are skipped */
        }
      }
      const fs = await import('node:fs/promises');
      await fs.writeFile(
        out,
        JSON.stringify({ tenant: ten[0], exportedAt: new Date().toISOString(), tables: dump })
      );
      await audit(req, 'tenant_export', 'tenant', tenantId, `Logical export of ${ten[0].slug}`);
      res
        .status(201)
        .json({ data: { file: path.basename(out), path: out, tables: Object.keys(dump).length } });
    } catch (e) {
      next(e);
    }
  }
);

backupsDrRouter.post(
  '/backups/detect-stale',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await detectStale() });
    } catch (e) {
      next(e);
    }
  }
);

backupsDrRouter.get(
  '/backups/:id/download',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = (await q`SELECT * FROM "backup_runs" WHERE "id"=${req.params.id}`) as Array<
        Record<string, unknown>
      >;
      const b = rows[0];
      if (!b) {
        res.status(404).json({ error: 'not found' });
        return;
      }
      if (b.status !== 'completed') {
        res.status(409).json({ error: 'backup not completed' });
        return;
      }
      if (!existsSync(b.destination as string)) {
        res
          .status(410)
          .json({
            error: 'file not on local storage (S3-hosted). Use the S3 console with audit trail.',
          });
        return;
      }
      await audit(
        req,
        'backup_download',
        'backup_run',
        b.id as string,
        `Downloaded ${path.basename(b.destination as string)} (${Number(b.sizeBytes)} bytes)`
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${path.basename(b.destination as string)}"`
      );
      createReadStream(b.destination as string).pipe(res);
    } catch (e) {
      next(e);
    }
  }
);

backupsDrRouter.delete('/backups/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = (await q`SELECT * FROM "backup_runs" WHERE "id"=${req.params.id}`) as Array<
      Record<string, unknown>
    >;
    if (rows[0] && existsSync(rows[0].destination as string))
      await unlink(rows[0].destination as string).catch(() => {});
    await run`DELETE FROM "backup_runs" WHERE "id"=${req.params.id}`;
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// ─────────────────────── schedulers ───────────────────────────

let started = false;
export function startBackupsDrSchedulers() {
  if (started || process.env.VITEST === 'true' || process.env.NODE_ENV === 'test') return;
  started = true;
  // Crash recovery: any run still 'running' from a previous process life was
  // interrupted by a restart — mark it failed so the UI never lies for hours.
  run`UPDATE "backup_runs" SET "status"='failed', "error"='interrupted by API restart (stale running row recovered on boot)', "finishedAt"=${now()} WHERE "status"='running'`
    .then((n) => {
      if (n) logger.info({ recovered: n }, 'recovered stale running backup runs');
    })
    .catch((e) => logger.error({ err: e }, 'stale-run sweep failed'));
  setInterval(() => {
    void runDueSchedules();
  }, 30_000);
  cron.schedule('*/10 * * * *', () => {
    void detectStale().catch((e) => logger.error({ err: e }, 'stale detect failed'));
  });
  logger.info('Backups & DR schedulers started (30s schedule sweep, 10min stale detector)');
}
