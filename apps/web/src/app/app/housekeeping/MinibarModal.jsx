/* apps/web/src/app/app/housekeeping/MinibarModal.jsx — T2
 * Log minibar consumption with camera photo proof. The API auto-posts the
 * folio charge for the in-house reservation in the selected room.
 */
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { toast } from '../../../hooks/use-toast';
import { api, logMinibar, fetchMinibarChecks, waiveMinibar } from '../../../api/minibar';
import { Camera, Plus, Minus, CheckCircle2, Wine } from 'lucide-react';

const CATALOG = [
  { name: 'Still water 500ml', priceMinor: 2500 },
  { name: 'Sparkling water 500ml', priceMinor: 3500 },
  { name: 'Coca-Cola 330ml', priceMinor: 3000 },
  { name: 'Local beer 340ml', priceMinor: 5500 },
  { name: 'House wine 250ml', priceMinor: 8500 },
  { name: 'Snack nuts 100g', priceMinor: 4000 },
  { name: 'Chocolate bar', priceMinor: 3500 },
];

const fmt = (minor) => `R${(minor / 100).toFixed(2)}`;

export default function MinibarModal({ open, onClose, onLogged }) {
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [rows, setRows] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [recent, setRecent] = useState([]);

  const loadRecent = () =>
    fetchMinibarChecks({ pageSize: 10 })
      .then((r) => setRecent(r.data))
      .catch(() => {});

  useEffect(() => {
    if (!open) return;
    setRoomId('');
    setRows([]);
    setPhotos([]);
    setNote('');
    setResult(null);
    loadRecent();
    api('/v1/rooms?pageSize=200')
      .then((r) => setRooms(Array.isArray(r) ? r : (r.data ?? [])))
      .catch(() => setRooms([]));
  }, [open]);

  if (!open) return null;

  const total = rows.reduce((s, r) => s + r.quantity * r.priceMinor, 0);

  const addItem = (item) => {
    const existing = rows.find((r) => r.name === item.name);
    if (existing) {
      setRows(rows.map((r) => (r.name === item.name ? { ...r, quantity: r.quantity + 1 } : r)));
    } else {
      setRows([...rows, { ...item, quantity: 1 }]);
    }
  };

  const bump = (name, delta) =>
    setRows(
      rows
        .map((r) => (r.name === name ? { ...r, quantity: r.quantity + delta } : r))
        .filter((r) => r.quantity > 0)
    );

  const onPhotoChange = (e) => {
    const files = [...e.target.files].slice(0, 4 - photos.length);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setPhotos((p) => [...p, reader.result].slice(0, 4));
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const submit = async () => {
    if (!roomId) return toast({ title: 'Pick a room first', variant: 'destructive' });
    if (rows.length === 0) return toast({ title: 'Add at least one item', variant: 'destructive' });
    setBusy(true);
    try {
      const res = await logMinibar({
        roomId,
        items: rows.map(({ name, quantity, priceMinor }) => ({ name, quantity, priceMinor })),
        photos,
        note: note || undefined,
      });
      setResult(res);
      loadRecent();
      onLogged?.();
    } catch (err) {
      toast({ title: 'Minibar log failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const handleWaive = async (c) => {
    const reason = window.prompt('Waive reason — posts a folio reversal:');
    if (!reason) return;
    try {
      await waiveMinibar(c.id, reason);
      toast({ title: 'Check waived & charge reversed' });
      loadRecent();
    } catch (err) {
      toast({ title: 'Waive failed', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wine className="h-5 w-5" /> Minibar log
          </DialogTitle>
          <DialogDescription>
            Consumption is charged straight to the in-house guest's folio.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {result.posted
                    ? `Charge posted to folio — ${result.reservation?.confirmationNumber ?? ''}`
                    : 'Logged — no in-house reservation in this room, charge held'}
                </p>
                <p className="text-sm text-muted-foreground">Total: {fmt(total)}</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setResult(null);
                setRows([]);
                setPhotos([]);
                setNote('');
              }}
            >
              Log another
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Room</label>
                <Select value={roomId} onValueChange={setRoomId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room…" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        Room {r.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Photo proof (max 4)</label>
                <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent">
                  <Camera className="h-4 w-4" />
                  <span className="text-muted-foreground">
                    {photos.length > 0 ? `${photos.length} attached` : 'Take / attach photos'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={onPhotoChange}
                  />
                </label>
              </div>
            </div>

            {photos.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {photos.map((p, i) => (
                  <div key={i} className="relative">
                    <img src={p} alt="" className="h-16 w-16 object-cover rounded-md border" />
                    <button
                      onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-600 text-white text-xs leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Items</label>
              <div className="flex flex-wrap gap-1.5">
                {CATALOG.map((item) => (
                  <Button
                    key={item.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => addItem(item)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> {item.name} · {fmt(item.priceMinor)}
                  </Button>
                ))}
              </div>
            </div>

            {rows.length > 0 && (
              <div className="rounded-md border divide-y">
                {rows.map((r) => (
                  <div key={r.name} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>{r.name}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => bump(r.name, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-4 text-center">{r.quantity}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => bump(r.name, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="w-20 text-right font-medium">
                        {fmt(r.quantity * r.priceMinor)}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between px-3 py-2 text-sm font-bold bg-muted/50">
                  <span>Total</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>
            )}

            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />

            <Button onClick={submit} disabled={busy} className="w-full">
              {busy ? 'Posting…' : `Log & post ${fmt(total)} to folio`}
            </Button>
          </div>
        )}

        {recent.length > 0 && (
          <div className="border-t pt-4 space-y-1.5">
            <h3 className="text-sm font-semibold">Recent checks</h3>
            {recent.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Room {c.room?.number} — {fmt(c.totalMinor)}
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      c.status === 'posted'
                        ? 'text-emerald-600 border-emerald-500/30'
                        : c.status === 'waived'
                          ? 'text-zinc-400'
                          : 'text-orange-500 border-orange-500/30'
                    }
                  >
                    {c.status}
                  </Badge>
                  {c.status === 'posted' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-red-600"
                      onClick={() => handleWaive(c)}
                    >
                      Waive
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
