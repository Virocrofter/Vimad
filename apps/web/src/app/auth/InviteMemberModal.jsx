import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Mail, UserPlus, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'front_desk', 'housekeeping', 'readonly']),
});

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'front_desk', label: 'Front Desk' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'readonly', label: 'Read-only' },
];

export function InviteMemberModal({ isOpen, onClose }) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', role: 'front_desk' },
  });

  const onSubmit = async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    console.log('Invite sent:', data);
    setSubmitted(true);
    setTimeout(() => {
      reset();
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-backdrop absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <CheckCircle className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-text-primary">Invitation sent!</h3>
            <p className="mt-1 text-sm text-text-secondary">
              They'll receive an email to join your team.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                <UserPlus className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Invite Team Member</h3>
                <p className="text-sm text-text-secondary">Add a new member to your property</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="colleague@property.com"
                icon={Mail}
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">
                  Role <span className="text-danger">*</span>
                </label>
                <select
                  {...register('role')}
                  className={cn(
                    'flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    errors.role && 'border-danger focus-visible:ring-danger'
                  )}
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {errors.role && <p className="text-xs text-danger">{errors.role.message}</p>}
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                  Send Invitation
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
