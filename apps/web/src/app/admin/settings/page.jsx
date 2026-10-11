'use client';

import { useState } from 'react';
import { useApiFetch } from '@/hooks/useApiFetch';
import { useApiMutation } from '@/hooks/useApiMutation';
import { fetchSettings, updateSettings } from '@/api/settings';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, RotateCcw } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: settings, loading, error, refetch } = useApiFetch(fetchSettings, []);
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState(null);

  const updateMutation = useApiMutation(updateSettings, {
    onSuccess: () => {
      toast({
        title: 'Settings saved',
        description: 'Your changes have been saved successfully.',
      });
      setHasChanges(false);
      refetch();
    },
    onError: (err) => {
      toast({
        title: 'Error saving settings',
        description: err.message || 'Failed to save settings',
        variant: 'destructive',
      });
    },
  });

  // Initialize form data when settings load
  if (settings && !formData) {
    setFormData(settings);
  }

  const handleChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleReset = () => {
    setFormData(settings);
    setHasChanges(false);
    toast({
      title: 'Changes discarded',
      description: 'All unsaved changes have been reset.',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSkeleton count={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (!formData) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure global platform settings and preferences
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Discard
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.loading}>
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic platform configuration and defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={formData.general.platformName}
                    onChange={(e) => handleChange('general', 'platformName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={formData.general.supportEmail}
                    onChange={(e) => handleChange('general', 'supportEmail', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultTimezone">Default Timezone</Label>
                  <Select
                    value={formData.general.defaultTimezone}
                    onValueChange={(value) => handleChange('general', 'defaultTimezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency">Default Currency</Label>
                  <Select
                    value={formData.general.defaultCurrency}
                    onValueChange={(value) => handleChange('general', 'defaultCurrency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ZAR">ZAR - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={formData.general.dateFormat}
                    onValueChange={(value) => handleChange('general', 'dateFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Select
                    value={formData.general.timeFormat}
                    onValueChange={(value) => handleChange('general', 'timeFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                      <SelectItem value="24h">24 Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Authentication and access control configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={formData.security.sessionTimeout}
                    onChange={(e) =>
                      handleChange('security', 'sessionTimeout', parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={formData.security.maxLoginAttempts}
                    onChange={(e) =>
                      handleChange('security', 'maxLoginAttempts', parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    value={formData.security.lockoutDuration}
                    onChange={(e) =>
                      handleChange('security', 'lockoutDuration', parseInt(e.target.value))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Enforce 2FA for all admin users</p>
                </div>
                <Switch
                  checked={formData.security.requireTwoFactor}
                  onCheckedChange={(checked) =>
                    handleChange('security', 'requireTwoFactor', checked)
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Password Min Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="8"
                    max="32"
                    value={formData.security.passwordMinLength}
                    onChange={(e) =>
                      handleChange('security', 'passwordMinLength', parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordExpiryDays">Password Expiry (days)</Label>
                  <Input
                    id="passwordExpiryDays"
                    type="number"
                    value={formData.security.passwordExpiryDays}
                    onChange={(e) =>
                      handleChange('security', 'passwordExpiryDays', parseInt(e.target.value))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Special Characters</Label>
                  <p className="text-sm text-muted-foreground">
                    Passwords must contain special characters
                  </p>
                </div>
                <Switch
                  checked={formData.security.passwordRequireSpecial}
                  onCheckedChange={(checked) =>
                    handleChange('security', 'passwordRequireSpecial', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>SMTP and email service settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emailProvider">Email Provider</Label>
                  <Select
                    value={formData.email.provider}
                    onValueChange={(value) => handleChange('email', 'provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smtp">SMTP</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="ses">Amazon SES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={formData.email.fromName}
                    onChange={(e) => handleChange('email', 'fromName', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={formData.email.fromEmail}
                  onChange={(e) => handleChange('email', 'fromEmail', e.target.value)}
                />
              </div>

              {formData.email.provider === 'smtp' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={formData.email.smtpHost || ''}
                        onChange={(e) => handleChange('email', 'smtpHost', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={formData.email.smtpPort || ''}
                        onChange={(e) =>
                          handleChange('email', 'smtpPort', parseInt(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpUser">SMTP Username</Label>
                      <Input
                        id="smtpUser"
                        value={formData.email.smtpUser || ''}
                        onChange={(e) => handleChange('email', 'smtpUser', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-8">
                      <div className="space-y-0.5">
                        <Label>Use SSL/TLS</Label>
                        <p className="text-sm text-muted-foreground">Secure connection</p>
                      </div>
                      <Switch
                        checked={formData.email.smtpSecure}
                        onCheckedChange={(checked) => handleChange('email', 'smtpSecure', checked)}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Flags */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
              <CardDescription>Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: 'enableGuestPortal',
                  label: 'Guest Portal',
                  description: 'Allow guests to self-manage bookings',
                },
                {
                  key: 'enableMobileApp',
                  label: 'Mobile App',
                  description: 'Enable mobile app access',
                },
                {
                  key: 'enableChannelManager',
                  label: 'Channel Manager',
                  description: 'Connect to booking channels',
                },
                {
                  key: 'enableLoyaltyProgram',
                  label: 'Loyalty Program',
                  description: 'Guest loyalty and rewards',
                },
                {
                  key: 'enableMarketingAutomation',
                  label: 'Marketing Automation',
                  description: 'Automated email campaigns',
                },
                {
                  key: 'enableAdvancedReporting',
                  label: 'Advanced Reporting',
                  description: 'Custom reports and analytics',
                },
              ].map((feature) => (
                <div key={feature.key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{feature.label}</Label>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                  <Switch
                    checked={formData.features[feature.key]}
                    onCheckedChange={(checked) => handleChange('features', feature.key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Integrations</CardTitle>
              <CardDescription>Configure external service integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Payment Processing (Stripe)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stripePublicKey">Public Key</Label>
                    <Input
                      id="stripePublicKey"
                      value={formData.integrations.stripePublicKey || ''}
                      onChange={(e) =>
                        handleChange('integrations', 'stripePublicKey', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripeSecretKey">Secret Key</Label>
                    <Input
                      id="stripeSecretKey"
                      type="password"
                      value={formData.integrations.stripeSecretKey || ''}
                      onChange={(e) =>
                        handleChange('integrations', 'stripeSecretKey', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">SMS (Twilio)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twilioSid">Account SID</Label>
                    <Input
                      id="twilioSid"
                      value={formData.integrations.twilioAccountSid || ''}
                      onChange={(e) =>
                        handleChange('integrations', 'twilioAccountSid', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twilioToken">Auth Token</Label>
                    <Input
                      id="twilioToken"
                      type="password"
                      value={formData.integrations.twilioAuthToken || ''}
                      onChange={(e) =>
                        handleChange('integrations', 'twilioAuthToken', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twilioPhone">Phone Number</Label>
                    <Input
                      id="twilioPhone"
                      value={formData.integrations.twilioPhoneNumber || ''}
                      onChange={(e) =>
                        handleChange('integrations', 'twilioPhoneNumber', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Error Tracking (Sentry)</h3>
                <div className="space-y-2">
                  <Label htmlFor="sentryDsn">DSN</Label>
                  <Input
                    id="sentryDsn"
                    value={formData.integrations.sentryDsn || ''}
                    onChange={(e) => handleChange('integrations', 'sentryDsn', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Updated Info */}
      {settings && (
        <div className="text-sm text-muted-foreground text-center">
          Last updated: {new Date(settings.updatedAt).toLocaleString()} by {settings.updatedBy}
        </div>
      )}
    </div>
  );
}
