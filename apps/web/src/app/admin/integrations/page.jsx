'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiFetch } from '@/hooks/useApiFetch';
import { useApiMutation } from '@/hooks/useApiMutation';
import {
  fetchIntegrations,
  connectIntegration,
  disconnectIntegration,
  syncIntegration,
} from '@/api/integrations';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import {
  Plug,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Settings,
  Trash2,
  Calendar,
  Mail,
  MessageSquare,
  CreditCard,
  Cloud,
  Database,
  BarChart3,
  Bell,
  FileText,
  Globe,
} from 'lucide-react';

// Integration categories with icons
const CATEGORIES = {
  all: { label: 'All Integrations', icon: Plug },
  channel: { label: 'Channel Managers', icon: Globe },
  payment: { label: 'Payment Gateways', icon: CreditCard },
  communication: { label: 'Communication', icon: MessageSquare },
  analytics: { label: 'Analytics & Reporting', icon: BarChart3 },
  productivity: { label: 'Productivity', icon: Calendar },
  storage: { label: 'Storage & Backup', icon: Database },
  notifications: { label: 'Notifications', icon: Bell },
};

// Provider icon mapping
const PROVIDER_ICONS = {
  bookingcom: Globe,
  expedia: Globe,
  airbnb: Globe,
  agoda: Globe,
  tripcom: Globe,
  vrbo: Globe,
  stripe: CreditCard,
  paypal: CreditCard,
  square: CreditCard,
  twilio: MessageSquare,
  sendgrid: Mail,
  slack: MessageSquare,
  google_analytics: BarChart3,
  mixpanel: BarChart3,
  segment: BarChart3,
  google_calendar: Calendar,
  outlook: Calendar,
  dropbox: Cloud,
  google_drive: Cloud,
  s3: Database,
  webhook: Bell,
  zapier: Plug,
};

export default function IntegrationsPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [configValues, setConfigValues] = useState({});

  // Fetch integrations
  const {
    data: integrations,
    loading,
    error,
    refetch,
  } = useApiFetch(() => fetchIntegrations(), []);

  // Mutations
  const connectMutation = useApiMutation(connectIntegration);
  const disconnectMutation = useApiMutation(disconnectIntegration);
  const syncMutation = useApiMutation(syncIntegration);

  // Filter integrations by category
  const filteredIntegrations =
    integrations?.filter((integration) => {
      if (activeCategory === 'all') return true;
      return integration.category === activeCategory;
    }) || [];

  // Group by connection status
  const connectedIntegrations = filteredIntegrations.filter((i) => i.status === 'connected');
  const availableIntegrations = filteredIntegrations.filter((i) => i.status !== 'connected');

  const handleConnect = (integration) => {
    setSelectedIntegration(integration);
    setConfigValues({});
    setConnectDialogOpen(true);
  };

  const handleDisconnect = async (integrationId) => {
    try {
      await disconnectMutation.mutate(integrationId);
      toast({
        title: 'Integration disconnected',
        description: 'The integration has been successfully disconnected.',
      });
      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to disconnect integration',
        variant: 'destructive',
      });
    }
  };

  const handleSync = async (integrationId) => {
    try {
      await syncMutation.mutate(integrationId);
      toast({
        title: 'Sync started',
        description: 'The integration sync has been initiated.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to start sync',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitConnection = async (e) => {
    e.preventDefault();

    try {
      await connectMutation.mutate({
        integrationId: selectedIntegration.id,
        config: configValues,
      });

      toast({
        title: 'Integration connected',
        description: `${selectedIntegration.name} has been successfully connected.`,
      });

      setConnectDialogOpen(false);
      setSelectedIntegration(null);
      setConfigValues({});
      refetch();
    } catch (err) {
      toast({
        title: 'Connection failed',
        description: err.message || 'Failed to connect integration',
        variant: 'destructive',
      });
    }
  };

  const getProviderIcon = (provider) => {
    const IconComponent = PROVIDER_ICONS[provider] || Plug;
    return <IconComponent className="h-6 w-6" />;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <LoadingSkeleton count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorState error={error} onRetry={refetch} title="Failed to load integrations" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground mt-1">Connect and manage third-party integrations</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrations?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {integrations?.filter((i) => i.status === 'connected').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <RefreshCw className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {integrations?.filter((i) => i.status === 'pending').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {integrations?.filter((i) => i.status === 'error').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          {Object.entries(CATEGORIES).map(([key, { label, icon: Icon }]) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          {/* Connected Integrations */}
          {connectedIntegrations.length > 0 && (
            <div className="space-y-4 mb-8">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Connected ({connectedIntegrations.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {connectedIntegrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onDisconnect={() => handleDisconnect(integration.id)}
                    onSync={() => handleSync(integration.id)}
                    onConfigure={() => navigate(`/admin/integrations/${integration.id}`)}
                    isSyncing={syncMutation.loading}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Available Integrations */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Plug className="h-5 w-5 text-muted-foreground" />
              Available ({availableIntegrations.length})
            </h2>

            {availableIntegrations.length === 0 ? (
              <EmptyState
                title="No integrations available"
                description="All integrations in this category are already connected."
                icon={CheckCircle2}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableIntegrations.map((integration) => (
                  <AvailableIntegrationCard
                    key={integration.id}
                    integration={integration}
                    onConnect={() => handleConnect(integration)}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Connection Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Connect {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              Enter your {selectedIntegration?.name} credentials to establish the connection.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitConnection} className="space-y-4">
            {/* Dynamic form fields based on integration config schema */}
            {selectedIntegration?.configFields?.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>

                {field.type === 'select' ? (
                  <Select
                    value={configValues[field.name] || ''}
                    onValueChange={(value) =>
                      setConfigValues((prev) => ({ ...prev, [field.name]: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'password' ? (
                  <Input
                    id={field.name}
                    type="password"
                    value={configValues[field.name] || ''}
                    onChange={(e) =>
                      setConfigValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                ) : field.type === 'textarea' ? (
                  <textarea
                    id={field.name}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={configValues[field.name] || ''}
                    onChange={(e) =>
                      setConfigValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type || 'text'}
                    value={configValues[field.name] || ''}
                    onChange={(e) =>
                      setConfigValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}

                {field.description && (
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                )}
              </div>
            ))}

            {/* Default fields if no config schema */}
            {!selectedIntegration?.configFields && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">
                    API Key <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={configValues.apiKey || ''}
                    onChange={(e) =>
                      setConfigValues((prev) => ({ ...prev, apiKey: e.target.value }))
                    }
                    placeholder="Enter your API key"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiSecret">API Secret</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    value={configValues.apiSecret || ''}
                    onChange={(e) =>
                      setConfigValues((prev) => ({ ...prev, apiSecret: e.target.value }))
                    }
                    placeholder="Enter your API secret (if applicable)"
                  />
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConnectDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={connectMutation.loading}>
                {connectMutation.loading ? 'Connecting...' : 'Connect'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Connected Integration Card Component
const getStatusBadge = (status) => {
  const variants = {
    connected: 'bg-green-100 text-green-800 hover:bg-green-100',
    pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    error: 'bg-red-100 text-red-800 hover:bg-red-100',
    disconnected: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  };

  return <Badge className={variants[status] || variants.disconnected}>{status}</Badge>;
};

function IntegrationCard({ integration, onDisconnect, onSync, onConfigure, isSyncing }) {
  const Icon = PROVIDER_ICONS[integration.provider] || Plug;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <CardDescription>{integration.description}</CardDescription>
            </div>
          </div>
          {getStatusBadge(integration.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Last sync info */}
        {integration.lastSyncAt && (
          <div className="text-sm text-muted-foreground">
            Last synced: {new Date(integration.lastSyncAt).toLocaleString()}
          </div>
        )}

        {/* Stats */}
        {integration.stats && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(integration.stats).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground capitalize">{key}:</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onSync} disabled={isSyncing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button variant="outline" size="sm" onClick={onConfigure}>
            <Settings className="h-4 w-4 mr-1" />
            Configure
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDisconnect}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Available Integration Card Component
function AvailableIntegrationCard({ integration, onConnect }) {
  const Icon = PROVIDER_ICONS[integration.provider] || Plug;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{integration.name}</CardTitle>
            <CardDescription className="line-clamp-2">{integration.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {integration.features?.slice(0, 3).map((feature) => (
              <Badge key={feature} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
          <Button onClick={onConnect} size="sm">
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
