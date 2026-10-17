/* apps/api/src/modules/inventory/inventory.push.ts — I1 channel push.
 * Pushes availability computed by the INVENTORY ENGINE (OOO excluded, holds
 * subtracted, adjustments applied, overbooking honoured, stop-sell pushed as
 * 0 rooms-to-sell) to every active channel connection via the real adapters.
 * This is what "Sync OTAs" on the Inventory page calls.
 */
import { prisma } from '../../common/prisma.js';
import { logger } from '../../common/logger.js';
import { getGrid, dstr } from './inventory.service.js';
import { sendToChannel } from '../channel/channel.service.js';

export async function pushInventoryToChannels(tenantId: string, propertyId: string, days = 60) {
  const connections = await (prisma as any).channelConnection.findMany({
    where: { tenantId, propertyId, status: 'active' },
  });
  if (connections.length === 0) {
    return { pushed: 0, records: 0, results: [] as Record<string, unknown>[] };
  }

  const from = dstr(new Date());
  const to = dstr(new Date(Date.now() + (days - 1) * 86_400_000));
  const grid = await getGrid(tenantId, propertyId, from, to);

  const records: {
    date: string;
    roomTypeId: string;
    roomTypeCode: string;
    available: number;
    total: number;
  }[] = [];
  for (const rt of grid.roomTypes) {
    for (const c of rt.cells) {
      records.push({
        date: c.date,
        roomTypeId: rt.id,
        roomTypeCode: rt.code,
        // Stop-sell must push as zero rooms-to-sell — an OTA selling a
        // stop-sold date is the exact overbooking scenario I1 exists to kill.
        available: c.stopSell ? 0 : Math.max(c.remaining, 0),
        total: c.total,
      });
    }
  }

  const results = [];
  for (const conn of connections) {
    const result = await sendToChannel(conn as never, 'availability', records);
    results.push({ channelId: conn.id, provider: conn.provider, ...result });
    await (prisma as any).channelConnection.update({
      where: { id: conn.id },
      data: { lastSyncAt: new Date(), lastSyncStatus: result.success ? 'success' : 'error' },
    });
  }

  logger.info(
    { propertyId, connections: connections.length, records: records.length },
    'inventory availability pushed to channels'
  );
  return { pushed: connections.length, records: records.length, results };
}
