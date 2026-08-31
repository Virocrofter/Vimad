import { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-secondary text-white hover:bg-secondary/90 border-transparent',
  secondary: 'bg-surface text-text-primary border-border hover:bg-surface-elevated',
  outline: 'bg-transparent text-text-primary border-border hover:bg-surface',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-elevated hover:text-text-primary border-transparent',
  danger: 'bg-danger text-white hover:bg-danger/90 border-transparent',
};

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-sm',
  icon: 'h-9 w-9 p-0 justify-center',
};

export const Button = forwardRef(function Button(
  { className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center gap-2 rounded-md border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
