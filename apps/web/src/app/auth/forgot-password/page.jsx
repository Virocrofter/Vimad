import { Link } from 'react-router-dom';
import { ForgotPasswordForm } from '../../../components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">Reset password</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Enter your email and we'll send you a reset link
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm text-text-secondary">
        Remember your password?{' '}
        <Link to="/auth/login" className="font-medium text-secondary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}