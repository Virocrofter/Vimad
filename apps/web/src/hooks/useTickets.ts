/* apps/web/src/hooks/useTickets.ts — staff Support Desk state */
import { useCallback, useEffect, useState } from 'react';
import {
  getTickets,
  getTicket,
  getTicketStats,
  addTicketComment,
  assignTicket,
  updateTicket,
  closeTicket,
  type Ticket,
  type TicketStats,
  type TicketListParams,
} from '../api/tickets';

export function useTickets(initial: TicketListParams = {}) {
  const [params, setParams] = useState<TicketListParams>({ page: 1, pageSize: 20, ...initial });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (p: TicketListParams = params) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getTickets(p);
        setTickets(res.data);
        setMeta(res.meta);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load tickets');
      } finally {
        setLoading(false);
      }
    },
    [params]
  );

  useEffect(() => {
    refresh(params);
  }, [params]); // eslint-disable-line

  return { tickets, meta, loading, error, params, setParams, refresh };
}

export function useTicket(id: string | null) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getTicket(id);
      setTicket(res.data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const comment = async (message: string, isInternal: boolean) => {
    if (!id) return;
    await addTicketComment(id, message, isInternal);
    await reload();
  };
  const assign = async (assigneeId: string | null) => {
    if (!id) return;
    await assignTicket(id, assigneeId);
    await reload();
  };
  const setStatus = async (status: Ticket['status']) => {
    if (!id) return;
    await updateTicket(id, { status });
    await reload();
  };
  const close = async () => {
    if (!id) return;
    await closeTicket(id);
    await reload();
  };

  return { ticket, loading, error, reload, comment, assign, setStatus, close };
}

export function useTicketStats(refreshKey = 0) {
  const [stats, setStats] = useState<TicketStats | null>(null);
  useEffect(() => {
    getTicketStats()
      .then((r) => setStats(r.data))
      .catch(() => setStats(null));
  }, [refreshKey]);
  return stats;
}
