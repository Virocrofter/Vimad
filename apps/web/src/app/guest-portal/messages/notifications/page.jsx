/* src/app/guest-portal/messages/notifications/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronLeft,
  Mail,
  MessageSquare,
  Smartphone,
  Volume2,
  Moon,
  Sun,
  Trash2,
  CheckCheck,
  Filter,
  Search,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { NotificationPrefCard, NotificationItem } from '../components';

const initialNotifications = [
  {
    id: 'notif-001',
    type: 'message',
    title: 'New message from Front Desk',
    body: 'Sarah Mitchell: Your late checkout has been confirmed! You may keep your room until 2:00 PM...',
    time: '2h ago',
    read: false,
  },
  {
    id: 'notif-002',
    type: 'alert',
    title: 'Pool Maintenance Alert',
    body: 'The rooftop pool will be closed for maintenance on August 20 from 6:00 AM to 12:00 PM. We apologize for any inconvenience.',
    time: '4h ago',
    read: false,
  },
  {
    id: 'notif-003',
    type: 'promo',
    title: 'Spa Special Offer',
    body: 'Enjoy 20% off all spa treatments this week. Book through the Concierge section of your guest portal.',
    time: '1d ago',
    read: true,
  },
  {
    id: 'notif-004',
    type: 'system',
    title: 'Digital Key Activated',
    body: 'Your digital key for Room 204 is now active. You can use it to access your room and hotel amenities.',
    time: '2d ago',
    read: true,
  },
  {
    id: 'notif-005',
    type: 'message',
    title: 'Room Service Update',
    body: 'Your order #SVC-001 (Continental Breakfast) has been delivered to Room 204.',
    time: '3d ago',
    read: true,
  },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inbox');
  const [notifications, setNotifications] = useState(initialNotifications);
  const [prefs, setPrefs] = useState({
    push: true,
    email: true,
    sms: false,
    sound: true,
    quietHours: false,
    marketing: false,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const archiveNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications =
    activeTab === 'inbox' ? notifications : notifications.filter((n) => !n.read);

  const togglePref = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/messages')}
          className="p-2 -ml-2 rounded-lg hover:bg-surface-elevated"
        >
          <ChevronLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Notifications</h1>
          <p className="text-sm text-text-secondary">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="ml-auto text-xs text-secondary hover:underline flex items-center gap-1"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'inbox', label: 'All', count: notifications.length },
          { id: 'unread', label: 'Unread', count: unreadCount },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-secondary bg-secondary/5 text-secondary'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
            )}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-text-muted">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={markAsRead}
              onArchive={archiveNotification}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <Bell className="mx-auto h-10 w-10 text-text-muted mb-3" />
            <p className="text-sm text-text-muted">No notifications</p>
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
          Preferences
        </h2>
        <div className="space-y-3">
          <NotificationPrefCard
            icon={Bell}
            label="Push Notifications"
            description="Receive alerts on your device"
            enabled={prefs.push}
            onToggle={() => togglePref('push')}
          />
          <NotificationPrefCard
            icon={Mail}
            label="Email Notifications"
            description="Get updates via email"
            enabled={prefs.email}
            onToggle={() => togglePref('email')}
          />
          <NotificationPrefCard
            icon={Smartphone}
            label="SMS Notifications"
            description="Text messages for urgent updates"
            enabled={prefs.sms}
            onToggle={() => togglePref('sms')}
          />
          <NotificationPrefCard
            icon={Volume2}
            label="Sound"
            description="Play sound for new notifications"
            enabled={prefs.sound}
            onToggle={() => togglePref('sound')}
          />
          <NotificationPrefCard
            icon={Moon}
            label="Quiet Hours"
            description="Pause notifications 10 PM - 7 AM"
            enabled={prefs.quietHours}
            onToggle={() => togglePref('quietHours')}
          />
          <NotificationPrefCard
            icon={MessageSquare}
            label="Marketing"
            description="Promotional offers and updates"
            enabled={prefs.marketing}
            onToggle={() => togglePref('marketing')}
          />
        </div>
      </div>
    </div>
  );
}
