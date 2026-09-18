import { useState } from 'react';
import { Shield, Key, Clock, User, MoreHorizontal } from 'lucide-react';

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function UsersComponents() {
  const users = [
    { id: 'u1', name: 'John Smith', email: 'john@example.com', role: 'admin', status: 'active' },
    {
      id: 'u2',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      role: 'staff',
      status: 'active',
    },
  ];

  const sessions = [
    {
      id: 's1',
      userId: 'u1',
      userName: 'John Smith',
      ip: '192.168.1.1',
      startedAt: '2026-09-10T08:00:00Z',
      sessionId: 'sess-1',
    },
    {
      id: 's2',
      userId: 'u2',
      userName: 'Sarah Johnson',
      ip: '192.168.1.2',
      startedAt: '2026-09-10T09:00:00Z',
      sessionId: 'system',
    },
  ];

  // Pre-compute session expiry time (stable reference)
  const [sessionExpiryTime] = useState(() => new Date(Date.now() + 3600000).toISOString());

  return (
    <div className="space-y-6">
      {/* Users Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-background-secondary">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">User</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Role</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                Status
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{user.name}</p>
                      <p className="text-sm text-text-secondary">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-background-secondary text-text-secondary'
                    }`}
                  >
                    <Shield className="h-3 w-3" />
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'active'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-background-secondary text-text-secondary'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="p-1 hover:bg-background-secondary rounded">
                    <MoreHorizontal className="h-4 w-4 text-text-secondary" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Active Sessions */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Active Sessions</h2>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-background-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                  User
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                  Started
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                  Expires
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-4 py-3 text-sm text-text-primary">{session.userName}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{session.ip}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {new Date(session.startedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <SessionBadge
                      expiry={session.sessionId !== 'system' ? sessionExpiryTime : null}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SessionBadge({ expiry }) {
  if (!expiry) return <span className="text-sm text-text-secondary">—</span>;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
      <Clock className="h-3 w-3" />
      {new Date(expiry).toLocaleTimeString()}
    </span>
  );
}
