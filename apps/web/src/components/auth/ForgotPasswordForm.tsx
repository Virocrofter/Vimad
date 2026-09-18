import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../api/auth';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    await requestPasswordReset(data);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Check your email</h3>
          <p className="mt-1 text-sm text-text-secondary">
            We've sent a password reset link to your email address.
          </p>
        </div>
        <Link
          to="/auth/login"
          className="inline-flex items-center text-sm font-medium text-secondary hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="you@property.com"
        icon={Mail}
        error={errors.email?.message}
        {...register('email')}
      />
      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Send Reset Link
      </Button>
    </form>
  );
}
