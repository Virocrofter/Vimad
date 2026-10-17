/* apps/web/src/components/layout/PropertySwitcher.tsx — C1 */
import { useEffect, useRef, useState } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { usePropertyScope } from '../../hooks/usePropertyScope';

export function PropertySwitcher() {
  const { properties, current, isLoading, selectProperty } = usePropertyScope();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (isLoading && properties.length === 0) {
    return (
      <div className="h-9 w-40 animate-pulse rounded-md bg-surface-elevated" aria-hidden="true" />
    );
  }

  if (properties.length <= 1) return null; // single-property tenant — no switcher

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-md border border-border bg-surface-elevated px-3 text-sm font-medium text-text-primary hover:bg-surface"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Building2 className="h-4 w-4 shrink-0 text-primary" />
        <span className="max-w-[200px] truncate">{current ? current.name : 'All properties'}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-1 max-h-80 w-72 overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          <button
            type="button"
            role="option"
            aria-selected={current === null}
            onClick={() => {
              void selectProperty(null);
              setOpen(false);
            }}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
          >
            <span className="font-medium">All properties</span>
            {current === null && <Check className="h-4 w-4 text-primary" />}
          </button>

          <div className="my-1 border-t border-border" />

          {properties.map((p) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={current?.id === p.id}
              onClick={() => {
                void selectProperty(p.id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{p.name}</span>
                <span className="block text-xs text-text-muted">
                  {p.code}
                  {p.city ? ` · ${p.city}` : ''} · {p._count.rooms} rooms
                </span>
              </span>
              {current?.id === p.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
