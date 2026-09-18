// apps/web/src/app/admin/shadow/page.jsx — wired to api/shadow.ts (Phase 3D)
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  getShadowUsers,
  getActiveSessions,
  getSessions,
  getAuditLogs,
  terminateShadowSession,
} from '@/api/shadow';
import { api } from '@/api/client';
import { useShadowStore } from './store';
import {
  OnlineUsersPanel,
  ActiveSessionsTable,
  SessionHistoryTable,
  AuditLogTable,
  ImpersonationBanner,
  ShadowUserSelector,
  BroadcastModal,
} from './components';
import { ShadowBanner } from './components/ShadowBanner';
import { ShadowSessionHistory } from './components/ShadowSessionHistory';
import { ShadowAuditLog } from './components/ShadowAuditLog';

/** User activity stream — endpoint: GET /admin/shadow/users/:id/activity */
const getUserActivityStream = (userId) => api.get(`/admin/shadow/users/${userId}/activity`);

/** Broadcast a message to online users — endpoint: POST /admin/shadow/broadcast */
const broadcastMessage = (payload) => api.post('/admin/shadow/broadcast', payload);

export default function ShadowPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('online');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);

  // Shadow session state lives in the store (sessionId, banner visibility, audit mirror)
  const isShadowActive = useShadowStore((s) => s.isShadowActive);
  const shadowUser = useShadowStore((s) => s.shadowUser);
  const startShadow = useShadowStore((s) => s.startShadow);
  const endShadow = useShadowStore((s) => s.endShadow);

  /* ─── Queries (real API) ─── */
  const { data: onlineUsers, isLoading: onlineLoading } = useQuery({
    queryKey: ['shadow-online'],
    queryFn: async () => {
      const res = await getShadowUsers({ status: 'active', pageSize: 100 });
      const users = res?.data ?? res ?? [];
      return users.map((u) => ({
        ...u,
        name: u.name ?? [u.firstName, u.lastName].filter(Boolean).join(' '),
        isOnline: u.status === 'active',
      }));
    },
    refetchInterval: 30000,
  });

  const { data: activeSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['shadow-sessions'],
    queryFn: getActiveSessions,
    refetchInterval: 30000,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['shadow-history', historyPage, selectedUser?.id],
    queryFn: () =>
      getSessions({
        page: historyPage,
        pageSize: 20,
        ...(selectedUser?.id ? { shadowUserId: selectedUser.id } : {}),
      }),
    enabled: activeTab === 'history',
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['shadow-audit', auditPage],
    queryFn: () => getAuditLogs({ page: auditPage, pageSize: 20 }),
    enabled: activeTab === 'audit',
  });

  const { data: userActivity } = useQuery({
    queryKey: ['shadow-activity', selectedUser?.id],
    queryFn: () => getUserActivityStream(selectedUser.id),
    enabled: !!selectedUser && activeTab === 'online',
  });

  /* ─── Mutations ─── */
  const impersonateMutation = useMutation({
    mutationFn: (user) =>
      startShadow(user, currentUser, 'Support impersonation from admin console'),
    onSuccess: (_sessionId, user) => {
      toast({
        title: 'Impersonation started',
        description: `You are now viewing as ${user.email}`,
      });
      queryClient.invalidateQueries({ queryKey: ['shadow-sessions'] });
    },
    onError: (err) => {
      toast({ title: 'Impersonation failed', description: err.message, variant: 'destructive' });
    },
  });

  const endImpersonationMutation = useMutation({
    mutationFn: () => endShadow('manual'),
    onSuccess: () => {
      toast({ title: 'Impersonation ended' });
      queryClient.invalidateQueries({ queryKey: ['shadow-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['shadow-history'] });
    },
  });

  const terminateMutation = useMutation({
    mutationFn: (sessionId) => terminateShadowSession(sessionId, 'Terminated by admin'),
    onSuccess: () => {
      toast({ title: 'Session terminated' });
      queryClient.invalidateQueries({ queryKey: ['shadow-sessions'] });
    },
    onError: (err) => {
      toast({ title: 'Failed to terminate', description: err.message, variant: 'destructive' });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: broadcastMessage,
    onSuccess: () => {
      toast({ title: 'Message broadcasted' });
      setShowBroadcast(false);
    },
    onError: (err) => {
      toast({ title: 'Broadcast failed', description: err.message, variant: 'destructive' });
    },
  });

  /* ─── Handlers ─── */
  const handleImpersonate = useCallback(
    (user) => {
      setSelectedUser(user);
      impersonateMutation.mutate(user);
    },
    [impersonateMutation]
  );

  const handleTerminate = useCallback(
    (sessionId) => {
      if (window.confirm('Are you sure you want to terminate this session?')) {
        terminateMutation.mutate(sessionId);
      }
    },
    [terminateMutation]
  );

  const handleBroadcast = useCallback(
    (data) => {
      broadcastMutation.mutate(data);
    },
    [broadcastMutation]
  );

  return (
    <div className="space-y-6">
      {/* Global persistent banner (store-connected, stealth-aware) */}
      <ShadowBanner />

      {/* Inline banner shown in-page while impersonating */}
      {isShadowActive && shadowUser && (
        <ImpersonationBanner user={shadowUser} onEnd={() => endImpersonationMutation.mutate()} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shadow Mode</h1>
          <p className="text-muted-foreground">
            Monitor user sessions, audit activity, and manage impersonation
          </p>
        </div>
        <button
          onClick={() => setShowBroadcast(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
        >
          Broadcast Message
        </button>
      </div>

      <div className="border-b">
        <nav className="flex gap-6">
          {[
            { id: 'online', label: 'Online Users', count: onlineUsers?.length },
            { id: 'sessions', label: 'Active Sessions', count: activeSessions?.length },
            { id: 'history', label: 'Session History' },
            { id: 'audit', label: 'Audit Log' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-muted">{tab.count}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'online' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <OnlineUsersPanel
              users={onlineUsers || []}
              isLoading={onlineLoading}
              onSelectUser={setSelectedUser}
              selectedUser={selectedUser}
              onImpersonate={handleImpersonate}
              isImpersonating={impersonateMutation.isPending}
            />
          </div>
          <div className="lg:col-span-2">
            {selectedUser ? (
              <ShadowUserSelector
                user={selectedUser}
                activity={userActivity || []}
                onImpersonate={() => handleImpersonate(selectedUser)}
                onViewHistory={() => setActiveTab('history')}
              />
            ) : (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                Select a user to view activity details
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <ActiveSessionsTable
          sessions={activeSessions || []}
          isLoading={sessionsLoading}
          onTerminate={handleTerminate}
          isTerminating={terminateMutation.isPending}
        />
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Server-side session history */}
          <SessionHistoryTable
            sessions={historyData?.data || []}
            meta={historyData?.meta}
            isLoading={historyLoading}
            page={historyPage}
            onPageChange={setHistoryPage}
          />
          {/* Local shadow archive (store) */}
          <ShadowSessionHistory />
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Server-side shadow audit log */}
          <AuditLogTable
            logs={auditData?.data || []}
            meta={auditData?.meta}
            isLoading={auditLoading}
            page={auditPage}
            onPageChange={setAuditPage}
          />
          {/* Local action mirror (store) */}
          <ShadowAuditLog />
        </div>
      )}

      {showBroadcast && (
        <BroadcastModal
          onClose={() => setShowBroadcast(false)}
          onSubmit={handleBroadcast}
          isSubmitting={broadcastMutation.isPending}
        />
      )}
    </div>
  );
}
