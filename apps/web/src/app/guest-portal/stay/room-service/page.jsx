/* src/app/guest-portal/stay/room-service/page.jsx — G4: real ordering */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UtensilsCrossed,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  Sparkles,
  Clock,
  XCircle,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { getGuestToken } from '../../../../hooks/guestPortalApi';
import {
  useGuestMenu,
  useGuestOrders,
  usePlaceOrder,
  useCancelOrder,
  useGuestUpsells,
  usePurchaseUpsell,
} from '../../../../hooks/useGuestCommerce';
import { formatCurrency, formatDate } from '../../../../lib/guest-utils';

const orderStatusMeta = {
  received: { label: 'Received', chip: 'bg-warning/10 text-warning border-warning/20' },
  preparing: { label: 'Preparing', chip: 'bg-secondary/10 text-secondary border-secondary/20' },
  ready: { label: 'Ready', chip: 'bg-accent/10 text-accent border-accent/20' },
  delivered: { label: 'Delivered', chip: 'bg-accent/10 text-accent border-accent/20' },
  cancelled: { label: 'Cancelled', chip: 'bg-danger/10 text-danger border-danger/20' },
};

function newKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID();
  return `go-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function RoomServicePageInner() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());

  const {
    data: menuData,
    isLoading: menuLoading,
    isError: menuError,
    refetch: refetchMenu,
  } = useGuestMenu();
  const { data: ordersData } = useGuestOrders();
  const { data: upsellsData } = useGuestUpsells();
  const placeOrder = usePlaceOrder();
  const cancelOrder = useCancelOrder();
  const purchase = usePurchaseUpsell();

  const [cart, setCart] = useState({});
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!hasToken) navigate('/guest-portal/auth/login', { replace: true });
  }, [hasToken, navigate]);

  if (!hasToken) return null;

  if (menuLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Loading the menu…</p>
      </div>
    );
  }

  if (menuError || !menuData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">We couldn't load the menu.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetchMenu()}>
          Retry
        </Button>
      </div>
    );
  }

  const menu = menuData.menu ?? [];
  const orders = ordersData?.orders ?? [];
  const products = upsellsData?.products ?? [];

  const categories = useMemo(() => [...new Set(menu.map((m) => m.category))], [menu]);

  const cartLines = Object.entries(cart)
    .map(([id, qty]) => ({ item: menu.find((m) => m.id === id), qty }))
    .filter((l) => l.item && l.qty > 0);
  const cartTotal = cartLines.reduce((s, l) => s + l.item.price * l.qty, 0);

  const bump = (id, delta) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, Math.min(10, (c[id] ?? 0) + delta)) }));

  const handleOrder = () => {
    setFeedback(null);
    placeOrder.mutate(
      {
        items: cartLines.map((l) => ({ menuItemId: l.item.id, quantity: l.qty })),
        note: note.trim() || undefined,
        idempotencyKey: newKey(),
      },
      {
        onSuccess: () => {
          getGuestToken() &&
            void fetch(
              (import.meta.env?.VITE_API_URL ?? '/api/v1') +
                '/guest-portal/comms/telemetry/' +
                encodeURIComponent(getGuestToken()),
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event: 'order_placed' }),
              }
            ).catch(() => {});
          setFeedback({ ok: true, text: 'Order placed — the kitchen has it. Track status below.' });
          setCart({});
          setNote('');
          setConfirming(false);
        },
        onError: (e) => {
          setFeedback({ ok: false, text: e.message });
          setConfirming(false);
        },
      }
    );
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/stay')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Room Service</h1>
          <p className="text-xs text-text-muted flex items-center gap-1">
            <Clock className="h-3 w-3" /> Kitchen time {menuData.now} ({menuData.timezone})
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            'rounded-xl border p-4 flex items-center gap-3',
            feedback.ok ? 'border-accent/20 bg-accent/5' : 'border-danger/20 bg-danger/5'
          )}
        >
          {feedback.ok ? (
            <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          )}
          <p className="text-sm text-text-primary">{feedback.text}</p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border bg-background px-4 py-3">
            <h3 className="text-sm font-semibold text-text-primary">Your orders</h3>
          </div>
          <div className="divide-y divide-border">
            {orders.map((o) => {
              const meta = orderStatusMeta[o.status] ?? orderStatusMeta.received;
              return (
                <div key={o.id} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-text-primary">
                      {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                    </p>
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0',
                        meta.chip
                      )}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-text-muted">
                      {formatDate(o.createdAt)} · {formatCurrency(o.total)}
                    </p>
                    {o.status === 'received' && (
                      <button
                        onClick={() => cancelOrder.mutate(o.id)}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-danger hover:underline"
                      >
                        <XCircle className="h-3 w-3" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {categories.map((cat) => (
        <div key={cat} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted px-1">
            {cat}
          </h3>
          <div className="space-y-2">
            {menu
              .filter((m) => m.category === cat)
              .map((m) => {
                const qty = cart[m.id] ?? 0;
                return (
                  <div key={m.id} className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary">{m.name}</p>
                        {m.description && (
                          <p className="text-xs text-text-muted mt-0.5">{m.description}</p>
                        )}
                        <p className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {m.availableFrom}–{m.availableTo}
                          {!m.availableNow && <span className="text-warning">· opens later</span>}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <p className="text-sm font-mono font-medium text-text-primary">
                          {formatCurrency(m.price)}
                        </p>
                        {qty === 0 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!m.availableNow}
                            onClick={() => bump(m.id, 1)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => bump(m.id, -1)}
                              className="rounded-md border border-border p-1.5 hover:bg-surface-elevated"
                            >
                              <Minus className="h-3.5 w-3.5 text-text-primary" />
                            </button>
                            <span className="text-sm font-mono w-4 text-center text-text-primary">
                              {qty}
                            </span>
                            <button
                              onClick={() => bump(m.id, 1)}
                              className="rounded-md border border-border p-1.5 hover:bg-surface-elevated"
                            >
                              <Plus className="h-3.5 w-3.5 text-text-primary" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      {cartLines.length > 0 && (
        <div className="rounded-xl border border-secondary/30 bg-surface p-4 space-y-3 sticky bottom-20 z-10 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-secondary" /> Your order
            </p>
            <p className="text-sm font-mono font-medium text-text-primary">
              {formatCurrency(cartTotal)}
            </p>
          </div>
          {cartLines.map((l) => (
            <div key={l.item.id} className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">
                {l.qty}× {l.item.name}
              </span>
              <span className="font-mono text-text-primary">
                {formatCurrency(l.item.price * l.qty)}
              </span>
            </div>
          ))}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note for the kitchen (allergies, timing…)"
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {confirming ? (
            <div className="flex gap-2">
              <Button className="flex-1" disabled={placeOrder.isPending} onClick={handleOrder}>
                {placeOrder.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UtensilsCrossed className="mr-2 h-4 w-4" />
                )}
                Confirm — {formatCurrency(cartTotal)}
              </Button>
              <Button variant="outline" onClick={() => setConfirming(false)}>
                Back
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={() => setConfirming(true)}>
              Place order
            </Button>
          )}
        </div>
      )}

      {products.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted px-1 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-secondary" /> Enhance your stay
          </h3>
          {products.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">{p.name}</p>
                  <p className="text-[10px] text-text-muted capitalize">
                    {p.category} · charged to your folio
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={purchase.isPending || purchase.variables?.productId === p.id}
                  onClick={() => purchase.mutate({ productId: p.id, quantity: 1 })}
                >
                  {purchase.isPending && purchase.variables?.productId === p.id ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                  )}
                  {formatCurrency(p.price)}
                </Button>
              </div>
            </div>
          ))}
          {purchase.isSuccess && (
            <p className="text-xs text-accent flex items-center gap-1 px-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Added to your folio — thank you.
            </p>
          )}
          {purchase.isError && (
            <p className="text-xs text-danger flex items-center gap-1 px-1">
              <AlertTriangle className="h-3.5 w-3.5" /> {purchase.error?.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Phase B: live feature-flag gate (guest-portal-commerce) ───
import { useLiveFlag } from '../../../../components/FlagsProvider';

function RoomServicePage() {
  const enabled = useLiveFlag('guest-portal-commerce', true);
  if (!enabled) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <UtensilsCrossed className="h-8 w-8 text-text-muted" />
        <h2 className="text-base font-semibold">Room service is temporarily unavailable</h2>
        <p className="max-w-sm text-sm text-text-muted">
          We are tuning this feature right now. Please try again shortly or contact the front desk.
        </p>
      </div>
    );
  }
  return <RoomServicePageInner />;
}
export default RoomServicePage;
