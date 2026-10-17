/* apps/api/src/common/storage.ts */
import { createHmac, timingSafeEqual } from 'crypto';
import { mkdir, writeFile, readFile } from 'fs/promises';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env.js';
import { logger } from './logger.js';
import { AppError } from './errors.js';

// ─── Storage backends ───
// STORAGE_PROVIDER=s3     → S3 or S3-compatible (MinIO for dev via S3_ENDPOINT)
// STORAGE_PROVIDER=local  → files on disk under STORAGE_LOCAL_DIR, served by
//                           the files router with HMAC-signed URLs (dev default)

export interface StoredFile {
  key: string;
  size: number;
  contentType: string;
}

const SAFE_KEY = /^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.(json|csv|pdf|jpg|jpeg|png|webp)$/;

function assertSafeKey(key: string): void {
  if (!SAFE_KEY.test(key) || key.includes('..')) {
    throw new AppError(400, 'Invalid storage key', 'STORAGE_KEY_INVALID');
  }
}

// ─── S3 client (lazy singleton) ───

let s3: S3Client | null = null;

function getS3(): S3Client {
  if (!s3) {
    s3 = new S3Client({
      region: env.S3_REGION,
      ...(env.S3_ENDPOINT
        ? { endpoint: env.S3_ENDPOINT, forcePathStyle: env.S3_FORCE_PATH_STYLE }
        : {}),
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID ?? '',
        secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? '',
      },
    });
  }
  return s3;
}

// ─── Local signed URLs (HMAC, same idea as S3 presign) ───

function localSignature(key: string, expires: number): string {
  return createHmac('sha256', env.JWT_SECRET).update(`${key}:${expires}`).digest('hex');
}

export function verifyLocalSignature(key: string, expires: number, signature: string): boolean {
  if (Date.now() > expires) return false;
  const expected = Buffer.from(localSignature(key, expires));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

// ─── Public API ───

/**
 * Store a file and return its key. Keys should be namespaced, e.g.
 * `exports/<tenantId>/<requestId>.json` or `reports/<tenantId>/<file>.pdf`.
 */
export async function putFile(
  key: string,
  content: Buffer | string,
  contentType: string
): Promise<StoredFile> {
  assertSafeKey(key);
  const body = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');

  if (env.STORAGE_PROVIDER === 's3') {
    await getS3().send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
      })
    );
  } else {
    const filePath = path.join(env.STORAGE_LOCAL_DIR, key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, body);
  }

  logger.info({ key, size: body.length, provider: env.STORAGE_PROVIDER }, 'file stored');
  return { key, size: body.length, contentType };
}

/**
 * Time-limited download URL for a stored file.
 * S3: presigned GET. Local: HMAC-signed URL served by the files router.
 */
export async function getSignedDownloadUrl(
  key: string,
  opts?: { ttlSeconds?: number; downloadName?: string }
): Promise<string> {
  assertSafeKey(key);
  const ttl = opts?.ttlSeconds ?? env.EXPORT_URL_TTL_SECONDS;

  if (env.STORAGE_PROVIDER === 's3') {
    return getSignedUrl(
      getS3(),
      new GetObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        ...(opts?.downloadName
          ? { ResponseContentDisposition: `attachment; filename="${opts.downloadName}"` }
          : {}),
      }),
      { expiresIn: ttl }
    );
  }

  const expires = Date.now() + ttl * 1000;
  const sig = localSignature(key, expires);
  const base = env.API_PUBLIC_URL.replace(/\/$/, '');
  return `${base}/v1/files/${encodeURIComponent(key)}?expires=${expires}&sig=${sig}`;
}

/** Read a local file (used by the files router; S3 objects go through presigned URLs). */
export async function readLocalFile(key: string): Promise<Buffer> {
  assertSafeKey(key);
  return readFile(path.join(env.STORAGE_LOCAL_DIR, key));
}

export async function deleteFile(key: string): Promise<void> {
  assertSafeKey(key);
  if (env.STORAGE_PROVIDER === 's3') {
    await getS3().send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  }
  // Local files are left to OS-level cleanup (tmpwatch/cron) in dev.
}
