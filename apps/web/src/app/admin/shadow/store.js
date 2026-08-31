/* src/app/admin/shadow/store.js */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Shadow Mode Store
 * Manages user impersonation sessions with stealth capabilities.
 * Shadow sessions bypass normal audit trails and appear as the target user.
 */

const SHADOW_STORAGE_KEY = 'pms-shadow-session';

export const useShadowStore = create(
  persist(
    (set, get) => ({
      /* ─── Core State ─── */
      isShadowActive: false,
      shadowUser: null,           // The user being impersonated
      originalUser: null,         // The admin who initiated shadow
      shadowStartTime: null,
      shadowSessionId: null,
      stealthMode: false,         // When true, no banner/toggle visible to admin
      
      /* ─── Session History ─── */
      sessionHistory: [],
      
      /* ─── Current View State ─── */
      viewContext: 'admin',       // 'admin' | 'user' — which UI to render
      activeModule: null,         // Which module the shadow user is "in"
      
      /* ─── Actions ─── */
      
      /**
       * Start a shadow session — impersonate a target user
       */
      startShadow: (targetUser, adminUser) => {
        const sessionId = `SHD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const startTime = new Date().toISOString();
        
        set({
          isShadowActive: true,
          shadowUser: { ...targetUser, sessionId },
          originalUser: adminUser,
          shadowStartTime: startTime,
          shadowSessionId: sessionId,
          viewContext: 'user',
          activeModule: targetUser.defaultModule || 'dashboard',
        });
        
        // Log to shadow audit (separate from main audit)
        get().logShadowAction({
          sessionId,
          action: 'SESSION_STARTED',
          targetUserId: targetUser.id,
          targetUserName: targetUser.name,
          adminUserId: adminUser.id,
          adminUserName: adminUser.name,
          timestamp: startTime,
          stealth: get().stealthMode,
        });
        
        return sessionId;
      },
      
      /**
       * End the current shadow session and restore admin context
       */
      endShadow: (reason = 'manual') => {
        const state = get();
        if (!state.isShadowActive) return;
        
        const endTime = new Date().toISOString();
        const duration = state.shadowStartTime 
          ? Math.round((new Date(endTime) - new Date(state.shadowStartTime)) / 1000)
          : 0;
        
        // Archive session to history
        const archivedSession = {
          id: state.shadowSessionId,
          shadowUser: state.shadowUser,
          originalUser: state.originalUser,
          startTime: state.shadowStartTime,
          endTime,
          duration,
          reason,
          stealth: state.stealthMode,
          actionsTaken: state.sessionHistory.filter(h => h.sessionId === state.shadowSessionId),
        };
        
        set((prev) => ({
          isShadowActive: false,
          shadowUser: null,
          originalUser: null,
          shadowStartTime: null,
          shadowSessionId: null,
          viewContext: 'admin',
          activeModule: null,
          sessionHistory: [...prev.sessionHistory, archivedSession],
        }));
        
        get().logShadowAction({
          sessionId: state.shadowSessionId,
          action: 'SESSION_ENDED',
          targetUserId: state.shadowUser?.id,
          targetUserName: state.shadowUser?.name,
          adminUserId: state.originalUser?.id,
          adminUserName: state.originalUser?.name,
          timestamp: endTime,
          duration,
          reason,
          stealth: state.stealthMode,
        });
      },
      
      /**
       * Toggle stealth mode — hides all shadow UI indicators
       */
      toggleStealth: () => {
        set((prev) => {
          const next = !prev.stealthMode;
          get().logShadowAction({
            sessionId: prev.shadowSessionId,
            action: next ? 'STEALTH_ENABLED' : 'STEALTH_DISABLED',
            timestamp: new Date().toISOString(),
            stealth: next,
          });
          return { stealthMode: next };
        });
      },
      
      /**
       * Switch view context — view as admin or as the shadow user
       */
      setViewContext: (context) => {
        set({ viewContext: context });
        get().logShadowAction({
          sessionId: get().shadowSessionId,
          action: 'CONTEXT_SWITCHED',
          details: { from: get().viewContext, to: context },
          timestamp: new Date().toISOString(),
        });
      },
      
      /**
       * Set active module within shadow session
       */
      setActiveModule: (module) => {
        set({ activeModule: module });
      },
      
      /**
       * Log an action taken during shadow session
       */
      logShadowAction: (action) => {
        set((prev) => ({
          sessionHistory: [
            ...prev.sessionHistory,
            { ...action, id: `ACT-${Date.now().toString(36).toUpperCase()}` },
          ],
        }));
      },
      
      /**
       * Record a user action taken while in shadow mode
       * (e.g., "viewed reservation R-1234", "modified guest profile")
       */
      recordAction: (actionType, details = {}) => {
        const state = get();
        if (!state.isShadowActive) return;
        
        get().logShadowAction({
          sessionId: state.shadowSessionId,
          action: actionType,
          details,
          timestamp: new Date().toISOString(),
          targetUserId: state.shadowUser?.id,
        });
      },
      
      /**
       * Take over an existing user session (session hijacking simulation)
       */
      takeoverSession: (targetSession, adminUser) => {
        const sessionId = `SHD-TAKEOVER-${Date.now().toString(36).toUpperCase()}`;
        const startTime = new Date().toISOString();
        
        set({
          isShadowActive: true,
          shadowUser: { ...targetSession.user, sessionId, takenOverSession: targetSession.id },
          originalUser: adminUser,
          shadowStartTime: startTime,
          shadowSessionId: sessionId,
          viewContext: 'user',
          activeModule: targetSession.currentModule || 'dashboard',
        });
        
        get().logShadowAction({
          sessionId,
          action: 'SESSION_TAKEOVER',
          targetUserId: targetSession.user.id,
          targetUserName: targetSession.user.name,
          takenOverSessionId: targetSession.id,
          adminUserId: adminUser.id,
          adminUserName: adminUser.name,
          timestamp: startTime,
          stealth: get().stealthMode,
        });
        
        return sessionId;
      },
      
      /**
       * Clear all shadow history (irreversible)
       */
      clearHistory: () => {
        set({ sessionHistory: [] });
      },
      
      /**
       * Get active session duration in seconds
       */
      getSessionDuration: () => {
        const { shadowStartTime } = get();
        if (!shadowStartTime) return 0;
        return Math.round((Date.now() - new Date(shadowStartTime).getTime()) / 1000);
      },
      
      /**
       * Get all actions for current session
       */
      getCurrentSessionActions: () => {
        const { shadowSessionId, sessionHistory } = get();
        return sessionHistory.filter(h => h.sessionId === shadowSessionId);
      },
      
      /**
       * Get archived sessions (ended shadow sessions)
       */
      getArchivedSessions: () => {
        return get().sessionHistory.filter(h => h.endTime && h.id);
      },
    }),
    {
      name: SHADOW_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage), // sessionStorage = disappears on tab close
      partialize: (state) => ({
        isShadowActive: state.isShadowActive,
        shadowUser: state.shadowUser,
        originalUser: state.originalUser,
        shadowStartTime: state.shadowStartTime,
        shadowSessionId: state.shadowSessionId,
        stealthMode: state.stealthMode,
        viewContext: state.viewContext,
        activeModule: state.activeModule,
        sessionHistory: state.sessionHistory,
      }),
    }
  )
);

/**
 * Hook to wrap auth store for shadow-aware user resolution
 * Returns the effective user (shadow user if active, otherwise real user)
 */
export const useEffectiveUser = () => {
  const shadowState = useShadowStore();
  
  return {
    user: shadowState.isShadowActive ? shadowState.shadowUser : shadowState.originalUser,
    isShadow: shadowState.isShadowActive,
    originalUser: shadowState.originalUser,
    shadowUser: shadowState.shadowUser,
    canShadow: shadowState.originalUser?.role === 'super_admin',
  };
};
