/* apps/api/src/jobs/report.job.ts */
import { enqueue, createWorker } from '../common/queue.js';
import { prisma } from '../common/prisma.js';
import { logger } from '../common/logger.js';
import { env } from '../common/env.js';
import { putFile, getSignedDownloadUrl } from '../common/storage.js';
import { sendEmail } from './email.queue.js';

export const REPORT_QUEUE = 'report';

export interface ReportJobData {
  tenantId: string;
  userId: string;
  userEmail: string;
  reportType: 'occupancy' | 'revenue' | 'guest' | 'custom';
  format: 'csv' | 'pdf';
  filters: {
    propertyId?: string;
    startDate?: string;
    endDate?: string;
    roomTypeId?: string;
  };
}

// ─── Schedule Helper ───
export async function generateReport(data: ReportJobData) {
  await enqueue(REPORT_QUEUE, `report-${data.reportType}`, data, {
    priority: data.format === 'pdf' ? 2 : 1, // PDFs are heavier, lower priority
  });
}

// ─── CSV Builder ───
function buildCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val === null || val === undefined ? '' : String(val);
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(',')
    ),
  ];
  return lines.join('\n');
}

// ─── PDF Builder (puppeteer-core + system/installed Chromium) ───

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildReportHTML(
  title: string,
  rows: Record<string, unknown>[],
  meta: { tenantId: string; generatedAt: Date; filters: ReportJobData['filters'] }
): string {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const filterSummary = Object.entries(meta.filters)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1a1a2e; margin: 40px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color: #666; font-size: 12px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #863bff; color: #fff; text-align: left; padding: 8px 10px; font-weight: 600; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e5ef; }
  tr:nth-child(even) td { background: #f8f7fc; }
  .footer { margin-top: 24px; font-size: 10px; color: #999; }
  @page { margin: 20mm; }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">
    Generated ${meta.generatedAt.toISOString()} · ${rows.length} rows${filterSummary ? ` · ${escapeHtml(filterSummary)}` : ''}
  </div>
  ${
    rows.length === 0
      ? '<p>No data for the selected filters.</p>'
      : `<table>
    <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>
      ${rows
        .map((row) => `<tr>${headers.map((h) => `<td>${escapeHtml(row[h])}</td>`).join('')}</tr>`)
        .join('\n')}
    </tbody>
  </table>`
  }
  <div class="footer">Vimad PMS · Confidential — for internal use only</div>
</body>
</html>`;
}

async function renderPDF(html: string): Promise<Buffer> {
  // Lazy import so the worker doesn't pay the startup cost for CSV-only runs.
  // `puppeteer-core` is provided by the runtime image / installed browser setup,
  // and this avoids a hard compile-time dependency in local dev environments.
  // @ts-ignore - module is supplied at runtime for PDF generation only.
  const puppeteer = await import('puppeteer-core');

  const browser = await puppeteer.default.launch({
    executablePath: env.PUPPETEER_EXECUTABLE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, landscape: true });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

// ─── Data fetchers ───

async function fetchReportRows(
  tenantId: string,
  reportType: ReportJobData['reportType'],
  filters: ReportJobData['filters']
): Promise<{ title: string; rows: Record<string, unknown>[] }> {
  switch (reportType) {
    case 'occupancy': {
      const stays = await prisma.reservationStay.findMany({
        where: {
          reservation: {
            tenantId,
            ...(filters.propertyId && { propertyId: filters.propertyId }),
            ...(filters.startDate &&
              filters.endDate && {
                arrivalDate: { gte: new Date(filters.startDate) },
                departureDate: { lte: new Date(filters.endDate) },
              }),
          },
        },
        include: { reservation: { include: { guest: true, property: true } }, room: true },
      });

      return {
        title: 'Occupancy Report',
        rows: stays.map((s) => ({
          date: s.date.toISOString().slice(0, 10),
          property: s.reservation.property.name,
          room: s.room.number,
          guest: `${s.reservation.guest.firstName} ${s.reservation.guest.lastName}`,
          rate: s.rate,
        })),
      };
    }

    case 'revenue': {
      const reservations = await prisma.reservation.findMany({
        where: {
          tenantId,
          ...(filters.propertyId && { propertyId: filters.propertyId }),
          ...(filters.startDate &&
            filters.endDate && {
              createdAt: {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate + 'T23:59:59'),
              },
            }),
        },
        include: { property: true, guest: true, folio: { include: { items: true } } },
      });

      return {
        title: 'Revenue Report',
        rows: reservations.map((r) => ({
          confirmation: r.confirmationNumber,
          property: r.property.name,
          guest: `${r.guest.firstName} ${r.guest.lastName}`,
          arrival: r.arrivalDate.toISOString().slice(0, 10),
          departure: r.departureDate.toISOString().slice(0, 10),
          nights: r.nights,
          total: r.totalAmount,
          balance: r.balance,
          status: r.status,
        })),
      };
    }

    case 'guest': {
      const guests = await prisma.guest.findMany({
        where: { tenantId },
        include: { reservations: { take: 1, orderBy: { createdAt: 'desc' } } },
      });

      return {
        title: 'Guest Report',
        rows: guests.map((g) => ({
          id: g.id,
          name: `${g.firstName} ${g.lastName}`,
          email: g.email ?? '',
          phone: g.phone ?? '',
          loyaltyPoints: g.loyaltyPoints,
          vipStatus: g.vipStatus ?? '',
          lastStay: g.reservations[0]?.departureDate.toISOString().slice(0, 10) ?? '',
        })),
      };
    }

    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
}

// ─── Worker ───
export const reportWorker = createWorker<ReportJobData>(REPORT_QUEUE, async (job) => {
  const { tenantId, userId, userEmail, reportType, format, filters } = job.data;
  const start = Date.now();

  const { title, rows } = await fetchReportRows(tenantId, reportType, filters);

  // Render in the requested format
  let content: Buffer;
  let contentType: string;
  let filename: string;

  if (format === 'pdf') {
    const html = buildReportHTML(title, rows, { tenantId, generatedAt: new Date(), filters });
    content = await renderPDF(html);
    contentType = 'application/pdf';
    filename = `${reportType}-${Date.now()}.pdf`;
  } else {
    content = Buffer.from(buildCSV(rows), 'utf8');
    contentType = 'text/csv';
    filename = `${reportType}-${Date.now()}.csv`;
  }

  // Upload to storage and email a time-limited download link — works for
  // arbitrarily large reports (no email attachment size limits) and keeps
  // report data off mail servers longer than necessary.
  const key = `reports/${tenantId}/${filename}`;
  await putFile(key, content, contentType);
  const downloadUrl = await getSignedDownloadUrl(key, { downloadName: filename });

  await sendEmail({
    to: userEmail,
    subject: `Your ${reportType} report is ready`,
    template: 'generic',
    payload: {
      message: `Your ${reportType} report (${format.toUpperCase()}, ${rows.length} rows) is ready. Download it here (link expires in ${Math.round(env.EXPORT_URL_TTL_SECONDS / 3600)}h): ${downloadUrl}`,
    },
  });

  logger.info(
    {
      reportType,
      format,
      tenantId,
      userId,
      durationMs: Date.now() - start,
      key,
      rows: rows.length,
    },
    'report generated'
  );
});
