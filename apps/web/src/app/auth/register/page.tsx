import { useState, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { RegisterWizard } from '../../../components/auth/RegisterWizard';

type RegisterWizardProps = {
  onSubmit: (data: {
    tenantName: string;
    tenantSlug: string;
    ownerEmail: string;
    ownerPassword: string;
    ownerFirstName?: string;
    ownerLastName?: string;
  }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

const TypedRegisterWizard = RegisterWizard as unknown as ComponentType<RegisterWizardProps>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (data: {
    tenantName: string;
    tenantSlug: string;
    ownerEmail: string;
    ownerPassword: string;
    ownerFirstName?: string;
    ownerLastName?: string;
  }) => {
    setFormError(null);
    clearError();
    try {
      await register(data);
      navigate('/app/dashboard');
    } catch (err: any) {
      setFormError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Create your Vimad account</h1>
        <TypedRegisterWizard
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={formError || error}
        />
      </div>
    </div>
  );
}
