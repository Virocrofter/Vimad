/* src/app/app/users/store.js */
import { create } from 'zustand';
import { initialUsers, roles, auditLogEntries, departments } from './data';

export const useUserStore = create((set, get) => ({
  /* ─── Users ─── */
  users: initialUsers,

  addUser: (newUser) =>
    set((state) => ({
      users: [
        {
          ...newUser,
          id: `USR-${1000 + state.users.length + 1}`,
          createdAt: new Date().toISOString().split('T')[0],
          loginCount: 0,
          lastLogin: null,
          sessionExpiry: null,
          avatar: `${newUser.firstName[0]}${newUser.lastName[0]}`.toUpperCase(),
        },
        ...state.users,
      ],
    })),

  updateUser: (id, updater) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === id ? (typeof updater === 'function' ? updater(u) : { ...u, ...updater }) : u
      ),
    })),

  deactivateUser: (id, reason, byUserId) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === id
          ? {
              ...u,
              status: 'suspended',
              suspensionReason: reason,
              suspendedAt: new Date().toISOString().split('T')[0],
              suspendedBy: byUserId,
              sessionExpiry: null,
            }
          : u
      ),
    })),

  reactivateUser: (id) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === id
          ? {
              ...u,
              status: 'active',
              suspensionReason: null,
              suspendedAt: null,
              suspendedBy: null,
            }
          : u
      ),
    })),

  getUserById: (id) => get().users.find((u) => u.id === id),

  getUsersByRole: (roleId) => get().users.filter((u) => u.roleId === roleId),

  getUsersByDepartment: (deptId) => get().users.filter((u) => u.departmentId === deptId),

  getActiveUsers: () => get().users.filter((u) => u.status === 'active'),

  /* ─── Roles ─── */
  roles: roles,

  addRole: (newRole) =>
    set((state) => ({
      roles: [
        ...state.roles,
        {
          ...newRole,
          id: `role-${Date.now()}`,
          isSystem: false,
        },
      ],
    })),

  updateRole: (id, updater) =>
    set((state) => ({
      roles: state.roles.map((r) =>
        r.id === id ? (typeof updater === 'function' ? updater(r) : { ...r, ...updater }) : r
      ),
    })),

  deleteRole: (id) =>
    set((state) => ({
      roles: state.roles.filter((r) => r.id !== id),
      // Reassign users with deleted role to read-only
      users: state.users.map((u) => (u.roleId === id ? { ...u, roleId: 'role-readonly' } : u)),
    })),

  getRoleById: (id) => get().roles.find((r) => r.id === id),

  /* ─── Audit Logs ─── */
  auditLogs: auditLogEntries,

  addAuditLog: (entry) =>
    set((state) => ({
      auditLogs: [
        {
          ...entry,
          id: `AUD-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(state.auditLogs.length + 1).padStart(3, '0')}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        },
        ...state.auditLogs,
      ],
    })),

  getAuditLogsByUser: (userId) => get().auditLogs.filter((l) => l.userId === userId),

  getAuditLogsByResource: (resource) => get().auditLogs.filter((l) => l.resource === resource),

  getAuditLogsBySeverity: (severity) => get().auditLogs.filter((l) => l.severity === severity),

  /* ─── Session / Auth State (for demo) ─── */
  currentUserId: 'USR-001',

  setCurrentUser: (id) => set({ currentUserId: id }),

  getCurrentUser: () => get().users.find((u) => u.id === get().currentUserId),

  hasPermission: (permissionKey) => {
    const user = get().getCurrentUser();
    if (!user) return false;
    const role = get().getRoleById(user.roleId);
    if (!role) return false;
    return role.permissions.includes(permissionKey);
  },

  hasAnyPermission: (permissionKeys) => {
    return permissionKeys.some((k) => get().hasPermission(k));
  },

  hasAllPermissions: (permissionKeys) => {
    return permissionKeys.every((k) => get().hasPermission(k));
  },
}));
