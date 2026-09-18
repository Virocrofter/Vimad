import { apiClient } from './client';

export interface PlatformSettings {
  id: string;
  general: {
    platformName: string;
    supportEmail: string;
    defaultTimezone: string;
    defaultCurrency: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    requireTwoFactor: boolean;
    passwordMinLength: number;
    passwordRequireSpecial: boolean;
    passwordExpiryDays: number;
  };
  email: {
    provider: 'smtp' | 'sendgrid' | 'ses';
    fromEmail: string;
    fromName: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpSecure: boolean;
  };
  features: {
    enableGuestPortal: boolean;
    enableMobileApp: boolean;
    enableChannelManager: boolean;
    enableLoyaltyProgram: boolean;
    enableMarketingAutomation: boolean;
    enableAdvancedReporting: boolean;
  };
  integrations: {
    stripePublicKey?: string;
    stripeSecretKey?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioPhoneNumber?: string;
    sentryDsn?: string;
  };
  updatedAt: string;
  updatedBy: string;
}

export interface UpdateSettingsPayload {
  general?: Partial<PlatformSettings['general']>;
  security?: Partial<PlatformSettings['security']>;
  email?: Partial<PlatformSettings['email']>;
  features?: Partial<PlatformSettings['features']>;
  integrations?: Partial<PlatformSettings['integrations']>;
}

export async function fetchSettings(): Promise<PlatformSettings> {
  const response = await apiClient.get<{ data: PlatformSettings }>('/v1/admin/settings');
  return response.data.data;
}

export async function updateSettings(payload: UpdateSettingsPayload): Promise<PlatformSettings> {
  const response = await apiClient.patch<{ data: PlatformSettings }>('/v1/admin/settings', payload);
  return response.data.data;
}

export async function resetSettings(section?: keyof PlatformSettings): Promise<PlatformSettings> {
  const response = await apiClient.post<{ data: PlatformSettings }>('/v1/admin/settings/reset', {
    section,
  });
  return response.data.data;
}
