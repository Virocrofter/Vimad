import { useState, useRef, useEffect, type ReactNode, type MouseEvent } from 'react';
import { cn } from '../../lib/utils';

export interface DropdownItem {
  id: string;
  label: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: globalThis.MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleItemClick = (e: MouseEvent<HTMLButtonElement>, item: DropdownItem) => {
    e.stopPropagation();
    if (item.disabled) return;
    item.onClick?.();
    setOpen(false);
  };

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-40 mt-2 min-w-[10rem] rounded-md border border-border bg-surface py-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={item.disabled}
              onClick={(e) => handleItemClick(e, item)}
              className={cn(
                'flex w-full items-center px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-elevated disabled:opacity-50',
                item.destructive && 'text-danger hover:bg-danger/10'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
