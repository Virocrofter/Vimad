/* apps/api/src/types/express.d.ts */

declare global {
  namespace Express {
    interface Request {
      auth: {
        userId: string;
        tenantId: string;
        email: string;
        role: string;
        user: {
          id: string;
          email: string;
          role: string;
          tenantId: string;
          permissions: string[];
        };
      };
      tenantId: string;
      requestId?: string;
    }
  }
}

export {};
