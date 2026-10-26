/* apps/web/src/api/chainDashboard.ts — C2 chain dashboard */
import { apiGet } from './client';

export type TapeCellState = 'vacant' | 'occupied' | 'arrival' | 'departure' | 'turn' | 'ooo';
export interface TapeCell {
  state: TapeCellState;
  reservationId?: string;
  confirmationNumber?: string;
  guestName?: string;
  vipStatus?: string | null;
  status?: string;
}
export interface ChainTapeRoom {
  id: string;
  number: string;
  floor?: string | null;
  roomTypeName?: string | null;
  status: string;
  housekeepingStatus: string;
  ooo: boolean;
}
export interface ChainTapeProperty {
  id: string;
  name: string;
  code: string;
  city?: string | null;
  timezone: string;
  businessDate: string;
  roomCount: number;
  rooms: ChainTapeRoom[];
  cells: Record<string, Record<string, TapeCell>>;
  occupancy: Record<string, { occupied: number; available: number; pct: number }>;
}
export interface ChainTapeChart {
  chain: { id: string; name: string; slug: string };
  from: string;
  to: string;
  days: string[];
  properties: ChainTapeProperty[];
}

export interface RollupTotals {
  occupiedNights: number;
  availableNights: number;
  occupancyPct: number;
  roomRevenue: number;
  folioRevenue: number;
  adr: number;
  revpar: number;
}
export interface RollupDay {
  date: string;
  occupied: number;
  available: number;
  occupancyPct: number;
  roomRevenue: number;
  adr: number;
  revpar: number;
}
export interface ChainRollupProperty {
  id: string;
  name: string;
  code: string;
  city?: string | null;
  currency: string;
  totalRooms: number;
  availableRooms: number;
  totals: RollupTotals;
  daily: RollupDay[];
}
export interface ChainRollup {
  chain: { id: string; name: string; slug: string };
  from: string;
  to: string;
  days: string[];
  currency: string;
  properties: ChainRollupProperty[];
  consolidated: { totals: RollupTotals; daily: RollupDay[] } | null;
}

export interface ChainException {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  propertyId: string;
  propertyName: string;
  title: string;
  detail: string;
  date?: string;
  count?: number;
  dates?: string[];
}
export interface ChainExceptions {
  chain: { id: string; name: string; slug: string };
  generatedAt: string;
  windowDays: number;
  summary: { critical: number; warning: number; info: number };
  exceptions: ChainException[];
}

export async function getChainTapeChart(
  chainId: string,
  from: string,
  to: string
): Promise<ChainTapeChart> {
  const res = await apiGet<{ data: ChainTapeChart }>(
    `/v1/chain-dashboard/chains/${chainId}/tape-chart`,
    { from, to }
  );
  return res.data;
}

export async function getChainRollup(
  chainId: string,
  from: string,
  to: string
): Promise<ChainRollup> {
  const res = await apiGet<{ data: ChainRollup }>(`/v1/chain-dashboard/chains/${chainId}/rollup`, {
    from,
    to,
  });
  return res.data;
}

export async function getChainExceptions(chainId: string, days = 7): Promise<ChainExceptions> {
  const res = await apiGet<{ data: ChainExceptions }>(
    `/v1/chain-dashboard/chains/${chainId}/exceptions`,
    { days }
  );
  return res.data;
}
