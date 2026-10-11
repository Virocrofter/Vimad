import * as React from 'react';
import { cn } from '@/lib/utils';

// ─── DropdownMenu Root ───

const DropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

// ─── DropdownMenu Trigger ───

type TriggerChildProps = {
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  ref?: React.Ref<HTMLButtonElement>;
};

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
  }
>(({ className, children, onClick, asChild = false, ...props }, ref) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(!open);
    onClick?.(e);
  };

  // asChild: merge props INTO the child instead of wrapping it in a <button>
  // (prevents illegal <button> inside <button> when the child is a Button)
  if (asChild && React.isValidElement<TriggerChildProps>(children)) {
    const childProps = children.props;

    const setRefs = (node: HTMLButtonElement | null) => {
      // Only handle the forwarded ref — do not attempt to merge with child ref
      // Merging with children.props.ref violates React Compiler immutability rules
      // Child components that need ref access should use forwardRef at their call site
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref && typeof ref === 'object') {
        (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      }
    };

    return React.cloneElement(
      children as React.ReactElement<Record<string, unknown>>,
      {
        ...props,
        ref: setRefs,
        className: cn('inline-flex justify-center', className, childProps.className),
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          childProps.onClick?.(e);
          handleClick(e);
        },
      } as React.Attributes & Record<string, unknown>
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      className={cn('inline-flex justify-center', className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

// ─── DropdownMenu Content ───

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: 'start' | 'center' | 'end';
  }
>(({ className, align = 'end', children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, setOpen]);

  if (!open) return null;

  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div
      ref={(node) => {
        contentRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref && typeof ref === 'object') {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      }}
      className={cn(
        'absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

// ─── DropdownMenu Item ───

const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { setOpen } = React.useContext(DropdownMenuContext);

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        className
      )}
      onClick={(e) => {
        setOpen(false);
        onClick?.(e);
      }}
      {...props}
    />
  );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

// ─── DropdownMenu Label ───

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-2 py-1.5 text-sm font-semibold', className)} {...props} />
  )
);
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

// ─── DropdownMenu Separator ───

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
