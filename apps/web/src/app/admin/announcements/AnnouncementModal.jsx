// apps/web/src/app/admin/announcements/AnnouncementModal.jsx
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Send, Save } from 'lucide-react';
import { createAnnouncement, updateAnnouncement } from '@/api/announcements';

const AUDIENCE_OPTIONS = [
  'all_tenants',
  'admins',
  'managers',
  'staff',
  'owners',
  'trial_users',
  'paid_users',
];

export default function AnnouncementModal({ announcement, onClose, onSuccess }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'general',
    priority: 'normal',
    status: 'draft',
    targetAudience: [],
    scheduledAt: '',
    expiresAt: '',
  });

  const [prevAnnouncement, setPrevAnnouncement] = useState(null);
  if (announcement !== prevAnnouncement) {
    setPrevAnnouncement(announcement);
    if (announcement) {
      setForm({
        title: announcement.title || '',
        message: announcement.message || '',
        type: announcement.type || 'general',
        priority: announcement.priority || 'normal',
        status: announcement.status || 'draft',
        targetAudience: announcement.targetAudience || [],
        scheduledAt: announcement.scheduledAt
          ? new Date(announcement.scheduledAt).toISOString().slice(0, 16)
          : '',
        expiresAt: announcement.expiresAt
          ? new Date(announcement.expiresAt).toISOString().slice(0, 16)
          : '',
      });
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...form,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      };

      if (announcement) {
        await updateAnnouncement(announcement.id, data);
        toast({ title: 'Updated', description: 'Announcement updated successfully' });
      } else {
        await createAnnouncement(data);
        toast({ title: 'Created', description: 'Announcement created successfully' });
      }
      onSuccess();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save announcement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAudience = (audience) => {
    setForm((prev) => ({
      ...prev,
      targetAudience: prev.targetAudience.includes(audience)
        ? prev.targetAudience.filter((a) => a !== audience)
        : [...prev.targetAudience, audience],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {announcement ? 'Edit Announcement' : 'New Announcement'}
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
                placeholder="Enter announcement title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Message *</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Enter announcement message"
                rows={6}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="feature">Feature</option>
                  <option value="alert">Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target Audience</label>
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_OPTIONS.map((audience) => (
                  <button
                    key={audience}
                    type="button"
                    onClick={() => toggleAudience(audience)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      form.targetAudience.includes(audience)
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {audience.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Schedule For (optional)</label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Expires At (optional)</label>
                <Input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? (
                  'Saving...'
                ) : announcement ? (
                  <>
                    <Save className="w-4 h-4" />
                    Update
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Create
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
