/* apps/api/src/jobs/gdpr.job.ts */
import { enqueue, createWorker } from '../common/queue.js';
import { prisma } from '../common/prisma.js';
import { logger } from '../common/logger.js';
import { sendEmail } from './email.queue.js';
import { putFile, getSignedDownloadUrl } from '../common/storage.js';

export const GDPR_QUEUE = 'gdpr';

export type GdprJobType = 'export' | 'anonymize' | 'delete';

export interface GdprJobData {
  tenantId: string;
  requestId: string;
  type: GdprJobType;
  targetType: 'guest' | 'user' | 'tenant';
  targetId: string;
  requestedBy: string; // user email
}

// ─── Schedule Helper ───
export async function scheduleGdprJob(data: GdprJobData) {
  await enqueue(GDPR_QUEUE, `gdpr-${data.type}`, data, {
    priority: data.type === 'delete' ? 10 : 5,
  });
}

// ─── Worker ───
export const gdprWorker = createWorker<GdprJobData>(GDPR_QUEUE, async (job) => {
  const { tenantId, requestId, type, targetType, targetId, requestedBy } = job.data;

  logger.info({ requestId, type, targetType, targetId }, 'GDPR job started');

  switch (type) {
    case 'export': {
      await handleExport(tenantId, targetType, targetId, requestedBy);
      break;
    }

    case 'anonymize': {
      await handleAnonymize(tenantId, targetType, targetId);
      break;
    }

    case 'delete': {
      await handleDelete(tenantId, targetType, targetId);
      break;
    }
  }

  logger.info({ requestId, type }, 'GDPR job completed');
});

// ─── Export Handler: JSON → Storage → Signed URL → Email ───
async function handleExport(
  tenantId: string,
  targetType: string,
  targetId: string,
  requestedBy: string
) {
  let exportData: Record<string, unknown>;

  if (targetType === 'guest') {
    const guest = await prisma.guest.findFirst({
      where: { id: targetId, tenantId },
      include: {
        reservations: { include: { stays: true, folio: { include: { items: true } } } },
        preferences: true,
        documents: true,
      },
    });
    if (!guest) throw new Error('Guest not found');
    exportData = { guest, exportedAt: new Date().toISOString(), tenantId };
  } else if (targetType === 'user') {
    const user = await prisma.user.findFirst({
      where: { id: targetId, tenantId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new Error('User not found');
    exportData = { user, exportedAt: new Date().toISOString(), tenantId };
  } else {
    throw new Error(`Unsupported export target: ${targetType}`);
  }

  const json = JSON.stringify(exportData, null, 2);
  const filename = `gdpr-export-${targetType}-${targetId}-${Date.now()}.json`;
  const key = `gdpr/${tenantId}/${filename}`;

  // Upload to storage (S3 or local with signed URL)
  await putFile(key, json, 'application/json');
  const downloadUrl = await getSignedDownloadUrl(key, {
    ttlSeconds: 7 * 24 * 60 * 60, // 7 days
    downloadName: filename,
  });

  // Record usage
  await prisma.usageRecord.create({
    data: {
      tenantId,
      metric: 'gdpr_exports',
      quantity: 1,
      metadata: { targetType, targetId, requestId: `gdpr-${targetId}-${Date.now()}` },
    },
  });

  await sendEmail({
    to: requestedBy,
    subject: 'Your data export is ready',
    template: 'generic',
    payload: {
      message: `Your data export for ${targetType} ${targetId} is ready.\n\nDownload link (expires in 7 days):\n${downloadUrl}\n\nFile: ${filename}\nSize: ${(json.length / 1024).toFixed(1)} KB`,
    },
  });

  logger.info({ tenantId, targetType, targetId, key }, 'GDPR export uploaded and emailed');
}

// ─── Anonymize Handler ───
async function handleAnonymize(_tenantId: string, targetType: string, targetId: string) {
  if (targetType === 'guest') {
    await prisma.guest.update({
      where: { id: targetId },
      data: {
        firstName: 'ANONYMIZED',
        lastName: 'ANONYMIZED',
        email: `anonymized-${targetId.slice(-8)}@deleted.local`,
        phone: null,
        address: null,
        city: null,
        country: null,
        passportNumber: null,
        notes: null,
      },
    });
  } else if (targetType === 'user') {
    await prisma.user.update({
      where: { id: targetId },
      data: {
        firstName: 'ANONYMIZED',
        lastName: 'ANONYMIZED',
        email: `anonymized-${targetId.slice(-8)}@deleted.local`,
        status: 'inactive',
      },
    });
  }
}

// ─── Delete Handler (Right to Erasure) ───
async function handleDelete(_tenantId: string, targetType: string, targetId: string) {
  if (targetType === 'guest') {
    await prisma.guest.update({
      where: { id: targetId },
      data: {
        firstName: 'DELETED',
        lastName: 'DELETED',
        email: null,
        phone: null,
        address: null,
        city: null,
        country: null,
        passportNumber: null,
        notes: 'GDPR Article 17 deletion',
        loyaltyPoints: 0,
        vipStatus: null,
      },
    });

    await prisma.guestPreference.deleteMany({ where: { guestId: targetId } });
    await prisma.guestDocument.deleteMany({ where: { guestId: targetId } });
  } else if (targetType === 'user') {
    await prisma.user.update({
      where: { id: targetId },
      data: {
        email: `deleted-${targetId.slice(-8)}@deleted.local`,
        firstName: null,
        lastName: null,
        passwordHash: null,
        status: 'deleted',
      },
    });
  }
}
