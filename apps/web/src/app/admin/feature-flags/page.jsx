'use client';

import { useState } from 'react';
import { useApiFetch } from '@/hooks/useApiFetch';
import { useApiMutation } from '@/hooks/useApiMutation';
import {
  fetchFeatureFlags,
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
} from '@/api/feature-flag';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Flag, Plus, Search, Edit, Trash2, Users, Globe } from 'lucide-react';

export default function FeatureFlagsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enabled: false,
    rolloutPercentage: 100,
    targetAudience: 'all',
  });

  const { data: flags, loading, error, refetch } = useApiFetch(fetchFeatureFlags, []);

  const { mutate: createFlag, loading: creating } = useApiMutation(createFeatureFlag);

  const { mutate: updateFlag, loading: updating } = useApiMutation(updateFeatureFlag);

  const { mutate: deleteFlag, loading: deleting } = useApiMutation(deleteFeatureFlag);

  const handleCreate = async () => {
    try {
      await createFlag(formData);
      setCreateDialogOpen(false);
      resetForm();
      refetch();
    } catch (err) {
      console.error('Failed to create flag:', err);
    }
  };

  const handleUpdate = async () => {
    if (!selectedFlag) return;

    try {
      await updateFlag({ id: selectedFlag.id, ...formData });
      setEditDialogOpen(false);
      setSelectedFlag(null);
      resetForm();
      refetch();
    } catch (err) {
      console.error('Failed to update flag:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedFlag) return;

    try {
      await deleteFlag(selectedFlag.id);
      setDeleteDialogOpen(false);
      setSelectedFlag(null);
      refetch();
    } catch (err) {
      console.error('Failed to delete flag:', err);
    }
  };

  const handleToggle = async (flag) => {
    try {
      await updateFlag({ id: flag.id, enabled: !flag.enabled });
      refetch();
    } catch (err) {
      console.error('Failed to toggle flag:', err);
    }
  };

  const openEditDialog = (flag) => {
    setSelectedFlag(flag);
    setFormData({
      name: flag.name,
      description: flag.description,
      enabled: flag.enabled,
      rolloutPercentage: flag.rolloutPercentage,
      targetAudience: flag.targetAudience,
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      enabled: false,
      rolloutPercentage: 100,
      targetAudience: 'all',
    });
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  const filteredFlags = flags?.filter(
    (flag) =>
      flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flag className="h-8 w-8" />
            Feature Flags
          </h1>
          <p className="text-muted-foreground mt-1">Manage feature rollouts and A/B testing</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Flag
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search flags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Flags Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} count={1} />
          ))}
        </div>
      ) : filteredFlags?.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFlags.map((flag) => (
            <Card key={flag.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{flag.name}</CardTitle>
                    <CardDescription className="mt-1">{flag.description}</CardDescription>
                  </div>
                  <Switch checked={flag.enabled} onCheckedChange={() => handleToggle(flag)} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{flag.rolloutPercentage}% rollout</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{flag.targetAudience}</span>
                  </div>
                </div>

                {/* Rollout Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Rollout Progress</span>
                    <span className="font-medium">{flag.rolloutPercentage}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${flag.rolloutPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(flag)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedFlag(flag);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No feature flags found"
          description="Create your first feature flag to get started."
          actionLabel="Create Flag"
          onAction={() => setCreateDialogOpen(true)}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setSelectedFlag(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createDialogOpen ? 'Create Feature Flag' : 'Edit Feature Flag'}
            </DialogTitle>
            <DialogDescription>
              {createDialogOpen
                ? 'Create a new feature flag to control feature rollouts.'
                : 'Update the feature flag settings.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Flag Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="new-feature"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does this flag control?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rollout">Rollout Percentage</Label>
              <Input
                id="rollout"
                type="number"
                min="0"
                max="100"
                value={formData.rolloutPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rolloutPercentage: parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Select
                value={formData.targetAudience}
                onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="beta">Beta Users</SelectItem>
                  <SelectItem value="internal">Internal Only</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">Enabled</Label>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setEditDialogOpen(false);
                setSelectedFlag(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={createDialogOpen ? handleCreate : handleUpdate}
              disabled={creating || updating || !formData.name}
            >
              {creating || updating ? 'Saving...' : createDialogOpen ? 'Create' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Feature Flag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the feature flag <strong>{selectedFlag?.name}</strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
