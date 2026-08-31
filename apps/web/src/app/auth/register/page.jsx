import { Link } from 'react-router-dom';
import { RegisterWizard } from '../../../components/auth/RegisterWizard';

export default function RegisterPage() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">Create your account</h1>
        <p className="mt-1 text-sm text-text-secondary">Set up your property in 5 easy steps</p>
      </div>
      <RegisterWizard />
      <p className="text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link to="/auth/login" className="font-medium text-secondary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}