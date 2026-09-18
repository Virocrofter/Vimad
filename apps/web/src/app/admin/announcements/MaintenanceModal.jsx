// apps/web/src/app/admin/announcements/MaintenanceModal.jsx
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, Plus, Wrench, Save } from 'lucide-react';
import { createMaintenanceWindow, updateMaintenanceWindow } from '@/api/announcements';

const SERVICE_OPTIONS = [
  'API',
  'Web App',
  'Database',
  'Email',
  'SMS',
  'Channel Manager',
  'Reports',
  'Guest Portal',
  'Mobile App',
];

export default function MaintenanceModal({ maintenanceWindow, onClose, onSuccess }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    affectedServices: [],
  });

  const [prevMaintenanceWindow, setPrevMaintenanceWindow] = useState(null);
  if (maintenanceWindow !== prevMaintenanceWindow) {
    setPrevMaintenanceWindow(maintenanceWindow);
    if (maintenanceWindow) {
      setForm({
        title: maintenanceWindow.title || '',
        description: maintenanceWindow.description || '',
        startTime: maintenanceWindow.startTime
          ? new Date(maintenanceWindow.startTime).toISOString().slice(0, 16)
          : '',
        endTime: maintenanceWindow.endTime
          ? new Date(maintenanceWindow.endTime).toISOString().slice(0, 16)
          : '',
        affectedServices: maintenanceWindow.affectedServices || [],
      });
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      };

      if (maintenanceWindow) {
        await updateMaintenanceWindow(maintenanceWindow.id, data);
        toast({ title: 'Updated', description: 'Maintenance window updated successfully' });
      } else {
        await createMaintenanceWindow(data);
        toast({ title: 'Scheduled', description: 'Maintenance window scheduled successfully' });
      }
      onSuccess();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save maintenance window',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service) => {
    setForm((prev) => ({
      ...prev,
      affectedServices: prev.affectedServices.includes(service)
        ? prev.affectedServices.filter((s) => s !== service)
        : [...prev.affectedServices, service],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {maintenanceWindow ? 'Edit Maintenance' : 'Schedule Maintenance'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Database Upgrade"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the maintenance work and expected impact"
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Time *</label>
                <Input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Time *</label>
                <Input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Affected Services *</label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_OPTIONS.map((service) => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => toggleService(service)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      form.affectedServices.includes(service)
                        ? 'bg-orange-100 text-orange-800 border-orange-300'
                        : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || form.affectedServices.length === 0}
                className="gap-2"
              >
                {loading ? (
                  'Saving...'
                ) : maintenanceWindow ? (
                  <>
                    <Save className="w-4 h-4" />
                    Update
                  </>
                ) : (
                  <>
                    <Wrench className="w-4 h-4" />
                    Schedule
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
