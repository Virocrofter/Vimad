// C1 switcher scope — fields set by attachPropertyScope (auth.middleware).
declare global {
  namespace Express {
    interface Request {
      switcherPropertyId: string | null;
      effectivePropertyIds: string[] | null;
    }
  }
}
export {};
