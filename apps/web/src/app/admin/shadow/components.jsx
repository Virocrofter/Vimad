// apps/web/src/app/admin/shadow/components.jsx
import { useState } from 'react';
import {
  Users,
  Activity,
  LogOut,
  Eye,
  MessageSquare,
  Shield,
  Clock,
  MapPin,
  Monitor,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Send,
  Globe,
  UserCheck,
  Radio,
  ChevronRight,
  Ban,
} from 'lucide-react';

// ─── Impersonation Banner ───
export function ImpersonationBanner({ user, onEnd }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-amber-600" />
        <div>
          <div className="text-sm font-medium text-amber-800">Shadow Mode Active</div>
          <div className="text-xs text-amber-700">
            You are impersonating <span className="font-semibold">{user.email}</span> ({user.role})
          </div>
        </div>
      </div>
      <button
        onClick={onEnd}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-800 bg-amber-100 rounded-md hover:bg-amber-200"
      >
        <LogOut className="w-4 h-4" />
        End Impersonation
      </button>
    </div>
  );
}

// ─── Online Users Panel ───
export function OnlineUsersPanel({
  users,
  isLoading,
  onSelectUser,
  selectedUser,
  onImpersonate,
  isImpersonating,
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-muted border-b">
        <div className="flex items-center gap-2 font-medium">
          <Radio className="w-4 h-4 text-green-500" />
          Online Users ({users.length})
        </div>
      </div>
      <div className="divide-y max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No users currently online
          </div>
        ) : (
          users.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user)}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors ${
                selectedUser?.id === user.id ? 'bg-primary/5 border-l-2 border-primary' : ''
              }`}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                    user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                <div className="text-xs text-muted-foreground">{user.tenantName}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Shadow User Selector Detail ───
export function ShadowUserSelector({ user, activity, onImpersonate, onViewHistory }) {
  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-medium">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                  {user.role}
                </span>
                <span className="text-xs text-muted-foreground">{user.tenantName}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onImpersonate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              <Eye className="w-4 h-4" />
              Impersonate
            </button>
            <button
              onClick={onViewHistory}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent"
            >
              <Clock className="w-4 h-4" />
              History
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{activity?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Recent Actions</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">
              {new Date(user.lastActiveAt).toLocaleTimeString()}
            </div>
            <div className="text-xs text-muted-foreground">Last Active</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{user.isOnline ? 'Yes' : 'No'}</div>
            <div className="text-xs text-muted-foreground">Currently Online</div>
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-muted border-b font-medium">Recent Activity</div>
        <div className="divide-y">
          {activity?.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              No recent activity
            </div>
          ) : (
            activity?.slice(0, 10).map((log) => (
              <div key={log.id} className="px-4 py-3 flex items-center gap-3">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm">{log.action}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    log.severity === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : log.severity === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                  }`}
                >
                  {log.severity}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Active Sessions Table ───
export function ActiveSessionsTable({ sessions, isLoading, onTerminate, isTerminating }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-3 text-left font-medium">User</th>
            <th className="px-4 py-3 text-left font-medium">Tenant</th>
            <th className="px-4 py-3 text-left font-medium">IP Address</th>
            <th className="px-4 py-3 text-left font-medium">Started</th>
            <th className="px-4 py-3 text-left font-medium">Last Activity</th>
            <th className="px-4 py-3 text-left font-medium">Current Page</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {isLoading ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              </td>
            </tr>
          ) : sessions.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                No active sessions
              </td>
            </tr>
          ) : (
            sessions.map((session) => (
              <tr key={session.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <div className="font-medium">{session.userName}</div>
                  <div className="text-xs text-muted-foreground">{session.userEmail}</div>
                </td>
                <td className="px-4 py-3 text-xs">{session.tenantName}</td>
                <td className="px-4 py-3 font-mono text-xs">{session.ipAddress}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(session.startedAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(session.lastActivityAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs">{session.currentPage || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onTerminate(session.id)}
                    disabled={isTerminating}
                    className="flex items-center gap-1 ml-auto px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50"
                  >
                    <Ban className="w-3 h-3" />
                    Terminate
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Session History Table ───
export function SessionHistoryTable({ sessions, meta, isLoading, page, onPageChange }) {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">IP / User Agent</th>
              <th className="px-4 py-3 text-left font-medium">Duration</th>
              <th className="px-4 py-3 text-left font-medium">Started</th>
              <th className="px-4 py-3 text-left font-medium">Ended</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No session history
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{session.userName}</div>
                    <div className="text-xs text-muted-foreground">{session.userEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-mono">{session.ipAddress}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {session.userAgent}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {session.startedAt && session.lastActivityAt
                      ? `${Math.round((new Date(session.lastActivityAt) - new Date(session.startedAt)) / 60000)} min`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(session.startedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {session.expiresAt ? new Date(session.expiresAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        session.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {session.isActive ? 'Active' : 'Ended'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= meta.totalPages}
              className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Audit Log Table ───
export function AuditLogTable({ logs, meta, isLoading, page, onPageChange }) {
  const actionColors = {
    login: 'bg-blue-100 text-blue-800',
    logout: 'bg-gray-100 text-gray-800',
    impersonate_start: 'bg-purple-100 text-purple-800',
    impersonate_end: 'bg-purple-100 text-purple-800',
    page_view: 'bg-green-100 text-green-800',
    data_access: 'bg-yellow-100 text-yellow-800',
    action_performed: 'bg-primary/10 text-primary',
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Timestamp</th>
              <th className="px-4 py-3 text-left font-medium">Actor</th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
              <th className="px-4 py-3 text-left font-medium">Target</th>
              <th className="px-4 py-3 text-left font-medium">Details</th>
              <th className="px-4 py-3 text-left font-medium">IP</th>
              <th className="px-4 py-3 text-left font-medium">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No audit logs
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{log.actorName}</div>
                    <div className="text-xs text-muted-foreground">{log.actorEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-gray-100'}`}
                    >
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{log.targetUserName || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                    {JSON.stringify(log.details)}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono">{log.ipAddress}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        log.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : log.severity === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {log.severity === 'critical' && <AlertTriangle className="w-3 h-3" />}
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= meta.totalPages}
              className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Broadcast Modal ───
export function BroadcastModal({ onClose, onSubmit, isSubmitting = false }) {
  const [form, setForm] = useState({ title: '', message: '', severity: 'info' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg border bg-background shadow-2xl">
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Radio className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Broadcast Message</h3>
            <p className="text-xs text-muted-foreground">Send a message to all online users</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Title
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Scheduled maintenance"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Message
            </label>
            <textarea
              required
              rows={4}
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              placeholder="Message body…"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Severity
            </label>
            <select
              value={form.severity}
              onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value }))}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium rounded-md border hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Broadcast
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
