// apps/web/src/components/PermissionGuard.tsx
import { ReactNode } from 'react';
import { usePermission, useAnyPermission } from '../hooks/usePermissions';

interface PermissionGuardProps {
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  resource,
  action,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const hasPermission = usePermission(resource, action);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

interface AnyPermissionGuardProps {
  permissions: [string, string][];
  children: ReactNode;
  fallback?: ReactNode;
}

export function AnyPermissionGuard({
  permissions,
  children,
  fallback = null,
}: AnyPermissionGuardProps) {
  const hasAny = useAnyPermission(...permissions);
  return hasAny ? <>{children}</> : <>{fallback}</>;
}
