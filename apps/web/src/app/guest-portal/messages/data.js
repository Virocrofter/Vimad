/* src/app/guest-portal/messages/data.js */

/* ─── Mock Staff ─── */
export const mockStaff = [
  {
    id: 'staff-001',
    name: 'Sarah Mitchell',
    role: 'Guest Services',
    avatar: null,
    status: 'online',
  },
  { id: 'staff-002', name: 'James Rodriguez', role: 'Concierge', avatar: null, status: 'away' },
  {
    id: 'staff-003',
    name: 'Emily Chen',
    role: 'Housekeeping Manager',
    avatar: null,
    status: 'online',
  },
];

/* ─── Mock Messages ─── */
export const mockMessages = [
  {
    id: 'msg-001',
    sender: 'staff',
    staffId: 'staff-001',
    text: "Welcome to Grand Hotel Boston! I'm Sarah, your guest services specialist. Feel free to reach out if you need anything during your stay.",
    timestamp: '2026-08-12T15:30:00Z',
    status: 'read',
    attachments: [],
  },
  {
    id: 'msg-002',
    sender: 'guest',
    text: 'Hi Sarah! Thank you. Could you help me with a late checkout request?',
    timestamp: '2026-08-12T15:32:00Z',
    status: 'read',
    attachments: [],
  },
  {
    id: 'msg-003',
    sender: 'staff',
    staffId: 'staff-001',
    text: "Of course! I've noted your request for a late checkout. As a Gold member, you're eligible for complimentary late checkout until 2 PM. I'll confirm this with housekeeping and get back to you shortly.",
    timestamp: '2026-08-12T15:35:00Z',
    status: 'read',
    attachments: [],
  },
  {
    id: 'msg-004',
    sender: 'staff',
    staffId: 'staff-001',
    text: 'Your late checkout has been confirmed! You may keep your room until 2:00 PM on August 15th at no additional charge.',
    timestamp: '2026-08-12T16:00:00Z',
    status: 'read',
    attachments: [],
  },
  {
    id: 'msg-005',
    sender: 'guest',
    text: "That's wonderful, thank you so much!",
    timestamp: '2026-08-12T16:05:00Z',
    status: 'read',
    attachments: [],
  },
  {
    id: 'msg-006',
    sender: 'system',
    text: 'Announcement: The rooftop pool will be closed for maintenance on August 20 from 6 AM to 12 PM.',
    timestamp: '2026-08-15T14:00:00Z',
    status: 'delivered',
    attachments: [],
  },
];

/* ─── Helpers ─── */
export function formatMessageTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
