import { useAuthStore } from '../stores/authStores';

/**
 * Check if current user has a specific permission
 */
export function usePermission(resource: string, action: string): boolean {
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions) || [];

  if (!user) return false;
  if (user.role === 'owner') return true; // owner has all permissions
  if (permissions.includes('*')) return true;
  if (permissions.includes(`${resource}:*`)) return true;

  return permissions.includes(`${resource}:${action}`);
}

/**
 * Check if user has any of the specified permissions
 */
export function useAnyPermission(...perms: [string, string][]): boolean {
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions) || [];

  if (!user) return false;
  if (user.role === 'owner') return true;
  if (permissions.includes('*')) return true;

  return perms.some(([resource, action]) => {
    if (permissions.includes(`${resource}:*`)) return true;
    return permissions.includes(`${resource}:${action}`);
  });
}

/**
 * Check if user has all specified permissions
 */
export function useAllPermissions(...perms: [string, string][]): boolean {
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions) || [];

  if (!user) return false;
  if (user.role === 'owner') return true;
  if (permissions.includes('*')) return true;

  return perms.every(([resource, action]) => {
    if (permissions.includes(`${resource}:*`)) return true;
    return permissions.includes(`${resource}:${action}`);
  });
}
