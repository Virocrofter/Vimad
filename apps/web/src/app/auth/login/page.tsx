import { useState, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { LoginForm } from '../../../components/auth/LoginForm';

type LoginFormProps = {
  onSubmit: (data: { tenantSlug: string; email: string; password: string }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

const TypedLoginForm = LoginForm as unknown as ComponentType<LoginFormProps>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (data: { tenantSlug: string; email: string; password: string }) => {
    setFormError(null);
    clearError();
    try {
      await login(data.tenantSlug, data.email, data.password);
      navigate('/app/dashboard');
    } catch (err: any) {
      setFormError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Sign in to Vimad</h1>
        <TypedLoginForm onSubmit={handleSubmit} isLoading={isLoading} error={formError || error} />
      </div>
    </div>
  );
}
