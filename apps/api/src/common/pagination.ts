import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export function paginate<T>(items: T[], total: number, { page, pageSize }: PaginationInput) {
  return {
    data: items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export function skipTake({ page, pageSize }: PaginationInput) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}
