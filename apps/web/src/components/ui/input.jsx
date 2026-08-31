import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(function Input(
  { label, error, icon: Icon, className, containerClassName, ...props },
  ref
) {
  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-text-primary">
          {label}
          {props.required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            Icon && 'pl-10',
            error && 'border-danger focus-visible:ring-danger',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
});
