// Plan tier catalog — extracted from the marketing pricing page (single
// source for list prices). resolveBaseFee seam: contract overrides plug in
// here later (own phase). DB plan names: trial/starter/professional/enterprise.
export const PLAN_CATALOG: Record<string, { label: string; monthlyZar: number }> = {
  enterprise: { label: 'Constellation', monthlyZar: 999 },
  professional: { label: 'Command', monthlyZar: 499 },
  starter: { label: 'Compass', monthlyZar: 199 },
  trial: { label: 'Beacon Trial', monthlyZar: 0 },
};

export function planFee(plan: string): number {
  return PLAN_CATALOG[plan?.toLowerCase()]?.monthlyZar ?? 0;
}
