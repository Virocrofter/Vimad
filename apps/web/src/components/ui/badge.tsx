import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant =
  'default' | 'secondary' | 'outline' | 'accent' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface text-text-primary border-border',
  secondary: 'bg-secondary/10 text-secondary border-secondary/20',
  outline: 'bg-transparent text-text-primary border-border',
  accent: 'bg-accent/10 text-accent border-accent/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  info: 'bg-info/10 text-info border-info/20',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
