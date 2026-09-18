import { forwardRef, type InputHTMLAttributes } from 'react';
import { Calendar } from 'lucide-react';
import { Input } from './input';

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  { label, error, containerClassName, className, ...props },
  ref
) {
  return (
    <Input
      ref={ref}
      type="date"
      label={label}
      error={error}
      icon={Calendar}
      containerClassName={containerClassName}
      className={className}
      {...props}
    />
  );
});
