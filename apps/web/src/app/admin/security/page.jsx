'use client';

import { useState } from 'react';
import { useApiFetch } from '@/hooks/useApiFetch';
import { useApiMutation } from '@/hooks/useApiMutation';
import { fetchSecuritySettings, updateSecuritySettings } from '@/api/security';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, Key, Clock, Globe, Save } from 'lucide-react';

export default function SecurityPage() {
  const { toast } = useToast();
  const { data: security, loading, error, refetch } = useApiFetch(fetchSecuritySettings, []);
  const [formData, setFormData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const updateMutation = useApiMutation(updateSecuritySettings, {
    onSuccess: () => {
      toast({
        title: 'Security settings updated',
        description: 'Security configuration saved successfully.',
      });
      setHasChanges(false);
      refetch();
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update security settings',
        variant: 'destructive',
      });
    },
  });

  if (security && !formData) {
    setFormData(security);
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Security Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure authentication, password policies, and access controls
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={updateMutation.loading}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.loading ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      <Tabs defaultValue="2fa" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="2fa">Two-Factor Auth</TabsTrigger>
          <TabsTrigger value="password">Password Policy</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="ip">IP Restrictions</TabsTrigger>
          <TabsTrigger value="audit">Audit Retention</TabsTrigger>
        </TabsList>

        {/* 2FA Settings */}
        <TabsContent value="2fa">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>Configure 2FA requirements and allowed methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to enable 2FA on their accounts
                  </p>
                </div>
                <Switch
                  checked={formData.twoFactorAuth.enabled}
                  onCheckedChange={(checked) => handleChange('twoFactorAuth', 'enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Make 2FA mandatory for specified roles
                  </p>
                </div>
                <Switch
                  checked={formData.twoFactorAuth.required}
                  onCheckedChange={(checked) => handleChange('twoFactorAuth', 'required', checked)}
                />
              </div>

              <div className="space-y-3">
                <Label>Allowed 2FA Methods</Label>
                <div className="space-y-2">
                  {[
                    {
                      value: 'authenticator',
                      label: 'Authenticator App',
                      description: 'Google Authenticator, Authy, etc.',
                    },
                    { value: 'sms', label: 'SMS', description: 'Text message verification' },
                    { value: 'email', label: 'Email', description: 'Email verification code' },
                  ].map((method) => (
                    <div key={method.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={method.value}
                        checked={formData.twoFactorAuth.methods.includes(method.value)}
                        onCheckedChange={(checked) => {
                          const methods = checked
                            ? [...formData.twoFactorAuth.methods, method.value]
                            : formData.twoFactorAuth.methods.filter((m) => m !== method.value);
                          handleChange('twoFactorAuth', 'methods', methods);
                        }}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={method.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {method.label}
                        </label>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {formData.twoFactorAuth.required && (
                <div className="space-y-3">
                  <Label>Enforce for Roles</Label>
                  <div className="flex flex-wrap gap-2">
                    {['owner', 'admin', 'manager', 'staff'].map((role) => (
                      <Badge
                        key={role}
                        variant={
                          formData.twoFactorAuth.enforceForRoles.includes(role)
                            ? 'default'
                            : 'outline'
                        }
                        className="cursor-pointer"
                        onClick={() => {
                          const roles = formData.twoFactorAuth.enforceForRoles.includes(role)
                            ? formData.twoFactorAuth.enforceForRoles.filter((r) => r !== role)
                            : [...formData.twoFactorAuth.enforceForRoles, role];
                          handleChange('twoFactorAuth', 'enforceForRoles', roles);
                        }}
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Policy */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Password Policy</CardTitle>
              <CardDescription>Configure password requirements and expiration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minLength">Minimum Length</Label>
                  <Input
                    id="minLength"
                    type="number"
                    min="8"
                    max="32"
                    value={formData.passwordPolicy.minLength}
                    onChange={(e) =>
                      handleChange('passwordPolicy', 'minLength', parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDays">Expiry (days)</Label>
                  <Input
                    id="expiryDays"
                    type="number"
                    value={formData.passwordPolicy.expiryDays}
                    onChange={(e) =>
                      handleChange('passwordPolicy', 'expiryDays', parseInt(e.target.value))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'requireUppercase', label: 'Require Uppercase Letters' },
                  { key: 'requireLowercase', label: 'Require Lowercase Letters' },
                  { key: 'requireNumbers', label: 'Require Numbers' },
                  { key: 'requireSpecialChars', label: 'Require Special Characters' },
                ].map((req) => (
                  <div key={req.key} className="flex items-center justify-between">
                    <Label>{req.label}</Label>
                    <Switch
                      checked={formData.passwordPolicy[req.key]}
                      onCheckedChange={(checked) =>
                        handleChange('passwordPolicy', req.key, checked)
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preventReuse">Prevent Reuse (last N passwords)</Label>
                <Input
                  id="preventReuse"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.passwordPolicy.preventReuse}
                  onChange={(e) =>
                    handleChange('passwordPolicy', 'preventReuse', parseInt(e.target.value))
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Users cannot reuse their last {formData.passwordPolicy.preventReuse} passwords
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session Security */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Session Security
              </CardTitle>
              <CardDescription>
                Configure session timeouts and concurrent session limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxConcurrent">Max Concurrent Sessions</Label>
                  <Input
                    id="maxConcurrent"
                    type="number"
                    min="1"
                    value={formData.sessionSecurity.maxConcurrentSessions}
                    onChange={(e) =>
                      handleChange(
                        'sessionSecurity',
                        'maxConcurrentSessions',
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idleTimeout">Idle Timeout (minutes)</Label>
                  <Input
                    id="idleTimeout"
                    type="number"
                    value={formData.sessionSecurity.idleTimeoutMinutes}
                    onChange={(e) =>
                      handleChange(
                        'sessionSecurity',
                        'idleTimeoutMinutes',
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="absoluteTimeout">Absolute Timeout (hours)</Label>
                  <Input
                    id="absoluteTimeout"
                    type="number"
                    value={formData.sessionSecurity.absoluteTimeoutHours}
                    onChange={(e) =>
                      handleChange(
                        'sessionSecurity',
                        'absoluteTimeoutHours',
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Re-authentication for Sensitive Actions</Label>
                  <p className="text-sm text-muted-foreground">
                    Ask for password confirmation when changing security settings
                  </p>
                </div>
                <Switch
                  checked={formData.sessionSecurity.requireReauthForSensitive}
                  onCheckedChange={(checked) =>
                    handleChange('sessionSecurity', 'requireReauthForSensitive', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IP Restrictions */}
        <TabsContent value="ip">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                IP Restrictions
              </CardTitle>
              <CardDescription>Control access based on IP addresses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable IP Restrictions</Label>
                  <p className="text-sm text-muted-foreground">
                    Only allow access from specified IP addresses
                  </p>
                </div>
                <Switch
                  checked={formData.ipRestrictions.enabled}
                  onCheckedChange={(checked) => handleChange('ipRestrictions', 'enabled', checked)}
                />
              </div>

              {formData.ipRestrictions.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Allowed IP Addresses (one per line)</Label>
                    <textarea
                      className="w-full h-32 p-2 border rounded-md"
                      value={formData.ipRestrictions.allowedIPs.join('\n')}
                      onChange={(e) =>
                        handleChange(
                          'ipRestrictions',
                          'allowedIPs',
                          e.target.value.split('\n').filter((ip) => ip.trim())
                        )
                      }
                      placeholder="192.168.1.1&#10;10.0.0.0/8&#10;172.16.0.0/12"
                    />
                    <p className="text-sm text-muted-foreground">
                      Supports individual IPs and CIDR notation
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Blocked IP Addresses (one per line)</Label>
                    <textarea
                      className="w-full h-32 p-2 border rounded-md"
                      value={formData.ipRestrictions.blockedIPs.join('\n')}
                      onChange={(e) =>
                        handleChange(
                          'ipRestrictions',
                          'blockedIPs',
                          e.target.value.split('\n').filter((ip) => ip.trim())
                        )
                      }
                      placeholder="192.168.1.100&#10;203.0.113.0/24"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Retention */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log Retention</CardTitle>
              <CardDescription>Configure how long to keep audit logs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retentionDays">Retention Period (days)</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    value={formData.auditRetention.days}
                    onChange={(e) =>
                      handleChange('auditRetention', 'days', parseInt(e.target.value))
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Audit logs older than this will be deleted
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="archiveDays">Archive After (days)</Label>
                  <Input
                    id="archiveDays"
                    type="number"
                    value={formData.auditRetention.archiveAfterDays}
                    onChange={(e) =>
                      handleChange('auditRetention', 'archiveAfterDays', parseInt(e.target.value))
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Move to cold storage after this period
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
